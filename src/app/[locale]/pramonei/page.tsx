'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Phone, Calculator, Wrench, Factory, ZoomIn, X } from 'lucide-react';
import { useVatDisplayStore } from '../../../store/vat-display';
import { assetUrl } from '../../../lib/api';
import { resolveAppLocale } from '../../../i18n/storefront-ui-copy';
import type { AppLocale } from '../../../i18n/routing';
import {
    INDUSTRIAL_BOILER_MODULES,
    INDUSTRIAL_FUELS,
    computeIndustrialBoilerRoi,
    GILES_COMPANY_IDENTITY,
    type IndustrialFuelOption,
} from '../../../lib/giles-masterpiece-data';
import {
    getLocalizedCompletedWorks,
    getLocalizedContainerBoilerSpecs,
    type GilesCompletedWorkItem,
} from '../../../lib/giles-completed-works-data';
import {
    GilesContainer20ftSchematic,
    type ContainerZoneId,
} from '../../../components/giles-animated-schematics';
import {
    IndustrialContainersHub,
    INDUSTRIAL_CONTAINER_SYSTEMS,
} from '../../../components/industrial-containers-hub';
import { CompletedWorksGallery } from '../../../components/completed-works-gallery';

const INDUSTRIAL_STUDIO_GALLERY: Array<{
    id: string;
    src: string;
    label: Record<AppLocale, string>;
}> = [
    {
        id: 'gk-500',
        src: '/studio-assets/projects/giles-darbas-06.webp',
        label: {
            lt: 'GK-500 Konteinerinė katilinė',
            en: 'GK-500 Containerized boiler room',
            pl: 'GK-500 Kotłownia kontenerowa',
            ru: 'GK-500 Контейнерная котельная',
        },
    },
    {
        id: 'gk-750',
        src: '/studio-assets/projects/giles-darbas-07.webp',
        label: {
            lt: 'GK-750 Pramoninė katilinė',
            en: 'GK-750 Industrial boiler plant',
            pl: 'GK-750 Kotłownia przemysłowa',
            ru: 'GK-750 Промышленная котельная',
        },
    },
    {
        id: 'moduline-2000',
        src: '/studio-assets/projects/giles-darbas-08.webp',
        label: {
            lt: 'Modulinė katilinė 2,0 MW',
            en: '2.0 MW Modular boiler plant',
            pl: 'Kotłownia modułowa 2,0 MW',
            ru: 'Модульная котельная 2,0 МВт',
        },
    },
    {
        id: 'mobili-500',
        src: '/studio-assets/projects/giles-darbas-09.webp',
        label: {
            lt: 'Mobili katilinė nuomai 500 kW',
            en: '500 kW Mobile rental boiler room',
            pl: 'Mobilna kotłownia na wynajem 500 kW',
            ru: 'Мобильная котельная в аренду 500 кВт',
        },
    },
    {
        id: 'bioduju-pramonine',
        src: '/studio-assets/projects/giles-darbas-14.webp',
        label: {
            lt: 'Pramoninė biodujų katilinė',
            en: 'Industrial biogas boiler plant',
            pl: 'Przemysłowa kotłownia biogazowa',
            ru: 'Промышленная биогазовая котельная',
        },
    },
    {
        id: 'karsto-oro-80-190',
        src: '/studio-assets/projects/giles-darbas-16.webp',
        label: {
            lt: 'Karšto oro katilinė 80–190 kW',
            en: '80–190 kW Hot-air boiler unit',
            pl: 'Kotłownia gorącego powietrza 80–190 kW',
            ru: 'Воздушная котельная 80–190 кВт',
        },
    },
];
void INDUSTRIAL_CONTAINER_SYSTEMS;

const BOILER_ROOM_ZONES_I18N: Record<
    AppLocale,
    Array<{ id: string; title: string; desc: string; specs: string }>
> = {
    lt: [
        {
            id: '01',
            title: '01. Kuro sandėlis su judančiomis grindimis arba sraigtais',
            desc: '8–90 m³ talpos granulių arba skiedros (G30–G50) bunkeris su hidraulinėmis judančiomis grindimis (Walking-Floor), priešgaisrine sklendžių sistema ir kuro lygio radarais.',
            specs: 'Autonomija: 7–21 para be papildymo · Šlapia skiedra iki 45 % drėgmės arba DINplus granulės',
        },
        {
            id: '02',
            title: '02. Pramoninis katilas su savaime išsivalančiu degikliu',
            desc: 'P265GH katilinio plieno trys eigų šilumokaitis su pneumatiniu vamzdžių valymu ir judančių ardelių degikliu MPB PRO / BIOFIRE.',
            specs: 'Naudingumo koeficientas: 91–94 % · Galios moduliacija 25–100 %',
        },
        {
            id: '03',
            title: '03. Multiciklonas ir dūmų valymo filtras',
            desc: 'Daugiapakopis multiciklonas, dūmsiurbė su dažnio keitikliu ir kietųjų dalelių nusodintuvas pagal ES EcoDesign / Aplinkos apsaugos taršos normas.',
            specs: 'Automatinis traukos palaikymas · Nerūdijančio plieno izoliuotas kaminas',
        },
        {
            id: '04',
            title: '04. Automatinis pelenų šalinimas į išorinį konteinerį',
            desc: 'Sraigtiniai pelenų transporteriai iš po ardelių ir šilumokaičio tiesiai į sandarų išorinį ratukinį konteinerį.',
            specs: 'Aptarnavimas: tik 1 kartą per 2–4 savaites',
        },
        {
            id: '05',
            title: '05. GSM / SCADA telemetrija ir hidraulinis mazgas',
            desc: 'Pilnai surinktas siurblių, pamaišymo vožtuvų, šilumokaičio bei saugos mazgas su nuotoliniu valdymu internetu ir SMS/SCADA avariniais pranešimais.',
            specs: 'Darbinis slėgis iki 6 bar · Nuotolinė Gilės serviso diagnostika',
        },
    ],
    en: [
        {
            id: '01',
            title: '01. Fuel Store with Walking-Floor or Screw Extractors',
            desc: '8–90 m³ pellet or wood-chip (G30–G50) bunker equipped with a hydraulic Walking-Floor system, fire-damper safety interlocks, and radar fuel level sensors.',
            specs: 'Autonomy: 7–21 days without refilling · Wet wood chips up to 45% moisture or DINplus pellets',
        },
        {
            id: '02',
            title: '02. Industrial Boiler with Self-Cleaning Moving-Grate Burner',
            desc: 'P265GH boiler-grade steel three-pass heat exchanger with pneumatic tube cleaning and MPB PRO / BIOFIRE moving-grate burner.',
            specs: 'Thermal efficiency: 91–94% · Output modulation 25–100%',
        },
        {
            id: '03',
            title: '03. Multicyclone & Flue Gas Filtration Unit',
            desc: 'Multi-stage multicyclone, VFD-controlled induced draft fan, and particulate precipitator compliant with EU EcoDesign emission limits.',
            specs: 'Automatic draft stabilization · Insulated stainless-steel chimney',
        },
        {
            id: '04',
            title: '04. Automatic De-Ashing into External Wheeled Bin',
            desc: 'Auger ash conveyors extract ash from beneath the grates and heat exchanger directly into a sealed external wheeled container.',
            specs: 'Maintenance interval: only once every 2–4 weeks',
        },
        {
            id: '05',
            title: '05. GSM / SCADA Telemetry & Hydronic Substation',
            desc: 'Factory-assembled circulation pump, mixing valve, plate heat exchanger, and safety manifold with online remote control and SMS/SCADA alarm alerts.',
            specs: 'Working pressure up to 6 bar · Remote Gilės service diagnostics',
        },
    ],
    pl: [
        {
            id: '01',
            title: '01. Magazyn paliwa z ruchomą podłogą lub podajnikami ślimakowymi',
            desc: 'Bunkier o pojemności 8–90 m³ na pellet lub zrębkę (G30–G50) z hydrauliczną ruchomą podłogą (Walking-Floor), klapami ppoż. i radarowymi czujnikami poziomu paliwa.',
            specs: 'Autonomia: 7–21 dni bez załadunku · Zrębka o wilgotności do 45% lub pellet DINplus',
        },
        {
            id: '02',
            title: '02. Kocioł przemysłowy z samoczyszczącym palnikiem',
            desc: 'Trójciągowy wymiennik ciepła ze stali kotłowej P265GH z pneumatycznym czyszczeniem płomieniówek oraz palnikiem z rusztem ruchomym MPB PRO / BIOFIRE.',
            specs: 'Sprawność cieplna: 91–94% · Modulacja mocy 25–100%',
        },
        {
            id: '03',
            title: '03. Multicyklon i filtr odpylania spalin',
            desc: 'Wielostopniowy multicyklon, wentylator wyciągowy z falownikiem oraz odpylacz cząstek stałych zgodny z normami emisyjnymi UE EcoDesign.',
            specs: 'Automatyczna stabilizacja podciśnienia · Izolowany komin ze stali nierdzewnej',
        },
        {
            id: '04',
            title: '04. Automatyczne odpopielanie do zewnętrznego kontenera',
            desc: 'Przenośniki ślimakowe usuwają popiół spod rusztu i wymiennika bezpośrednio do szczelnego zewnętrznego pojemnika kołowego.',
            specs: 'Obsługa serwisowa: tylko raz na 2–4 tygodnie',
        },
        {
            id: '05',
            title: '05. Telemetria GSM / SCADA i węzeł hydrauliczny',
            desc: 'Fabrycznie zmontowany zespół pomp, zaworów mieszających, wymiennika i zabezpieczeń ze zdalnym sterowaniem przez internet oraz powiadomieniami SMS/SCADA.',
            specs: 'Ciśnienie robocze do 6 bar · Zdalna diagnostyka serwisu Gilės',
        },
    ],
    ru: [
        {
            id: '01',
            title: '01. Топливный склад с подвижным полом или шнеками',
            desc: 'Бункер объемом 8–90 м³ для пеллет или щепы (G30–G50) с гидравлическим подвижным полом (Walking-Floor), противопожарными клапанами и радарными датчиками уровня.',
            specs: 'Автономность: 7–21 сутки без дозагрузки · Влажная щепа до 45% или пеллеты DINplus',
        },
        {
            id: '02',
            title: '02. Промышленный котел с самоочищающейся горелкой',
            desc: 'Трехходовой теплообменник из котельной стали P265GH с пневматической очисткой труб и горелкой с подвижными колосниками MPB PRO / BIOFIRE.',
            specs: 'КПД: 91–94% · Модуляция мощности 25–100%',
        },
        {
            id: '03',
            title: '03. Мультициклон и фильтр очистки дымовых газов',
            desc: 'Многоступенчатый мультициклон, дымосос с частотным преобразователем и золоуловитель согласно экологическим нормам ЕС EcoDesign.',
            specs: 'Автоматическое поддержание разрежения · Утепленный дымоход из нержавейки',
        },
        {
            id: '04',
            title: '04. Автоматическое золоудаление во внешний контейнер',
            desc: 'Шнековые транспортеры удаляют золу из-под колосников и теплообменника прямо в герметичный внешний колесный контейнер.',
            specs: 'Обслуживание: только 1 раз в 2–4 недели',
        },
        {
            id: '05',
            title: '05. GSM / SCADA телеметрия и гидравлический узел',
            desc: 'Полностью собранный узел насосов, смесительных клапанов, теплообменника и группы безопасности с интернет-управлением и аварийными оповещениями SMS/SCADA.',
            specs: 'Рабочее давление до 6 бар · Удаленная диагностика сервиса Gilės',
        },
    ],
};

