'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, TrendingUp, FileText, CheckCircle2 } from 'lucide-react';
import { useCartStore, useCartHydration } from '../store/cart';
import { formatEur } from '../lib/conversion';
import { assetUrl } from '../lib/api';
import { DEFAULT_VAT_RATE, netFromGrossCents } from '../lib/vat';
import { useVatDisplayStore } from '../store/vat-display';
import { useTranslations } from 'next-intl';
import {
    calculateB2BCartPricing,
    DEFAULT_CART_VOLUME_TIERS,
    DEFAULT_QUANTITY_TIERS,
} from '../lib/b2b-pricing-engine';

export interface CartCompatibilityRecommendation {
    sku: string;
    title: string;
    reason: string;
    priceGrossEur: number;
    imageUrl: string;
    verificationStatus?: 'PATVIRTINTA_GAMINTOJO' | 'NEPATVIRTINTA_GAMINTOJO';
    verificationBadge?: string;
}

export function evaluateCartCompatibilityRecommendations(
    items: Array<{ sku?: string; name: string; id?: string }>,
): CartCompatibilityRecommendation[] {
    if (!items || items.length === 0) return [];

    const combinedText = items
        .map((i) => `${i.sku || ''} ${i.id || ''} ${i.name || ''}`.toUpperCase())
        .join(' | ');

    const hasRadiator =
        combinedText.includes('RADIATOR') ||
        combinedText.includes('POL./') ||
        combinedText.includes('CALIDOR') ||
        combinedText.includes('KERMI') ||
        combinedText.includes('PURMO') ||
        combinedText.includes('KORADO');

    const hasBottomVkRadiator =
        combinedText.includes('22 VK') ||
        combinedText.includes('22VK') ||
        combinedText.includes('GI-RAD-22VK') ||
        combinedText.includes('APATINIO PAJUNGIMO') ||
        combinedText.includes('APATINIS PAJUNGIMAS');

    const hasAluminumRadiator =
        combinedText.includes('POL./') ||
        combinedText.includes('CALIDOR') ||
        combinedText.includes('ALIUMIN');

    const hasSteelPanel22K =
        combinedText.includes('22 K') ||
        combinedText.includes('22K') ||
        combinedText.includes('GI-RAD-22K');

    const hasDanfossValve =
        combinedText.includes('013G0014') ||
        combinedText.includes('013G0013') ||
        combinedText.includes('013G0015') ||
        combinedText.includes('RA-N') ||
        combinedText.includes('RA-DV') ||
        combinedText.includes('RA-FN');

    const hasHeimeierOrM30Valve =
        combinedText.includes('3933-02.000') ||
        combinedText.includes('0382-02.000') ||
        combinedText.includes('ECLIPSE') ||
        combinedText.includes('V-EXACT') ||
        combinedText.includes('VEKOLUX') ||
        combinedText.includes('MULTILUX') ||
        combinedText.includes('1776138') ||
        combinedText.includes('HERZ-TS');

    const hasBottomVkValve =
        combinedText.includes('0382-02.000') ||
        combinedText.includes('VEKOLUX') ||
        combinedText.includes('MULTILUX') ||
        combinedText.includes('RLV-K') ||
        combinedText.includes('RLV-KS') ||
        combinedText.includes('H-BLOK') ||
        combinedText.includes('BINOKL');

    const hasRadiatorValve =
        hasDanfossValve ||
        hasHeimeierOrM30Valve ||
        hasBottomVkValve ||
        combinedText.includes('VOŽTUV');

    const hasDanfossRaHead =
        combinedText.includes('013G2990') ||
        combinedText.includes('013G2970') ||
        combinedText.includes('AERO') ||
        combinedText.includes('REDIA') ||
        combinedText.includes('RA 2990');

    const hasM30Head =
        combinedText.includes('6000-00.500') ||
        combinedText.includes('HEIMEIER K') ||
        combinedText.includes('GALVUTĖ K') ||
        combinedText.includes('HALO') ||
        combinedText.includes('M30X1.5') ||
        combinedText.includes('M30×1,5');

    const hasRadiatorMountingKit =
        combinedText.includes('GI-FERROLI-001') ||
        combinedText.includes('MONTAVIMO KOMPLEKT') ||
        combinedText.includes('AKLĖ') ||
        combinedText.includes('LAIKIKL');

    const hasBoilerOrHeatPump =
        combinedText.includes('KATIL') ||
        combinedText.includes('DEGIKL') ||
        combinedText.includes('MPB') ||
        combinedText.includes('ZV-') ||
        combinedText.includes('GK-') ||
        combinedText.includes('SIURBL') ||
        combinedText.includes('MONOBLOK') ||
        combinedText.includes('HAIER') ||
        combinedText.includes('AW0') ||
        combinedText.includes('AW1');

    const hasSafetyOrSeparator =
        combinedText.includes('GI-SAFE-GRP') ||
        combinedText.includes('GI-MAG-CLEAN') ||
        combinedText.includes('8292-01.103') ||
        combinedText.includes('APSAUGIN') ||
        combinedText.includes('IŠSIPLĖTIMO') ||
        combinedText.includes('PURVO') ||
        combinedText.includes('SEPARATOR');

    const recommendations: CartCompatibilityRecommendation[] = [];

    if (hasBottomVkRadiator && !hasBottomVkValve) {
        recommendations.push({
            sku: '0382-02.000',
            title: 'IMI Heimeier Vekolux VK 50 mm apatinio pajungimo mazgas („binoklis“, 0382-02.000, M30×1,5)',
            reason: 'Krepšelyje yra apatinio pajungimo radiatorius Tipas 22 VK (su integruotu termostatiniu įdėklu) – jam reikalingas VK 50 mm H-blokas (0382-02.000), o ne šoninis DN15 vožtuvas. Suderinamumą pasitikslinkite su mūsų inžinieriumi (+370 611 19158) arba pagal įrenginio techninį pasą.',
            priceGrossEur: 28.9,
            imageUrl: '/images/products/013g2990.webp',
            verificationStatus: 'NEPATVIRTINTA_GAMINTOJO',
            verificationBadge:
                'Suderinamumą pasitikslinkite su mūsų inžinieriumi (+370 611 19158) arba pagal įrenginio techninį pasą',
        });
    } else if (hasRadiator && !hasRadiatorValve) {
        recommendations.push({
            sku: '013G0014',
            title: 'Danfoss RA-N 15 šoninis termostatinis radiatoriaus vožtuvas DN15 (alternatyva pagal EN 215: IMI 3933-02.000)',
            reason: 'Krepšelyje yra šoninio pajungimo radiatorius (Tipas 22 K arba Ferroli POL), tačiau nepasirinktas šoninis termostatinis vožtuvas DN15 (013G0014 arba 3933-02.000). Suderinamumą pasitikslinkite su mūsų inžinieriumi (+370 611 19158) arba pagal įrenginio techninį pasą.',
            priceGrossEur: 18.5,
            imageUrl: '/images/products/013g2990.webp',
            verificationStatus: 'NEPATVIRTINTA_GAMINTOJO',
            verificationBadge:
                'Suderinamumą pasitikslinkite su mūsų inžinieriumi (+370 611 19158) arba pagal įrenginio techninį pasą',
        });
    }

    if (hasDanfossValve && !hasDanfossRaHead && !(hasRadiator && hasRadiatorMountingKit)) {
        recommendations.push({
            sku: '013G2990',
            title: 'Termostatinė galvutė Danfoss Redia RA-Click 23 mm (013G2990)',
            reason: 'Gamintojo dokumentu patvirtintas suderinamumas: krepšelyje yra Danfoss RA-N vožtuvas (013G0014) su Danfoss RA-Click (23 mm) fiksavimo jungtimi – jam tinka Danfoss RA-Click galvutė (013G2990); M30×1,5 galvutės be adapterio netinka.',
            priceGrossEur: 26.8,
            imageUrl: '/images/products/013g2990.webp',
            verificationStatus: 'PATVIRTINTA_GAMINTOJO',
            verificationBadge: 'Gamintojo dokumentu patvirtintas suderinamumas',
        });
    }

    if (hasHeimeierOrM30Valve && !hasM30Head && !(hasRadiator && hasRadiatorMountingKit)) {
        recommendations.push({
            sku: '6000-00.500',
            title: 'Termostatinė galvutė IMI Heimeier K M30×1,5 (6000-00.500)',
            reason: 'Gamintojo dokumentu patvirtintas suderinamumas: krepšelyje yra IMI Heimeier vožtuvas (3933-02.000 / 0382-02.000) su standartiniu M30×1,5 sriegiu – jam reikalinga M30×1,5 termogalvutė (6000-00.500); Danfoss RA-Click galvutės be adapterio netinka.',
            priceGrossEur: 19.5,
            imageUrl: '/images/products/013g2990.webp',
            verificationStatus: 'PATVIRTINTA_GAMINTOJO',
            verificationBadge: 'Gamintojo dokumentu patvirtintas suderinamumas',
        });
    }

    if (
        hasRadiator &&
        !hasBottomVkRadiator &&
        !hasSteelPanel22K &&
        (hasAluminumRadiator || !hasRadiatorMountingKit) &&
        !hasRadiatorMountingKit
    ) {
        recommendations.push({
            sku: 'GI-FERROLI-001',
            title: 'Radiatoriaus prijungimo ir montavimo perėjimų komplektas 1"x1/2" su nuorintoju ir laikikliais (GI-FERROLI-001)',
            reason: 'Aliumininiam sekcijiniam radiatoriui (G 1" šoninės angos) sumontuoti reikalingas 1"×1/2" perėjimų, aklės, Majevskio oro išleidėjo ir sieninių laikiklių komplektas. Suderinamumą pasitikslinkite su mūsų inžinieriumi (+370 611 19158) arba pagal įrenginio techninį pasą.',
            priceGrossEur: 14.9,
            imageUrl: '/images/products/013g2990.webp',
            verificationStatus: 'NEPATVIRTINTA_GAMINTOJO',
            verificationBadge:
                'Suderinamumą pasitikslinkite su mūsų inžinieriumi (+370 611 19158) arba pagal įrenginio techninį pasą',
        });
    }

    if (hasBoilerOrHeatPump && !hasSafetyOrSeparator) {
        recommendations.push({
            sku: 'GI-SAFE-GRP',
            title: 'Katilinės apsauginė grupė 3 bar su manometru, automatiniu nuorintoju ir magnetiniu purvo separatoriumi DN25',
            reason: 'Krepšelyje yra katilas, granulių degiklis arba šilumos siurblys – saugiam eksploatavimui pagal EN 12828 rekomenduojama 3 bar apsauginė grupė, išsiplėtimo indas ir purvo separatorius. Suderinamumą pasitikslinkite su mūsų inžinieriumi (+370 611 19158) arba pagal įrenginio techninį pasą.',
            priceGrossEur: 89.0,
            imageUrl: '/images/products/013g2990.webp',
            verificationStatus: 'NEPATVIRTINTA_GAMINTOJO',
            verificationBadge:
                'Suderinamumą pasitikslinkite su mūsų inžinieriumi (+370 611 19158) arba pagal įrenginio techninį pasą',
        });
    }

    return recommendations;
}

