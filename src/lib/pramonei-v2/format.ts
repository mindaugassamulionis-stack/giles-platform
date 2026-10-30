import type { AppLocale } from '../../i18n/routing';
import { isEstimate, isPublishable, type IndustrialModel } from './types';

// Deterministic number and price formatting without Intl/toLocaleString to prevent React #418 hydration mismatches.

const NBSP = '\u00A0';

export function formatInt(n: number): string {
    const r = Math.round(n);
    const sign = r < 0 ? '−' : '';
    return sign + Math.abs(r).toString().replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

export function formatEur(n: number): string {
    return formatInt(n) + NBSP + '€';
}

export function formatDecimal(n: number, digits = 1): string {
    return n.toFixed(digits).replace('.', ',');
}

export function withVat(net: number, vatRate = 0.21): number {
    return Math.round(net * (1 + vatRate));
}

export function priceLabel(
    net: number,
    opts: { gross: boolean; estimate: boolean; vatRate?: number },
): string {
    const v = opts.gross ? withVat(net, opts.vatRate) : net;
    return (opts.estimate ? '≈' + NBSP : '') + formatEur(v);
}

export function formatModelPower(m: IndustrialModel, locale: AppLocale): string {
    const p = m.power_kw.value;
    if (!p) return '–';
    const mwUnit = locale === 'ru' ? 'МВт' : 'MW';
    const kwUnit = locale === 'ru' ? 'кВт' : 'kW';
    if (p.range) return p.range;
    if (p.nominal >= 1000) {
        const mw = formatDecimal(p.nominal / 1000, 1);
        return `${mw}\u00A0${mwUnit}`;
    }
    return `${formatInt(p.nominal)}\u00A0${kwUnit}`;
}

export function formatModelArea(m: IndustrialModel, locale: AppLocale): string {
    if (!isPublishable(m.heated_area_m2, { SHOW_ASSUMPTIONS: true })) {
        if (m.slug === 'bio-dujos-800') {
            return locale === 'en'
                ? 'Process heat'
                : locale === 'pl'
                  ? 'Ciepło technologiczne'
                  : locale === 'ru'
                    ? 'Технологическое тепло'
                    : 'Technologinė šiluma';
        }
        return '–';
    }
    const a = m.heated_area_m2.value;
    if (!a.min && a.max) {
        const prefix =
            locale === 'en' ? 'up to ' : locale === 'pl' ? 'do ' : locale === 'ru' ? 'до ' : 'iki ';
        return `${prefix}${formatInt(a.max)}\u00A0m²`;
    }
    if (a.min && a.max) {
        return `${formatInt(a.min)}–${formatInt(a.max)}\u00A0m²`;
    }
    return '–';
}

export function formatModelFuel(
    m: IndustrialModel,
    locale: AppLocale,
    showAssumptions: boolean,
): { main: string; autonomy: string } {
    const f = m.fuel_storage.value;
    const main = f
        ? f.volume_m3
            ? `${f.volume_m3}\u00A0m³ · ${f.type}`
            : f.type
        : locale === 'en'
          ? 'Pellets'
          : locale === 'pl'
            ? 'Pellet'
            : locale === 'ru'
              ? 'Пеллеты'
              : 'Granulės';

    let autonomy = '';
    if (m.autonomy_pellets?.value) {
        const days = formatDecimal(m.autonomy_pellets.value.full_load_days, 1);
        const prefix = showAssumptions ? '≈\u00A0' : '';
        autonomy =
            locale === 'en'
                ? `${prefix}${days} d. on pellets`
                : locale === 'pl'
                  ? `${prefix}${days} d. na pellecie`
                  : locale === 'ru'
                    ? `${prefix}${days} сут. на пеллетах`
                    : `${prefix}${days} d. granulėmis`;
    }
    return { main, autonomy };
}

export function formatModelPriceCell(
    m: IndustrialModel,
    opts: {
        gross: boolean;
        showAssumptions: boolean;
        locale: AppLocale;
        priceOnRequest: string;
        vatRate?: number;
    },
): { main: string; sub: string } {
    const env = { SHOW_ASSUMPTIONS: opts.showAssumptions };
    const vatRate = opts.vatRate ?? 0.21;
    const fromWord =
        opts.locale === 'en'
            ? 'from '
            : opts.locale === 'pl'
              ? 'od '
              : opts.locale === 'ru'
                ? 'от '
                : 'nuo ';
    const moUnit =
        opts.locale === 'en'
            ? '/mo'
            : opts.locale === 'pl'
              ? '/mies.'
              : opts.locale === 'ru'
                ? '/мес.'
                : '/mėn.';
    const vatWord = opts.gross
        ? opts.locale === 'en'
            ? 'incl. VAT'
            : opts.locale === 'pl'
              ? 'z VAT'
              : opts.locale === 'ru'
                ? 'с НДС'
                : 'su PVM'
        : opts.locale === 'en'
          ? 'excl. VAT'
          : opts.locale === 'pl'
            ? 'bez VAT'
            : opts.locale === 'ru'
              ? 'без НДС'
              : 'be PVM';

    if (isPublishable(m.price_net_eur, env)) {
        const main =
            fromWord +
            priceLabel(m.price_net_eur.value, {
                gross: opts.gross,
                estimate: isEstimate(m.price_net_eur),
                vatRate,
            });
        if (isPublishable(m.rent_net_eur_month, env)) {
            const rentStr = priceLabel(m.rent_net_eur_month.value, {
                gross: opts.gross,
                estimate: isEstimate(m.rent_net_eur_month),
                vatRate,
            });
            const rentPrefix =
                opts.locale === 'en'
                    ? 'or rent from '
                    : opts.locale === 'pl'
                      ? 'lub wynajem od '
                      : opts.locale === 'ru'
                        ? 'или аренда от '
                        : 'arba nuoma nuo ';
            return { main, sub: `${rentPrefix}${rentStr}${moUnit}` };
        }
        return { main, sub: vatWord };
    }

    if (isPublishable(m.rent_net_eur_month, env)) {
        const rentStr = priceLabel(m.rent_net_eur_month.value, {
            gross: opts.gross,
            estimate: isEstimate(m.rent_net_eur_month),
            vatRate,
        });
        const saleNote =
            opts.locale === 'en'
                ? `${vatWord} · sale on request`
                : opts.locale === 'pl'
                  ? `${vatWord} · sprzedaż na zapytanie`
                  : opts.locale === 'ru'
                    ? `${vatWord} · продажа по запросу`
                    : `${vatWord} · pardavimas pagal užklausą`;
        return { main: `${fromWord}${rentStr}${moUnit}`, sub: saleNote };
    }

    return { main: opts.priceOnRequest, sub: '' };
}
