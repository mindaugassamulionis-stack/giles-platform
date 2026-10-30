import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { createAutonomousSkaitaInvoice } from '../../../../lib/skaita-accounting';

export type SupportTicketStatus =
    | 'Naujas'
    | 'Diagnozuota (Vytautas AI)'
    | 'Meistras išvyko'
    | 'Detalė rezervuota'
    | 'Išspręsta / Uždaryta';

export type SupportTechnician =
    | 'Darius (+370 611 19158)'
    | 'Vidas (+370 656 77679)'
    | 'Brigada #1 Kaunas'
    | 'Brigada #2 Vilnius';

export interface SupportTicketRecord {
    id: string;
    ticketNumber: string;
    title: string;
    ticketType: string;
    priority: string;
    status: SupportTicketStatus;
    serialNumber: string;
    clientName: string;
    clientPhone: string;
    assignedTechnician: string;
    vytautasDiagnosis: string;
    sparePartSku: string;
    sparePartTitle: string;
    sparePartStockKaunas: number;
    sparePartNetEur: number;
    reservedPartFlag: boolean;
    serviceInvoiceNumber: string | null;
}

export interface WarrantyPassportRecord {
    id: string;
    serialNumber: string;
    equipmentTitle: string;
    category: string;
    clientName: string;
    clientPhone: string;
    warrantyStatus: string;
    reminderSentAt: string | null;
}

export interface RmaQueueRecord {
    id: string;
    rmaNumber: string;
    ticketNumber: string;
    returnedSku: string;
    returnedTitle: string;
    replacementSku: string;
    replacementTitle: string;
    partnerName: string;
    reason: string;
    stage: string;
    creditNoteNumber: string;
}

interface SupportDatabaseShape {
    tickets: SupportTicketRecord[];
    warrantyPassports: WarrantyPassportRecord[];
    rmaRequests: RmaQueueRecord[];
    warrantyRegistry: WarrantyPassportRecord[];
    rmaQueue: RmaQueueRecord[];
}

const SUPPORT_DB_PATH = path.join(process.cwd(), 'src', 'data', 'support-tickets.json');

let memorySupportDb: SupportDatabaseShape | null = null;
let ticketSeq = 1;

function createEmptyDb(): SupportDatabaseShape {
    return {
        tickets: [],
        warrantyPassports: [],
        rmaRequests: [],
        warrantyRegistry: [],
        rmaQueue: [],
    };
}

function loadSupportDb(): SupportDatabaseShape {
    if (memorySupportDb) return memorySupportDb;
    try {
        if (fs.existsSync(SUPPORT_DB_PATH)) {
            const raw = fs.readFileSync(SUPPORT_DB_PATH, 'utf-8');
            const parsed = JSON.parse(raw) as Partial<SupportDatabaseShape>;
            const tickets = Array.isArray(parsed?.tickets) ? parsed.tickets : [];
            const passports = Array.isArray(parsed?.warrantyPassports)
                ? parsed.warrantyPassports
                : Array.isArray(parsed?.warrantyRegistry)
                  ? parsed.warrantyRegistry
                  : [];
            const rmas = Array.isArray(parsed?.rmaRequests)
                ? parsed.rmaRequests
                : Array.isArray(parsed?.rmaQueue)
                  ? parsed.rmaQueue
                  : [];
            memorySupportDb = {
                tickets,
                warrantyPassports: passports,
                rmaRequests: rmas,
                warrantyRegistry: passports,
                rmaQueue: rmas,
            };
            return memorySupportDb;
        }
    } catch {
        // fallback to clean memory db
    }
    memorySupportDb = createEmptyDb();
    return memorySupportDb;
}

