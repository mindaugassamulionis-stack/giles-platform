import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { validateServiceRequest, isWorkingHours } from '../../../lib/inzinerija-v2/service-request';

// Kliento serviso užklausos taškas. Vidinė integracija su dispečerine
// (src/data/support-tickets.json per /api/admin/support) atliekama serveryje;
// kliento sąsajoje šis kelias niekada nerodomas.
const REQUESTS_PATH = path.join(process.cwd(), 'src', 'data', 'service-requests.json');

interface StoredRequest {
    id: string;
    urgency: string;
    type: string;
    model?: string;
    error_code?: string;
    name: string;
    phone: string;
    city?: string;
    description?: string;
    part?: string;
    photoName?: string;
    photoSize?: number;
    source_page: string;
    workingHours: boolean;
    createdAt: string;
}

function loadRequests(): StoredRequest[] {
    try {
        if (fs.existsSync(REQUESTS_PATH)) {
            const parsed = JSON.parse(fs.readFileSync(REQUESTS_PATH, 'utf-8')) as { requests?: StoredRequest[] };
            return Array.isArray(parsed.requests) ? parsed.requests : [];
        }
    } catch {
        // naujas failas, kai disko būsena nepriklauso nuo atsakymo
    }
    return [];
}

function saveRequests(requests: StoredRequest[]): void {
    try {
        fs.mkdirSync(path.dirname(REQUESTS_PATH), { recursive: true });
        fs.writeFileSync(REQUESTS_PATH, JSON.stringify({ requests }, null, 2), 'utf-8');
    } catch {
        // ne lemtinga read-only aplinkoje
    }
}

export async function POST(request: Request) {
    let body: Record<string, unknown>;
    try {
        body = (await request.json()) as Record<string, unknown>;
    } catch {
        return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
    }

    // Honeypot: botai užpildo paslėptą lauką; atsakome taip pat, kad spąstai neatskleidžiami.
    if (typeof body.website === 'string' && body.website.trim().length > 0) {
        return NextResponse.json({ ok: true, id: 'S-0000' }, { status: 200 });
    }

    const payload = {
        urgency: (body.urgency as 'urgent' | 'high' | 'plan') ?? 'high',
        type: (body.type as 'post' | 'warranty' | 'start' | 'part') ?? 'post',
        model: typeof body.model === 'string' ? body.model : undefined,
        error_code: typeof body.error_code === 'string' ? body.error_code : undefined,
        name: typeof body.name === 'string' ? body.name : '',
        phone: typeof body.phone === 'string' ? body.phone : '',
        city: typeof body.city === 'string' ? body.city : undefined,
        description: typeof body.description === 'string' ? body.description : undefined,
        part: typeof body.part === 'string' ? body.part : undefined,
        photoName: typeof body.photoName === 'string' ? body.photoName : undefined,
        photoSize: typeof body.photoSize === 'number' ? body.photoSize : undefined,
        source_page: typeof body.source_page === 'string' ? body.source_page : 'inzinerija',
    };

    const errors = validateServiceRequest({
        urgency: payload.urgency,
        type: payload.type,
        model: payload.model,
        error_code: payload.error_code,
        name: payload.name,
        phone: payload.phone,
        city: payload.city,
        description: payload.description,
        part: payload.part,
        source_page: payload.source_page,
    });
    if (Object.keys(errors).length > 0) {
        return NextResponse.json({ ok: false, error: 'validation_failed', fields: errors }, { status: 400 });
    }

    const requests = loadRequests();
    const id = `S-${String(1001 + requests.length)}`;
    const stored: StoredRequest = { id, ...payload, workingHours: isWorkingHours(), createdAt: new Date().toISOString() };
    requests.push(stored);
    saveRequests(requests);

    console.log(JSON.stringify({
        event: 'service_request_received',
        id,
        urgency: stored.urgency,
        type: stored.type,
        source_page: stored.source_page,
        workingHours: stored.workingHours,
        at: stored.createdAt,
    }));

    // Vidinis perdavimas į dispečerinę (ne klientui matomas). Klaida neblokuoja atsakymo.
    try {
        await fetch(new URL('/api/admin/support', request.url), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: `Serviso užklausa ${id}: ${stored.name}, ${stored.model || 'modelis nenurodytas'}`,
                ticketType: stored.urgency === 'urgent' ? 'SKUBUS (šildymas sustojęs)' : 'Garantinis servisas',
                priority: stored.urgency === 'urgent' ? 'SKUBUS (šildymas sustojęs)' : 'PLANINIS',
                clientName: stored.name,
                clientPhone: stored.phone,
                serialNumber: stored.error_code || stored.model || 'MPB-SN-PATIKRA',
            }),
        });
    } catch {
        // dispečerinė nepasiekiama vietinėje testų aplinkoje
    }

    return NextResponse.json({ ok: true, id }, { status: 200 });
}
