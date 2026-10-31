export interface ServiceRequest {
    urgency: 'urgent' | 'high' | 'plan';
    type: 'post' | 'warranty' | 'start' | 'part';
    model?: string;
    error_code?: string;
    name: string;
    phone: string;
    city?: string;
    description?: string;
    part?: string;
    photo?: File | null;
    website?: string;
    source_page: 'inzinerija' | string;
}

export type FieldErrors = Partial<Record<keyof ServiceRequest, string>>;

const PHONE = /^\+?[0-9 ()-]{8,20}$/;
const MAX_PHOTO = 10 * 1024 * 1024;

export function validateServiceRequest(
    r: ServiceRequest,
    msg = {
        required: 'Užpildykite šį lauką',
        phone: 'Įveskite telefono numerį, pvz., +370 600 00000',
        file: 'Nuotrauka iki 10 MB (JPG, PNG, HEIC)',
    },
): FieldErrors {
    const e: FieldErrors = {};
    if (!r.name?.trim() || r.name.trim().length < 2) e.name = msg.required;
    if (!r.phone?.trim()) e.phone = msg.required;
    else if (!PHONE.test(r.phone.trim())) e.phone = msg.phone;
    if (r.photo) {
        const okType = /^image\//.test(r.photo.type) || /\.heic$/i.test(r.photo.name);
        if (!okType || r.photo.size > MAX_PHOTO) e.photo = msg.file;
    }
    return e;
}

/** Ar dabar darbo laikas (I–V 8:30–17:30, Europe/Vilnius). */
export function isWorkingHours(now: Date = new Date()): boolean {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Vilnius',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).formatToParts(now);
    const wd = parts.find((p) => p.type === 'weekday')?.value ?? '';
    const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
    const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
    if (wd === 'Sat' || wd === 'Sun') return false;
    const mins = h * 60 + m;
    return mins >= 8 * 60 + 30 && mins < 17 * 60 + 30;
}