export function parseMcpImportSkusParam(rawParam: string | null | undefined): Array<{
    sku: string;
    qty: number;
    title: string;
    priceGrossEur: number;
}> {
    if (!rawParam) return [];
    const PRESET_SKUS: Record<string, { title: string; priceGrossEur: number }> = {
        'MPB-NANI-35': { title: 'Granulių degiklio komplektas Megatherm MPB NANI 35', priceGrossEur: 2350 },
        '013G2990': { title: 'Termostatinė galvutė Danfoss RA 2990', priceGrossEur: 26.8 },
        'ZV-100': { title: 'Katilas Gilės ZV 100 su automatiniu valymu', priceGrossEur: 4890 },
        '1776138': { title: 'Termostatinis vožtuvas HERZ-TS-90 DN15', priceGrossEur: 18.4 },
    };
    return rawParam
        .split(',')
        .map((pair) => pair.trim())
        .filter(Boolean)
        .map((pair) => {
            const [rawSku, rawQty] = pair.split(':');
            const sku = (rawSku || '').trim().toUpperCase();
            const qty = Math.max(1, Number(rawQty || 1));
            const preset = PRESET_SKUS[sku];
            return {
                sku,
                qty,
                title: preset?.title || `Katilinės mazgas ${sku}`,
                priceGrossEur: preset?.priceGrossEur || 64,
            };
        })
        .filter((r) => r.sku.length > 0);
}

