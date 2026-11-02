'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckCircle2, FileText, ShieldCheck, Flame, Thermometer } from 'lucide-react';
import { useLocale } from 'next-intl';
import { resolveAppLocale } from '../i18n/storefront-ui-copy';
import type { AppLocale } from '../i18n/routing';
// W126-F3: calculateApvaSubsidyEstimate ir tipai – serveriui saugiame
// src/lib/heat/apva-estimate (MCP maršrutas per 'use client' modulį gaudavo
// RSC client-reference proxy).
import {
    calculateApvaSubsidyEstimate,
    APVA_POWER_STEPS_KW,
    type ApvaReplacedBoilerType,
    type ApvaNewDeviceType,
    type ApvaPowerStepKw,
} from '../lib/heat/apva-estimate';

export type {
    ApvaReplacedBoilerType,
    ApvaNewDeviceType,
    ApvaPowerStepKw,
    ApvaSubsidyCalculationInput,
    ApvaSubsidyCalculationResult,
} from '../lib/heat/apva-estimate';

export const APVA_MANDATORY_INVOICE_FIELDS: Record<AppLocale, [string, string, string, string, string]> = {
    lt: [
        '1. Tikslus gamintojo modelio kodas',
        '2. Vardinė šiluminė galia (kW)',
        '3. Sezoninis naudingumo koeficientas SCOP / ηs',
        '4. EcoDesign (ES 2015/1189 arba 813/2013) atitikties žyma',
        '5. Objekto NTR registro / montavimo adresas',
    ],
    en: [
        '1. Exact manufacturer model code (Tikslus gamintojo modelio kodas)',
        '2. Nominal thermal power in kW (Vardinė šiluminė galia (kW))',
        '3. Seasonal efficiency SCOP / ηs (Sezoninis naudingumo koeficientas SCOP / ηs)',
        '4. EcoDesign (EU 2015/1189 or 813/2013) compliance mark (EcoDesign atitikties žyma)',
        '5. Unique building registry / installation address (Objekto unikalus / montavimo adresas)',
    ],
    pl: [
        '1. Dokładny kod modelu producenta (Tikslus gamintojo modelio kodas)',
        '2. Znamionowa moc cieplna w kW (Vardinė šiluminė galia (kW))',
        '3. Sezonowa efektywność SCOP / ηs (Sezoninis naudingumo koeficientas SCOP / ηs)',
        '4. Znak zgodności EcoDesign UE 2015/1189 lub 813/2013',
        '5. Unikalny numer obiektu / adres montażu',
    ],
    ru: [
        '1. Точный код модели производителя (Tikslus gamintojo modelio kodas)',
        '2. Номинальная тепловая мощность в кВт (Vardinė šiluminė galia (kW))',
        '3. Сезонный коэффициент эффективности SCOP / ηs',
        '4. Отметка соответствия EcoDesign (ЕС 2015/1189 или 813/2013)',
        '5. Уникальный номер объекта / адрес монтажа',
    ],
};

export function isProductEligibleForApvaSubsidy(product: {
    name?: string | null;
    category?: string | null;
    sku?: string | null;
    description?: string | null;
}): boolean {
    const text = [product.name || '', product.category || '', product.sku || ''].join(' ');
    const isExcludedAccessory =
        /termogalvut|termostatinė radiatoriaus|radiatorius|kolektorius|balansinis|plėtimosi indas|separatorius|oro atskyriklis|tarpin|eurokonus/i.test(
            text,
        );
    if (isExcludedAccessory) return false;

    return /šilumos siurbl|heat pump|pompa ciepła|тепловой насос|haier|aw0|granul\w*\s+degikl|pellet\s+burner|palnik\s+pelet|пеллетн\w+\s+горелк|mpb[-\s]?nani|pelltech|pv[-\s]?\d|katil|boiler|kocioł|котел|katri|verner|ponast|megatherm/i.test(
        text,
    );
}

