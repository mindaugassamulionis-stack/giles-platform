'use client';

// W126-A1 (S4): „Namui“ režimas – /skaiciuokle pagrindinis puslapis.
// Visi skaičiai – iš src/lib/heat branduolio (heat-calc + lea) ir data/heat JSON. Jokių įkaltų reikšmių.
// Užklausos forma (POST) – atskiras S5 slice; čia sąžiningas kontaktinis CTA (tel: + kontaktai).

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle, ArrowRight, Phone, FileText } from 'lucide-react';
import { useLocale } from 'next-intl';
import { resolveAppLocale } from '../i18n/storefront-ui-copy';
import type { AppLocale } from '../i18n/routing';
import { compare, type HeatInput } from '../lib/heat/heat-calc';
import { leaEligibility, leaGrant, type LeaData } from '../lib/heat/lea';
import { toQuery, fromQuery } from '../lib/heat/lead';
import heatConfigJson from '../data/heat/heat-config.lt.json';

// Trumpi vienaeiliai mygtukų užrašai (ilgi žodynų pavadinimai rodomi užvedus / legendos eilutėje).
const SHORT_CLASS: Record<string, Record<string, string>> = {
    lt: { app: 'Naujas A++/A+', a: 'Naujas A', b: 'B klasė', c: 'Renovuotas C', d: 'Dalinai D', old: 'Senas' },
    en: { app: 'New A++/A+', a: 'New A', b: 'Class B', c: 'Renovated C', d: 'Partly D', old: 'Old' },
    pl: { app: 'Nowy A++/A+', a: 'Nowy A', b: 'Klasa B', c: 'Renowacja C', d: 'Częściowo D', old: 'Stary' },
    ru: { app: 'Новый A++/A+', a: 'Новый A', b: 'Класс B', c: 'Реновация C', d: 'Частично D', old: 'Старый' },
};
const SHORT_CURRENT: Record<string, Record<string, string>> = {
    lt: { wood: 'Malkos', coal: 'Anglys', gas: 'Dujos', oil: 'Skystas kuras', electric: 'Elektra', stove: 'Krosnis', none: 'Naujas namas' },
    en: { wood: 'Wood', coal: 'Coal', gas: 'Gas', oil: 'Oil', electric: 'Electric', stove: 'Stove', none: 'New build' },
    pl: { wood: 'Drewno', coal: 'Węgiel', gas: 'Gaz', oil: 'Olej', electric: 'Prąd', stove: 'Piecyk', none: 'Nowy dom' },
    ru: { wood: 'Дрова', coal: 'Уголь', gas: 'Газ', oil: 'Жидкое топл.', electric: 'Электро', stove: 'Печь', none: 'Новый дом' },
};
import devicesJson from '../data/heat/devices.lt.json';
import leaJson from '../data/heat/lea-2026.lt.json';
import contentJson from '../data/heat/skaiciuokle-content.lt.json';

/* eslint-disable @typescript-eslint/no-explicit-any */
const cfg: any = heatConfigJson;
const dev: any = devicesJson;
const lea = leaJson as unknown as LeaData;
const content = contentJson as any;

const fmtEur = (n: number | null | undefined) =>
    n == null ? '–' : `${Math.round(n).toLocaleString('lt-LT')} €`;
const fmtKw = (n: number) => n.toLocaleString('lt-LT', { maximumFractionDigits: 1 });

