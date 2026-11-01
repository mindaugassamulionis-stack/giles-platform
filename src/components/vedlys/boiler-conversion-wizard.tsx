'use client';

// W124-A1 (F0.1/F0.2/F0.5/F2/F3.1/F4.3): katilo perdarymo vedlys v2.
// Skaičiavimai – src/lib/vedlys-calc.ts (savininko patikrinta logika);
// kainos – tik iš katalogo per serverinį getVedlysWizardCatalog().

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
    resolveBoiler,
    designKw,
    pickBurner,
    buildKit,
    seasonCost,
    autonomyDays,
    type Rules,
    type Building,
    type Fuel,
    type WizardInput,
} from '../../lib/vedlys-calc';
import { fmtEurKit, kitCodeToWizardConfig, boilerSlugForBurner } from '../../lib/vedlys-wizard';
import type { WizardLineMeta } from '../../lib/vedlys-catalog';
import { isWorkingHours } from '../../lib/inzinerija-v2/service-request';
import { useCartStore } from '../../store/cart';
import { useVatDisplayStore } from '../../store/vat-display';

const PHONE_RE = /^\+?[0-9 ()-]{8,20}$/;

const AVAILABILITY_COPY: Record<WizardLineMeta['availability'], string> = {
    in_stock: 'Sandėlyje Kaune',
    supplier_2_4d: 'Tiekėjo sandėlyje · 2–4 d. d.',
    on_request: 'Pagal užklausą',
    site: 'Komplektuojame pagal užsakymą',
};

const FUEL_LABEL: Record<Fuel, string> = {
    malkos: 'Malkos',
    anglis: 'Anglys / briketai',
};

const BUILDING_LABEL: Record<Building, string> = {
    senas: 'Senas (iki ~1990 m.)',
    renovuotas: 'Renovuotas',
    naujas: 'Naujas',
};

export interface BoilerConversionWizardProps {
    rules: Rules;
    prices: Record<string, number>;
    lines: Record<string, WizardLineMeta>;
    assumptions: string[];
    kitCodes: string[];
}