export function formatApvaInvoiceComplianceNote(params: {
    sku: string;
    title: string;
    powerKw?: number;
    buyerAddress?: string;
}): string {
    const inferredKwMatch = params.title.match(/(\d+(?:[.,]\d+)?)\s*kW/i);
    const kwStr = params.powerKw
        ? `${params.powerKw} kW`
        : inferredKwMatch
          ? `${inferredKwMatch[1]} kW`
          : '8,0–25,0 kW';
    const isHp = /siurbl|haier|aw0|r290|r32/i.test(`${params.sku} ${params.title}`);
    const effStr = isHp ? 'SCOP 4,85 / A+++' : 'SCOP/ηs ≥ 79 % (EN 303-5 5 kl.)';
    const ecoStr = isHp ? 'EcoDesign ES 813/2013' : 'EcoDesign ES 2015/1189';
    const addr = params.buyerAddress?.trim() || 'Eigulių g. 21, LT-51418 Kaunas';

    return `[LEA ATITIKTIS: Modelis ${params.sku} | Vardinė galia: ${kwStr} | Efektyvumas: ${effStr} | Sertifikatas: ${ecoStr} | Montavimo adresas: ${addr}]`;
}

const APVA_WIDGET_I18N: Record<
    AppLocale,
    {
        kicker: string;
        heading: string;
        subtitle: string;
        step1ReplacedLabel: string;
        replacedOptions: Record<ApvaReplacedBoilerType, string>;
        step2NewDeviceLabel: string;
        newDeviceOptions: Record<ApvaNewDeviceType, { title: string; badge: string; desc: string }>;
        step3PowerLabel: string;
        step4PriceLabel: string;
        resultBadge: string;
        estimatedGrantLabel: string;
        netInvestmentLabel: string;
        rateFormulaNote: (rateEur: number, sharePct: number) => string;
        mandatoryFieldsHeading: string;
        mandatoryFieldsSub: string;
        recommendedModelLabel: string;
        viewEligibleProductsBtn: string;
    }