const I18N: Record<AppLocale, Record<string, string>> = {
    lt: {},
    en: {
        'Šildomas plotas': 'Heated area',
        'Namo būklė': 'House condition',
        'nežinote klasės – rinkitės pagal metus': 'unsure – pick by build year',
        'Kuo šildote dabar?': 'How do you heat now?',
        'Patikslinti skaičiavimą': 'Refine the estimate',
        'Reikalinga šildymo galia': 'Required heating power',
        'Šilumos per metus': 'Heat per year',
        'Dabar kainuoja': 'Heating costs now',
        'Palyginti 3 sprendimus': 'Compare 3 solutions',
        'Gauti tikslų pasiūlymą': 'Get an exact quote',
        'Trys sprendimai jūsų namui': 'Three solutions for your home',
        'Mano kainos (neprivaloma)': 'My energy prices (optional)',
        'Prielaidos': 'Assumptions',
        'DUK': 'FAQ',
        'Skambinti inžinieriui': 'Call the engineer',
        'Kontaktai': 'Contacts',
    },
    pl: {
        'Šildomas plotas': 'Ogrzewana powierzchnia',
        'Namo būklė': 'Stan domu',
        'nežinote klasės – rinkitės pagal metus': 'nie pewni – wybierz po roku budowy',
        'Kuo šildote dabar?': 'Jak się teraz grzejecie?',
        'Patikslinti skaičiavimą': 'Doprecyzuj obliczenie',
        'Reikalinga šildymo galia': 'Wymagana moc grzewcza',
        'Šilumos per metus': 'Ciepło rocznie',
        'Dabar kainuoja': 'Koszty teraz',
        'Palyginti 3 sprendimus': 'Porównaj 3 rozwiązania',
        'Gauti tikslų pasiūlymą': 'Uzyskaj dokładną wycenę',
        'Trys sprendimai jūsų namui': 'Trzy rozwiązania dla Twojego domu',
        'Mano kainos (neprivaloma)': 'Moje ceny (opcjonalnie)',
        'Prielaidos': 'Założenia',
        'DUK': 'FAQ',
        'Skambinti inžinieriui': 'Zadzwoń do inżyniera',
        'Kontaktai': 'Kontakt',
    },
    ru: {
        'Šildomas plotas': 'Отапливаемая площадь',
        'Namo būklė': 'Состояние дома',
        'nežinote klasės – rinkitės pagal metus': 'не уверены – выбирайте по году',
        'Kuo šildote dabar?': 'Чем отапливаете сейчас?',
        'Patikslinti skaičiavimą': 'Уточнить расчёт',
        'Reikalinga šildymo galia': 'Нужная мощность отопления',
        'Šilumos per metus': 'Тепла в год',
        'Dabar kainuoja': 'Сейчас стоит',
        'Palyginti 3 sprendimus': 'Сравнить 3 решения',
        'Gauti tikslų pasiūlymą': 'Получить точное предложение',
        'Trys sprendimai jūsų namui': 'Три решения для вашего дома',
        'Mano kainos (neprivaloma)': 'Мои цены (необязательно)',
        'Prielaidos': 'Допущения',
        'DUK': 'Вопросы',
        'Skambinti inžinieriui': 'Позвонить инженеру',
        'Kontaktai': 'Контакты',
    },
};

