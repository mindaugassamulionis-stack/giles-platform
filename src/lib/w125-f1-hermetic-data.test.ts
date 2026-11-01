import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// W125-F1: API maršrutai, kuriuos testai kviečia tiesiogiai, turi rašyti tik į
// vitest laikinąjį kelią – gyvi src/data failai lieka nepaliesti (git status švarus).
const LIVE_DATA = path.resolve(__dirname, '../data');

function snapshot(file: string): string | null {
    const p = path.join(LIVE_DATA, file);
    return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

describe('W125-F1: hermetiški duomenų keliai (service-request, support-tickets)', () => {
    it('POST /api/service-request nekeičia gyvo src/data/service-requests.json', async () => {
        const before = snapshot('service-requests.json');
        const mod = await import('../app/api/service-request/route');
        const res = await mod.POST(
            new Request('http://localhost/api/service-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    urgency: 'plan',
                    type: 'conversion',
                    name: '',
                    phone: '+370 600 00000',
                    source_page: 'vedlys',
                }),
            }),
        );
        expect(res.status).toBe(200);
        expect(snapshot('service-requests.json')).toBe(before);
    });

    it('POST /api/admin/support nekeičia gyvo src/data/support-tickets.json', async () => {
        const before = snapshot('support-tickets.json');
        const mod = await import('../app/api/admin/support/route');
        const res = await mod.POST(
            new Request('http://localhost/api/admin/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: 'RMA / W125-F1 hermetiškumo patikra',
                    ticketType: 'Garantinis gedimas',
                    serialNumber: 'W125-F1',
                    clientName: 'Hermetiškumo testas',
                    clientPhone: '+370 600 00000',
                }),
            }),
        );
        expect(res.status).toBe(200);
        expect(snapshot('support-tickets.json')).toBe(before);
    });
});