> = {
    lt: {
        kicker: 'LEA KOMPENSACIJA KATILŲ KEITIMUI · LIETUVOS ENERGETIKOS AGENTŪRA',
        heading: 'LEA katilų keitimo kompensacijos skaičiuoklė ir PVM sąskaitos faktūros reikalavimai',
        subtitle:
            'Apskaičiuokite preliminarią valstybės kompensaciją keičiant neefektyvų malkinį, anglies ar dujinį katilą į A+++ šilumos siurblį Oras–Vanduo arba 5 klasės EcoDesign biokuro katilą.',
        step1ReplacedLabel: '1. Keičiamo katilo tipas',
        replacedOptions: {
            fossil_coal_wood: 'Senas malkinis / anglies / durpių katilas',
            old_biomass: 'Susidėvėjęs biokuro katilas (iki 2016 m.)',
            fossil_gas_oil: 'Dujinis / skystojo kuro katilas',
        },
        step2NewDeviceLabel: '2. Naujo įrenginio tipas (Oras–Vanduo / 5 kl. granulinis katilas)',
        newDeviceOptions: {
            heat_pump_air_water: {
                title: 'Šilumos siurblys Oras–Vanduo (Haier R290 / R32)',
                badge: 'A+++ · ES 813/2013',
                desc: 'Aukštatemperatūris R290 monoblokas iki +75 °C (tinka ir senų radiatorių sistemoms)',
            },
            ecodesign_pellet_boiler: {
                title: '5 klasės EcoDesign biokuro / granulinis katilas',
                badge: 'EN 303-5 · ES 2015/1189',
                desc: 'Megatherm / Verner / Ponast / Gilės automatinė granulinė sistema',
            },
        },
        step3PowerLabel: '3. Reikalinga šiluminė galia (kW)',
        step4PriceLabel: '4. Įrenginio kaina (€ su PVM)',
        resultBadge: 'LEA KOMPENSACIJOS SUVESTINĖ',
        estimatedGrantLabel: 'Preliminari LEA kompensacija',
        netInvestmentLabel: 'Kliento grynoji investicija po paramos',
        rateFormulaNote: (rateEur, sharePct) =>
            `Skaičiuojama pagal LEA fiksuotąjį įkainį (${rateEur.toLocaleString('lt-LT')} €/kW šioje galios juostoje), kompensuojant iki ${sharePct} % įrenginio kainos.`,
        mandatoryFieldsHeading: '5 privalomi LEA PVM sąskaitos faktūros ir deklaracijos rekvizitai',
        mandatoryFieldsSub:
            'UAB „Gilės inžinerija“ GILE serijos sąskaitose visi šie rodikliai nurodomi automatiškai – LEA paraiškai papildomų pažymų nebereikia:',
        recommendedModelLabel: 'Rekomenduojamas LEA reikalavimus atitinkantis įrenginys:',
        viewEligibleProductsBtn: 'Peržiūrėti LEA tinkamus katilus ir ŠS',
    },
    en: {
        kicker: 'LEA BOILER REPLACEMENT GRANT · LITHUANIAN ENERGY AGENCY',
        heading: 'LEA State Subsidy Calculator & Invoice Compliance Checklist',
        subtitle:
            'Estimate your Lithuanian LEA state grant when replacing an inefficient wood, coal, or fossil boiler with an A+++ Air-to-Water heat pump or 5th-class EcoDesign pellet boiler.',
        step1ReplacedLabel: '1. Replaced Boiler Type (Keičiamo katilo tipas)',
        replacedOptions: {
            fossil_coal_wood: 'Old wood / coal / peat solid-fuel boiler',
            old_biomass: 'Legacy biomass boiler (installed before 2016)',
            fossil_gas_oil: 'Natural gas / diesel fuel boiler',
        },
        step2NewDeviceLabel: '2. New Heating Device Type (Naujo įrenginio tipas)',
        newDeviceOptions: {
            heat_pump_air_water: {
                title: 'Air-to-Water Heat Pump (Haier R290 / R32, A+++)',
                badge: 'A+++ · EU 813/2013',
                desc: 'High-temperature R290 monoblock up to +75 °C for radiators & underfloor',
            },
            ecodesign_pellet_boiler: {
                title: '5th Class EcoDesign Biomass / Pellet Boiler',
                badge: 'EN 303-5 · EU 2015/1189',
                desc: 'Megatherm / Verner / Ponast / Gilės automated pellet system',
            },
        },
        step3PowerLabel: '3. Required Thermal Power (Reikalinga šiluminė galia, kW)',
        step4PriceLabel: '4. Device Price (€ incl. VAT / Įrenginio kaina €)',
        resultBadge: 'LEA GRANT ESTIMATE',
        estimatedGrantLabel: 'Estimated LEA Grant (€)',
        netInvestmentLabel: 'Net Customer Investment After Grant (€)',
        rateFormulaNote: (rateEur, sharePct) =>
            `Calculated at the LEA fixed rate of ${rateEur} €/kW for this power band (up to ${sharePct}% of device cost covered).`,
        mandatoryFieldsHeading: '5 Mandatory LEA Invoice & Declaration Fields',
        mandatoryFieldsSub:
            'UAB "Gilės inžinerija" automatically includes all 5 technical parameters on GILE VAT invoices for the LEA application:',
        recommendedModelLabel: 'Recommended LEA-Eligible Equipment:',
        viewEligibleProductsBtn: 'Browse LEA-Eligible Boilers & Heat Pumps',
    },
    pl: {
        kicker: 'DOTACJA LEA · WYMIANA KOTŁA',
        heading: 'Kalkulator dotacji LEA i wymogi faktury VAT',
        subtitle:
            'Oblicz szacunkową dotację przy wymianie starego kotła węglowego lub drzewnego na pompę ciepła Powietrze–Woda A+++ lub kocioł peletowy 5 klasy EcoDesign.',
        step1ReplacedLabel: '1. Typ wymienianego kotła (Keičiamo katilo tipas)',
        replacedOptions: {
            fossil_coal_wood: 'Stary kocioł na drewno / węgiel / torf',
            old_biomass: 'Zużyty kocioł biomasowy',
            fossil_gas_oil: 'Kocioł gazowy / olejowy',
        },
        step2NewDeviceLabel: '2. Typ nowego urządzenia (Naujo įrenginio tipas)',
        newDeviceOptions: {
            heat_pump_air_water: {
                title: 'Pompa ciepła Powietrze–Woda (Haier R290 / R32)',
                badge: 'A+++ · UE 813/2013',
                desc: 'Monoblok wysokotemperaturowy R290 do +75 °C',
            },
            ecodesign_pellet_boiler: {
                title: 'Kocioł peletowy 5 klasy EcoDesign',
                badge: 'EN 303-5 · UE 2015/1189',
                desc: 'Megatherm / Verner / Ponast / Gilės automatyczny system peletowy',
            },
        },
        step3PowerLabel: '3. Wymagana moc grzewcza (kW)',
        step4PriceLabel: '4. Cena urządzenia (€ z VAT)',
        resultBadge: 'SZACOWANA DOTACJA LEA',
        estimatedGrantLabel: 'Szacowana dotacja LEA (€)',
        netInvestmentLabel: 'Koszt netto klienta po dotacji (€)',
        rateFormulaNote: (rateEur, sharePct) =>
            `Stawka jednostkowa LEA: ${rateEur} €/kW (do ${sharePct}% wartości urządzenia).`,
        mandatoryFieldsHeading: '5 obowiązkowych danych technicznych na fakturze LEA',
        mandatoryFieldsSub:
            'Faktury VAT serii GILE zawierają wszystkie 5 parametrów wymaganych przez LEA:',
        recommendedModelLabel: 'Rekomendowane urządzenie kwalifikujące się do LEA:',
        viewEligibleProductsBtn: 'Zobacz kotły i pompy ciepła LEA',
    },
    ru: {
        kicker: 'СУБСИДИЯ LEA · ЗАМЕНА КОТЛА',
        heading: 'Калькулятор субсидии LEA и реквизиты счета-фактуры',
        subtitle:
            'Рассчитайте государственную компенсацию при замене старого твердотопливного котла на тепловой насос Воздух–Вода A+++ или пеллетный котел 5 класса EcoDesign.',
        step1ReplacedLabel: '1. Тип заменяемого котла (Keičiamo katilo tipas)',
        replacedOptions: {
            fossil_coal_wood: 'Старый дровяной / угольный котел',
            old_biomass: 'Устаревший твердотопливный котел',
            fossil_gas_oil: 'Газовый / жидкотопливный котел',
        },
        step2NewDeviceLabel: '2. Тип нового оборудования (Naujo įrenginio tipas)',
        newDeviceOptions: {
            heat_pump_air_water: {
                title: 'Тепловой насос Воздух–Вода (Haier R290 / R32)',
                badge: 'A+++ · ЕС 813/2013',
                desc: 'Высокотемпературный моноблок R290 до +75 °C',
            },
            ecodesign_pellet_boiler: {
                title: 'Пеллетный котел 5 класса EcoDesign',
                badge: 'EN 303-5 · ЕС 2015/1189',
                desc: 'Megatherm / Verner / Ponast / Gilės пеллетная система',
            },
        },
        step3PowerLabel: '3. Требуемая тепловая мощность (кВт)',
        step4PriceLabel: '4. Цена оборудования (€ с НДС)',
        resultBadge: 'РАСЧЕТ КОМПЕНСАЦИИ LEA',
        estimatedGrantLabel: 'Предварительная выплата LEA (€)',
        netInvestmentLabel: 'Чистая инвестиция клиента после субсидии (€)',
        rateFormulaNote: (rateEur, sharePct) =>
            `Расчет по тарифу LEA ${rateEur} €/кВт (до ${sharePct}% стоимости).`,
        mandatoryFieldsHeading: '5 обязательных реквизитов счета-фактуры для LEA',
        mandatoryFieldsSub:
            'В счетах серии GILE от UAB «Gilės inžinerija» все 5 параметров указываются автоматически:',
        recommendedModelLabel: 'Рекомендуемая модель, подходящая для LEA:',
        viewEligibleProductsBtn: 'Смотреть котлы и тепловые насосы для LEA',
    },
};

