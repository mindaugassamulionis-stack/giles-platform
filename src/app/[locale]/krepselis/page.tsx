'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCartStore, useCartHydration } from '../../../store/cart';
import { formatEur } from '../../../lib/conversion';
import { assetUrl } from '../../../lib/api';
import { DEFAULT_VAT_RATE, netFromGrossCents } from '../../../lib/vat';
import { useVatDisplayStore } from '../../../store/vat-display';
import { VatToggle } from '../../../components/vat-toggle';
import {
    parseMcpImportSkusParam,
    evaluateCartCompatibilityRecommendations,
} from '../../../components/cart-client';
import { useTranslations } from 'next-intl';

// W22-D1-C (G-D1-3): DESIGN.md v3 cart page (/krepselis) — assetUrl(item.image),
// font-mono SKU, VatToggle + net/PVM breakdown, 2px technical corners, copper
// CTA, Lucide ShoppingCart (zero cart emoji, zero consumer free-shipping upsell).
export default function CartPage() {
    const t = useTranslations();
    const hydrated = useCartHydration();
    const items = useCartStore((s) => s.items);
    const addItem = useCartStore((s) => s.addItem);
    const updateQuantity = useCartStore((s) => s.updateQuantity);
    const removeItem = useCartStore((s) => s.removeItem);
    const showNet = useVatDisplayStore((s) => s.showNet);
    const [mcpRows, setMcpRows] = useState<ReturnType<typeof parseMcpImportSkusParam>>([]);
    const [mcpApplied, setMcpApplied] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const parsed = parseMcpImportSkusParam(params.get('import_skus'));
        if (parsed.length > 0) setMcpRows(parsed);
    }, []);

    const grossCents = Math.round(items.reduce((sum, i) => sum + i.price * 100 * i.quantity, 0));
    const netCents = netFromGrossCents(grossCents, DEFAULT_VAT_RATE);
    const vatCents = Math.max(0, grossCents - netCents);
    const subtotalGross = grossCents / 100;
    const subtotalNet = netCents / 100;
    const vatAmount = vatCents / 100;

    const compatibilityRecs = hydrated ? evaluateCartCompatibilityRecommendations(items) : [];

    return (
        <main className="min-h-screen bg-[#F5F3EE] text-[#11161B]">
            <div className="bg-[#11161B] text-white border-b border-[#2C3742] pt-28 pb-6 mb-8">
                <div className="container mx-auto px-4 max-w-6xl space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <h1 className="font-display text-3xl font-extrabold text-white">{t('cartPage.title')}</h1>
                        <VatToggle />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
                        {[
                            { src: '/images/products/giles-studio-01-mpb-nani-35-50.webp', label: 'Megatherm MPB' },
                            { src: '/images/products/giles-studio-04-viadrus-conversion-kit.webp', label: 'Viadrus U22/U26' },
                            { src: '/images/products/giles-studio-05-pelltech-pv20a-kit.webp', label: 'Pelltech / HERZ' },
                            { src: '/images/products/giles-studio-06-megatherm-burner-kit.webp', label: 'Degiklių mazgai' },
                            { src: '/images/products/giles-studio-21-haier-super-aqua-r290.webp', label: 'Haier R290' },
                            { src: '/images/products/giles-studio-27-centrometal-cas-1001-buffer.webp', label: 'Buferinės talpos' },
                        ].map((b) => (
                            <div key={b.label} className="inline-flex items-center gap-2.5">
                                <img
                                    src={assetUrl(b.src)}
                                    alt={b.label}
                                    width={48}
                                    height={48}
                                    className="h-12 w-12 bg-white object-contain p-1 shrink-0"
                                />
                                <span className="text-xs font-semibold text-[#C9D0D8]">{b.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="container mx-auto px-4 pb-16 max-w-6xl space-y-6">
                {items.length > 0 && (
                    <section
                        data-testid="cart-compatibility-guard"
                        className="rounded-[2px] border border-[#C2410C] bg-white p-4 space-y-3"
                    >
                        <div>
                            <span className="text-xs font-bold text-[#C2410C] block">
                                Inžinerinė suderinamumo patikra · UAB „Gilės inžinerija“ techninis skyrius
                            </span>
                            <strong className="text-sm text-[#11161B] block">
                                {compatibilityRecs.length > 0
                                    ? 'Dėmesio: jūsų pasirinktai įrangai trūksta privalomų pajungimo ar apsaugos mazgų'
                                    : 'Visi pagrindiniai šildymo ir aprišimo mazgai krepšelyje yra suderinti'}
                            </strong>
                        </div>
                        {compatibilityRecs.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2 border-t border-[#E2DDD3]">
                                {compatibilityRecs.map((rec) => (
                                    <div
                                        key={rec.sku}
                                        className="flex flex-col justify-between gap-2 pb-2 border-b border-[#E2DDD3]"
                                    >
                                        <div>
                                            <span className="font-mono font-bold text-[#C2410C]">
                                                SKU: {rec.sku}
                                            </span>{' '}
                                            · <strong className="text-[#11161B]">{rec.title}</strong>
                                            <p className="text-[#5B6470] mt-0.5">{rec.reason}</p>
                                        </div>
                                        <div className="flex flex-wrap items-center justify-between gap-2">
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
                                                className="min-h-[40px] px-3 rounded-[2px] border border-[#C2410C] bg-transparent hover:bg-[#FBEADF] text-[#C2410C] font-bold cursor-pointer"
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
                {mcpRows.length > 0 && (
                    <section
                        data-testid="cart-mcp-import-banner"
                        className="mb-6 rounded-[2px] border border-[#C2410C] bg-[#11161B] text-[#F5F3EE] p-4 space-y-3"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <span className="text-xs font-bold text-[#FF8A3D] block">
                                    AI / MCP Asistento paruoštas krepšelis ({mcpRows.length} poz.)
                                </span>
                                <strong className="text-sm text-white block">
                                    Patikrinkite asistento parinktas prekes ir patvirtinkite įkėlimą į krepšelį
                                </strong>
                            </div>
                            <button
                                type="button"
                                data-testid="cart-mcp-import-apply-btn"
                                disabled={mcpApplied}
                                onClick={() => {
                                    for (const row of mcpRows) {
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
                                    setMcpApplied(true);
                                }}
                                className="min-h-[44px] px-5 rounded-[2px] bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-bold cursor-pointer"
                            >
                                {mcpApplied ? 'Įkelta į krepšelį' : '+ Įkelti AI paruoštą komplektą'}
                            </button>
                        </div>
                    </section>
                )}

                {items.length === 0 ? (
                    <div className="text-center py-20 border border-border bg-card rounded-[2px]">
                        <ShoppingCart className="w-14 h-14 text-muted-foreground/40 mx-auto mb-4" strokeWidth={1.5} aria-hidden="true" />
                        <p className="text-xl font-semibold mb-2">{t('cartPage.empty')}</p>
                        <p className="text-muted-foreground mb-6">{t('cartPage.emptyDesc')}</p>
                        <Link
                            href="/products"
                            className="inline-flex rounded-[2px] bg-[var(--accent)] px-8 py-3 font-bold text-white transition-colors duration-150 hover:bg-[var(--accent-hover)]"
                        >
                            {t('cartPage.goCatalog')}
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
                        <ul className="space-y-4">
                            {items.map((item) => {
                                const unitCents = Math.round(item.price * 100);
                                const displayUnitCents = showNet ? netFromGrossCents(unitCents, DEFAULT_VAT_RATE) : unitCents;
                                const displayLineCents = displayUnitCents * item.quantity;
                                return (
                                    <li key={item.id} className="flex gap-4 rounded-[2px] border border-border bg-card p-4">
                                        <div className="h-20 w-20 rounded-[2px] bg-muted overflow-hidden flex-shrink-0">
                                            {item.image && <img src={assetUrl(item.image)} alt={item.name} className="h-full w-full object-cover" />}
                                        </div>
                                        <div className="flex flex-col flex-grow">
                                            <div className="flex justify-between gap-3">
                                                <div>
                                                    {item.sku && (
                                                        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-0.5">
                                                            KODAS: {item.sku}
                                                        </p>
                                                    )}
                                                    <p className="font-semibold leading-snug">{item.name}</p>
                                                </div>
                                                <p className="font-mono font-bold whitespace-nowrap tabular-nums">
                                                    {formatEur(displayLineCents / 100)}{' '}
                                                    <span className="text-xs font-normal text-muted-foreground">
                                                        {showNet ? t('vat.bePvm') : t('vat.suPvm')}
                                                    </span>
                                                </p>
                                            </div>
                                            <p className="font-mono text-sm text-muted-foreground tabular-nums">
                                                {formatEur(displayUnitCents / 100)} / vnt. ({showNet ? t('vat.bePvm') : t('vat.suPvm')})
                                            </p>
                                            <div className="mt-auto pt-2 flex items-center gap-4">
                                                <div className="flex items-center rounded-[2px] border border-border font-mono" role="group" aria-label={`Kiekis: ${item.name}`}>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="px-3 py-1 font-bold hover:text-[var(--primary)]"
                                                        aria-label={t('cartPage.decrease')}
                                                    >−</button>
                                                    <span className="min-w-[2rem] text-center font-semibold tabular-nums">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="px-3 py-1 font-bold hover:text-[var(--primary)]"
                                                        aria-label={t('cartPage.increase')}
                                                    >+</button>
                                                </div>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-sm text-muted-foreground hover:text-[var(--data-error)] underline-offset-2 hover:underline"
                                                >
                                                    {t('cartPage.remove')}
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>

                        <aside className="h-fit rounded-[2px] border border-border bg-card p-6 lg:sticky lg:top-24">
                            <h2 className="font-display text-xl font-bold mb-4">{t('cartPage.summary')}</h2>
                            <dl className="space-y-2 text-sm font-mono">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Suma be PVM:</dt>
                                    <dd className="font-semibold tabular-nums">{formatEur(subtotalNet)}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">PVM ({DEFAULT_VAT_RATE}%):</dt>
                                    <dd className="font-semibold tabular-nums">{formatEur(vatAmount)}</dd>
                                </div>
                                <div className="flex justify-between border-t border-border pt-2 text-base">
                                    <dt className="font-bold text-foreground">{t('cartPage.subtotal')} ({t('vat.suPvm')})</dt>
                                    <dd className="font-bold text-foreground tabular-nums">{formatEur(subtotalGross)}</dd>
                                </div>
                                <div className="flex justify-between pt-1">
                                    <dt className="text-muted-foreground">{t('cartPage.shipping')}</dt>
                                    <dd className="font-semibold text-right">Pagal pasirinktą pristatymo būdą</dd>
                                </div>
                            </dl>
                            <p className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground leading-relaxed">
                                B2B ir B2C užsakymai: išrašome PVM sąskaitą faktūrą įmonėms ir privatiems pirkėjams. Pristatymas visoje Lietuvoje.
                            </p>
                            <Link
                                href="/atsiskaitymas"
                                className="mt-6 block rounded-[2px] bg-[var(--accent)] px-6 py-4 text-center text-base font-bold text-white transition-colors duration-150 hover:bg-[var(--accent-hover)]"
                            >
                                {t('cartPage.buy')}
                            </Link>
                            <Link href="/products" className="mt-3 block text-center text-sm text-muted-foreground hover:text-foreground">
                                {t('cartPage.continue')}
                            </Link>
                            <p className="mt-4 text-center text-xs text-muted-foreground">{t('orderReceived.secure')}</p>
                        </aside>
                    </div>
                )}
            </div>
        </main>
    );
}
