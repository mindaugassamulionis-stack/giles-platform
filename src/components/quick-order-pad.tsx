'use client';

import { useState } from 'react';
import { ClipboardList, Check, Loader2 } from 'lucide-react';
import { useCartStore } from '../store/cart';
import type { AppLocale } from '../i18n/routing';
import type { QuickOrderCartItem } from '../lib/quick-order-pad';

interface QuickOrderRowView {
    sku: string;
    qty: number;
    status: 'found' | 'not_found' | 'price_on_request' | 'invalid_qty';
    product: {
        id: string;
        slug: string | null;
        name: string;
        price: number;
        imageUrl: string | undefined;
        brandName: string | null;
        availability: string | null;
    } | null;
}

interface QuickOrderPadCopy {
    ctaLabel: string;
    ctaAria: string;
    panelTitle: string;
    helpText: string;
    textareaAria: string;
    textareaPlaceholder: string;
    checkButton: string;
    checking: string;
    addToCartButton: (count: number) => string;
    addedToast: string;
    errorText: string;
    truncatedNote: string;
    foundLabel: string;
    notFoundLabel: string;
    invalidQtyLabel: string;
    priceOnRequestLabel: string;
    summaryFound: (count: number) => string;
    summaryMissing: (count: number) => string;
    qtyLabel: string;
}

const COPY: Record<AppLocale, QuickOrderPadCopy> = {
    lt: {
        ctaLabel: 'Greitasis užsakymas',
        ctaAria: 'Atverti greitąjį užsakymą (įklijuokite prekių sąrašą)',
        panelTitle: 'Greitasis užsakymas',
        helpText: 'Įklijuokite sąrašą iš Excel: kiekvienoje eilutėje kodas ir kiekis (pvz. „MPB-NANI-35  2“). Iki 200 eilučių.',
        textareaAria: 'Greitojo užsakymo eilutės',
        textareaPlaceholder: 'MPB-NANI-35\t2\nHERZ-1-7723\t10',
        checkButton: 'Tikrinti eilutes',
        checking: 'Tikrinama…',
        addToCartButton: (n) => `Įdėti viską į krepšelį (${n})`,
        addedToast: 'Prekės įdėtos į krepšelį',
        errorText: 'Nepavyko patikrinti eilučių. Bandykite dar kartą.',
        truncatedNote: 'Sąrašas per ilgas: tikrintos pirmosios 200 eilučių.',
        foundLabel: 'rasta',
        notFoundLabel: 'nerasta',
        invalidQtyLabel: 'blogas kiekis',
        priceOnRequestLabel: 'kaina pagal užklausą',
        summaryFound: (n) => `${n} prekės rastos`,
        summaryMissing: (n) => `${n} eilutės nerasta`,
        qtyLabel: 'vnt',
    },
    en: {
        ctaLabel: 'Quick order',
        ctaAria: 'Open quick order (paste a product list)',
        panelTitle: 'Quick order',
        helpText: 'Paste a list from Excel: one SKU and quantity per line (e.g. "MPB-NANI-35  2"). Up to 200 lines.',
        textareaAria: 'Quick order lines',
        textareaPlaceholder: 'MPB-NANI-35\t2\nHERZ-1-7723\t10',
        checkButton: 'Check lines',
        checking: 'Checking…',
        addToCartButton: (n) => `Add all to cart (${n})`,
        addedToast: 'Items added to cart',
        errorText: 'Could not check the lines. Please try again.',
        truncatedNote: 'List too long: only the first 200 lines were checked.',
        foundLabel: 'found',
        notFoundLabel: 'not found',
        invalidQtyLabel: 'bad quantity',
        priceOnRequestLabel: 'price on request',
        summaryFound: (n) => `${n} items found`,
        summaryMissing: (n) => `${n} lines not found`,
        qtyLabel: 'pcs',
    },
    pl: {
        ctaLabel: 'Szybkie zamówienie',
        ctaAria: 'Otwórz szybkie zamówienie (wklej listę produktów)',
        panelTitle: 'Szybkie zamówienie',
        helpText: 'Wklej listę z programu Excel: w każdym wierszu kod i ilość (np. „MPB-NANI-35  2”). Do 200 wierszy.',
        textareaAria: 'Wiersze szybkiego zamówienia',
        textareaPlaceholder: 'MPB-NANI-35\t2\nHERZ-1-7723\t10',
        checkButton: 'Sprawdź wiersze',
        checking: 'Sprawdzanie…',
        addToCartButton: (n) => `Dodaj wszystko do koszyka (${n})`,
        addedToast: 'Produkty dodane do koszyka',
        errorText: 'Nie udało się sprawdzić wierszy. Spróbuj ponownie.',
        truncatedNote: 'Lista zbyt długa: sprawdzono tylko pierwsze 200 wierszy.',
        foundLabel: 'znaleziono',
        notFoundLabel: 'nie znaleziono',
        invalidQtyLabel: 'zła ilość',
        priceOnRequestLabel: 'cena na zapytanie',
        summaryFound: (n) => `znaleziono ${n} produktów`,
        summaryMissing: (n) => `${n} wierszy nie znaleziono`,
        qtyLabel: 'szt',
    },
    ru: {
        ctaLabel: 'Быстрый заказ',
        ctaAria: 'Открыть быстрый заказ (вставьте список товаров)',
        panelTitle: 'Быстрый заказ',
        helpText: 'Вставьте список из Excel: в каждой строке код и количество (напр. «MPB-NANI-35  2»). До 200 строк.',
        textareaAria: 'Строки быстрого заказа',
        textareaPlaceholder: 'MPB-NANI-35\t2\nHERZ-1-7723\t10',
        checkButton: 'Проверить строки',
        checking: 'Проверка…',
        addToCartButton: (n) => `Добавить всё в корзину (${n})`,
        addedToast: 'Товары добавлены в корзину',
        errorText: 'Не удалось проверить строки. Попробуйте ещё раз.',
        truncatedNote: 'Список слишком длинный: проверены только первые 200 строк.',
        foundLabel: 'найдено',
        notFoundLabel: 'не найдено',
        invalidQtyLabel: 'неверное количество',
        priceOnRequestLabel: 'цена по запросу',
        summaryFound: (n) => `найдено товаров: ${n}`,
        summaryMissing: (n) => `строк не найдено: ${n}`,
        qtyLabel: 'шт',
    },
};