const MODULE_TRANSLATIONS: Record<
    string,
    Record<
        AppLocale,
        {
            dimensionsM: string;
            hopperVolumeM3: string;
            targetUseCases: string;
        }
    >
> = {
    'GK-100': {
        lt: {
            dimensionsM: '6,0 × 2,4 × 2,9 m',
            hopperVolumeM3: '8 m³ (5,2 t granulių)',
            targetUseCases: 'Autoservisai, gamybos cechai, kaimo turizmo kompleksai, mokyklos',
        },
        en: {
            dimensionsM: '6.0 × 2.4 × 2.9 m',
            hopperVolumeM3: '8 m³ (5.2 t pellets)',
            targetUseCases: 'Auto repair workshops, production halls, rural resorts, schools',
        },
        pl: {
            dimensionsM: '6,0 × 2,4 × 2,9 m',
            hopperVolumeM3: '8 m³ (5,2 t pelletu)',
            targetUseCases: 'Warsztaty samochodowe, hale produkcyjne, ośrodki wypoczynkowe, szkoły',
        },
        ru: {
            dimensionsM: '6,0 × 2,4 × 2,9 м',
            hopperVolumeM3: '8 м³ (5,2 т пеллет)',
            targetUseCases: 'Автосервисы, производственные цеха, комплексы отдыха, школы',
        },
    },
    'GK-250': {
        lt: {
            dimensionsM: '6,0 × 3,0 × 3,0 m',
            hopperVolumeM3: '16 m³ (judančios grindys / sraigtai)',
            targetUseCases: 'Baldai ir medienos apdirbimas, sandėliai, šiltnamiai, biurų pastatai',
        },
        en: {
            dimensionsM: '6.0 × 3.0 × 3.0 m',
            hopperVolumeM3: '16 m³ (walking floor / screw augers)',
            targetUseCases: 'Furniture & woodworking plants, warehouses, greenhouses, office buildings',
        },
        pl: {
            dimensionsM: '6,0 × 3,0 × 3,0 m',
            hopperVolumeM3: '16 m³ (ruchoma podłoga / ślimaki)',
            targetUseCases: 'Zakłady meblarskie i drzewne, magazyny, szklarnie, biurowce',
        },
        ru: {
            dimensionsM: '6,0 × 3,0 × 3,0 м',
            hopperVolumeM3: '16 м³ (подвижный пол / шнеки)',
            targetUseCases: 'Мебельное и деревообрабатывающее производство, склады, теплицы, офисы',
        },
    },
    'GK-500': {
        lt: {
            dimensionsM: '9,0 × 3,0 × 3,2 m',
            hopperVolumeM3: '28 m³ (hidraulinės judančios grindys)',
            targetUseCases: 'Gamyklos, logistikos centrai, šiltnamių ūkiai, daugiabučių kvartalai',
        },
        en: {
            dimensionsM: '9.0 × 3.0 × 3.2 m',
            hopperVolumeM3: '28 m³ (hydraulic Walking-Floor)',
            targetUseCases: 'Factories, logistics hubs, commercial greenhouses, residential districts',
        },
        pl: {
            dimensionsM: '9,0 × 3,0 × 3,2 m',
            hopperVolumeM3: '28 m³ (hydrauliczna ruchoma podłoga)',
            targetUseCases: 'Fabryki, centra logistyczne, gospodarstwa szklarniowe, osiedla mieszkaniowe',
        },
        ru: {
            dimensionsM: '9,0 × 3,0 × 3,2 м',
            hopperVolumeM3: '28 м³ (гидравлический подвижный пол)',
            targetUseCases: 'Заводы, логистические центры, тепличные хозяйства, жилые кварталы',
        },
    },
    'GK-1000': {
        lt: {
            dimensionsM: '12,0 × 3,5 × 3,5 m (2×500 kW kaskada)',
            hopperVolumeM3: '45 m³ su automatiniu pelenų šalinimu ir multiciklonu',
            targetUseCases: 'Pramonės įmonės, grūdų džiovyklos, rajoninės katilinės',
        },
        en: {
            dimensionsM: '12.0 × 3.5 × 3.5 m (2×500 kW cascade)',
            hopperVolumeM3: '45 m³ with automatic de-ashing & multicyclone',
            targetUseCases: 'Industrial enterprises, grain dryers, district heating plants',
        },
        pl: {
            dimensionsM: '12,0 × 3,5 × 3,5 m (kaskada 2×500 kW)',
            hopperVolumeM3: '45 m³ z automatycznym odpopielaniem i multicyklonem',
            targetUseCases: 'Zakłady przemysłowe, suszarnie zbóż, ciepłownie rejonowe',
        },
        ru: {
            dimensionsM: '12,0 × 3,5 × 3,5 м (каскад 2×500 кВт)',
            hopperVolumeM3: '45 м³ с автоматическим золоудалением и мультициклоном',
            targetUseCases: 'Промышленные предприятия, зерносушилки, районные котельные',
        },
    },
    'GK-2500': {
        lt: {
            dimensionsM: 'Modulinis 2–3 konteinerių blokas su dūmų filtrais',
            hopperVolumeM3: '90 m³ Walking-Floor kuro sandėlis',
            targetUseCases: 'Didžioji pramonė, centralizuoto šildymo tinklai, technologinis garas/vanduo',
        },
        en: {
            dimensionsM: 'Modular 2–3 container block with flue gas filters',
            hopperVolumeM3: '90 m³ Walking-Floor fuel bunker',
            targetUseCases: 'Heavy industry, district heating networks, process steam/hot water',
        },
        pl: {
            dimensionsM: 'Modułowy blok 2–3 kontenerów z filtrami spalin',
            hopperVolumeM3: 'Magazyn paliwa Walking-Floor 90 m³',
            targetUseCases: 'Duży przemysł, sieci ciepłownicze, para technologiczna / gorąca woda',
        },
        ru: {
            dimensionsM: 'Модульный блок из 2–3 контейнеров с рукавными фильтрами',
            hopperVolumeM3: '90 м³ склад топлива Walking-Floor',
            targetUseCases: 'Крупная промышленность, централизованные теплосети, технологический пар/вода',
        },
    },
};