export function SkaiciuokleNamui({
    locale: propLocale,
    initialInput,
}: {
    locale?: AppLocale;
    initialInput: HeatInput;
}) {
    const intlLocale = useLocale() || 'lt';
    const locale = resolveAppLocale(propLocale ?? (intlLocale as AppLocale));
    const t = (s: string) => I18N[locale][s] ?? s;

    const [input, setInput] = useState<HeatInput>(initialInput);
    const [prices, setPrices] = useState<{ fuel: string; elec: string; pellets: string }>({
        fuel: '',
        elec: '',
        pellets: '',
    });
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const hydratedFromUrl = useRef(false);

    useEffect(() => {
        if (hydratedFromUrl.current || typeof window === 'undefined') return;
        hydratedFromUrl.current = true;
        const q = new URLSearchParams(window.location.search);
        if (q.toString()) setInput(fromQuery(q, cfg));
    }, []);

    useEffect(() => {
        if (!hydratedFromUrl.current || typeof window === 'undefined') return;
        const q = toQuery(input, cfg);
        window.history.replaceState(null, '', `?${q}`);
    }, [input]);

    const numericPrices = useMemo(() => {
        const p: HeatInput['prices'] = {};
        const f = Number(prices.fuel.replace(',', '.'));
        const e = Number(prices.elec.replace(',', '.'));
        const g = Number(prices.pellets.replace(',', '.'));
        if (Number.isFinite(f) && f > 0) p.fuel_now_eur_mwh = f;
        if (Number.isFinite(e) && e > 0) p.electricity_eur_mwh = e;
        if (Number.isFinite(g) && g > 0) p.pellets_eur_mwh = g;
        return Object.keys(p).length ? p : undefined;
    }, [prices]);

    const result = useMemo(
        () => compare(cfg, dev, lea, { ...input, prices: numericPrices }),
        [input, numericPrices],
    );
    const demand = result.demand;
    const cur = cfg.current_heating.find((c: any) => c.id === input.current);

    // LEA blokas – pagal geriausią tinkamą sprendimą su parama (ŠS arba biokuras).
    const grantOption = result.options.find(
        (o) => o.available && o.grant_eligible && o.id !== 'conversion',
    );
    const leaType: any = grantOption?.id === 'hp_aw' ? 'hp_aw' : grantOption?.id === 'pellet_boiler' ? 'bio' : null;
    const eligibility = leaType
        ? leaEligibility(lea, {
              building: input.building_type ?? 'house',
              oldSystem: cur?.lea_old ?? 'not-eligible',
              inBigCityDhZone: !!input.big_city_dh_zone,
              type: leaType,
          })
        : null;
    const leaGrantShown = grantOption ? Math.max(...result.options.filter((o) => o.available && o.grant_eligible).map((o) => o.grant)) : 0;
    const anchorTest = leaType ? leaGrant(lea, leaType, grantOption?.device?.kw ?? 8) : 0;

    const set = (patch: Partial<HeatInput>) => setInput((prev) => ({ ...prev, ...patch }));

    const classes: any[] = cfg.building_classes;
    const currents: any[] = cfg.current_heating;
    const emitters: any[] = cfg.emitters;

    return (
        <div
            data-testid="skaiciuokle-namui"
            className="min-h-screen bg-[#F5F3EE] text-[#11161B]"
        >
            {/* Header band: brand-derived dark ink, orange accent on numbers only */}
            <section id="skaiciuokle" className="bg-[#11161B] text-[#F5F3EE] border-b-4 border-[#C2410C]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 space-y-5">
                    <p className="text-xs font-bold tracking-wide text-[#FF8A3D]">
                        {content.eyebrow.replace('{lea_date}', leaJson.data_date)}
                    </p>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight max-w-3xl">
                        {content.seo.home.h1}
                    </h1>
                    <p className="text-sm sm:text-base text-[#C9D0D8] max-w-2xl leading-relaxed">
                        {content.lead}
                    </p>
                    <ul className="flex flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm text-[#C9D0D8]">
                        {content.trust.slice(0, 2).map((line: string) => (
                            <li key={line} className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-4 w-4 text-[#FF8A3D]" aria-hidden />
                                {line}
                            </li>
                        ))}
                    </ul>
                    <p className="text-xs text-[#9BA6B2]">
                        <Link
                            href={`/${locale}/skaiciuokle/hidraulinis-mazgas`}
                            className="underline decoration-[#2C3742] hover:text-white break-words"
                        >
                            Montuotojams: hidraulinio mazgo skaičiuoklė
                        </Link>
                    </p>
                </div>
            </section>

            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-x border-b border-[#E2DDD3] bg-white">
                    {/* 1. Inputs */}
                    <div className="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-[#E2DDD3] p-5 sm:p-8 space-y-8">
                        <div className="space-y-3">
                            <div className="flex items-baseline justify-between">
                                <label htmlFor="namui-area" className="text-sm font-extrabold">
                                    {t('Šildomas plotas')}
                                </label>
                                <span className="text-xl font-extrabold tabular-nums text-[#C2410C]">
                                    {input.area_m2} m²
                                </span>
                            </div>
                            <input
                                id="namui-area"
                                type="range"
                                min={40}
                                max={400}
                                step={5}
                                value={input.area_m2}
                                onChange={(e) => set({ area_m2: Number(e.target.value) })}
                                className="w-full accent-[#C2410C] cursor-pointer"
                            />
                        </div>

                        <div className="space-y-2.5">
                            <span className="block text-sm font-extrabold">
                                {t('Namo būklė')}{' '}
                                <span className="font-normal text-[#5B6470] text-xs">
                                    ({t('nežinote klasės – rinkitės pagal metus')})
                                </span>
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 border-t border-l border-[#E2DDD3]" role="radiogroup" aria-label={t('Namo būklė')}>
                                {classes.map((c) => (
                                    <label
                                        key={c.id}
                                        title={`${c.label} – ${c.hint}`}
                                        className={`flex items-center gap-2 px-3.5 py-3 border-r border-b rounded-none cursor-pointer transition-colors whitespace-nowrap ${
                                            input.building_class === c.id
                                                ? 'bg-[#FBEADF] border-l-4 border-l-[#C2410C]'
                                                : 'bg-white hover:bg-[#FAF8F5] border-[#E2DDD3]'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="namui-class"
                                            checked={input.building_class === c.id}
                                            onChange={() => set({ building_class: c.id })}
                                            className="h-3.5 w-3.5 accent-[#C2410C] shrink-0"
                                        />
                                        <span className="block text-xs font-extrabold leading-snug">
                                            {SHORT_CLASS[locale][c.id] ?? c.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <span className="block text-sm font-extrabold">{t('Kuo šildote dabar?')}</span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-l border-[#E2DDD3]" role="radiogroup" aria-label={t('Kuo šildote dabar?')}>
                                {currents.map((c) => (
                                    <label
                                        key={c.id}
                                        title={c.label}
                                        className={`flex items-center gap-2 px-3.5 py-3 border-r border-b rounded-none cursor-pointer transition-colors whitespace-nowrap ${
                                            input.current === c.id
                                                ? 'bg-[#11161B] text-white border-l-4 border-l-[#C2410C]'
                                                : 'bg-white hover:bg-[#FAF8F5] border-[#E2DDD3]'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="namui-current"
                                            checked={input.current === c.id}
                                            onChange={() => set({ current: c.id })}
                                            className="h-3.5 w-3.5 accent-[#FF8A3D] shrink-0"
                                        />
                                        <span className="block text-xs font-extrabold leading-snug">
                                            {SHORT_CURRENT[locale][c.id] ?? c.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <details className="border-t border-[#E2DDD3] pt-4" onToggle={(e) => setAdvancedOpen((e.target as HTMLDetailsElement).open)}>
                            <summary className="inline-flex items-center gap-1.5 text-sm font-bold text-[#C2410C] cursor-pointer py-2 select-none">
                                {t('Patikslinti skaičiavimą')}
                            </summary>
                            {advancedOpen && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    <label className="text-xs font-bold space-y-1.5 block">
                                        {t('Šildymo prietaisai')}
                                        <select
                                            value={input.emitters ?? 'mixed'}
                                            onChange={(e) => set({ emitters: e.target.value })}
                                            className="w-full border border-[#E2DDD3] bg-white px-3 py-2.5 rounded-none text-sm font-normal"
                                        >
                                            {emitters.map((em) => (
                                                <option key={em.id} value={em.id}>
                                                    {em.label} (SCOP {em.scop_aw})
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="text-xs font-bold space-y-1.5 block">
                                        {t('Gyventojų skaičius')} ({t('karštam vandeniui')})
                                        <input
                                            type="number"
                                            min={1}
                                            max={8}
                                            value={input.people ?? 3}
                                            onChange={(e) => set({ people: Number(e.target.value) })}
                                            className="w-full border border-[#E2DDD3] bg-white px-3 py-2.5 rounded-none text-sm font-normal tabular-nums"
                                        />
                                    </label>
                                    <label className="text-xs font-bold space-y-1.5 block">
                                        {t('Lubų aukštis (m)')}
                                        <input
                                            type="number"
                                            min={2.2}
                                            max={4}
                                            step={0.05}
                                            value={input.ceiling_m ?? 2.7}
                                            onChange={(e) => set({ ceiling_m: Number(e.target.value) })}
                                            className="w-full border border-[#E2DDD3] bg-white px-3 py-2.5 rounded-none text-sm font-normal tabular-nums"
                                        />
                                    </label>
                                    <label className="text-xs font-bold space-y-1.5 flex items-start gap-2 pt-6 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={!!input.big_city_dh_zone}
                                            onChange={(e) => set({ big_city_dh_zone: e.target.checked })}
                                            className="mt-0.5 h-4 w-4 accent-[#C2410C]"
                                        />
                                        <span className="font-normal leading-snug">
                                            {t('Namas 5 didžiųjų miestų CŠT zonoje (biokurui LEA netaikoma)')}
                                        </span>
                                    </label>
                                    <fieldset className="sm:col-span-2 border border-[#E2DDD3] p-3.5 space-y-2.5">
                                        <legend className="text-xs font-extrabold px-1">
                                            {t('Mano kainos (neprivaloma)')} – €/MWh
                                        </legend>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                            <input
                                                inputMode="decimal"
                                                placeholder={t('dabartinis kuras')}
                                                value={prices.fuel}
                                                onChange={(e) => setPrices((p) => ({ ...p, fuel: e.target.value }))}
                                                className="border border-[#E2DDD3] px-3 py-2.5 rounded-none text-sm tabular-nums"
                                            />
                                            <input
                                                inputMode="decimal"
                                                placeholder={t('elektra')}
                                                value={prices.elec}
                                                onChange={(e) => setPrices((p) => ({ ...p, elec: e.target.value }))}
                                                className="border border-[#E2DDD3] px-3 py-2.5 rounded-none text-sm tabular-nums"
                                            />
                                            <input
                                                inputMode="decimal"
                                                placeholder={t('granulės')}
                                                value={prices.pellets}
                                                onChange={(e) => setPrices((p) => ({ ...p, pellets: e.target.value }))}
                                                className="border border-[#E2DDD3] px-3 py-2.5 rounded-none text-sm tabular-nums"
                                            />
                                        </div>
                                    </fieldset>
                                </div>
                            )}
                        </details>
                    </div>

                    {/* 2. Result panel */}
                    <div className="lg:col-span-5 bg-[#FAF8F5] p-5 sm:p-8 space-y-5">
                        {demand.clamped && (
                            <p className="text-xs text-[#9A3412] bg-[#FBEADF] border border-[#E2DDD3] px-3 py-2">
                                {t('Skaičiuojame iki 400 m²; didesniems – B2B pasiūlymas.')}
                            </p>
                        )}
                        <div>
                            <span className="block text-xs font-bold text-[#5B6470]">
                                {t('Reikalinga šildymo galia')}
                            </span>
                            <span
                                data-testid="result-power"
                                className="block text-4xl sm:text-5xl font-extrabold tabular-nums text-[#C2410C] leading-none mt-1"
                            >
                                {fmtKw(demand.design_kw)} kW
                            </span>
                            <span data-testid="result-hp-power" className="block text-xs text-[#5B6470] mt-1">
                                {content.result.hp_note.replace('{hp_kw}', fmtKw(demand.hp_kw))}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-0 border-t border-l border-[#E2DDD3]">
                            <div className="border-r border-b border-[#E2DDD3] bg-white p-3.5">
                                <span className="block text-xs font-bold text-[#5B6470]">
                                    {t('Šilumos per metus')}
                                </span>
                                <span data-testid="result-annual" className="block text-xl font-extrabold tabular-nums mt-0.5">
                                    {fmtKw(demand.annual_mwh)} MWh
                                </span>
                            </div>
                            <div className="border-r border-b border-[#E2DDD3] bg-white p-3.5">
                                <span className="block text-xs font-bold text-[#5B6470]">
                                    {t('Dabar kainuoja')}
                                </span>
                                <span
                                    data-testid="result-current-cost"
                                    className="block text-xl font-extrabold tabular-nums mt-0.5"
                                >
                                    {fmtEur(result.current_cost)}
                                    <span className="text-xs font-bold text-[#5B6470]"> / {t('metus')}</span>
                                </span>
                            </div>
                        </div>
                        <p className="text-xs text-[#5B6470] leading-relaxed">
                            {t('Supaprastintas įvertinimas')} ({demand.q_w_m2} W/m²), {t('ne EN 12831 projektas')}. {t('Tikslų skaičiavimą pagal brėžinius atlieka inžinierius nemokamai')}.
                        </p>
                        <a
                            href="#sprendimai"
                            className="flex items-center justify-center gap-2 border border-[#C2410C] bg-[#C2410C] hover:bg-[#9A3412] text-white text-sm font-bold px-4 py-3.5 rounded-none transition-colors"
                        >
                            {t('Palyginti 3 sprendimus')} <ArrowRight className="h-4 w-4" aria-hidden />
                        </a>
                    </div>
                </div>

                {/* 3. Solutions */}
                <section id="sprendimai" className="border-x border-b border-[#E2DDD3] bg-white px-5 sm:px-8 py-8 space-y-6">
                    <header>
                        <h2 className="text-xl sm:text-2xl font-extrabold">{t('Trys sprendimai jūsų namui')}</h2>
                        <p className="text-sm text-[#5B6470] mt-1 max-w-2xl">{content.compare.lead}</p>
                    </header>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {result.options.map((o) => {
                            const isBest = result.best === o.id && o.available;
                            const rows: [string, string][] = [
                                [content.compare.rows[0], o.available ? fmtEur(o.capex) : '–'],
                                [content.compare.rows[1], o.grant_eligible && o.grant > 0 ? `− ${fmtEur(o.grant)}` : content.compare.grant_none],
                                [content.compare.rows[2], o.available ? fmtEur(o.net_capex) : '–'],
                                [content.compare.rows[3], o.available ? `${fmtEur(o.annual_cost)} / ${t('metus')}` : '–'],
                                [
                                    content.compare.rows[4],
                                    o.saving_year == null
                                        ? '–'
                                        : o.saving_year >= 0
                                          ? `${t('sutaupote')} ${fmtEur(o.saving_year)}`
                                          : `${t('brangiau')} ${fmtEur(-o.saving_year)}`,
                                ],
                                [
                                    content.compare.rows[5],
                                    o.payback_years == null
                                        ? result.current_cost == null
                                            ? content.compare.payback_newbuild
                                            : content.compare.payback_none
                                        : o.payback_years > 20
                                          ? content.compare.payback_long
                                          : `${fmtKw(o.payback_years)} ${t('m.')}`,
                                ],
                                [content.compare.rows[6], o.available ? fmtEur(o.tco) : '–'],
                                [
                                    content.compare.rows[7],
                                    o.refuel_days == null
                                        ? cfg.solutions.find((s: any) => s.id === o.id)?.refuel ?? '–'
                                        : `${o.refuel_days} ${t('d. autonomija')}`,
                                ],
                            ];
                            return (
                                <article
                                    key={o.id}
                                    data-testid="option-card"
                                    data-option={o.id}
                                    className={`border p-0 rounded-none self-start ${
                                        isBest ? 'border-2 border-[#C2410C] bg-[#FDFBF8]' : 'border-[#E2DDD3] bg-white'
                                    }`}
                                >
                                    <div
                                        className={`px-4 py-3 border-b ${isBest ? 'border-[#C2410C] bg-[#FBEADF]' : 'border-[#E2DDD3] bg-[#FAF8F5]'}`}
                                    >
                                        {isBest && (
                                            <span
                                                data-testid="option-best"
                                                className="block text-xs font-extrabold text-[#9A3412] mb-1"
                                            >
                                                {content.compare.best_badge}
                                            </span>
                                        )}
                                        <h3 className="text-sm font-extrabold leading-snug">{o.label}</h3>
                                        {o.device && (
                                            <p className="text-xs text-[#5B6470] mt-1">
                                                {o.device.label} · {fmtKw(o.device.kw)} kW
                                            </p>
                                        )}
                                        {!o.available && (
                                            <p className="text-xs text-[#9A3412] mt-1.5 leading-relaxed">
                                                {o.id === 'hp_aw'
                                                    ? content.compare.na_hp.replace('{kw}', fmtKw(demand.hp_kw))
                                                    : content.compare.na_conversion}
                                            </p>
                                        )}
                                    </div>
                                    <dl className="px-4 py-2 divide-y divide-[#E2DDD3]">
                                        {rows.map(([k, v]) => (
                                            <div key={k} className="flex items-baseline justify-between gap-3 py-2">
                                                <dt className="text-xs text-[#5B6470]">{k}</dt>
                                                <dd className="text-xs font-extrabold tabular-nums text-right whitespace-nowrap">{v}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                    {o.band_tip && (
                                        <p className="px-4 py-2.5 text-xs leading-relaxed bg-[#FBEADF] border-t border-[#E2DDD3]">
                                            {content.compare.tip
                                                .replace('{kw}', fmtKw(o.band_tip.kw))
                                                .replace('{grant}', fmtEur(o.band_tip.grant))
                                                .replace('{current}', fmtEur(o.grant))}
                                        </p>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                </section>

                {/* 4. LEA parama */}
                <section id="parama" className="border-x border-b border-[#E2DDD3] bg-white px-5 sm:px-8 py-8 space-y-5">
                    <div
                        data-testid="lea-block"
                        className={`border-l-4 p-5 ${leaGrantShown > 0 ? 'border-[#157A3B] bg-[#F2F8F3]' : 'border-[#E2DDD3] bg-[#FAF8F5]'}`}
                    >
                        <h2 className="text-lg font-extrabold">
                            {leaGrantShown > 0
                                ? content.lea.title_ok.replace('{grant}', fmtEur(leaGrantShown))
                                : input.current === 'wood' || input.current === 'coal'
                                  ? content.lea.title_conversion
                                  : content.lea.title_none}
                        </h2>
                        <p className="text-sm text-[#5B6470] mt-1.5 max-w-2xl leading-relaxed">{content.lea.lead}</p>
                        {eligibility && (
                            <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {eligibility.checks.map((c) => (
                                    <li
                                        key={c.label}
                                        data-testid="lea-check"
                                        className="flex items-start gap-2 text-xs leading-snug"
                                    >
                                        {c.ok ? (
                                            <CheckCircle2 className="h-4 w-4 text-[#157A3B] shrink-0" aria-hidden />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-[#9A3412] shrink-0" aria-hidden />
                                        )}
                                        {c.label}
                                    </li>
                                ))}
                            </ul>
                        )}
                        <p className="text-xs text-[#5B6470] mt-4 max-w-2xl leading-relaxed">{content.lea.we_do}</p>
                        <p className="text-xs text-[#5B6470] mt-2 max-w-2xl leading-relaxed">{content.lea.band_note}</p>
                        <p className="text-xs text-[#5B6470] mt-2">
                            {t('Kitas LEA kvietimas')}:{' '}
                            <time dateTime={leaJson.next_call} className="font-bold">
                                2027-01-04 14:00
                            </time>
                        </p>
                    </div>
                </section>

                {/* 5. Užklausa – S5 POST atidėtas; sąžiningas kontaktinis CTA */}
                <section id="uzklausa" className="border-x border-b border-[#E2DDD3] bg-[#11161B] text-[#F5F3EE] px-5 sm:px-8 py-10 space-y-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">{content.form.title}</h2>
                    <p className="text-sm text-[#C9D0D8] max-w-2xl leading-relaxed">{content.form.lead}</p>
                    <div className="flex flex-wrap gap-3 pt-1">
                        <a
                            href="tel:+37061119158"
                            className="inline-flex items-center gap-2 border border-[#FF8A3D] bg-[#C2410C] hover:bg-[#9A3412] px-5 py-3 text-sm font-bold text-white rounded-none transition-colors"
                        >
                            <Phone className="h-4 w-4" aria-hidden /> +370 611 19158
                        </a>
                        <Link
                            href={`/${locale}/kontaktai`}
                            className="inline-flex items-center gap-2 border border-[#2C3742] hover:border-[#FF8A3D] px-5 py-3 text-sm font-bold text-[#F5F3EE] rounded-none transition-colors"
                        >
                            {t('Gauti tikslų pasiūlymą')} <ArrowRight className="h-4 w-4" aria-hidden />
                        </Link>
                    </div>
                    <p className="text-xs text-[#9BA6B2]">{content.form.privacy}</p>
                </section>

                {/* 6. Prielaidos + DUK */}
                <section id="prielaidos" className="border-x border-b border-[#E2DDD3] bg-white px-5 sm:px-8 py-8 space-y-6">
                    <div className="space-y-3">
                        <h2 className="text-lg font-extrabold flex items-center gap-2">
                            <FileText className="h-5 w-5 text-[#5B6470]" aria-hidden /> {t('Prielaidos')}
                        </h2>
                        <p className="text-xs text-[#5B6470] max-w-2xl leading-relaxed">
                            {t('Reikšmės su žyma „prielaida“ – redaguojamos lauke „Mano kainos“ arba patikrinamos inžinieriaus. Šaltiniai: heat-config.lt.json')} ({cfg.version}).
                        </p>
                        <div className="border-t border-l border-[#E2DDD3] max-w-3xl">
                            {cfg.current_heating
                                .filter((c: any) => c.id === input.current)
                                .map((c: any) => (
                                    <div key={c.id} className="grid grid-cols-2 sm:grid-cols-4 border-r border-b border-[#E2DDD3]">
                                        <div className="p-3 border-r border-[#E2DDD3]">
                                            <span className="block text-xs text-[#5B6470]">{t('Kuro kaina')}</span>
                                            <span className="block text-sm font-extrabold tabular-nums">
                                                {c.fuel_eur_mwh == null ? '–' : `${c.fuel_eur_mwh} €/MWh`}
                                            </span>
                                        </div>
                                        <div className="p-3 border-r border-[#E2DDD3]">
                                            <span className="block text-xs text-[#5B6470]">{t('Naudingumas')}</span>
                                            <span className="block text-sm font-extrabold tabular-nums">
                                                {c.eff == null ? '–' : `${Math.round(c.eff * 100)} %`}
                                            </span>
                                        </div>
                                        <div className="p-3 border-r border-[#E2DDD3]">
                                            <span className="block text-xs text-[#5B6470]">SCOP ({t('prietaisams')})</span>
                                            <span className="block text-sm font-extrabold tabular-nums">
                                                {emitters.find((e) => e.id === (input.emitters ?? 'mixed'))?.scop_aw}
                                            </span>
                                        </div>
                                        <div className="p-3">
                                            <span className="block text-xs text-[#5B6470]">{t('Metinis poreikis')}</span>
                                            <span className="block text-sm font-extrabold tabular-nums">
                                                {classes.find((c2) => c2.id === input.building_class)?.e_kwh_m2a} kWh/m²
                                            </span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-lg font-extrabold">{t('DUK')}</h2>
                        {content.faq.map((f: { q: string; a: string }) => (
                            <details key={f.q} className="border border-[#E2DDD3] rounded-none">
                                <summary className="px-4 py-3 text-sm font-bold cursor-pointer">{f.q}</summary>
                                <p className="px-4 pb-4 text-sm text-[#5B6470] leading-relaxed">{f.a}</p>
                            </details>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
