export type Source =
    | 'site:series-table'
    | 'site:passport'
    | 'site:passport#11'
    | 'site:projects'
    | 'computed'
    | 'assumption'
    | 'owner-input'
    | 'n/a';

export interface Sourced<T> {
    value: T | null;
    source: Source;
    note?: string;
}

export type Segment = 'buy' | 'rent' | 'special';

export interface PowerInfo {
    nominal: number;
    modulation?: string;
    cascade?: string;
    range?: string;
}

export interface BoilerDrawingSpec {
    rev: string;
    modules: { id: 'M1' | 'M2' | 'M3'; lengthMm: number; widthMm: number; heightMm: number }[];
    layout: 'single' | 'side-by-side';
    zones: {
        tag: string;
        kind:
            | 'fuel'
            | 'auger'
            | 'firewall'
            | 'boiler'
            | 'cyclone'
            | 'filter'
            | 'fan'
            | 'chimney'
            | 'hydraulics'
            | 'control';
        x0Mm: number;
        x1Mm: number;
        y0Mm: number;
        y1Mm: number;
        hidden?: boolean;
    }[];
    sectionYmm: number;
    chimneyHeightM: number | null;
    hydraulics: {
        dn: number;
        pn: number;
        supplyC: number;
        returnC: number;
        minReturnC: number;
        pumps: 1 | 2;
        safetyValveBar: number | null;
    };
    positions: {
        tag: string;
        name: string;
        spec: string;
        views: ('plan' | 'section' | 'pid')[];
    }[];
    techSpecs?: { k: string; v: string }[];
}

export interface IndustrialModel {
    slug: string;
    code: string;
    segment: Segment;
    kind: string;
    power_kw: Sourced<PowerInfo>;
    efficiency_pct?: Sourced<number>;
    heated_area_m2: Sourced<{ min: number | null; max: number | null }>;
    fuel_storage: Sourced<{ volume_m3: number | null; type: string; note?: string }>;
    dimensions: Sourced<{ label: string; mass_t: number | string | null }>;
    connection?: Sourced<string>;
    price_net_eur: Sourced<number>;
    rent_net_eur_month: Sourced<number>;
    aux_power_kw: Sourced<number>;
    fuel_kg_h_full?: Sourced<number>;
    fuel_kg_h_full_chips?: Sourced<number>;
    autonomy_pellets: Sourced<{ full_load_days: number; half_load_days: number }>;
    autonomy_chips?: Sourced<{ full_load_days: number; half_load_days: number }>;
    ash?: Sourced<string>;
    flue_cleaning?: Sourced<string>;
    use_cases: string[];
    image: string | null;
    notes?: string[];
    drawing?: BoilerDrawingSpec;
}

export interface ModelsFile {
    vat_rate: number;
    constants: {
        pellet_bulk_density_kg_m3: number;
        chip_bulk_density_kg_m3: number;
        full_load_hours: number;
        area_w_per_m2: [number, number];
    };
    models: IndustrialModel[];
}

export interface FuelPrice {
    id: string;
    label: string;
    eur_per_mwh_heat: { min: number; max: number };
    default?: boolean;
}

export interface RoiConfig {
    version: string;
    sources: string;
    current_fuels: FuelPrice[];
    bio_fuels: FuelPrice[];
    full_load_hours: number;
    sizing_reserve: number;
    opex: { service_pct_of_capex: number; electricity_eur_per_kwh: number; source: string };
    load_presets_mwh: number[];
    price_point: 'midpoint';
}

export interface PublishEnv {
    SHOW_ASSUMPTIONS: boolean;
}

export function isPublishable<T>(
    v: Sourced<T> | undefined,
    env: PublishEnv,
): v is Sourced<T> & { value: T } {
    if (!v || v.value === null || v.value === undefined) return false;
    if (v.source === 'owner-input' || v.source === 'n/a') return false;
    if (v.source === 'assumption' && !env.SHOW_ASSUMPTIONS) return false;
    return true;
}

export const isEstimate = (v: Sourced<unknown> | undefined): boolean => v?.source === 'assumption';