const FUEL_TRANSLATIONS: Record<
    IndustrialFuelOption['id'],
    Record<AppLocale, { label: string; note: string }>
> = {
    'natural-gas': {
        lt: {
            label: 'Gamtinės dujos (su ESO skirstymo dedamąja)',
            note: '~82 €/MWh šilumos (įskaitant katilo naudingumą ir galios mokestį)',
        },
        en: {
            label: 'Natural Gas (incl. grid distribution fee)',
            note: '~82 €/MWh heat (including boiler efficiency & capacity fee)',
        },
        pl: {
            label: 'Gaz ziemny (z opłatą dystrybucyjną)',
            note: '~82 €/MWh ciepła (z uwzględnieniem sprawności kotła i mocy zamówionej)',
        },
        ru: {
            label: 'Природный газ (с тарифом распределения)',
            note: '~82 €/МВт·ч тепла (включая КПД котла и плату за мощность)',
        },
    },
    lpg: {
        lt: {
            label: 'Suskystintos dujos (LPG balionai / požeminė talpa)',
            note: '~108 €/MWh šilumos (~0,78 €/l LPG)',
        },
        en: {
            label: 'Liquefied Petroleum Gas (LPG cylinders / underground tank)',
            note: '~108 €/MWh heat (~0.78 €/L LPG)',
        },
        pl: {
            label: 'Gaz płynny LPG (butle / zbiornik podziemny)',
            note: '~108 €/MWh ciepła (~0,78 €/l LPG)',
        },
        ru: {
            label: 'Сжиженный газ СУГ / LPG (баллоны / газгольдер)',
            note: '~108 €/МВт·ч тепла (~0,78 €/л LPG)',
        },
    },
    diesel: {
        lt: {
            label: 'Dyzelinas (žymėtas šildymo kuras)',
            note: '~118 €/MWh šilumos (~1,05 €/l su pristatymu)',
        },
        en: {
            label: 'Heating Oil / Diesel (marked heating fuel)',
            note: '~118 €/MWh heat (~1.05 €/L delivered)',
        },
        pl: {
            label: 'Olej opałowy / napędowy (paliwo grzewcze)',
            note: '~118 €/MWh ciepła (~1,05 €/l z dostawą)',
        },
        ru: {
            label: 'Дизельное печное топливо',
            note: '~118 €/МВт·ч тепла (~1,05 €/л с доставкой)',
        },
    },
    electricity: {
        lt: {
            label: 'Tiesioginė elektra / pramoniniai šildytuvai',
            note: '~165 €/MWh (pramoninis tarifas su persiuntimu)',
        },
        en: {
            label: 'Direct Electricity / Industrial Electric Heaters',
            note: '~165 €/MWh (commercial tariff incl. transmission)',
        },
        pl: {
            label: 'Energia elektryczna / nagrzewnice przemysłowe',
            note: '~165 €/MWh (taryfa przemysłowa z przesyłem)',
        },
        ru: {
            label: 'Прямое электроотопление / промышленные ТЭНы',
            note: '~165 €/МВт·ч (промышленный тариф с передачей)',
        },
    },
};

