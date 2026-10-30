'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { assetUrl } from '../../lib/api';
import type { AppLocale } from '../../i18n/routing';
import {
    INDUSTRIAL_MODELS_FILE,
    getDefaultPublishEnv,
    getLocalizedIndustrialModels,
    getLocalizedProjects,
    getPramoneiContent,
} from '../../lib/pramonei-v2/data';
import {
    formatDecimal,
    formatInt,
    formatModelArea,
    formatModelFuel,
    formatModelPower,
    formatModelPriceCell,
    priceLabel,
} from '../../lib/pramonei-v2/format';
import { isEstimate, isPublishable, type IndustrialModel } from '../../lib/pramonei-v2/types';
import { BoilerDrawings } from './boiler-drawings';
import { RfqSection, RoiCalculatorSection } from './pramonei-v2-view';

const PASSPORT_I18N: Record<
    AppLocale,
    {
        powerLabel: string;
        areaLabel: string;
        fuelLabel: string;
        dimsLabel: string;
        connLabel: string;
        efficiencyLabel: string;
        consumptionLabel: string;
        auxLabel: string;
        ashLabel: string;
        flueLabel: string;
        useCasesLabel: string;
        techDataTitle: string;
        modelProjectsTitle: string;
        otherModelsTitle: string;
        getQuoteCta: string;
        schemCta: string;
    }
> = {
    lt: {
        powerLabel: 'Vardinė galia',
        areaLabel: 'Šildomas plotas',
        fuelLabel: 'Kuro sandėlis ir autonomija',
        dimsLabel: 'Gabaritai ir masė',
        connLabel: 'Prijungimas',
        efficiencyLabel: 'Naudingumo koeficientas',
        consumptionLabel: 'Kuro sąnaudos (100 % apkrova)',
        auxLabel: 'Savos reikmės elektra',
        ashLabel: 'Pelenų šalinimas',
        flueLabel: 'Dūmų valymas',
        useCasesLabel: 'Paskirtis ir objektai',
        techDataTitle: 'Techniniai duomenys',
        modelProjectsTitle: 'Šio modelio įgyvendinti objektai',
        otherModelsTitle: 'Kiti modeliai',
        getQuoteCta: 'Gauti pasiūlymą',
        schemCta: 'Principinės schemos',
    },
    en: {
        powerLabel: 'Nominal Output',
        areaLabel: 'Heated Area',
        fuelLabel: 'Fuel Store & Autonomy',
        dimsLabel: 'Dimensions & Mass',
        connLabel: 'Connections',
        efficiencyLabel: 'Thermal Efficiency',
        consumptionLabel: 'Fuel Consumption (100% load)',
        auxLabel: 'Auxiliary Electric Power',
        ashLabel: 'De-ashing System',
        flueLabel: 'Flue Gas Cleaning',
        useCasesLabel: 'Typical Applications',
        techDataTitle: 'Technical Data',
        modelProjectsTitle: 'Completed Projects with This Model',
        otherModelsTitle: 'Related Models',
        getQuoteCta: 'Request a Quote',
        schemCta: 'View Schematics',
    },
    pl: {
        powerLabel: 'Moc znamionowa',
        areaLabel: 'Ogrzewana powierzchnia',
        fuelLabel: 'Magazyn paliwa i autonomia',
        dimsLabel: 'Gabaryty i masa',
        connLabel: 'Przyłącza',
        efficiencyLabel: 'Sprawność cieplna',
        consumptionLabel: 'Zużycie paliwa (100% mocy)',
        auxLabel: 'Moc elektryczna potrzeb własnych',
        ashLabel: 'Usuwanie popiołu',
        flueLabel: 'Odpylanie spalin',
        useCasesLabel: 'Zastosowanie',
        techDataTitle: 'Dane techniczne',
        modelProjectsTitle: 'Zrealizowane obiekty z tym modelem',
        otherModelsTitle: 'Inne modele',
        getQuoteCta: 'Otrzymaj ofertę',
        schemCta: 'Schematy zasadnicze',
    },
    ru: {
        powerLabel: 'Номинальная мощность',
        areaLabel: 'Отапливаемая площадь',
        fuelLabel: 'Склад топлива и автономия',
        dimsLabel: 'Габариты и масса',
        connLabel: 'Подключение',
        efficiencyLabel: 'КПД',
        consumptionLabel: 'Расход топлива (100% нагрузка)',
        auxLabel: 'Эл. мощность собственных нужд',
        ashLabel: 'Золоудаление',
        flueLabel: 'Очистка дымовых газов',
        useCasesLabel: 'Применение и объекты',
        techDataTitle: 'Технические данные',
        modelProjectsTitle: 'Реализованные объекты этой модели',
        otherModelsTitle: 'Другие модели',
        getQuoteCta: 'Получить предложение',
        schemCta: 'Принципиальные схемы',
    },
};