export function ApvaSubsidyWidget({ locale: propLocale }: { locale?: AppLocale }) {
    const intlLocale = useLocale() || 'lt';
    const rawPathname = usePathname() || '';
    const urlMatch = rawPathname.match(/^\/(lt|en|pl|ru)(?=\/|$)/i);
    const locale = resolveAppLocale(propLocale || (urlMatch ? urlMatch[1] : intlLocale));
    const copy = APVA_WIDGET_I18N[locale];
    const mandatoryFields = APVA_MANDATORY_INVOICE_FIELDS[locale];

    const [replacedBoilerType, setReplacedBoilerType] =
        useState<ApvaReplacedBoilerType>('fossil_coal_wood');
    const [newDeviceType, setNewDeviceType] =
        useState<ApvaNewDeviceType>('heat_pump_air_water');
    const [powerKw, setPowerKw] = useState<ApvaPowerStepKw>(8);
    const [devicePriceEur, setDevicePriceEur] = useState<number>(3430);

    const calc = useMemo(
        () =>
            calculateApvaSubsidyEstimate({
                replacedBoilerType,
                newDeviceType,
                powerKw,
                devicePriceEur,
            }),
        [replacedBoilerType, newDeviceType, powerKw, devicePriceEur],
    );

    const handleSelectDeviceType = (type: ApvaNewDeviceType) => {
        setNewDeviceType(type);
        if (type === 'heat_pump_air_water' && devicePriceEur < 2600) {
            setDevicePriceEur(3430); // AW082HUGHA katalogo kaina su PVM
        } else if (type === 'ecodesign_pellet_boiler' && devicePriceEur > 3200) {
            setDevicePriceEur(2350); // DEGKMPL140MG20 komplekto katalogo kaina su PVM
        }
    };

    return (
        <section
            data-testid="apva-subsidy-calculator"
            aria-label={copy.heading}
            className="mx-auto max-w-7xl px-4 sm:px-6 py-10 border-t border-[#E2DDD3] bg-[#F5F3EE] text-[#11161B]"
        >
            <div className="space-y-6">
                <div className="border-b border-[#E2DDD3] pb-4 space-y-1.5">
                    <span className="font-mono text-xs font-bold text-[#C2410C] block">
                        {copy.kicker}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-[#11161B] leading-tight">
                        {copy.heading}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#5B6470] max-w-3xl leading-relaxed">
                        {copy.subtitle}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: 4 Interactive Inputs */}
                    <div className="lg:col-span-6 space-y-5">
                        {/* 1. Keičiamo katilo tipas */}
                        <div className="space-y-2">
                            <label
                                htmlFor="apva-replaced-boiler-select"
                                className="block text-xs font-bold text-[#11161B]"
                            >
                                {copy.step1ReplacedLabel}
                            </label>
                            <select
                                id="apva-replaced-boiler-select"
                                value={replacedBoilerType}
                                onChange={(e) =>
                                    setReplacedBoilerType(e.target.value as ApvaReplacedBoilerType)
                                }
                                className="w-full h-10 border border-[#D5CFC3] bg-white px-3 text-xs font-bold text-[#11161B] rounded-none"
                            >
                                <option value="fossil_coal_wood">
                                    {copy.replacedOptions.fossil_coal_wood}
                                </option>
                                <option value="old_biomass">
                                    {copy.replacedOptions.old_biomass}
                                </option>
                                <option value="fossil_gas_oil">
                                    {copy.replacedOptions.fossil_gas_oil}
                                </option>
                            </select>
                        </div>

                        {/* 2. Naujo įrenginio tipas */}
                        <div className="space-y-2">
                            <span className="block text-xs font-bold text-[#11161B]">
                                {copy.step2NewDeviceLabel}
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {(
                                    [
                                        'heat_pump_air_water',
                                        'ecodesign_pellet_boiler',
                                    ] as ApvaNewDeviceType[]
                                ).map((devType) => {
                                    const active = newDeviceType === devType;
                                    const meta = copy.newDeviceOptions[devType];
                                    return (
                                        <button
                                            key={devType}
                                            type="button"
                                            aria-pressed={active}
                                            onClick={() => handleSelectDeviceType(devType)}
                                            className={`border p-3.5 text-left bg-transparent transition-colors cursor-pointer rounded-none ${
                                                active
                                                    ? 'border-[#11161B] text-[#11161B] underline underline-offset-4'
                                                    : 'border-[#D5CFC3] text-[#5B6470] hover:border-[#11161B]'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className="font-mono text-xs font-bold text-[#C2410C]">
                                                    {meta.badge}
                                                </span>
                                                {devType === 'heat_pump_air_water' ? (
                                                    <Thermometer className="h-4 w-4 text-[#C2410C]" />
                                                ) : (
                                                    <Flame className="h-4 w-4 text-[#C2410C]" />
                                                )}
                                            </div>
                                            <div className="text-xs font-extrabold leading-snug text-[#11161B]">
                                                {meta.title}
                                            </div>
                                            <div className="text-xs mt-1 leading-snug text-[#5B6470]">
                                                {meta.desc}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 3. Reikalinga šiluminė galia (kW: 6 / 8 / 10 / 12 / 15 / 20 / 25 kW) */}
                        <div className="space-y-2">
                            <span className="block text-xs font-bold text-[#11161B]">
                                {copy.step3PowerLabel}:{' '}
                                <strong className="font-mono text-[#C2410C]">{powerKw} kW</strong>
                            </span>
                            <div className="grid grid-cols-7 gap-1.5">
                                {APVA_POWER_STEPS_KW.map((kw) => {
                                    const active = powerKw === kw;
                                    return (
                                        <button
                                            key={kw}
                                            type="button"
                                            aria-pressed={active}
                                            onClick={() => setPowerKw(kw)}
                                            className={`border py-2 text-xs font-bold tabular-nums bg-transparent cursor-pointer transition-colors rounded-none ${
                                                active
                                                    ? 'border-[#11161B] text-[#11161B] underline underline-offset-4 font-extrabold'
                                                    : 'border-[#D5CFC3] text-[#5B6470] hover:border-[#11161B]'
                                            }`}
                                        >
                                            {kw} kW
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 4. Įrenginio kaina (€) */}
                        <div className="space-y-1.5">
                            <label
                                htmlFor="apva-device-price-input"
                                className="block text-xs font-bold text-[#11161B]"
                            >
                                {copy.step4PriceLabel}
                            </label>
                            <input
                                id="apva-device-price-input"
                                type="number"
                                min={600}
                                max={15000}
                                step={50}
                                value={devicePriceEur}
                                onChange={(e) =>
                                    setDevicePriceEur(Math.max(500, Number(e.target.value) || 2000))
                                }
                                className="w-full h-10 border border-[#D5CFC3] bg-white px-3 font-mono text-sm font-bold text-[#11161B] rounded-none tabular-nums"
                            />
                        </div>
                    </div>

                    {/* Right Column: Grant Result Hero + 5 Mandatory APVA Invoice Fields */}
                    <div className="lg:col-span-6 space-y-4">
                        <div className="border border-[#11161B] bg-[#11161B] text-[#F5F3EE] p-5 space-y-4 rounded-none">
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-mono text-xs font-bold text-[#FF8A3D]">
                                    {copy.resultBadge}
                                </span>
                                <ShieldCheck className="h-4 w-4 text-[#4ADE80]" aria-hidden="true" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#2C3742]">
                                <div>
                                    <span className="block text-xs text-[#C9D0D8]">
                                        {copy.estimatedGrantLabel}
                                    </span>
                                    <span
                                        data-testid="apva-estimated-grant-eur"
                                        className="block text-2xl font-extrabold text-[#4ADE80] tabular-nums mt-1"
                                    >
                                        +{calc.estimatedGrantEur.toLocaleString('lt-LT')} €
                                    </span>
                                </div>

                                <div>
                                    <span className="block text-xs text-[#C9D0D8]">
                                        {copy.netInvestmentLabel}
                                    </span>
                                    <span
                                        data-testid="apva-net-investment-eur"
                                        className="block text-2xl font-extrabold text-[#FF8A3D] tabular-nums mt-1"
                                    >
                                        {calc.netCustomerInvestmentEur.toLocaleString('lt-LT')} €
                                    </span>
                                </div>
                            </div>

                            <p className="text-xs text-[#C9D0D8] leading-relaxed">
                                {copy.rateFormulaNote(
                                    calc.fixedRatePerKwEur,
                                    calc.subsidySharePercent,
                                )}
                            </p>

                            <div className="border-t border-[#2C3742] pt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                                <div>
                                    <span className="text-[#9BA6B2] block">
                                        {copy.recommendedModelLabel}
                                    </span>
                                    <strong className="text-white font-bold">
                                        {calc.recommendedModelTitle} (SKU: {calc.recommendedSku})
                                    </strong>
                                </div>
                                <Link
                                    href={`/${locale}/products?q=${encodeURIComponent(calc.recommendedSku)}`}
                                    className="border border-[#FF8A3D] bg-transparent hover:bg-[#C2410C] text-[#FF8A3D] hover:text-white px-3.5 py-2 text-xs font-bold transition-colors rounded-none whitespace-nowrap"
                                >
                                    {copy.viewEligibleProductsBtn}
                                </Link>
                            </div>
                        </div>

                        {/* 5 Mandatory LEA Invoice & Declaration Fields */}
                        <div className="border border-[#D5CFC3] bg-white p-4 space-y-2.5 rounded-none">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-[#C2410C] shrink-0" aria-hidden="true" />
                                <h3 className="text-xs sm:text-sm font-extrabold text-[#11161B]">
                                    {copy.mandatoryFieldsHeading}
                                </h3>
                            </div>
                            <p className="text-xs text-[#5B6470] leading-relaxed">
                                {copy.mandatoryFieldsSub}
                            </p>
                            <ul className="divide-y divide-[#E2DDD3] pt-1 text-xs">
                                {mandatoryFields.map((fieldText, idx) => (
                                    <li
                                        key={fieldText}
                                        className="flex items-start justify-between gap-2 py-2 font-semibold text-[#11161B]"
                                    >
                                        <span className="inline-flex items-center gap-1.5">
                                            <CheckCircle2
                                                className="h-3.5 w-3.5 text-[#157A3B] shrink-0"
                                                aria-hidden="true"
                                            />
                                            <span>{fieldText}</span>
                                        </span>
                                        <span className="font-mono text-xs font-bold text-[#5B6470] text-right">
                                            {idx === 0
                                                ? calc.recommendedSku
                                                : idx === 1
                                                  ? `${calc.powerKw},0 kW`
                                                  : idx === 2
                                                    ? calc.scopOrEfficiencyLabel.split('·')[0]
                                                    : idx === 3
                                                      ? calc.ecodesignRegulation.split('(')[0]
                                                      : 'NTR registro Nr.'}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