export default function IndustrialBoilerRoomsPage() {
    const intlLocale = useLocale() || 'lt';
    const rawPathname = usePathname() || '';
    const urlMatch = rawPathname.match(/^\/(lt|en|pl|ru)(?=\/|$)/i);
    const locale = resolveAppLocale(urlMatch ? urlMatch[1] : intlLocale);
    const showNet = useVatDisplayStore((s) => s.showNet);

    const heroEyebrow =
        locale === 'en'
            ? 'MANUFACTURING · SALES · RENTAL · 100 kW – 2.5 MW'
            : locale === 'pl'
              ? 'PRODUKCJA · SPRZEDAŻ · WYNAJEM · 100 kW – 2,5 MW'
              : locale === 'ru'
                ? 'ПРОИЗВОДСТВО · ПРОДАЖА · АРЕНДА · 100 кВт – 2,5 МВт'
                : 'GAMYBA · PARDAVIMAS · NUOMA · 100 kW – 2,5 MW';
    const heroTitle =
        locale === 'en'
            ? 'Containerized & Industrial Boiler Rooms 100 kW – 2.5 MW'
            : locale === 'pl'
              ? 'Kotłownie kontenerowe i przemysłowe 100 kW – 2,5 MW'
              : locale === 'ru'
                ? 'Контейнерные и промышленные котельные 100 кВт – 2,5 МВт'
                : 'Konteinerinės ir pramoninės katilinės 100 kW – 2,5 MW';
    const heroSubtitle =
        locale === 'en'
            ? 'Factory-assembled and pressure-tested in Kaunas: turnkey pellet and biomass boiler modules for factories, greenhouses, schools, district heating, and grain dryers.'
            : locale === 'pl'
              ? 'W pełni zmontowane i przetestowane w fabryce w Kownie kotłownie pelletowe i biomasowe dla zakładów produkcyjnych, szklarni, szkół oraz suszarni.'
              : locale === 'ru'
                ? 'Полностью собранные и испытанные на заводе в Каунасе пеллетные и биомассовые котельные для заводов, теплиц, школ и зерносушилок.'
                : 'Gamykloje Kaune pilnai surinktos, išbandytos ir į objektą atvežamos granulių bei biokuro katilinės gamykloms, šiltnamiams, mokykloms, daugiabučių kvartalams ir grūdų džiovykloms.';

    const [mode, setMode] = useState<'buy' | 'rent'>('buy');
    const [currentFuelId, setCurrentFuelId] = useState<IndustrialFuelOption['id']>('lpg');
    const [annualHeatMwh, setAnnualHeatMwh] = useState<number>(1200);
    const [selectedModuleCode, setSelectedModuleCode] = useState<string>('GK-500');
    const [activeZoneId, setActiveZoneId] = useState<string>('01');
    const [rfqSent, setRfqSent] = useState<boolean>(false);
    const [companyName, setCompanyName] = useState<string>('');
    const [contactPhone, setContactPhone] = useState<string>('');
    const [lightboxWork, setLightboxWork] = useState<GilesCompletedWorkItem | null>(null);
    const [externalDossierId, setExternalDossierId] = useState<string | null>(null);

    const allLocalizedWorks = getLocalizedCompletedWorks(locale);
    const localizedContainerSpecs = getLocalizedContainerBoilerSpecs(locale);

    const industrialWorks = allLocalizedWorks.filter(
        (w) =>
            w.category === 'industrial_containers' ||
            w.id === 'darbas-11' ||
            w.id === 'darbas-15' ||
            w.id === 'darbas-16',
    );

    const roi = computeIndustrialBoilerRoi({
        currentFuelId,
        annualHeatMwh,
        moduleCode: selectedModuleCode,
    });

    const localizedZones = BOILER_ROOM_ZONES_I18N[locale] || BOILER_ROOM_ZONES_I18N.lt;
    const activeZone =
        localizedZones.find((z) => z.id === activeZoneId) || localizedZones[0]!;

    const vatSuffix =
        locale === 'en'
            ? showNet
                ? 'excl. VAT'
                : 'incl. VAT'
            : locale === 'pl'
              ? showNet
                  ? 'netto'
                  : 'z VAT'
              : locale === 'ru'
                ? showNet
                    ? 'без НДС'
                    : 'с НДС'
                : showNet
                  ? 'be PVM'
                  : 'su PVM';

    const fromPrefix =
        locale === 'en'
            ? 'from'
            : locale === 'pl'
              ? 'od'
              : locale === 'ru'
                ? 'от'
                : 'nuo';

    const perMonthSuffix =
        locale === 'en'
            ? '/ mo.'
            : locale === 'pl'
              ? '/ mies.'
              : locale === 'ru'
                ? '/ мес.'
                : '/ mėn.';

    const formatPrice = (netEur: number) => {
        const val = showNet ? netEur : Math.round(netEur * 1.21);
        return `${val.toLocaleString('lt-LT')} € ${vatSuffix}`;
    };

    return (
        <main
            data-testid="industrial-boiler-rooms"
            className="min-h-screen bg-[#F5F3EE] text-[#11161B]"
        >
            {/* Dark Graphite Industrial Hero (#11161B) + 6 Studio Images Above the Fold */}
            <section className="bg-[#11161B] text-[#F5F3EE] border-b border-[#2C3742] py-6 sm:py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-[#FF8A3D]">
                            {heroEyebrow}
                        </span>
                        <span className="text-[#C9D0D8]">
                            {locale === 'en'
                                ? 'Lead Engineer Darius:'
                                : locale === 'pl'
                                  ? 'Inżynier Darius:'
                                  : locale === 'ru'
                                    ? 'Инженер Дарюс:'
                                    : 'Inžinierius Darius:'}{' '}
                            <strong className="text-white">{GILES_COMPANY_IDENTITY.phoneDarius}</strong>
                        </span>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                        <div className="space-y-2">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                                {heroTitle}
                            </h1>
                            <p className="text-xs sm:text-sm text-[#C9D0D8]">
                                {heroSubtitle}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <a
                                href="#industrial-rfq"
                                className="inline-flex items-center gap-2 rounded-sm bg-[#C2410C] hover:bg-[#9A3412] px-4 py-2.5 text-xs font-bold text-white text-center transition-colors max-w-full"
                            >
                                <Factory className="w-4 h-4 shrink-0" />
                                <span>
                                    {locale === 'en'
                                        ? 'Request Industrial Boiler Room Proposal'
                                        : locale === 'pl'
                                          ? 'Uzyskaj ofertę kotłowni przemysłowej'
                                          : locale === 'ru'
                                            ? 'Получить предложение по промышленной котельной'
                                            : 'Gauti pramoninės katilinės pasiūlymą'}
                                </span>
                            </a>
                        </div>
                    </div>

                    {/* 6 Bright Clickable Studio Industrial Boiler Visuals Above the Fold */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                        {INDUSTRIAL_STUDIO_GALLERY.map((item) => {
                            const lbl = item.label[locale] || item.label.lt;
                            return (
                                <div
                                    key={item.src}
                                    data-testid={`hero-industrial-unit-${item.id}`}
                                    onClick={() => setExternalDossierId(item.id)}
                                    className="cursor-pointer bg-[#EEEBE4] text-[#11161B] p-2.5 flex flex-col justify-between gap-2 min-w-0 max-w-full overflow-hidden transition-transform hover:-translate-y-0.5"
                                >
                                    <div className="h-24 w-full bg-white p-1.5 flex items-center justify-center overflow-hidden">
                                        <img
                                            src={assetUrl(item.src)}
                                            alt={lbl}
                                            className="max-h-full max-w-full object-contain brightness-105 contrast-105"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs font-extrabold text-[#11161B] leading-snug block break-words">
                                            {lbl}
                                        </span>
                                        <span className="text-xs font-bold text-[#C2410C] inline-flex items-center gap-1">
                                            <ZoomIn className="w-3 h-3 shrink-0" aria-hidden="true" />
                                            <span>Padidinti ir CAD</span>
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Full 6-Model Industrial Container Boiler House Dossiers, 3-View CAD Blueprints, Fuel/ROI Statistics & 0-to-Hero Guide */}
            <IndustrialContainersHub
                locale={locale}
                externalModalSystemId={externalDossierId}
                onCloseExternalModal={() => setExternalDossierId(null)}
            />

            {/* Section 2: 5 Typical Industrial Container Modules (GK-100 .. GK-2500) */}
            <section className="py-8 md:py-10 bg-white border-b border-[#E2DDD3]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                        <div>
                            <span className="text-xs font-bold text-[#C2410C] block mb-1">
                                {locale === 'en'
                                    ? '5 Standard Modules · Manufacturing & Rental'
                                    : locale === 'pl'
                                      ? '5 modułów typowych · Produkcja i wynajem'
                                      : locale === 'ru'
                                        ? '5 типовых модулей · Производство и аренда'
                                        : '5 tipiniai moduliai · Gamyba ir nuoma'}
                            </span>
                            <h2 className="text-xl md:text-2xl font-extrabold text-[#11161B]">
                                {locale === 'en'
                                    ? 'Containerized Boiler Room Series GK-100 – GK-2500'
                                    : locale === 'pl'
                                      ? 'Seria kotłowni kontenerowych GK-100 – GK-2500'
                                      : locale === 'ru'
                                        ? 'Серия контейнерных котельных GK-100 – GK-2500'
                                        : 'Konteinerinių katilinių serija GK-100 – GK-2500'}
                            </h2>
                        </div>

                        <div className="inline-flex flex-wrap items-center gap-1 rounded-sm bg-[#E7E3DB] p-1">
                            <button
                                type="button"
                                onClick={() => setMode('buy')}
                                aria-pressed={mode === 'buy'}
                                className={`px-3 py-1 rounded-xs text-xs font-bold whitespace-nowrap cursor-pointer bg-transparent border ${
                                    mode === 'buy'
                                        ? 'border-[#11161B] text-[#11161B]'
                                        : 'border-transparent text-[#5B6470] hover:text-[#11161B]'
                                }`}
                            >
                                {locale === 'en'
                                    ? 'Buy Boiler Plant (100 kW – 2.5 MW)'
                                    : locale === 'pl'
                                      ? 'Zakup kotłowni (100 kW – 2,5 MW)'
                                      : locale === 'ru'
                                        ? 'Покупка котельной (100 кВт – 2,5 МВт)'
                                        : 'Pirkti katilinę (100 kW – 2,5 MW)'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('rent')}
                                aria-pressed={mode === 'rent'}
                                className={`px-3 py-1 rounded-xs text-xs font-bold whitespace-nowrap cursor-pointer bg-transparent border ${
                                    mode === 'rent'
                                        ? 'border-[#C2410C] text-[#C2410C]'
                                        : 'border-transparent text-[#5B6470] hover:text-[#11161B]'
                                }`}
                            >
                                {locale === 'en'
                                    ? 'Rent Mobile Unit (15–500 kW)'
                                    : locale === 'pl'
                                      ? 'Wynajem (15–500 kW)'
                                      : locale === 'ru'
                                        ? 'Аренда (15–500 кВт)'
                                        : 'Nuomotis (15–500 kW)'}
                            </button>
                        </div>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-[#11161B] text-white">
                                    <th className="py-3 px-3 font-semibold">
                                        {locale === 'en' ? 'Model' : locale === 'pl' ? 'Model' : locale === 'ru' ? 'Модель' : 'Modelis'}
                                    </th>
                                    <th className="py-3 px-3 font-semibold">
                                        {locale === 'en' ? 'Heating Output' : locale === 'pl' ? 'Moc grzewcza' : locale === 'ru' ? 'Тепловая мощность' : 'Šildymo galia'}
                                    </th>
                                    <th className="py-3 px-3 font-semibold">
                                        {locale === 'en' ? 'Heated Area' : locale === 'pl' ? 'Ogrzewana pow.' : locale === 'ru' ? 'Отапливаемая пл.' : 'Šildomas plotas'}
                                    </th>
                                    <th className="py-3 px-3 font-semibold">
                                        {locale === 'en'
                                            ? 'Dimensions & Fuel Bunker'
                                            : locale === 'pl'
                                              ? 'Wymiary i magazyn paliwa'
                                              : locale === 'ru'
                                                ? 'Габариты и топливный бункер'
                                                : 'Gabaritai ir kuro sandėlis'}
                                    </th>
                                    <th className="py-3 px-3 font-semibold">
                                        {locale === 'en' ? 'Applications' : locale === 'pl' ? 'Zastosowanie' : locale === 'ru' ? 'Назначение' : 'Paskirtis'}
                                    </th>
                                    <th className="py-3 px-3 font-semibold text-right">
                                        {mode === 'buy'
                                            ? locale === 'en'
                                                ? 'Indicative Investment'
                                                : locale === 'pl'
                                                  ? 'Orientacyjna inwestycja'
                                                  : locale === 'ru'
                                                    ? 'Ориентировочная инвестиция'
                                                    : 'Orientacinė investicija'
                                            : locale === 'en'
                                              ? 'Monthly Rental'
                                              : locale === 'pl'
                                                ? 'Wynajem miesięczny'
                                                : locale === 'ru'
                                                  ? 'Аренда в месяц'
                                                  : 'Nuoma per mėn.'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2DDD3]">
                                {INDUSTRIAL_BOILER_MODULES.map((mod) => {
                                    const mTr = MODULE_TRANSLATIONS[mod.code]?.[locale] || {
                                        dimensionsM: mod.dimensionsM,
                                        hopperVolumeM3: mod.hopperVolumeM3,
                                        targetUseCases: mod.targetUseCases,
                                    };
                                    return (
                                        <tr
                                            key={mod.code}
                                            onClick={() => setSelectedModuleCode(mod.code)}
                                            className={`cursor-pointer transition-colors ${
                                                selectedModuleCode === mod.code
                                                    ? 'bg-[#FBEADF]'
                                                    : 'bg-white hover:bg-[#F5F3EE]'
                                            }`}
                                        >
                                            <td className="py-3 px-3 font-mono font-bold text-[#C2410C]">
                                                {mod.code}
                                            </td>
                                            <td className="py-3 px-3 font-extrabold text-[#11161B]">
                                                {mod.powerLabel}
                                            </td>
                                            <td className="py-3 px-3 font-semibold text-[#11161B] tabular-nums">
                                                {mod.heatedAreaM2}
                                            </td>
                                            <td className="py-3 px-3 text-[#5B6470]">
                                                <span className="font-mono text-[#11161B]">{mTr.dimensionsM}</span> · {mTr.hopperVolumeM3}
                                            </td>
                                            <td className="py-3 px-3 text-[#2A323B]">
                                                {mTr.targetUseCases}
                                            </td>
                                            <td className="py-3 px-3 font-extrabold text-[#11161B] text-right tabular-nums whitespace-nowrap">
                                                {mode === 'buy'
                                                    ? `${fromPrefix} ${formatPrice(mod.baseInvestmentNetEur)}`
                                                    : `${fromPrefix} ${formatPrice(mod.monthlyRentalNetEur)} ${perMonthSuffix}`}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Stacked Cards (0 swipe tables) */}
                    <div className="md:hidden space-y-3">
                        {INDUSTRIAL_BOILER_MODULES.map((mod) => {
                            const mTr = MODULE_TRANSLATIONS[mod.code]?.[locale] || {
                                dimensionsM: mod.dimensionsM,
                                hopperVolumeM3: mod.hopperVolumeM3,
                                targetUseCases: mod.targetUseCases,
                            };
                            return (
                                <div
                                    key={mod.code}
                                    onClick={() => setSelectedModuleCode(mod.code)}
                                    className={`rounded-md border p-3.5 space-y-1.5 text-xs ${
                                        selectedModuleCode === mod.code
                                            ? 'border-[#C2410C] bg-[#FBEADF]'
                                            : 'border-[#E2DDD3] bg-[#F5F3EE]'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-mono font-extrabold text-[#C2410C] text-sm">
                                            {mod.code} ({mod.powerLabel})
                                        </span>
                                        <span className="font-extrabold text-[#11161B] tabular-nums">
                                            {mode === 'buy'
                                                ? `${fromPrefix} ${formatPrice(mod.baseInvestmentNetEur)}`
                                                : `${fromPrefix} ${formatPrice(mod.monthlyRentalNetEur)} ${perMonthSuffix}`}
                                        </span>
                                    </div>
                                    <div className="text-[#11161B] font-semibold">
                                        {locale === 'en'
                                            ? 'Heated area:'
                                            : locale === 'pl'
                                              ? 'Ogrzewana powierzchnia:'
                                              : locale === 'ru'
                                                ? 'Отапливаемая площадь:'
                                                : 'Šildomas plotas:'}{' '}
                                        {mod.heatedAreaM2}
                                    </div>
                                    <div className="text-[#5B6470]">
                                        {locale === 'en'
                                            ? `Dimensions: ${mTr.dimensionsM} · Hopper: ${mTr.hopperVolumeM3}`
                                            : locale === 'pl'
                                              ? `Wymiary: ${mTr.dimensionsM} · Zasobnik: ${mTr.hopperVolumeM3}`
                                              : locale === 'ru'
                                                ? `Размеры: ${mTr.dimensionsM} · Бункер: ${mTr.hopperVolumeM3}`
                                                : `Matmenys: ${mTr.dimensionsM} · Bunkeris: ${mTr.hopperVolumeM3}`}
                                    </div>
                                    <div className="text-[#2A323B]">
                                        {locale === 'en'
                                            ? 'Applications:'
                                            : locale === 'pl'
                                              ? 'Obiekty:'
                                              : locale === 'ru'
                                                ? 'Объекты:'
                                                : 'Objektai:'}{' '}
                                        {mTr.targetUseCases}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Section 3: Interactive Industrial Fuel Payback (ROI) Calculator */}
            <section
                data-testid="industrial-roi-calculator"
                className="py-8 md:py-10 bg-[#F5F3EE] border-b border-[#E2DDD3]"
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-7 rounded-lg border border-[#E2DDD3] bg-white p-5 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#C2410C]">
                            <Calculator className="w-4 h-4 shrink-0" />
                            <span>
                                {locale === 'en'
                                    ? 'Industrial Fuel Payback (ROI) Calculator'
                                    : locale === 'pl'
                                      ? 'Kalkulator zwrotu (ROI) paliwa przemysłowego'
                                      : locale === 'ru'
                                        ? 'Калькулятор окупаемости (ROI) промышленного топлива'
                                        : 'Pramoninio kuro atsipirkimo (ROI) skaičiuoklė'}
                            </span>
                        </div>
                        <h2 className="text-xl font-extrabold text-[#11161B]">
                            {locale === 'en'
                                ? 'Compare your current fuel expenses with a Gilės biomass / pellet boiler plant'
                                : locale === 'pl'
                                  ? 'Porównaj obecne koszty paliwa z kotłownią na biomasę / pellet Gilės'
                                  : locale === 'ru'
                                    ? 'Сравните ваши текущие затраты на топливо с пеллетной / биомассовой котельной Gilės'
                                    : 'Palyginkite savo dabartines kuro sąnaudas su Gilės biokuro / granulių katiline'}
                        </h2>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-[#11161B]">
                                {locale === 'en'
                                    ? '1. Your current fuel:'
                                    : locale === 'pl'
                                      ? '1. Twoje obecne paliwo:'
                                      : locale === 'ru'
                                        ? '1. Ваше текущее топливо:'
                                        : '1. Jūsų dabartinis kuras:'}
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {INDUSTRIAL_FUELS.map((f) => {
                                    const active = f.id === currentFuelId;
                                    const fTr = FUEL_TRANSLATIONS[f.id]?.[locale] || {
                                        label: f.label,
                                        note: f.note,
                                    };
                                    return (
                                        <button
                                            key={f.id}
                                            type="button"
                                            onClick={() => setCurrentFuelId(f.id)}
                                            aria-pressed={active}
                                            className={`p-3 rounded-md border text-left text-xs cursor-pointer transition-colors ${
                                                active
                                                    ? 'border-[#C2410C] bg-[#FBEADF]'
                                                    : 'border-[#E2DDD3] bg-[#F5F3EE] hover:border-[#11161B]'
                                            }`}
                                        >
                                            <span className="block font-bold text-[#11161B]">
                                                {fTr.label}
                                            </span>
                                            <span className="block text-[#5B6470] mt-0.5">
                                                {fTr.note}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-[#11161B]">
                                    {locale === 'en'
                                        ? '2. Annual heat consumption (MWh / year):'
                                        : locale === 'pl'
                                          ? '2. Roczne zużycie ciepła (MWh / rok):'
                                          : locale === 'ru'
                                            ? '2. Годовое потребление тепла (МВт·ч / год):'
                                            : '2. Metinis šilumos suvartojimas (MWh / metus):'}
                                </span>
                                <span className="font-extrabold text-[#C2410C] tabular-nums text-sm">
                                    {annualHeatMwh}{' '}
                                    {locale === 'en'
                                        ? `MWh/yr (~${Math.round(annualHeatMwh / 2.2)} kW peak)`
                                        : locale === 'pl'
                                          ? `MWh/rok (~${Math.round(annualHeatMwh / 2.2)} kW szczyt)`
                                          : locale === 'ru'
                                            ? `МВт·ч/г. (~${Math.round(annualHeatMwh / 2.2)} кВт пик)`
                                            : `MWh/m. (~${Math.round(annualHeatMwh / 2.2)} kW pikas)`}
                                </span>
                            </div>
                            <input
                                type="range"
                                min={200}
                                max={6000}
                                step={100}
                                value={annualHeatMwh}
                                onChange={(e) => setAnnualHeatMwh(Number(e.target.value))}
                                aria-label={
                                    locale === 'en'
                                        ? 'Annual heat consumption in megawatt-hours'
                                        : locale === 'pl'
                                          ? 'Roczne zużycie ciepła w megawatogodzinach'
                                          : locale === 'ru'
                                            ? 'Годовое потребление тепла в мегаватт-часах'
                                            : 'Metinis šilumos suvartojimas megavatvalandėmis'
                                }
                                className="w-full accent-[#C2410C] cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-[#5B6470]">
                                <span>200 MWh (GK-100)</span>
                                <span>1 200 MWh (GK-500)</span>
                                <span>3 000 MWh (GK-1000)</span>
                                <span>6 000 MWh (GK-2500)</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-[#11161B]">
                                {locale === 'en'
                                    ? '3. Selected containerized boiler module:'
                                    : locale === 'pl'
                                      ? '3. Wybrany moduł kotłowni kontenerowej:'
                                      : locale === 'ru'
                                        ? '3. Выбранный модуль контейнерной котельной:'
                                        : '3. Pasirinktas konteinerinės katilinės modulis:'}
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {INDUSTRIAL_BOILER_MODULES.map((m) => (
                                    <button
                                        key={m.code}
                                        type="button"
                                        onClick={() => setSelectedModuleCode(m.code)}
                                        className={`px-3 py-1.5 rounded-xs text-xs font-semibold whitespace-nowrap cursor-pointer border ${
                                            selectedModuleCode === m.code
                                                ? 'border-[#11161B] bg-[#11161B] text-white'
                                                : 'border-[#D5CFC3] bg-[#F5F3EE] text-[#11161B]'
                                        }`}
                                    >
                                        {m.code} ({m.powerLabel})
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ROI Result Panel */}
                    <div className="lg:col-span-5 rounded-lg bg-[#11161B] text-[#F5F3EE] p-5 space-y-4">
                        <div>
                            <span className="text-xs font-bold text-[#FF8A3D] block mb-1">
                                {locale === 'en'
                                    ? `Economic Calculation · ${roi.module.code} (${roi.module.powerLabel})`
                                    : locale === 'pl'
                                      ? `Kalkulacja ekonomiczna · ${roi.module.code} (${roi.module.powerLabel})`
                                      : locale === 'ru'
                                        ? `Экономический расчет · ${roi.module.code} (${roi.module.powerLabel})`
                                        : `Ekonominis skaičiavimas · ${roi.module.code} (${roi.module.powerLabel})`}
                            </span>
                            <h3 className="text-xl font-extrabold text-white">
                                {locale === 'en'
                                    ? `Annual savings: ${roi.annualSavingsEur.toLocaleString('lt-LT')} € / yr`
                                    : locale === 'pl'
                                      ? `Roczna oszczędność: ${roi.annualSavingsEur.toLocaleString('lt-LT')} € / rok`
                                      : locale === 'ru'
                                        ? `Годовая экономия: ${roi.annualSavingsEur.toLocaleString('lt-LT')} € / г.`
                                        : `Metinis sutaupymas: ${roi.annualSavingsEur.toLocaleString('lt-LT')} € / m.`}
                            </h3>
                        </div>

                        <div className="bg-[#1B232C] rounded-md p-4 space-y-2.5 text-xs">
                            <div className="flex items-center justify-between text-[#C9D0D8]">
                                <span>
                                    {locale === 'en'
                                        ? 'Current annual fuel cost:'
                                        : locale === 'pl'
                                          ? 'Obecny roczny koszt paliwa:'
                                          : locale === 'ru'
                                            ? 'Текущие затраты на топливо в год:'
                                            : 'Dabartinio kuro sąnaudos per metus:'}
                                </span>
                                <span className="font-bold text-white tabular-nums">
                                    {roi.currentAnnualCostEur.toLocaleString('lt-LT')}{' '}
                                    {locale === 'en' ? '€ / yr' : locale === 'pl' ? '€ / rok' : locale === 'ru' ? '€ / г.' : '€ / m.'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-[#C9D0D8]">
                                <span>
                                    {locale === 'en'
                                        ? 'With Gilės pellet / biomass boiler (~38 €/MWh):'
                                        : locale === 'pl'
                                          ? 'Z kotłownią na pellet / biomasę Gilės (~38 €/MWh):'
                                          : locale === 'ru'
                                            ? 'С пеллетной / биомассовой котельной Gilės (~38 €/МВт·ч):'
                                            : 'Su Gilės granulių / biokuro katiline (~38 €/MWh):'}
                                </span>
                                <span className="font-bold text-[#4ADE80] tabular-nums">
                                    {roi.biomassAnnualCostEur.toLocaleString('lt-LT')}{' '}
                                    {locale === 'en' ? '€ / yr' : locale === 'pl' ? '€ / rok' : locale === 'ru' ? '€ / г.' : '€ / m.'}
                                </span>
                            </div>
                            <div className="pt-2 border-t border-[#2C3742] flex items-center justify-between">
                                <span className="text-[#C9D0D8] font-semibold">
                                    {locale === 'en'
                                        ? 'Estimated payback period:'
                                        : locale === 'pl'
                                          ? 'Orientacyjny okres zwrotu:'
                                          : locale === 'ru'
                                            ? 'Ориентировочная окупаемость:'
                                            : 'Orientacinis atsipirkimas:'}
                                </span>
                                <span className="text-lg font-extrabold text-[#FF8A3D] tabular-nums">
                                    {roi.paybackMonths}{' '}
                                    {locale === 'en' ? 'mo.' : locale === 'pl' ? 'mies.' : locale === 'ru' ? 'мес.' : 'mėn.'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-[#C9D0D8]">
                                <span>
                                    {locale === 'en'
                                        ? 'Net 5-year benefit (after CAPEX):'
                                        : locale === 'pl'
                                          ? 'Efekt netto po 5 latach (po odjęciu inwestycji):'
                                          : locale === 'ru'
                                            ? 'Чистый эффект за 5 лет (за вычетом инвестиции):'
                                            : 'Grynasis 5 metų efektas (atėmus investiciją):'}
                                </span>
                                <span className="font-extrabold text-[#4ADE80] tabular-nums">
                                    +{roi.fiveYearSavingsEur.toLocaleString('lt-LT')} €
                                </span>
                            </div>
                        </div>

                        <a
                            href="#industrial-rfq"
                            className="w-full inline-flex items-center justify-center rounded-sm bg-[#C2410C] hover:bg-[#9A3412] px-4 py-3 text-xs font-bold text-white text-center transition-colors"
                        >
                            {locale === 'en'
                                ? 'Order Site Thermal Audit & Technical Proposal'
                                : locale === 'pl'
                                  ? 'Zamów audyt cieplny obiektu i ofertę techniczną'
                                  : locale === 'ru'
                                    ? 'Заказать теплоаудит объекта и техническое предложение'
                                    : 'Užsakyti objekto šilumos auditą ir techninį pasiūlymą'}
                        </a>
                    </div>
                </div>
            </section>

            {/* Section 4: Container Boiler Room Structure & B2B RFQ Form */}
            <section id="industrial-rfq" className="py-8 md:py-10 bg-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-7 space-y-4">
                        <div>
                            <span className="text-xs font-bold text-[#C2410C] block mb-1">
                                {locale === 'en'
                                    ? 'Technical Architecture · Complete Factory Build'
                                    : locale === 'pl'
                                      ? 'Budowa techniczna · Pełna kompletacja fabryczna'
                                      : locale === 'ru'
                                        ? 'Техническое устройство · Полная заводская комплектация'
                                        : 'Techninė sandara · Pilna gamyklinė komplektacija'}
                            </span>
                            <h2 className="text-xl font-extrabold text-[#11161B]">
                                {locale === 'en'
                                    ? 'Containerized Boiler Room Architecture & 5 Core Assemblies'
                                    : locale === 'pl'
                                      ? 'Budowa kotłowni kontenerowej i 5 głównych zespołów'
                                      : locale === 'ru'
                                        ? 'Устройство контейнерной котельной и 5 основных узлов'
                                        : 'Konteinerinės katilinės sandara ir 5 pagrindiniai mazgai'}
                            </h2>
                        </div>

                        {/* High-Contrast 6-Meter Container Boiler Room Cross-Section CAD Blueprint (KONTEINERINĖS KATILINĖS PJŪVIS · 6 058 × 2 438 × 2 896 mm) */}
                        <GilesContainer20ftSchematic
                            locale={locale}
                            testId="pramonei-container-cad-blueprint"
                            selectedZoneId={
                                (['A', 'B', 'C', 'D'].includes(activeZoneId)
                                    ? activeZoneId
                                    : 'B') as ContainerZoneId
                            }
                            onSelectZone={(z) => setActiveZoneId(z)}
                        />

                        <div className="flex flex-wrap gap-1.5">
                            {localizedZones.map((z) => (
                                <button
                                    key={z.id}
                                    type="button"
                                    onClick={() => setActiveZoneId(z.id)}
                                    className={`px-3 py-1.5 rounded-xs text-xs font-semibold whitespace-nowrap cursor-pointer border ${
                                        activeZoneId === z.id
                                            ? 'border-[#C2410C] bg-[#C2410C] text-white'
                                            : 'border-[#D5CFC3] bg-[#F5F3EE] text-[#11161B]'
                                    }`}
                                >
                                    {locale === 'en'
                                        ? `Zone ${z.id}`
                                        : locale === 'pl'
                                          ? `Zespół ${z.id}`
                                          : locale === 'ru'
                                            ? `Узел ${z.id}`
                                            : `Mazgas ${z.id}`}
                                </button>
                            ))}
                        </div>

                        <div className="rounded-lg border border-[#E2DDD3] bg-[#F5F3EE] p-5 space-y-2">
                            <h3 className="text-base font-extrabold text-[#11161B]">
                                {activeZone.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-[#2A323B] leading-relaxed">
                                {activeZone.desc}
                            </p>
                            <p className="text-xs font-semibold text-[#C2410C] pt-1">
                                {activeZone.specs}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="rounded-md border border-[#E2DDD3] bg-[#F5F3EE] p-3.5">
                                <strong className="block text-[#11161B] mb-1">
                                    {locale === 'en'
                                        ? 'No Permanent Building Permit Required'
                                        : locale === 'pl'
                                          ? 'Nie wymaga pozwolenia na budowę budynku stałego'
                                          : locale === 'ru'
                                            ? 'Не требуется разрешение на капитальное строительство'
                                            : 'Nereikia statybos leidimo kapitaliniam pastatui'}
                                </strong>
                                <span className="text-[#5B6470]">
                                    {locale === 'en'
                                        ? 'Classified as a mobile technological unit – placed on foundation blocks and connected to your heating main within 1–2 days.'
                                        : locale === 'pl'
                                          ? 'Kotłownia kontenerowa traktowana jest jako mobilne urządzenie technologiczne – stawiana na bloczkach fundamentowych i podłączana w 1–2 dni.'
                                          : locale === 'ru'
                                            ? 'Контейнерная котельная классифицируется как мобильная технологическая установка – ставится на фундаментные блоки и подключается за 1–2 дня.'
                                            : 'Konteinerinė katilinė traktuojama kaip mobilus technologinis įrenginys – pastatoma ant pamatinių blokų ir prijungiama prie šilumos trasos per 1–2 dienas.'}
                                </span>
                            </div>
                            <div className="rounded-md border border-[#E2DDD3] bg-[#F5F3EE] p-3.5">
                                <strong className="block text-[#11161B] mb-1">
                                    {locale === 'en'
                                        ? '24/7 Remote Monitoring from Kaunas Service Center'
                                        : locale === 'pl'
                                          ? 'Zdalny nadzór 24/7 z centrum serwisowego w Kownie'
                                          : locale === 'ru'
                                            ? 'Удаленный мониторинг 24/7 из сервисного центра в Каунасе'
                                            : '24/7 nuotolinė priežiūra iš Kauno serviso centro'}
                                </strong>
                                <span className="text-[#5B6470]">
                                    {locale === 'en'
                                        ? 'Every module includes GSM/SCADA telemetry and rapid field support from the Gilės Inžinerija engineering team.'
                                        : locale === 'pl'
                                          ? 'Każdy moduł wyposażony jest w telemetrię GSM/SCADA oraz wsparcie brygady serwisowej Gilės Inžinerija.'
                                          : locale === 'ru'
                                            ? 'Каждый модуль комплектуется GSM/SCADA телеметрией и поддержкой выездной сервисной бригады Gilės Inžinerija.'
                                            : 'Kiekvienas modulis komplektuojamas su GSM/SCADA telemetrija ir Gilės Inžinerijos serviso brigados palaikymu.'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-5 rounded-lg border border-[#E2DDD3] bg-[#F5F3EE] p-5 space-y-3.5">
                        <div>
                            <span className="text-xs font-bold text-[#C2410C] block mb-1">
                                {locale === 'en'
                                    ? 'Industrial Project Inquiry (RFQ)'
                                    : locale === 'pl'
                                      ? 'Zapytanie ofertowe o projekt przemysłowy (RFQ)'
                                      : locale === 'ru'
                                        ? 'Запрос коммерческого предложения (RFQ)'
                                        : 'Pramoninio projekto užklausa (RFQ)'}
                            </span>
                            <h3 className="text-lg font-extrabold text-[#11161B]">
                                {locale === 'en'
                                    ? `Request Containerized Boiler Plant Quote (${roi.module.code})`
                                    : locale === 'pl'
                                      ? `Uzyskaj wycenę kotłowni kontenerowej (${roi.module.code})`
                                      : locale === 'ru'
                                        ? `Получить смету контейнерной котельной (${roi.module.code})`
                                        : `Gauti konteinerinės katilinės sąmatą (${roi.module.code})`}
                            </h3>
                        </div>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                setRfqSent(true);
                            }}
                            className="space-y-2.5 text-xs"
                        >
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder={
                                    locale === 'en'
                                        ? 'Company name & city'
                                        : locale === 'pl'
                                          ? 'Nazwa firmy i miasto'
                                          : locale === 'ru'
                                            ? 'Название компании и город'
                                            : 'Įmonės pavadinimas ir miestas'
                                }
                                aria-label={
                                    locale === 'en'
                                        ? 'Company name and city'
                                        : locale === 'pl'
                                          ? 'Nazwa firmy i miasto'
                                          : locale === 'ru'
                                            ? 'Название компании и город'
                                            : 'Įmonės pavadinimas ir miestas'
                                }
                                className="w-full rounded-xs border border-[#D5CFC3] bg-white px-3 py-2 text-[#11161B]"
                            />
                            <input
                                type="tel"
                                value={contactPhone}
                                onChange={(e) => setContactPhone(e.target.value)}
                                placeholder={
                                    locale === 'en'
                                        ? 'Contact phone (+370 6...)'
                                        : locale === 'pl'
                                          ? 'Telefon kontaktowy (+48 / +370...)'
                                          : locale === 'ru'
                                            ? 'Контактный телефон (+370 6...)'
                                            : 'Kontaktinis telefonas (+370 6...)'
                                }
                                aria-label={
                                    locale === 'en'
                                        ? 'Contact phone'
                                        : locale === 'pl'
                                          ? 'Telefon kontaktowy'
                                          : locale === 'ru'
                                            ? 'Контактный телефон'
                                            : 'Kontaktinis telefonas'
                                }
                                className="w-full rounded-xs border border-[#D5CFC3] bg-white px-3 py-2 text-[#11161B]"
                            />
                            <button
                                type="submit"
                                className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-[#11161B] hover:bg-[#C2410C] px-4 py-3 text-xs font-bold text-white text-center cursor-pointer transition-colors"
                            >
                                <Wrench className="w-4 h-4 shrink-0" />
                                <span>
                                    {rfqSent
                                        ? locale === 'en'
                                            ? 'Industrial inquiry sent to Engineer Darius'
                                            : locale === 'pl'
                                              ? 'Zapytanie przemysłowe wysłane do inżyniera Dariusa'
                                              : locale === 'ru'
                                                ? 'Промышленная заявка отправлена инженеру Дарюсу'
                                                : 'Pramoninė užklausa išsiųsta inžinieriui Dariui'
                                        : locale === 'en'
                                          ? `Send Inquiry (${roi.module.code} · ${mode === 'buy' ? 'Purchase' : 'Rental'})`
                                          : locale === 'pl'
                                            ? `Wyślij zapytanie (${roi.module.code} · ${mode === 'buy' ? 'Zakup' : 'Wynajem'})`
                                            : locale === 'ru'
                                              ? `Отправить запрос (${roi.module.code} · ${mode === 'buy' ? 'Покупка' : 'Аренда'})`
                                              : `Siųsti užklausą (${roi.module.code} · ${mode === 'buy' ? 'Pirkimas' : 'Nuoma'})`}
                                </span>
                            </button>
                        </form>

                        <div className="pt-2 border-t border-[#E2DDD3] flex items-center justify-between text-xs text-[#5B6470]">
                            <span className="inline-flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-[#C2410C]" />
                                <span>Darius: {GILES_COMPANY_IDENTITY.phoneDarius}</span>
                            </span>
                            <Link href={`/${locale}/b2b`} className="font-bold text-[#C2410C] underline">
                                {locale === 'en'
                                    ? 'B2B Installer Portal'
                                    : locale === 'pl'
                                      ? 'Portal B2B dla instalatorów'
                                      : locale === 'ru'
                                        ? 'B2B портал для монтажников'
                                        : 'Montuotojų B2B portalas'}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 5: Real Industrial & Containerized Completed Works Showcase (giles-darbas-*.webp) */}
            <section
                id="pramonei-atlikti-darbai"
                data-testid="pramonei-completed-works"
                className="py-10 md:py-14 bg-[#F5F3EE] border-t border-[#E2DDD3]"
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                        <div className="space-y-1.5 max-w-3xl">
                            <span className="tabular-nums text-xs font-bold text-[#C2410C] block">
                                {locale === 'en'
                                    ? 'Completed Industrial Projects · gilesinzinerija.com Archive'
                                    : locale === 'pl'
                                      ? 'Zrealizowane obiekty przemysłowe · archiwum gilesinzinerija.com'
                                      : locale === 'ru'
                                        ? 'Реализованные промышленные объекты · архив gilesinzinerija.com'
                                        : 'Realizuoti pramoniniai objektai · gilesinzinerija.com archyvas'}
                            </span>
                            <h2 className="text-xl md:text-3xl font-extrabold text-[#11161B] leading-tight">
                                {locale === 'en'
                                    ? 'Manufactured & Installed Containerized, Mobile, and Biogas Boiler Plants'
                                    : locale === 'pl'
                                      ? 'Wyprodukowane i zamontowane kotłownie kontenerowe, mobilne oraz biogazowe'
                                      : locale === 'ru'
                                        ? 'Изготовленные и смонтированные контейнерные, мобильные и биогазовые котельные'
                                        : 'Pagamintos ir sumontuotos konteinerinės, mobilios bei biodujų katilinės'}
                            </h2>
                            <p className="text-xs sm:text-sm text-[#5B6470]">
                                {locale === 'en'
                                    ? 'Authentic photographs of 120 kW – 2.0 MW boiler rooms, rooftop gas modules, and industrial hydronic substations built by UAB „Gilės inžinerija“ on a clean #EEEBE4 studio canvas.'
                                    : locale === 'pl'
                                      ? 'Autentyczne zdjęcia kotłowni 120 kW – 2,0 MW, dachowych modułów gazowych i węzłów przemysłowych wykonanych przez UAB „Gilės inžinerija” na czystym tle studyjnym #EEEBE4.'
                                      : locale === 'ru'
                                        ? 'Реальные фотографии котельных 120 кВт – 2,0 МВт, крышных газовых модулей и промышленных тепловых узлов производства UAB «Gilės inžinerija» на чистом студийном фоне #EEEBE4.'
                                        : 'Tikros UAB „Gilės inžinerija“ pagamintų 120 kW – 2,0 MW katilinių, stoginių dujinių modulių ir pramoninių šilumos mazgų fotofiksacijos ant švaraus #EEEBE4 studijinio fono.'}
                            </p>
                        </div>
                        <Link
                            href={`/${locale}/inzinerija#atlikti-darbai`}
                            className="inline-flex items-center rounded-none bg-[#11161B] hover:bg-[#C2410C] px-4 py-2.5 text-xs font-bold text-white text-center transition-colors min-h-[44px]"
                        >
                            {locale === 'en'
                                ? 'All 16 Completed Projects & Service'
                                : locale === 'pl'
                                  ? 'Wszystkie 16 realizacji i serwis'
                                  : locale === 'ru'
                                    ? 'Все 16 реализованных объектов и сервис'
                                    : 'Visi 16 realizuotų objektų ir servisas'}
                        </Link>
                    </div>

                    {/* 5 Real Mobile & Container Boiler Room Capabilities */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 border-t border-l border-[#E2DDD3]">
                        {localizedContainerSpecs.map((spec) => (
                            <div
                                key={spec.code}
                                className="border-r border-b border-[#E2DDD3] bg-white p-4 space-y-1.5 text-xs flex flex-col justify-between"
                            >
                                <div className="space-y-1">
                                    <span className="tabular-nums font-bold text-[#C2410C] block">
                                        {spec.code} · {spec.powerRange}
                                    </span>
                                    <strong className="text-[#11161B] block leading-snug">
                                        {spec.title}
                                    </strong>
                                    <p className="text-[#5B6470]">{spec.application}</p>
                                </div>
                                <span className="pt-2 border-t border-[#E2DDD3] font-bold text-[#157A3B] block">
                                    {spec.availability}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Industrial Completed Works Photo Grid (wired to IndustrialContainersHub Lightbox & CAD Dossier) */}
                    <CompletedWorksGallery
                        works={industrialWorks}
                        locale={locale}
                        onSelectSystemId={(sysId) => setExternalDossierId(sysId)}
                    />
                </div>
            </section>

            {lightboxWork && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={lightboxWork.title}
                    onClick={() => setLightboxWork(null)}
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white border-2 border-[#11161B] max-w-4xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-4"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-[#E2DDD3] pb-3">
                            <div>
                                <span className="font-mono text-xs font-bold text-[#C2410C] block">
                                    {lightboxWork.numLabel} · {lightboxWork.powerKw} · {lightboxWork.location}
                                </span>
                                <h3 className="text-lg sm:text-xl font-extrabold text-[#11161B]">
                                    {lightboxWork.title}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setLightboxWork(null)}
                                aria-label={
                                    locale === 'en'
                                        ? 'Close preview'
                                        : locale === 'pl'
                                          ? 'Zamknij podgląd'
                                          : locale === 'ru'
                                            ? 'Закрыть просмотр'
                                            : 'Uždaryti peržiūrą'
                                }
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
                                <span className="text-[#5B6470] block">
                                    {locale === 'en'
                                        ? 'Boiler / Module'
                                        : locale === 'pl'
                                          ? 'Kocioł / Moduł'
                                          : locale === 'ru'
                                            ? 'Котел / Модуль'
                                            : 'Katilas / Modulis'}
                                </span>
                                <strong className="text-[#11161B]">{lightboxWork.boilerModel}</strong>
                            </div>
                            <div>
                                <span className="text-[#5B6470] block">
                                    {locale === 'en'
                                        ? 'Burner & Equipment'
                                        : locale === 'pl'
                                          ? 'Palnik i wyposażenie'
                                          : locale === 'ru'
                                            ? 'Горелка и оборудование'
                                            : 'Degiklis ir įranga'}
                                </span>
                                <strong className="text-[#11161B]">{lightboxWork.burnerOrEquipment}</strong>
                            </div>
                            <div>
                                <span className="text-[#5B6470] block">
                                    {locale === 'en'
                                        ? 'Output & Result'
                                        : locale === 'pl'
                                          ? 'Moc i rezultat'
                                          : locale === 'ru'
                                            ? 'Мощность и результат'
                                            : 'Galia ir rezultatas'}
                                </span>
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
        </main>
    );
}