const STATUS_STYLE: Record<QuickOrderRowView['status'], string> = {
    found: 'text-[#157A3B]',
    not_found: 'text-[#C2410C]',
    price_on_request: 'text-[#5B6470]',
    invalid_qty: 'text-[#5B6470]',
};

/**
 * W123-A2 Grainger Copy&Paste quick order pad: one CTA in the catalog header
 * opens a collapsible panel above the product grid. Resolution happens in
 * /api/quick-order against the existing catalog search index; cart mutation
 * goes through the existing zustand cart store.
 */
export function QuickOrderPad({ locale }: { locale: AppLocale }) {
    const copy = COPY[locale];
    const [open, setOpen] = useState(false);
    const [text, setText] = useState('');
    const [rows, setRows] = useState<QuickOrderRowView[] | null>(null);
    const [cartItems, setCartItems] = useState<QuickOrderCartItem[]>([]);
    const [truncated, setTruncated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [added, setAdded] = useState(false);
    const addItem = useCartStore((s) => s.addItem);
    const openCart = useCartStore((s) => s.openCart);

    const foundCount = rows?.filter((r) => r.status === 'found').length ?? 0;
    const missingCount = rows ? rows.length - foundCount : 0;

    const checkLines = async () => {
        setLoading(true);
        setError(false);
        setAdded(false);
        try {
            const res = await fetch('/api/quick-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = (await res.json()) as {
                rows: QuickOrderRowView[];
                cartItems: QuickOrderCartItem[];
                truncated: boolean;
            };
            setRows(data.rows);
            setCartItems(data.cartItems);
            setTruncated(Boolean(data.truncated));
        } catch {
            setError(true);
            setRows(null);
            setCartItems([]);
        } finally {
            setLoading(false);
        }
    };

    const addAllToCart = () => {
        for (const item of cartItems) {
            addItem(item);
        }
        setAdded(true);
        openCart();
    };

    const statusLabel = (status: QuickOrderRowView['status']) => {
        switch (status) {
            case 'found':
                return copy.foundLabel;
            case 'not_found':
                return copy.notFoundLabel;
            case 'price_on_request':
                return copy.priceOnRequestLabel;
            default:
                return copy.invalidQtyLabel;
        }
    };

    return (
        <div data-testid="quick-order-pad" className="border-b border-[#E2DDD3] bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center justify-between gap-3 py-2">
                <p className="text-xs text-[#5B6470] min-w-0 truncate">
                    {copy.helpText}
                </p>
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                    aria-controls="quick-order-pad-panel"
                    className="inline-flex h-11 min-w-[44px] items-center gap-1.5 rounded-none border border-[#11161B] bg-white px-3 text-xs font-bold text-[#11161B] hover:bg-[#11161B] hover:text-white transition-colors shrink-0"
                >
                    <ClipboardList className="w-3.5 h-3.5" aria-hidden="true" />
                    {copy.ctaLabel}
                </button>
            </div>

            {open && (
                <div
                    id="quick-order-pad-panel"
                    className="mx-auto max-w-7xl px-4 sm:px-6 pb-4 space-y-3"
                >
                    <label htmlFor="quick-order-input" className="sr-only">
                        {copy.textareaAria}
                    </label>
                    <textarea
                        id="quick-order-input"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={5}
                        spellCheck={false}
                        placeholder={copy.textareaPlaceholder}
                        className="w-full rounded-none border border-[#D5CFC3] bg-white p-3 font-mono text-sm text-[#11161B] placeholder:text-[#5B6470] focus:outline-none focus:border-[#11161B]"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={checkLines}
                            disabled={loading || !text.trim()}
                            className="inline-flex h-11 min-w-[44px] items-center gap-1.5 rounded-none bg-[#11161B] px-4 text-xs font-bold text-white hover:bg-[#C2410C] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                            ) : (
                                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                            )}
                            {loading ? copy.checking : copy.checkButton}
                        </button>

                        {rows && cartItems.length > 0 && (
                            <button
                                type="button"
                                onClick={addAllToCart}
                                data-testid="quick-order-add-all"
                                className="inline-flex h-11 min-w-[44px] items-center rounded-none bg-[#157A3B] px-4 text-xs font-bold text-white hover:bg-[#0F5E2E] transition-colors"
                            >
                                {copy.addToCartButton(cartItems.length)}
                            </button>
                        )}

                        {rows && (
                            <span className="text-xs font-semibold text-[#5B6470] tabular-nums">
                                {copy.summaryFound(foundCount)} · {copy.summaryMissing(missingCount)}
                            </span>
                        )}
                        {added && (
                            <span className="text-xs font-bold text-[#157A3B]">{copy.addedToast}</span>
                        )}
                    </div>

                    {error && (
                        <p role="alert" className="text-xs font-bold text-[#C2410C]">
                            {copy.errorText}
                        </p>
                    )}
                    {truncated && !error && (
                        <p className="text-xs font-semibold text-[#5B6470]">{copy.truncatedNote}</p>
                    )}

                    {rows && rows.length === 0 && !error && (
                        <p className="text-xs text-[#5B6470]">
                            {copy.helpText}
                        </p>
                    )}

                    {rows && rows.length > 0 && (
                        <ul className="border border-[#E2DDD3] divide-y divide-[#E2DDD3] max-h-72 overflow-y-auto">
                            {rows.map((row) => (
                                <li
                                    key={`${row.sku}-${row.qty}`}
                                    className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-3 py-2 text-sm"
                                >
                                    <span className="font-mono text-xs font-bold text-[#11161B] break-all">
                                        {row.sku}
                                    </span>
                                    <span className="text-xs text-[#5B6470] tabular-nums">
                                        {row.qty} {copy.qtyLabel}
                                    </span>
                                    <span
                                        className={`ml-auto text-xs font-extrabold ${STATUS_STYLE[row.status]}`}
                                    >
                                        {statusLabel(row.status)}
                                    </span>
                                    {row.product && (
                                        <span className="basis-full text-xs text-[#5B6470] truncate">
                                            {row.product.name}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