function saveSupportDb(db: SupportDatabaseShape): void {
    db.warrantyRegistry = db.warrantyPassports;
    db.rmaQueue = db.rmaRequests;
    memorySupportDb = db;
    try {
        fs.mkdirSync(path.dirname(SUPPORT_DB_PATH), { recursive: true });
        fs.writeFileSync(SUPPORT_DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    } catch {
        // non-fatal in read-only test runners
    }
}

export async function GET() {
    const db = loadSupportDb();
    return NextResponse.json({
        ok: true,
        tickets: db.tickets,
        warrantyPassports: db.warrantyPassports,
        rmaRequests: db.rmaRequests,
        warrantyRegistry: db.warrantyPassports,
        rmaQueue: db.rmaRequests,
    });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const db = loadSupportDb();

        const nextNum = `TKT-${String(ticketSeq++).padStart(4, '0')}`;
        const sku = String(body.sparePartSku || 'MPB-IGN-300');
        const title = String(
            body.title || 'Katilo / granulių degiklio techninio aptarnavimo iškvietimas',
        );

        const vytautasDiagnosis = body.vytautasDiagnosis
            ? String(body.vytautasDiagnosis)
            : `Vytautas AI Pirminė Diagnostika: Pagal gedimo aprašymą („${title}“) rekomenduojama patikrinti mazgo jutiklį ir paruošti atsarginę dalį SKU: ${sku} iš Kauno sandėlio (Eigulių g. 21, LT-51418 Kaunas).`;

        const newTicket: SupportTicketRecord = {
            id: `tkt-${Date.now()}-${ticketSeq}`,
            ticketNumber: nextNum,
            title,
            ticketType: String(body.ticketType || 'Garantinis servisas'),
            priority: String(body.priority || 'SKUBUS (šildymas sustojęs)'),
            status: 'Diagnozuota (Vytautas AI)',
            serialNumber: String(body.serialNumber || 'MPB-SN-PATIKRA'),
            clientName: String(body.clientName || 'Serviso užklausa'),
            clientPhone: String(body.clientPhone || '+370 611 19158'),
            assignedTechnician: String(body.assignedTechnician || 'Darius (+370 611 19158)'),
            vytautasDiagnosis,
            sparePartSku: sku,
            sparePartTitle: String(
                body.sparePartTitle || `Atsarginė serviso detalė (${sku})`,
            ),
            sparePartStockKaunas: Number(body.sparePartStockKaunas || 9),
            sparePartNetEur: Number(body.sparePartNetEur || 42.0),
            reservedPartFlag: false,
            serviceInvoiceNumber: null,
        };

        db.tickets = [newTicket, ...db.tickets];
        saveSupportDb(db);

        return NextResponse.json({
            ok: true,
            ticket: newTicket,
            tickets: db.tickets,
            warrantyPassports: db.warrantyPassports,
            rmaRequests: db.rmaRequests,
            warrantyRegistry: db.warrantyPassports,
            rmaQueue: db.rmaRequests,
        });
    } catch {
        return NextResponse.json(
            { ok: false, error: 'Nepavyko sukurti serviso bilieto' },
            { status: 400 },
        );
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const db = loadSupportDb();

        if (body.action === 'reset_db') {
            ticketSeq = 1;
            const empty = createEmptyDb();
            saveSupportDb(empty);
            return NextResponse.json({
                ok: true,
                tickets: empty.tickets,
                warrantyPassports: empty.warrantyPassports,
                rmaRequests: empty.rmaRequests,
                warrantyRegistry: empty.warrantyPassports,
                rmaQueue: empty.rmaRequests,
            });
        }

        if (body.action === 'send_maintenance_reminder') {
            const sn = String(body.serialNumber || '');
            let updatedPassport: WarrantyPassportRecord | null = null;
            db.warrantyPassports = db.warrantyPassports.map((item) => {
                if (item.serialNumber === sn || item.id === body.id) {
                    updatedPassport = { ...item, reminderSentAt: 'Išsiųsta' };
                    return updatedPassport;
                }
                return item;
            });
            saveSupportDb(db);
            return NextResponse.json({
                ok: true,
                warrantyPassport: updatedPassport,
                warrantyPassports: db.warrantyPassports,
                warrantyRegistry: db.warrantyPassports,
            });
        }

        const targetTicketNumber = String(body.ticketNumber || '');
        const targetId = String(body.id || '');
        const idx = db.tickets.findIndex(
            (t) => t.ticketNumber === targetTicketNumber || t.id === targetId,
        );

        if (idx === -1) {
            return NextResponse.json(
                { ok: false, error: 'Serviso bilietas nerastas' },
                { status: 404 },
            );
        }

        const current = db.tickets[idx]!;
        let serviceInvoiceNumber = current.serviceInvoiceNumber;
        let reservedPartFlag = current.reservedPartFlag;
        let sparePartStockKaunas = current.sparePartStockKaunas;

        if (body.action === 'reserve_part') {
            reservedPartFlag = true;
            if (!current.reservedPartFlag && sparePartStockKaunas > 0) {
                sparePartStockKaunas -= 1;
            }
            if (!serviceInvoiceNumber) {
                const createdInv = createAutonomousSkaitaInvoice({
                    docType: 'PVM_SASKAITA_FAKTURA',
                    buyerName: current.clientName,
                    buyerCompanyCode: '302620907',
                    buyerVatCode: 'LT100006119810',
                    buyerAddress: 'Eigulių g. 21, LT-51418 Kaunas (Serviso iškvietimas)',
                    buyerEmail: 'info@gilesinzinerija.lt',
                    warehouse: 'KAUNAS_SERVISAS',
                    lines: [
                        {
                            sku: current.sparePartSku,
                            ean: '4770001000351',
                            title: `${current.sparePartTitle} (Serviso bilietas ${current.ticketNumber})`,
                            unit: 'vnt.',
                            qty: 1,
                            unitNetEur: current.sparePartNetEur,
                            costNetEur: Math.round(current.sparePartNetEur * 0.62 * 100) / 100,
                        },
                    ],
                });
                serviceInvoiceNumber = createdInv.invoiceNumber;
            }
        }

        const updated: SupportTicketRecord = {
            ...current,
            status: (body.status as SupportTicketStatus) || current.status,
            assignedTechnician: body.assignedTechnician
                ? String(body.assignedTechnician)
                : current.assignedTechnician,
            reservedPartFlag,
            sparePartStockKaunas,
            serviceInvoiceNumber,
        };

        db.tickets[idx] = updated;
        saveSupportDb(db);

        return NextResponse.json({
            ok: true,
            ticket: updated,
            tickets: db.tickets,
            warrantyPassports: db.warrantyPassports,
            rmaRequests: db.rmaRequests,
            warrantyRegistry: db.warrantyPassports,
            rmaQueue: db.rmaRequests,
        });
    } catch {
        return NextResponse.json(
            { ok: false, error: 'Nepavyko atnaujinti serviso bilieto' },
            { status: 400 },
        );
    }
}