export function CartClient({ accountId }: { accountId?: string | null }) {
    const t = useTranslations();
    const hydrated = useCartHydration();
    const items = useCartStore((s) => s.items);
    const addItem = useCartStore((s) => s.addItem);
    const updateQuantity = useCartStore((s) => s.updateQuantity);
    const removeItem = useCartStore((s) => s.removeItem);
    const showNet = useVatDisplayStore((s) => s.showNet);

    const [mcpImportedRows, setMcpImportedRows] = useState<
        Array<{ sku: string; qty: number; title: string; priceGrossEur: number }>
    >([]);
    const [mcpImportApplied, setMcpImportApplied] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const rawImport = params.get('import_skus');
        const parsed = parseMcpImportSkusParam(rawImport);
        if (parsed.length > 0) {
            setMcpImportedRows(parsed);
        }
    }, []);

    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [quoteName, setQuoteName] = useState('');
    const [quoteCompany, setQuoteCompany] = useState('');
    const [quotePhone, setQuotePhone] = useState('');
    const [quoteEmail, setQuoteEmail] = useState('');
    const [quoteNote, setQuoteNote] = useState('');
    const [quoteSubmittedRef, setQuoteSubmittedRef] = useState<string | null>(null);

    const pricingSummary = calculateB2BCartPricing({
        accountId: accountId || null,
        applyGlobalQuantityTiers: true,
        items: items.map((item) => ({
            sku: item.sku || item.id,
            title: item.name,
            retailGrossEur: item.price,
            qty: item.quantity,
        })),
    });

    const freeShippingThresholdEur = 250;
    const freeShippingProgressPct = Math.min(
        100,
        Math.round((pricingSummary.finalGrossEur / freeShippingThresholdEur) * 100),
    );
    const remainingFreeShipEur = Math.max(
        0,
        Math.round((freeShippingThresholdEur - pricingSummary.finalGrossEur) * 100) / 100,
    );

    const handleRequestCustomQuote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quoteName.trim() || !quotePhone.trim() || !quoteEmail.trim()) return;
        try {
            const res = await fetch(assetUrl('/api/b2b'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'request_cart_quote',
                    accountId: accountId || undefined,
                    customerName: quoteName.trim(),
                    companyName: quoteCompany.trim() || quoteName.trim(),
                    phone: quotePhone.trim(),
                    email: quoteEmail.trim(),
                    note:
                        quoteNote.trim() ||
                        'Prašoma individualios projekto / krepšelio nuolaidos',
                    items: items.map((i) => ({
                        sku: i.sku || i.id,
                        title: i.name,
                        qty: i.quantity,
                        unitGrossEur: i.price,
                    })),
                }),
            });
            const data = await res.json();
            if (data?.ok && data.quoteRequest?.requestNumber) {
                setQuoteSubmittedRef(data.quoteRequest.requestNumber);
            }
        } catch {
            // ignore
        }
    };

    if (!hydrated) {
        return (
            <main className="min-h-screen bg-[#F5F3EE] text-[#11161B]">
                <div className="container mx-auto px-4 py-16" aria-busy="true">
                    <div className="h-8 w-48 rounded-[2px] bg-[#E2DDD3] mb-8" />
                </div>
            </main>
        );
    }

    return (
        <main data-testid="giles-cart-client" className="min-h-screen bg-[#F5F3EE] text-[#11161B]">
            <div className="bg-[#11161B] text-[#F5F3EE] border-b border-[#2C3742] pt-28 pb-8 mb-8">
                <div className="container mx-auto px-4 max-w-6xl space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <span className="text-xs font-bold text-[#FF8A3D] block">
                                UAB „Gilės inžinerija“ · Mažmeninis ir B2B projektinis krepšelis
                            </span>
                            <h1 className="font-display text-3xl font-extrabold text-white">
                                {t('cartPage.title')}
                            </h1>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
                        {[
                            { src: '/images/brands/giles-inzinerija.svg', label: 'Gilės / Megatherm' },
                            { src: '/images/brands/danfoss.svg', label: 'Danfoss' },
                            { src: '/images/brands/herz.svg', label: 'HERZ Armaturen' },
                            { src: '/images/brands/haier.svg', label: 'Haier HVAC' },
                            { src: '/images/brands/gorenje.svg', label: 'Gorenje / TIKI' },
                            { src: '/images/brands/comisa.svg', label: 'Comisa' },
                        ].map((b) => (
                            <div
                                key={b.label}
                                className="rounded-lg bg-[#1B232C] p-2 flex items-center gap-2 overflow-hidden"
                            >
                                <img
                                    src={assetUrl(b.src)}
                                    alt={b.label}
                                    className="h-7 w-9 rounded-sm bg-white object-contain p-0.5 shrink-0"
                                />
                                <span className="text-xs font-semibold text-white truncate">
                                    {b.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 pb-16 max-w-6xl space-y-6">
                {mcpImportedRows.length > 0 && (
                    <section
                        data-testid="cart-mcp-import-banner"
                        className="rounded-xl border border-[#C2410C] bg-[#11161B] text-[#F5F3EE] p-4 sm:p-5 space-y-3"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <span className="text-xs font-bold text-[#FF8A3D] block">
                                    AI / MCP Asistento paruoštas šildymo komplektas ({mcpImportedRows.length} poz.)
                                </span>
                                <strong className="text-sm sm:text-base text-white block">
                                    Patikrinkite asistento parinktas prekes ir 1 paspaudimu įkelkite į savo krepšelį
                                </strong>
                            </div>
                            <button
                                type="button"
                                data-testid="cart-mcp-import-apply-btn"
                                disabled={mcpImportApplied}
                                onClick={() => {
                                    for (const row of mcpImportedRows) {
                                        addItem({
                                            id: row.sku,
                                            productId: row.sku,
                                            sku: row.sku,
                                            name: row.title,
                                            price: row.priceGrossEur,
                                            quantity: row.qty,
                                            image: '/images/products/013g2990.webp',
                                        });
                                    }
                                    setMcpImportApplied(true);
                                }}
                                className="min-h-[44px] px-5 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs sm:text-sm font-bold cursor-pointer"
                            >
                                {mcpImportApplied
                                    ? 'Komplektas įkeltas į krepšelį'
                                    : '+ Įkelti AI paruoštą komplektą į krepšelį'}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {mcpImportedRows.map((row) => (
                                <div
                                    key={row.sku}
                                    className="rounded-lg bg-[#1B232C] border border-[#2C3742] px-3 py-2 flex items-center justify-between gap-2"
                                >
                                    <span>
                                        <strong className="font-mono text-[#FF8A3D]">{row.sku}</strong> · {row.title} ×{' '}
                                        {row.qty} vnt.
                                    </span>
                                    <span className="font-mono font-bold text-white">
                                        {formatEur(row.priceGrossEur * row.qty)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Sales Growth Volume Progress Bar */}
                <section
                    data-testid="cart-volume-progress-bar"
                    className="rounded-xl border border-[#E2DDD3] bg-white p-4 sm:p-5 space-y-3"
                >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-[#11161B] inline-flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-[#C2410C]" />
                            {remainingFreeShipEur > 0
                                ? `Pridėkite dar už ${formatEur(remainingFreeShipEur)} nemokamam pristatymui Lietuvoje`
                                : 'Nemokamas pristatymas aktyvuotas!'}
                        </span>
                        <span className="font-mono font-bold text-[#157A3B]">
                            {pricingSummary.activeVolumeTier
                                ? `Aktyvi krepšelio apimties nuolaida: -${pricingSummary.volumeDiscountPct}% (${pricingSummary.activeVolumeTier.label})`
                                : pricingSummary.nextVolumeTier
                                  ? `Dar ${formatEur(pricingSummary.nextVolumeTier.remainingEur)} be PVM iki papildomos -${pricingSummary.nextVolumeTier.tier.extraDiscountPct}% krepšelio nuolaidos`
                                  : 'Projektinės krepšelio nuolaidos aktyvios'}
                        </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-[#E2DDD3] overflow-hidden">
                        <div
                            className="h-full bg-[#C2410C] transition-all duration-300"
                            style={{
                                width: `${pricingSummary.nextVolumeTier ? pricingSummary.nextVolumeTier.progressPct : freeShippingProgressPct}%`,
                            }}
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-[#5B6470]">
                        {DEFAULT_CART_VOLUME_TIERS.map((tier) => (
                            <div
                                key={tier.minCartEur}
                                className="rounded-lg bg-[#FAF9F6] border border-[#E2DDD3] px-3 py-2 flex items-center justify-between"
                            >
                                <span>{tier.label}</span>
                                <strong className="font-mono text-[#11161B]">
                                    -{tier.extraDiscountPct}%
                                </strong>
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#5B6470]">
                        <strong className="text-[#11161B]">
                            Kiekio nuolaida perkant 5+ / 10+ vnt.:
                        </strong>
                        {DEFAULT_QUANTITY_TIERS.map((qt) => (
                            <span
                                key={qt.minQty}
                                className="px-2.5 py-0.5 rounded bg-[#F5F3EE] font-mono font-semibold text-[#11161B]"
                            >
                                {qt.label}
                            </span>
                        ))}
                    </div>
                </section>

                {items.length > 0 && (
                    <section
                        data-testid="cart-compatibility-guard"
                        className="rounded-xl border border-[#C2410C] bg-[#FAF9F6] p-4 sm:p-5 space-y-3"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <span className="text-xs font-bold text-[#C2410C] block">
                                    Inžinerinė suderinamumo patikra · UAB „Gilės inžinerija“ techninis skyrius
                                </span>
                                <strong className="text-sm sm:text-base text-[#11161B] block">
                                    {evaluateCartCompatibilityRecommendations(items).length > 0
                                        ? 'Dėmesio: jūsų pasirinktai įrangai rekomenduojami papildomi pajungimo ar apsaugos mazgai'
                                        : 'Suderinamumą pasitikslinkite su mūsų inžinieriumi (+370 611 19158) arba pagal įrenginio techninį pasą'}
                                </strong>
                                <p className="text-xs text-[#5B6470] mt-1">
                                    Suderinamumą pasitikslinkite su mūsų inžinieriumi (+370 611 19158) arba pagal įrenginio techninį pasą.
                                </p>
                            </div>
                        </div>
                        {evaluateCartCompatibilityRecommendations(items).length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                {evaluateCartCompatibilityRecommendations(items).map((rec) => (
                                    <div
                                        key={rec.sku}
                                        className="rounded-lg border border-[#E2DDD3] bg-white p-3.5 flex flex-col justify-between gap-2.5"
                                    >
                                        <div>
                                            <span className="inline-block mb-1 px-2 py-0.5 border border-[#D5CFC3] bg-[#F5F3EE] font-bold text-[#11161B]">
                                                {rec.verificationBadge ||
                                                    'Suderinamumą pasitikslinkite su mūsų inžinieriumi (+370 611 19158) arba pagal įrenginio techninį pasą'}
                                            </span>
                                            <div>
                                                <span className="font-mono font-bold text-[#C2410C]">
                                                    SKU: {rec.sku}
                                                </span>{' '}
                                                · <strong className="text-[#11161B]">{rec.title}</strong>
                                            </div>
                                            <p className="text-[#5B6470] mt-1">{rec.reason}</p>
                                        </div>
                                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E2DDD3]">
                                            <strong className="font-mono text-sm text-[#11161B]">
                                                {formatEur(rec.priceGrossEur)} su PVM
                                            </strong>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    addItem({
                                                        id: rec.sku,
                                                        productId: rec.sku,
                                                        sku: rec.sku,
                                                        name: rec.title,
                                                        price: rec.priceGrossEur,
                                                        quantity: 1,
                                                        image: rec.imageUrl,
                                                    })
                                                }
                                                className="min-h-[40px] px-3.5 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold cursor-pointer"
                                            >
                                                + Pridėti rekomenduojamą mazgą į krepšelį
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {items.length === 0 ? (
                    <div className="text-center py-20 border border-[#E2DDD3] bg-white rounded-xl">
                        <ShoppingCart
                            className="w-14 h-14 text-[#5B6470]/40 mx-auto mb-4"
                            strokeWidth={1.5}
                            aria-hidden="true"
                        />
                        <p className="text-xl font-semibold mb-2">{t('cartPage.empty')}</p>
                        <p className="text-[#5B6470] mb-6">{t('cartPage.emptyDesc')}</p>
                        <Link
                            href="/products"
                            className="inline-flex min-h-[44px] items-center rounded-lg bg-[#C2410C] px-8 py-3 font-bold text-white"
                        >
                            {t('cartPage.goCatalog')}
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
                        <ul className="space-y-4">
                            {items.map((item, idx) => {
                                const lineCalc = pricingSummary.lines[idx];
                                const unitCents = Math.round(
                                    (lineCalc ? lineCalc.unitGrossEur : item.price) * 100,
                                );
                                const displayUnitCents = showNet
                                    ? netFromGrossCents(unitCents, DEFAULT_VAT_RATE)
                                    : unitCents;
                                const displayLineCents = displayUnitCents * item.quantity;
                                return (
                                    <li
                                        key={item.id}
                                        className="flex gap-4 rounded-xl border border-[#E2DDD3] bg-white p-4"
                                    >
                                        <div className="h-20 w-20 rounded-lg bg-[#FAF9F6] overflow-hidden flex-shrink-0">
                                            {item.image && (
                                                <img
                                                    src={assetUrl(item.image)}
                                                    alt={item.name}
                                                    className="h-full w-full object-contain p-1"
                                                />
                                            )}
                                        </div>
                                        <div className="flex flex-col flex-grow">
                                            <div className="flex justify-between gap-3">
                                                <div>
                                                    {item.sku && (
                                                        <p className="font-mono text-xs text-[#5B6470] mb-0.5">
                                                            KODAS: {item.sku}
                                                        </p>
                                                    )}
                                                    <p className="font-semibold leading-snug">
                                                        {item.name}
                                                    </p>
                                                    {lineCalc && lineCalc.appliedDiscountPct > 0 && (
                                                        <span className="inline-block mt-1 px-2 py-0.5 rounded bg-[#E3F1E8] text-[#0F5A2B] text-xs font-bold">
                                                            {lineCalc.appliedRuleLabel}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="font-mono font-bold whitespace-nowrap tabular-nums">
                                                    {formatEur(displayLineCents / 100)}{' '}
                                                    <span className="text-xs font-normal text-[#5B6470]">
                                                        {showNet ? t('vat.bePvm') : t('vat.suPvm')}
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="mt-auto pt-3 flex items-center gap-4">
                                                <div
                                                    className="flex items-center rounded-lg border border-[#D5CFC3] font-mono"
                                                    role="group"
                                                    aria-label={`Kiekis: ${item.name}`}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateQuantity(item.id, item.quantity - 1)
                                                        }
                                                        className="min-h-[40px] px-3 font-bold cursor-pointer"
                                                        aria-label={t('cartPage.decrease')}
                                                    >
                                                        −
                                                    </button>
                                                    <span className="min-w-[2rem] text-center font-semibold tabular-nums">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateQuantity(item.id, item.quantity + 1)
                                                        }
                                                        className="min-h-[40px] px-3 font-bold cursor-pointer"
                                                        aria-label={t('cartPage.increase')}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-xs font-bold text-[#5B6470] hover:text-[#B91C1C] underline cursor-pointer"
                                                >
                                                    {t('cartPage.remove')}
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>

                        <aside className="h-fit rounded-xl border border-[#E2DDD3] bg-white p-6 space-y-4 lg:sticky lg:top-24">
                            <h2 className="font-display text-xl font-bold">
                                {t('cartPage.summary')}
                            </h2>
                            <dl className="space-y-2 text-sm font-mono">
                                <div className="flex justify-between">
                                    <dt className="text-[#5B6470]">Eilučių suma be PVM:</dt>
                                    <dd className="font-semibold tabular-nums">
                                        {formatEur(pricingSummary.linesSubtotalNetEur)}
                                    </dd>
                                </div>
                                {pricingSummary.combinedExtraCartDiscountPct > 0 && (
                                    <div className="flex justify-between text-[#157A3B]">
                                        <dt>
                                            Papildoma krepšelio nuolaida (-
                                            {pricingSummary.combinedExtraCartDiscountPct}%):
                                        </dt>
                                        <dd className="font-bold tabular-nums">
                                            -{formatEur(pricingSummary.extraCartPercentDiscountEur)}
                                        </dd>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <dt className="text-[#5B6470]">
                                        PVM ({DEFAULT_VAT_RATE}%):
                                    </dt>
                                    <dd className="font-semibold tabular-nums">
                                        {formatEur(pricingSummary.finalVatEur)}
                                    </dd>
                                </div>
                                <div className="flex justify-between border-t border-[#E2DDD3] pt-2 text-base">
                                    <dt className="font-bold">
                                        {t('cartPage.subtotal')} ({t('vat.suPvm')})
                                    </dt>
                                    <dd className="font-bold tabular-nums text-[#C2410C]">
                                        {formatEur(pricingSummary.finalGrossEur)}
                                    </dd>
                                </div>
                            </dl>

                            <Link
                                href="/atsiskaitymas"
                                className="block rounded-lg bg-[#C2410C] hover:bg-[#9A3412] px-6 py-3.5 text-center text-sm font-bold text-white transition-colors"
                            >
                                {t('cartPage.buy')}
                            </Link>

                            {/* Request Custom Cart Quote Action */}
                            <div className="pt-2 border-t border-[#E2DDD3] space-y-3">
                                <button
                                    type="button"
                                    data-testid="cart-request-custom-quote-btn"
                                    onClick={() => setShowQuoteModal((v) => !v)}
                                    className="w-full min-h-[44px] px-4 rounded-lg border border-[#11161B] bg-[#FAF9F6] hover:bg-[#11161B] hover:text-white text-xs font-bold text-[#11161B] inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
                                >
                                    <FileText className="w-4 h-4" />
                                    <span>Prašyti individualios projekto / krepšelio nuolaidos</span>
                                </button>

                                {showQuoteModal && (
                                    <form
                                        data-testid="cart-custom-quote-form"
                                        onSubmit={handleRequestCustomQuote}
                                        className="rounded-xl bg-[#F5F3EE] border border-[#D5CFC3] p-3.5 space-y-2.5 text-xs"
                                    >
                                        <strong className="block text-[#11161B]">
                                            Gaukite individualią viso krepšelio kainą iš vadybininko Dariaus Šauklio
                                        </strong>
                                        <input
                                            type="text"
                                            required
                                            value={quoteName}
                                            onChange={(e) => setQuoteName(e.target.value)}
                                            placeholder="Vardas, pavardė *"
                                            className="w-full min-h-[40px] px-2.5 rounded border border-[#D5CFC3] bg-white"
                                        />
                                        <input
                                            type="text"
                                            value={quoteCompany}
                                            onChange={(e) => setQuoteCompany(e.target.value)}
                                            placeholder="Įmonės pavadinimas (nebūtina)"
                                            className="w-full min-h-[40px] px-2.5 rounded border border-[#D5CFC3] bg-white"
                                        />
                                        <input
                                            type="tel"
                                            required
                                            value={quotePhone}
                                            onChange={(e) => setQuotePhone(e.target.value)}
                                            placeholder="Telefonas (+370 6...) *"
                                            className="w-full min-h-[40px] px-2.5 rounded border border-[#D5CFC3] bg-white"
                                        />
                                        <input
                                            type="email"
                                            required
                                            value={quoteEmail}
                                            onChange={(e) => setQuoteEmail(e.target.value)}
                                            placeholder="El. paštas *"
                                            className="w-full min-h-[40px] px-2.5 rounded border border-[#D5CFC3] bg-white"
                                        />
                                        <textarea
                                            rows={2}
                                            value={quoteNote}
                                            onChange={(e) => setQuoteNote(e.target.value)}
                                            placeholder="Objekto komentarai ar pageidaujama nuolaida..."
                                            className="w-full p-2.5 rounded border border-[#D5CFC3] bg-white"
                                        />
                                        <button
                                            type="submit"
                                            className="w-full min-h-[40px] rounded-lg bg-[#11161B] text-white font-bold cursor-pointer"
                                        >
                                            Siųsti krepšelį individualiam įkainojimui
                                        </button>
                                        {quoteSubmittedRef && (
                                            <p className="text-[#157A3B] font-bold inline-flex items-center gap-1">
                                                <CheckCircle2 className="w-4 h-4" /> Užklausa {quoteSubmittedRef} perduota į Admin CRM!
                                            </p>
                                        )}
                                    </form>
                                )}
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </main>
    );
}
export default CartClient;