export function ModelPassportView({
    model,
    locale,
}: {
    model: IndustrialModel;
    locale: AppLocale;
}) {
    const content = getPramoneiContent(locale);
    const pCopy = PASSPORT_I18N[locale];
    const allModels = useMemo(() => getLocalizedIndustrialModels(locale), [locale]);
    const allProjects = useMemo(() => getLocalizedProjects(locale), [locale]);
    const defaultEnv = getDefaultPublishEnv();
    const showAssumptions = defaultEnv.SHOW_ASSUMPTIONS;
    const env = { SHOW_ASSUMPTIONS: showAssumptions };

    const [gross, setGross] = useState(false);

    useEffect(() => {
        try {
            const saved = window.localStorage.getItem('gi.vat');
            if (saved === 'gross') setGross(true);
            else if (saved === 'net') setGross(false);
        } catch {
            // keep default net
        }
    }, []);

    const selectVat = (nextGross: boolean) => {
        setGross(nextGross);
        try {
            window.localStorage.setItem('gi.vat', nextGross ? 'gross' : 'net');
        } catch {
            // ignore
        }
    };

    const fuelInfo = formatModelFuel(model, locale, showAssumptions);
    const priceInfo = formatModelPriceCell(model, {
        gross,
        showAssumptions,
        locale,
        priceOnRequest: content.models_section.price_on_request,
    });

    const techRows = useMemo(() => {
        const rows: Array<{ label: string; value: string }> = [];
        if (model.power_kw.value) {
            const p = model.power_kw.value;
            const parts = [`${formatInt(p.nominal)} kW`];
            if (p.modulation) parts.push(`moduliacija ${p.modulation}`);
            if (p.cascade) parts.push(`kaskada ${p.cascade}`);
            rows.push({ label: pCopy.powerLabel, value: parts.join(' · ') });
        }
        const areaStr = formatModelArea(model, locale);
        if (areaStr !== '–') {
            rows.push({ label: pCopy.areaLabel, value: areaStr });
        }
        if (isPublishable(model.efficiency_pct, env)) {
            rows.push({
                label: pCopy.efficiencyLabel,
                value: `${formatDecimal(model.efficiency_pct.value, 1)} %`,
            });
        }
        if (model.fuel_storage.value) {
            const fVal = fuelInfo.autonomy
                ? `${fuelInfo.main} (${fuelInfo.autonomy})`
                : fuelInfo.main;
            rows.push({ label: pCopy.fuelLabel, value: fVal });
        }
        if (isPublishable(model.fuel_kg_h_full, env)) {
            const chipsPart = isPublishable(model.fuel_kg_h_full_chips, env)
                ? ` · skiedra ${model.fuel_kg_h_full_chips.value} kg/h`
                : '';
            rows.push({
                label: pCopy.consumptionLabel,
                value: `${model.fuel_kg_h_full.value} kg/h${chipsPart}`,
            });
        }
        if (model.dimensions.value) {
            const massPart = model.dimensions.value.mass_t
                ? ` · ${String(model.dimensions.value.mass_t).replace('.', ',')} t`
                : '';
            rows.push({
                label: pCopy.dimsLabel,
                value: `${model.dimensions.value.label}${massPart}`,
            });
        }
        if (isPublishable(model.connection, env)) {
            rows.push({ label: pCopy.connLabel, value: model.connection.value });
        }
        if (isPublishable(model.aux_power_kw, env)) {
            const est = isEstimate(model.aux_power_kw) ? '≈ ' : '';
            rows.push({ label: pCopy.auxLabel, value: `${est}${model.aux_power_kw.value} kW` });
        }
        if (isPublishable(model.ash, env)) {
            rows.push({ label: pCopy.ashLabel, value: model.ash.value });
        }
        if (isPublishable(model.flue_cleaning, env)) {
            rows.push({ label: pCopy.flueLabel, value: model.flue_cleaning.value });
        }
        if (model.use_cases.length > 0) {
            rows.push({ label: pCopy.useCasesLabel, value: model.use_cases.join(', ') });
        }
        return rows;
    }, [model, locale, pCopy, env, fuelInfo]);

    const modelProjects = useMemo(
        () => allProjects.filter((p) => p.model === model.slug),
        [allProjects, model.slug],
    );

    const nearestModels = useMemo(() => {
        const curPower = model.power_kw.value?.nominal ?? 500;
        return allModels
            .filter((m) => m.slug !== model.slug)
            .sort(
                (a, b) =>
                    Math.abs((a.power_kw.value?.nominal ?? 0) - curPower) -
                    Math.abs((b.power_kw.value?.nominal ?? 0) - curPower),
            )
            .slice(0, 3);
    }, [allModels, model]);

    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: content.breadcrumb[0],
                item: `https://gilesinzinerija.lt/${locale}`,
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: content.breadcrumb[1],
                item: `https://gilesinzinerija.lt/${locale}/pramonei`,
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: model.code,
                item: `https://gilesinzinerija.lt/${locale}/pramonei/${model.slug}`,
            },
        ],
    };

    const productJsonLd = isPublishable(model.price_net_eur, env)
        ? {
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: `${model.code} – ${model.kind}`,
              sku: model.code,
              brand: { '@type': 'Brand', name: 'Gilės inžinerija' },
              image: model.image
                  ? `https://gilesinzinerija.lt${model.image}`
                  : 'https://gilesinzinerija.lt/studio-assets/projects/giles-darbas-08.webp',
              offers: {
                  '@type': 'Offer',
                  priceCurrency: 'EUR',
                  price: model.price_net_eur.value,
                  priceSpecification: {
                      '@type': 'UnitPriceSpecification',
                      priceCurrency: 'EUR',
                      price: model.price_net_eur.value,
                      valueAddedTaxIncluded: false,
                  },
                  availability: 'https://schema.org/InStock',
                  url: `https://gilesinzinerija.lt/${locale}/pramonei/${model.slug}`,
              },
          }
        : null;

    return (
        <div className="bg-[#F5F3EE] text-[#11161B] min-h-screen">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
            {productJsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
                />
            )}

            {/* 1 & 2. Breadcrumb + Hero overview */}
            <section className="bg-[#0E1216] text-[#F5F3EE] py-8 sm:py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-6">
                    <nav aria-label="Kelias" className="flex items-center gap-2 text-xs text-[#8E99A5]">
                        <Link href={`/${locale}`} className="hover:text-[#F5F3EE]">
                            {content.breadcrumb[0]}
                        </Link>
                        <span aria-hidden="true">/</span>
                        <Link href={`/${locale}/pramonei`} className="hover:text-[#F5F3EE]">
                            {content.breadcrumb[1]}
                        </Link>
                        <span aria-hidden="true">/</span>
                        <span className="text-[#F5F3EE] font-semibold">{model.code}</span>
                    </nav>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        <div className="lg:col-span-5 rounded-2xl overflow-hidden bg-[#EEEBE4] flex items-center justify-center min-h-[260px]">
                            {model.image ? (
                                <img
                                    src={assetUrl(model.image)}
                                    alt={`${model.code} – ${model.kind}`}
                                    width={800}
                                    height={600}
                                    fetchPriority="high"
                                    className="w-full aspect-[4/3] object-cover block brightness-105 contrast-105"
                                />
                            ) : (
                                <div className="p-10 flex flex-col items-center gap-3 text-[#3A4652]">
                                    <svg
                                        width="120"
                                        height="80"
                                        viewBox="0 0 44 30"
                                        fill="none"
                                        stroke="#5B6470"
                                        strokeWidth="1.5"
                                    >
                                        <rect x="2" y="10" width="32" height="18" rx="1" />
                                        <path d="M9 10V28 M16 10V28 M23 10V28 M30 10V28" />
                                        <rect x="36" y="2" width="5" height="26" />
                                    </svg>
                                    <span className="text-sm font-bold text-[#11161B]">
                                        {model.code} · {formatModelPower(model, locale)}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-7 space-y-5">
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-[#FF8A3D] block">
                                    {formatModelPower(model, locale)}
                                </span>
                                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F5F3EE] leading-tight text-balance">
                                    {model.code} – {model.kind}
                                </h1>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#151C23] border border-[#26313B]">
                                <div className="space-y-0.5">
                                    <strong className="text-2xl font-extrabold text-[#F5F3EE] block tabular-nums">
                                        {priceInfo.main}
                                    </strong>
                                    {priceInfo.sub && (
                                        <span className="text-xs text-[#A3ADB8] block">
                                            {priceInfo.sub}
                                        </span>
                                    )}
                                </div>

                                <div
                                    role="group"
                                    aria-label="Kainos"
                                    className="inline-flex p-1 rounded-lg bg-[#0E1216] border border-[#26313B] gap-1"
                                >
                                    <button
                                        type="button"
                                        aria-pressed={!gross}
                                        onClick={() => selectVat(false)}
                                        className={`min-h-[36px] px-3 rounded text-xs font-bold cursor-pointer ${
                                            !gross
                                                ? 'bg-[#FF8A3D] text-[#0E1216]'
                                                : 'bg-transparent text-[#F5F3EE]'
                                        }`}
                                    >
                                        {content.models_section.vat_toggle.net}
                                    </button>
                                    <button
                                        type="button"
                                        aria-pressed={gross}
                                        onClick={() => selectVat(true)}
                                        className={`min-h-[36px] px-3 rounded text-xs font-bold cursor-pointer ${
                                            gross
                                                ? 'bg-[#FF8A3D] text-[#0E1216]'
                                                : 'bg-transparent text-[#F5F3EE]'
                                        }`}
                                    >
                                        {content.models_section.vat_toggle.gross}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <a
                                    href="#industrial-rfq"
                                    className="min-h-[48px] px-6 inline-flex items-center justify-center rounded-lg bg-[#C2410C] text-white font-bold text-sm sm:text-base hover:brightness-110 transition"
                                >
                                    {pCopy.getQuoteCta}
                                </a>
                                <a
                                    href="#breziniai"
                                    className="min-h-[48px] px-5 inline-flex items-center justify-center rounded-lg border border-[#3A4652] bg-transparent text-[#F5F3EE] font-semibold text-sm sm:text-base hover:border-[#FF8A3D] transition"
                                >
                                    {pCopy.schemCta}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Brėžiniai */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 sm:pt-14">
                <BoilerDrawings model={model} locale={locale} rfqHref="#industrial-rfq" />
            </div>

            {/* 4. Techniniai duomenys */}
            <section className="pt-10 sm:pt-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#11161B]">
                        {pCopy.techDataTitle}
                    </h2>
                    <div className="rounded-2xl bg-white border border-[#E2DDD3] overflow-hidden">
                        <dl className="divide-y divide-[#E2DDD3] text-sm">
                            {techRows.map((r) => (
                                <div
                                    key={r.label}
                                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 px-5 py-3.5"
                                >
                                    <dt className="sm:col-span-4 font-semibold text-[#5B6470]">
                                        {r.label}
                                    </dt>
                                    <dd className="sm:col-span-8 font-bold text-[#11161B]">
                                        {r.value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
            </section>

            {/* 5. Skaičiuoklė */}
            <RoiCalculatorSection
                locale={locale}
                forcedModelSlug={model.segment === 'buy' ? model.slug : undefined}
                showAssumptions={showAssumptions}
            />

            {/* 6. Šio modelio projektai */}
            {modelProjects.length > 0 && (
                <section className="pt-10 sm:pt-14">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-4">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#11161B]">
                            {pCopy.modelProjectsTitle}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {modelProjects.map((p) => (
                                <div
                                    key={p.id}
                                    className="flex flex-col rounded-2xl bg-white border border-[#E2DDD3] overflow-hidden"
                                >
                                    <div className="relative bg-[#EEEBE4]">
                                        <img
                                            src={assetUrl(p.image)}
                                            alt={p.title}
                                            width={640}
                                            height={480}
                                            loading="lazy"
                                            className="w-full aspect-[4/3] object-cover block brightness-105 contrast-105"
                                        />
                                        <span className="absolute left-3.5 top-3.5 px-2.5 py-1 rounded bg-[#11161B] text-white text-xs font-bold">
                                            {p.tag}
                                        </span>
                                    </div>
                                    <div className="p-5 space-y-2">
                                        <h3 className="font-bold text-base text-[#11161B]">
                                            {p.title}
                                        </h3>
                                        <p className="text-xs text-[#5B6470]">{p.equipment}</p>
                                        <p className="text-xs font-semibold text-[#157A3B]">
                                            {p.result}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* 7. Užklausa */}
            <RfqSection
                locale={locale}
                defaultModelSlug={model.slug}
                defaultMode={model.segment === 'rent' ? 'rent' : 'buy'}
            />

            {/* 8. Kiti modeliai */}
            <section className="pb-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-4">
                    <h2 className="text-2xl font-extrabold text-[#11161B]">
                        {pCopy.otherModelsTitle}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {nearestModels.map((nm) => {
                            const nmPrice = formatModelPriceCell(nm, {
                                gross,
                                showAssumptions,
                                locale,
                                priceOnRequest: content.models_section.price_on_request,
                            });
                            return (
                                <Link
                                    key={nm.slug}
                                    href={`/${locale}/pramonei/${nm.slug}`}
                                    className="p-5 rounded-2xl bg-white border border-[#E2DDD3] hover:border-[#C2410C] flex flex-col justify-between gap-3 transition"
                                >
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold text-[#C2410C] block">
                                            {nm.code} · {formatModelPower(nm, locale)}
                                        </span>
                                        <strong className="font-bold text-base text-[#11161B] block">
                                            {nm.kind}
                                        </strong>
                                    </div>
                                    <span className="font-bold text-sm text-[#11161B]">
                                        {nmPrice.main}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>
        </div>
    );
}
