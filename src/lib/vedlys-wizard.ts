// W124-A1 (F2/F3.1/F3.3/F0.5): vedlio bendros šalys klientui ir serveriui –
// formatavimas, PVM eilutės, ?kit= kodų žemėlapis. Be React ir be fs.
import type { Rules } from './vedlys-calc';

const fmt = new Intl.NumberFormat('lt-LT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
});

/** „3 025 €“ (sveika suma be centų), „1 294,70 €“ (su centais tik kai reikia). */
export function fmtEurKit(value: number): string {
    const rounded = Math.round(value * 100) / 100;
    const hasCents = Math.round(rounded) !== rounded;
    return `${new Intl.NumberFormat('lt-LT', {
        minimumFractionDigits: hasCents ? 2 : 0,
        maximumFractionDigits: 2,
    }).format(rounded)} €`;
}

/**
 * F3.3: B2B „Be PVM“ suma skaičiuojama pagal eilutes, ne iš suapvalintos sumos.
 * Krepšelis laiko gross kainas, tad neto = Σ round(price / 1.21, 2) pagal eilutę.
 */
export function netFromGrossLines(lines: Array<{ price: number; quantity?: number }>): number {
    const net = lines.reduce(
        (sum, l) => sum + Math.round((l.price / 1.21) * 100) / 100 * (l.quantity ?? 1),
        0,
    );
    return Math.round(net * 100) / 100;
}

export interface KitWizardConfig {
    boilerSlug: string;
    burnerSku: string;
    bunkerL: number;
}

/** F0.5/F1.2: inžinerijos komplekto kodas → vedlio pradinė konfigūracija. */
const KIT_TO_CONFIG: Record<string, KitWizardConfig> = {
    'GILES-LINK-LYDERIU-35': { boilerSlug: 'viadrus', burnerSku: 'MPB-NANI-35', bunkerL: 500 },
    'GILES-NORD-KOMFORTUI-20': { boilerSlug: 'atmos', burnerSku: 'PELLTECH-PV20A', bunkerL: 500 },
    'GILES-VIDUTINIAMS-50': { boilerSlug: 'viadrus', burnerSku: 'MPB-NANI-50', bunkerL: 500 },
};

export function kitCodeToWizardConfig(code: string | null | undefined): KitWizardConfig | null {
    if (!code) return null;
    return KIT_TO_CONFIG[code.toUpperCase()] ?? null;
}

/** F0.5: katilo alias/slug → default boiler slug, kai ?kit= nurodo tik degiklį. */
export function boilerSlugForBurner(rules: Rules, burnerSku: string): string | null {
    const boiler = rules.boilers.find((b) => b.burners.includes(burnerSku) && b.online_checkout !== false);
    return boiler?.slug ?? null;
}

/** F2.3: ar degiklio SKU turi katalogo kainą (galima pirkti internetu). */
export function burnerBuyable(rules: Rules, prices: Record<string, number>, sku: string): boolean {
    return rules.burners.some((b) => b.sku === sku) && prices[sku] != null;
}