function WizardInner({ rules, prices, lines, assumptions, kitCodes }: BoilerConversionWizardProps) {
    const params = useSearchParams();
    const addItem = useCartStore((s) => s.addItem);
    const showNet = useVatDisplayStore((s) => s.showNet);

    const kitCfg = useMemo(() => kitCodeToWizardConfig(params.get('kit')), [params]);
    const boilerParam = params.get('boiler');
    const initialBoiler = useMemo(() => {
        if (kitCfg) return kitCfg.boilerSlug;
        if (boilerParam) return boilerParam.toLowerCase();
        return 'viadrus';
    }, [kitCfg, boilerParam]);

    const [boilerSlug, setBoilerSlug] = useState<string>(initialBoiler);
    const [areaM2, setAreaM2] = useState<number>(180);
    const [building, setBuilding] = useState<Building>('senas');
    const [fuelNow, setFuelNow] = useState<Fuel>('malkos');
    const initialBunker = kitCfg?.bunkerL ?? 350;
    const [bunkerL, setBunkerL] = useState<number>(initialBunker);
    const [wifi, setWifi] = useState<boolean>(true);
    const [install, setInstall] = useState<boolean>(true);
    const [addedBundle, setAddedBundle] = useState<boolean>(false);
    const [phone, setPhone] = useState<string>('');
    const [city, setCity] = useState<string>('');
    const [name, setName] = useState<string>('');
    const [website, setWebsite] = useState<string>('');
    const [leadError, setLeadError] = useState<string | null>(null);
    const [leadSending, setLeadSending] = useState<boolean>(false);
    const [leadTicket, setLeadTicket] = useState<string | null>(null);
    const [leadNetworkError, setLeadNetworkError] = useState<boolean>(false);

    useEffect(() => {
        setBoilerSlug(initialBoiler);
        if (kitCfg) setBunkerL(kitCfg.bunkerL);
    }, [initialBoiler, kitCfg]);

    const kw = designKw(rules, areaM2, building);
    const input: WizardInput = { boiler: boilerSlug, area_m2: areaM2, building, fuel_now: fuelNow, bunker_l: bunkerL, wifi, install };
    const kit = useMemo(() => buildKit(rules, input, prices), [rules, prices, boilerSlug, areaM2, building, bunkerL, wifi, install]);
    const boiler = resolveBoiler(rules, boilerSlug);
    const autonomy = useMemo(() => autonomyDays(rules, bunkerL, areaM2, building), [rules, bunkerL, areaM2, building]);
    const season = useMemo(
        () => (kit.ok ? seasonCost(rules, areaM2, building, fuelNow, kit.total) : null),
        [rules, kit, areaM2, building, fuelNow],
    );

    const rfqOnly = !kit.ok && kit.reason === 'rfq-only';
    const tooSmall = !kit.ok && kit.reason === 'boiler-too-small';
    const noBurner = !kit.ok && kit.reason === 'no-burner';
    // Pelltech degikliai be katalogo kainos – sąžiningas RFQ, ne fiktyvi kaina.
    const rfqBurners = boiler ? boiler.burners.filter((sku) => prices[sku] == null) : [];
    const pick = pickBurner(rules, boilerSlug, kw, new Set(Object.keys(prices)));

    const displayTotal = kit.ok ? (showNet ? kit.net : kit.total) : null;
    const bundleName = kit.ok ? `Perdarymo komplektas ${kit.boiler.label.split(' ')[0]} · ${kit.burner.label.replace('Megatherm ', '')} · ${bunkerL} l` : '';

    function addBundleToCart() {
        if (!kit.ok) return;
        addItem({
            id: `VEDLYS-${kit.boiler.slug.toUpperCase()}-${kit.burner.sku}-${bunkerL}`,
            productId: 'vedlys',
            name: bundleName,
            price: kit.total,
            sku: `VEDLYS-${kit.burner.sku}-${bunkerL}`,
            quantity: 1,
        });
        setAddedBundle(true);
    }

    async function submitLead(e: React.FormEvent) {
        e.preventDefault();
        setLeadNetworkError(false);
        const cleanPhone = phone.trim();
        if (!cleanPhone || !PHONE_RE.test(cleanPhone)) {
            setLeadError('Įveskite telefono numerį, pvz., +370 600 00000');
            return;
        }
        setLeadError(null);
        setLeadSending(true);
        try {
            const res = await fetch('/api/service-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    urgency: 'plan',
                    type: 'conversion',
                    name: name.trim(),
                    phone: cleanPhone,
                    city: city.trim() || undefined,
                    source_page: 'vedlys',
                    website,
                    config: kit.ok
                        ? {
                              boiler: kit.boiler.slug,
                              area_m2: areaM2,
                              kw,
                              burner_sku: kit.burner.sku,
                              bunker_l: bunkerL,
                              wifi,
                              install,
                              total_eur: kit.total,
                              lines: kit.lines,
                          }
                        : { boiler: boilerSlug, area_m2: areaM2, kw, bunker_l: bunkerL, wifi, install },
                }),
            });
            const data = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: string };
            if (res.ok && data.ok && data.id) {
                setLeadTicket(data.id);
            } else {
                setLeadNetworkError(true);
            }
        } catch {
            setLeadNetworkError(true);
        } finally {
            setLeadSending(false);
        }
    }

    const bunkerOptions = [200, 350, 500, 1000];

    return (
        <div className="grid gap-8 lg:grid-cols-[1fr_380px] items-start pb-16 lg:pb-0">
            <div className="space-y-8">
                {/* 1 žingsnis – katilas */}
                <section aria-labelledby="wizard-step-boiler">
                    <h2 id="wizard-step-boiler" className="text-xl font-extrabold text-[#11161B]">
                        1. Jūsų katilas
                    </h2>
                    <p className="mt-1 text-sm text-[#5B6470]">Pasirinkite dabartinį kieto kuro katilą.</p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3" role="radiogroup" aria-label="Katilo modelis">
                        {rules.boilers.map((b) => {
                            const active = b.slug === boiler?.slug;
                            return (
                                <button
                                    key={b.slug}
                                    type="button"
                                    aria-pressed={active}
                                    data-testid="boiler-option"
                                    onClick={() => setBoilerSlug(b.slug)}
                                    className={`text-left rounded-lg border px-4 py-3 min-h-[76px] transition-colors cursor-pointer ${
                                        active ? 'border-2 border-[#C2410C] bg-white' : 'border border-[#D5CFC3] bg-transparent hover:border-[#11161B]'
                                    }`}
                                >
                                    <span className="block font-bold text-[#11161B] text-sm leading-snug">{b.label}</span>
                                    <span className="block text-xs text-[#5B6470] mt-1">{b.kind}</span>
                                    <span className="block text-xs font-semibold text-[#11161B] mt-1">{b.range_kw[0]}–{b.range_kw[1]} kW</span>
                                </button>
                            );
                        })}
                    </div>
                    {rfqOnly && boiler && (
                        <div className="mt-4 rounded-lg border border-[#C2410C] bg-white p-4 text-sm text-[#2A323B]" data-testid="wizard-error">
                            <p className="font-bold text-[#11161B]">Pramoniniams katilams ({boiler.range_kw[0]}–{boiler.range_kw[1]} kW) sprendimą parengia inžinierius.</p>
                            <Link
                                href="/lt/pramonei#industrial-rfq"
                                className="mt-2 inline-block min-h-[44px] leading-[44px] rounded-lg bg-[#C2410C] text-white font-bold px-4 hover:brightness-110"
                            >
                                Gauti pasiūlymą
                            </Link>
                        </div>
                    )}
                    {boiler && (
                        <p className="mt-3 hidden sm:block text-sm font-semibold text-[#11161B]" data-testid="boiler-choice">
                            {boiler.label} · {boiler.kind} · {boiler.range_kw[0]}–{boiler.range_kw[1]} kW
                            {boiler.flange_sku ? <> · flanšas {boiler.flange_sku}</> : null}
                        </p>
                    )}
                    {rfqBurners.length > 0 && !rfqOnly && (
                        <p className="mt-3 text-xs text-[#5B6470]">
                            {rfqBurners.map((sku) => rules.burners.find((b) => b.sku === sku)?.label ?? sku).join(', ')} – kaina pagal užklausą (katalogo kainos dar nėra).
                        </p>
                    )}
                </section>

                {/* 2 žingsnis – namas */}
                <section aria-labelledby="wizard-step-house">
                    <h2 id="wizard-step-house" className="text-xl font-extrabold text-[#11161B]">
                        2. Namas ir galia
                    </h2>
                    <label htmlFor="wizard-area" className="mt-4 block text-sm font-semibold text-[#11161B]">
                        Šildomas plotas: <span className="font-extrabold tabular-nums">{areaM2} m²</span>
                    </label>
                    <input
                        id="wizard-area"
                        type="range"
                        min={60}
                        max={400}
                        step={10}
                        value={areaM2}
                        aria-label="Plotas (m²)"
                        onChange={(e) => setAreaM2(Number(e.target.value))}
                        className="mt-2 w-full accent-[#C2410C] cursor-pointer"
                    />
                    <div className="mt-3 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Namo tipas">
                        {(Object.keys(BUILDING_LABEL) as Building[]).map((b) => (
                            <button
                                key={b}
                                type="button"
                                role="radio"
                                aria-checked={building === b}
                                onClick={() => setBuilding(b)}
                                className={`rounded-lg border px-3 py-2.5 text-sm font-semibold cursor-pointer min-h-[44px] ${
                                    building === b ? 'border-2 border-[#C2410C] bg-white text-[#11161B]' : 'border border-[#D5CFC3] text-[#2A323B] hover:border-[#11161B]'
                                }`}
                            >
                                {BUILDING_LABEL[b]}
                            </button>
                        ))}
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Dabartinis kuras">
                        {(Object.keys(FUEL_LABEL) as Fuel[]).map((f) => (
                            <button
                                key={f}
                                type="button"
                                role="radio"
                                aria-checked={fuelNow === f}
                                onClick={() => setFuelNow(f)}
                                className={`rounded-lg border px-3 py-2.5 text-sm font-semibold cursor-pointer min-h-[44px] ${
                                    fuelNow === f ? 'border-2 border-[#C2410C] bg-white text-[#11161B]' : 'border border-[#D5CFC3] text-[#2A323B] hover:border-[#11161B]'
                                }`}
                            >
                                {FUEL_LABEL[f]}
                            </button>
                        ))}
                    </div>
                    <p className="mt-3 text-sm font-bold text-[#11161B]" data-testid="wizard-kw">
                        Reikalinga galia ≈ {kw} kW
                    </p>
                    {(tooSmall || noBurner) && boiler && (
                        <div className="mt-2 rounded-lg border-2 border-[#C2410C] bg-white p-4 text-sm text-[#2A323B]" data-testid="wizard-error" role="alert">
                            {tooSmall && 'max' in kit && (
                                <p>
                                    <strong>{boiler.label}</strong> maksimali galia – {kit.max} kW. Jūsų namui reikia ≈ {kw} kW – rekomenduojame naują katilą arba inžinieriaus konsultaciją.
                                </p>
                            )}
                            {noBurner && <p>Šiam galiui ({kw} kW) suderinto degiklio kataloge dar nėra – paklauskite inžinieriaus.</p>}
                        </div>
                    )}
                </section>

                {/* 3 žingsnis – bunkeris ir priedai */}
                <section aria-labelledby="wizard-step-bunker">
                    <h2 id="wizard-step-bunker" className="text-xl font-extrabold text-[#11161B]">
                        3. Bunkeris ir priedai
                    </h2>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4" role="radiogroup" aria-label="Bunkerio tūris">
                        {bunkerOptions.map((l) => {
                            const a = autonomyDays(rules, l, areaM2, building);
                            const active = bunkerL === l;
                            return (
                                <button
                                    key={l}
                                    type="button"
                                    aria-pressed={active}
                                    data-testid="bunker-option"
                                    onClick={() => setBunkerL(l)}
                                    className={`text-left rounded-lg border px-4 py-3 min-h-[96px] transition-colors cursor-pointer ${
                                        active ? 'border-2 border-[#C2410C] bg-white' : 'border border-[#D5CFC3] bg-transparent hover:border-[#11161B]'
                                    }`}
                                >
                                    <span className="block font-extrabold text-[#11161B] text-sm">{l} l</span>
                                    <span className="block text-xs text-[#5B6470] mt-1">≈ {a.avg} d. vidutiniškai · ≈ {a.cold} d. per šalčius</span>
                                    <span className="block text-xs font-semibold text-[#11161B] mt-1">{fmtEurKit(prices[`GI-BNK-${l}`] ?? 0)}</span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-3 space-y-2">
                        <label className="flex items-center gap-3 rounded-lg border border-[#D5CFC3] px-4 py-3 cursor-pointer text-sm font-semibold text-[#2A323B]">
                            <input type="checkbox" checked={wifi} onChange={(e) => setWifi(e.target.checked)} className="w-4 h-4 accent-[#C2410C] cursor-pointer" />
                            Wi-Fi modulis valdymui iš telefono ({fmtEurKit(prices['GI-WIFI-NET'] ?? 0)})
                        </label>
                        <label className="flex items-center gap-3 rounded-lg border border-[#D5CFC3] px-4 py-3 cursor-pointer text-sm font-semibold text-[#2A323B]">
                            <input type="checkbox" checked={install} onChange={(e) => setInstall(e.target.checked)} className="w-4 h-4 accent-[#C2410C] cursor-pointer" />
                            Montavimas objekte, paleidimas ir dūmų analizė ({fmtEurKit(prices['GI-SERV-INSTALL'] ?? 0)})
                        </label>
                    </div>
                </section>

                {/* 4 žingsnis – komplektas */}
                <section aria-labelledby="wizard-step-kit">
                    <h2 id="wizard-step-kit" className="text-xl font-extrabold text-[#11161B]">
                        4. Komplektas ir kaina
                    </h2>
                    {kit.ok ? (
                        <>
                            <div className="mt-4 overflow-x-auto rounded-lg border border-[#D5CFC3] bg-white">
                                <table className="w-full text-sm">
                                    <caption className="sr-only">Komplekto sudedamosios dalys ir kainos su PVM</caption>
                                    <thead className="bg-[#F5F3EE] text-left text-xs text-[#5B6470]">
                                        <tr>
                                            <th scope="col" className="px-3 py-2 font-semibold">Dalys</th>
                                            <th scope="col" className="px-3 py-2 font-semibold">Prieinamumas</th>
                                            <th scope="col" className="px-3 py-2 font-semibold text-right">Kaina</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E7E1D5]">
                                        {kit.lines.map((l) => {
                                            const meta = lines[l.sku];
                                            return (
                                                <tr key={l.sku} data-testid="bom-row">
                                                    <td className="px-3 py-2.5">
                                                        <span className="font-semibold text-[#11161B]">{meta?.label ?? l.sku}</span>
                                                        {assumptions.includes(l.sku) && <span className="block text-xs text-[#5B6470]">kaina – prielaida, patvirtins inžinierius</span>}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-xs text-[#5B6470]">{meta ? AVAILABILITY_COPY[meta.availability] : ''}</td>
                                                    <td className="px-3 py-2.5 text-right font-bold tabular-nums whitespace-nowrap" data-testid="bom-price">
                                                        {fmtEurKit(l.price)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <p className="mt-2 text-xs text-[#5B6470]">
                                Prie montavimo eilutės: galutinė kaina patvirtinama inžinieriui įvertinus katilą (nuotrauka / vizitas). Jei perdarymas negalimas – grąžiname 100 %.
                            </p>
                        </>
                    ) : (
                        <p className="mt-4 text-sm text-[#5B6470]">
                            Komplektas parodomas, kai katilas ir galia suderinti. {rfqOnly ? 'Pramoniniams katilams – individuali užklausa.' : ''}
                        </p>
                    )}
                </section>
            </div>

            {/* Suvestinė – visada matoma (desktop dešiniajame stulpelyje, mob. – po žingsniais) */}
            <aside data-testid="wizard-summary" className="rounded-xl bg-[#11161B] text-[#F5F3EE] p-5 lg:sticky lg:top-24">
                <p className="text-xs font-bold text-[#FF8A3D]">SUVESTINĖ</p>
                <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                        <dt className="text-[#A3ADB8]">Katilas</dt>
                        <dd className="font-semibold text-right">{boiler?.label ?? boilerSlug}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                        <dt className="text-[#A3ADB8]">Reikalinga galia</dt>
                        <dd className="font-semibold tabular-nums">≈ {kw} kW</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                        <dt className="text-[#A3ADB8]">Degiklis</dt>
                        <dd className="font-semibold text-right">{kit.ok ? kit.burner.label : 'parenkamas'}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                        <dt className="text-[#A3ADB8]">Bunkeris</dt>
                        <dd className="font-semibold tabular-nums">{bunkerL} l · ≈ {autonomy.avg} d. vidutiniškai</dd>
                    </div>
                    {season && (
                        <div className="flex justify-between gap-3">
                            <dt className="text-[#A3ADB8]">Kuras per sezoną</dt>
                            <dd className="font-semibold text-right text-xs leading-snug">
                                {season.saving > 0 ? (
                                    <>
                                        ≈ {fmtEurKit(season.before)} € → ≈ {fmtEurKit(season.after)} € (prielaida)
                                        <span className="block text-[#FF8A3D]">Atsipirkimas ≈ {season.paybackYears} m.</span>
                                    </>
                                ) : (
                                    <span>Kuro kaina panaši – nauda: automatika, kraujate kas ≈ {autonomy.avg} d., o ne 2–3 kartus per dieną (prielaida)</span>
                                )}
                            </dd>
                        </div>
                    )}
                    <div className="flex justify-between gap-3 border-t border-[#2C3742] pt-2">
                        <dt className="font-bold">{showNet ? 'Kaina be PVM' : 'Kaina su PVM'}</dt>
                        <dd className="font-extrabold text-base tabular-nums text-[#FF8A3D]" data-testid="summary-total">
                            {displayTotal != null ? fmtEurKit(displayTotal) : '–'}
                        </dd>
                    </div>
                    {!showNet && kit.ok && (
                        <div className="flex justify-between gap-3">
                            <dt className="text-[#A3ADB8]">Be PVM</dt>
                            <dd className="tabular-nums text-[#A3ADB8]">{fmtEurKit(kit.net)}</dd>
                        </div>
                    )}
                </dl>

                {(kit.ok || tooSmall || noBurner) && (
                    <button
                        type="button"
                        onClick={addBundleToCart}
                        disabled={!kit.ok || tooSmall || noBurner}
                        className="mt-4 w-full min-h-[52px] rounded-lg bg-[#C2410C] hover:brightness-110 text-white font-bold text-sm px-4 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {kit.ok ? `Į krepšelį · ${bundleName}` : 'Į krepšelį (iš pradžių suderinkite komplektą)'}
                    </button>
                )}
                {addedBundle && (
                    <p className="mt-2 text-xs text-[#3FB950] font-semibold" data-testid="wizard-cart-added">
                        Komplektas įdėtas į krepšelį (vienas darinys – flanšo ar saugos termostato atskirai neišimti).
                    </p>
                )}

                {/* Užklausos forma – realus siuntimas į /api/service-request */}
                <form data-testid="wizard-lead-form" onSubmit={submitLead} className="mt-5 space-y-2" aria-label="Užklausos forma">
                    {leadTicket ? (
                        <div data-testid="wizard-lead-success" className="rounded-lg bg-[#1B232C] border border-[#2C3742] p-4 text-sm" role="status">
                            <p className="font-extrabold text-[#3FB950]">Užklausa {leadTicket} gauta.</p>
                            <p className="mt-1 text-[#C9D0D8]">
                                {isWorkingHours() ? 'Darius paskambins per 2 val. darbo metu (I–V 8:30–17:30).' : 'Darius paskambins kitą darbo dieną iki 10:00.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="text-xs text-[#A3ADB8]">Patvirtinkite konfigūraciją – inžinierius paskambins ir patikslins sąmatą.</p>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Vardas (nebūtina)"
                                aria-label="Vardas"
                                className="w-full rounded-sm bg-[#0E1216] border border-[#2C3742] px-3 py-2.5 text-sm text-[#F5F3EE] placeholder-[#A3ADB8] focus:outline-none focus:border-[#FF8A3D]"
                            />
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Telefonas, pvz., +370 600 00000"
                                aria-label="Telefonas"
                                className="w-full rounded-sm bg-[#0E1216] border border-[#2C3742] px-3 py-2.5 text-sm text-[#F5F3EE] placeholder-[#A3ADB8] focus:outline-none focus:border-[#FF8A3D]"
                            />
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="Miestas, pvz., Kaunas"
                                aria-label="Miestas"
                                className="w-full rounded-sm bg-[#0E1216] border border-[#2C3742] px-3 py-2.5 text-sm text-[#F5F3EE] placeholder-[#A3ADB8] focus:outline-none focus:border-[#FF8A3D]"
                            />
                            <input
                                type="text"
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                aria-hidden="true"
                                tabIndex={-1}
                                autoComplete="off"
                                className="hidden"
                            />
                            {leadError && (
                                <p className="text-xs text-[#FF8A3D] font-semibold" role="alert">{leadError}</p>
                            )}
                            {leadNetworkError && (
                                <p className="text-xs text-[#FF8A3D] font-semibold" role="alert">
                                    Nepavyko išsiųsti. Paskambinkite +370 611 19158 arba bandykite dar kartą.
                                </p>
                            )}
                            <button
                                type="submit"
                                disabled={leadSending}
                                className="w-full min-h-[48px] rounded-sm bg-[#F5F3EE] text-[#11161B] font-bold text-sm px-4 hover:bg-white transition cursor-pointer disabled:opacity-60"
                            >
                                {leadSending ? 'Siunčiama…' : 'Gauti patvirtinimą'}
                            </button>
                        </>
                    )}
                </form>
                {kitCodes.length > 0 && (
                    <p className="mt-3 text-[11px] leading-snug text-[#A3ADB8]">
                        Skaičiavimai pagal taisykles su prielaidomis (kuro kainos – savininko patvirtintinos). Tiksliau įvertina inžinierius.
                    </p>
                )}
            </aside>

            {/* Mobilioji prilipusi juosta (F4.3) */}
            {kit.ok && (
                <div
                    data-testid="wizard-sticky-bar"
                    className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-[#11161B] text-[#F5F3EE] px-4 py-2.5 flex items-center justify-between gap-3 border-t border-[#2C3742]"
                >
                    <span className="text-sm font-bold tabular-nums">
                        {fmtEurKit(displayTotal ?? 0)} · {kit.ok ? kit.burner.label.replace('Megatherm ', '') : ''}
                    </span>
                    <a href="#wizard-step-kit" className="min-h-[44px] leading-[44px] rounded-lg bg-[#C2410C] text-white font-bold text-sm px-4">
                        Toliau →
                    </a>
                </div>
            )}
        </div>
    );
}

export function BoilerConversionWizard(props: BoilerConversionWizardProps) {
    return (
        <Suspense fallback={<div className="h-[420px]" aria-busy="true" />}>
            <WizardInner {...props} />
        </Suspense>
    );
}
