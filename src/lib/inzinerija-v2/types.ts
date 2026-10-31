export type Vat = 'incl' | 'excl' | null;

export interface Service {
    id: string;
    n: string;
    eyebrow: string;
    title: string;
    text: string;
    points: string[];
    term: string;
    price: {
        label: string;
        value_eur?: number | null;
        vat?: Vat;
        source: string;
        note?: string;
    };
    cta: { label: string; href: string };
    image: string | null;
    image_alt: string;
    notes?: string[];
}

export type ProjectCategory = 'perd' | 'ind' | 'hp' | 'svc';

export interface Project {
    id: string;
    category: ProjectCategory;
    category_label: string;
    power: string;
    subject: string;
    title: string;
    equipment: string;
    result: string;
    image: string | null;
    model_slug: string | null;
    cta_href: string;
    client: string | null;
    city: string | null;
    year: number | null;
}

export interface Kit {
    code: string;
    legacy_name: string;
    title: string;
    range_kw: string;
    brand: string;
    items: string[];
    price_eur_incl_vat: number;
}

export interface BoilerCompat {
    slug: string;
    brand: string;
    range_kw: string;
    type: string;
    door: string;
    burner: string;
    vedlys: string;
}

export interface Urgency {
    id: 'urgent' | 'high' | 'plan';
    label: string;
    sub: string;
    sla_hours: [number, number] | null;
    source: string;
    default?: boolean;
}
