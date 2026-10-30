import fs from 'node:fs';
import path from 'node:path';
import { GILES_COMPANY_IDENTITY } from './giles-masterpiece-data';
import { getGilesCatalogSnapshot } from './giles-catalog-snapshot';

export type SkaitaDocumentType =
    | 'ISANKSTINE_SASKAITA'
    | 'PVM_SASKAITA_FAKTURA'
    | 'KREDITINE_SASKAITA'
    | 'IVAZ_VAZTARASTIS';

export type SkaitaPaymentStatus =
    | 'LAUKIA_APMOKEJIMO'
    | 'APMOKETA_PAVEDIMU'
    | 'ANULIUOTA';

export interface SkaitaInvoiceLine {
    sku: string;
    ean: string;
    title: string;
    unit: string;
    qty: number;
    unitNetEur: number;
    discountPercent?: number;
    vatRatePercent: number;
    lineVatEur: number;
    lineGrossEur: number;
    costNetEur: number;
}

export interface SkaitaInvoiceRecord {
    id: string;
    invoiceNumber: string;
    proformaNumber: string;
    waybillNumber: string;
    docType: SkaitaDocumentType;
    paymentStatus: SkaitaPaymentStatus;
    paymentTermDays: number;
    paidAt?: string | null;
    sepaReference?: string | null;
    issueDate: string;
    dueDate: string;
    sellerName: string;
    sellerCompanyCode: string;
    sellerVatCode: string;
    sellerAddress: string;
    sellerBankAccount: string;
    buyerName: string;
    buyerCompanyCode: string;
    buyerVatCode: string;
    buyerAddress: string;
    buyerEmail: string;
    warehouse: string;
    vatRatePercent: number;
    totalNetEur: number;
    vatAmountEur: number;
    totalGrossEur: number;
    amountInWordsLt: string;
    skaitaSyncStatus: 'READY_FOR_SKAITA_EXPORT' | 'EXPORTED_TO_SKAITA';
    lines: SkaitaInvoiceLine[];
}

const SKAITA_INVOICES_PATH = path.join(process.cwd(), 'src', 'data', 'skaita-invoices.json');

let memoryInvoicesCache: SkaitaInvoiceRecord[] | null = null;
let sequenceCounter = 1;

const LT_ONES = [
    '',
    'vienas',
    'du',
    'trys',
    'keturi',
    'penki',
    'šeši',
    'septyni',
    'aštuoni',
    'devyni',
];
const LT_TEENS = [
    'dešimt',
    'vienuolika',
    'dvylika',
    'trylika',
    'keturiolika',
    'penkiolika',
    'šešiolika',
    'septyniolika',
    'aštuoniolika',
    'devyniolika',
];
const LT_TENS = [
    '',
    'dešimt',
    'dvidešimt',
    'trisdešimt',
    'keturiasdešimt',
    'penkiasdešimt',
    'šešiasdešimt',
    'septyniasdešimt',
    'aštuoniasdešimt',
    'devyniasdešimt',
];

function tripletToWordsLt(n: number): string {
    const parts: string[] = [];
    const hundreds = Math.floor(n / 100);
    const rem = n % 100;
    if (hundreds === 1) {
        parts.push('vienas šimtas');
    } else if (hundreds > 1) {
        parts.push(`${LT_ONES[hundreds]} šimtai`);
    }
    if (rem >= 10 && rem <= 19) {
        parts.push(LT_TEENS[rem - 10]!);
    } else {
        const tens = Math.floor(rem / 10);
        const ones = rem % 10;
        if (tens > 0) parts.push(LT_TENS[tens]!);
        if (ones > 0) parts.push(LT_ONES[ones]!);
    }
    return parts.join(' ').trim();
}

export function sumaZodziaisLt(amountEur: number): string {
    const rounded = Math.max(0, Math.round(amountEur * 100) / 100);
    const euros = Math.floor(rounded);
    const cents = Math.round((rounded - euros) * 100);
    const centsStr = String(cents).padStart(2, '0');

    if (euros === 0) {
        return `Nulis eurų ir ${centsStr} ct`;
    }

    const thousands = Math.floor(euros / 1000);
    const underThousand = euros % 1000;
    const chunks: string[] = [];

    if (thousands > 0) {
        if (thousands === 1) {
            chunks.push('vienas tūkstantis');
        } else {
            const thWords = tripletToWordsLt(thousands);
            const thLastTwo = thousands % 100;
            const thLast = thousands % 10;
            const thSuffix =
                thLastTwo >= 10 && thLastTwo <= 20
                    ? 'tūkstančių'
                    : thLast === 1
                      ? 'tūkstantis'
                      : 'tūkstančiai';
            chunks.push(`${thWords} ${thSuffix}`);
        }
    }

    if (underThousand > 0) {
        chunks.push(tripletToWordsLt(underThousand));
    }

    const lastTwo = euros % 100;
    const lastOne = euros % 10;
    const euroWord =
        lastTwo >= 10 && lastTwo <= 20
            ? 'eurų'
            : lastOne === 1
              ? 'euras'
              : lastOne >= 2 && lastOne <= 9
                ? 'eurai'
                : 'eurų';

    const sentence = `${chunks.join(' ').trim()} ${euroWord} ir ${centsStr} ct`;
    return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

function readInvoicesFromDisk(): SkaitaInvoiceRecord[] {
    if (memoryInvoicesCache) return memoryInvoicesCache;
    try {
        if (fs.existsSync(SKAITA_INVOICES_PATH)) {
            const raw = fs.readFileSync(SKAITA_INVOICES_PATH, 'utf-8');
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                memoryInvoicesCache = parsed;
                return parsed;
            }
        }
    } catch {
        // fallback
    }
    memoryInvoicesCache = [];
    return memoryInvoicesCache;
}

export function resetSkaitaInvoices(): void {
    sequenceCounter = 1;
    saveInvoicesToDisk([]);
}

function saveInvoicesToDisk(invoices: SkaitaInvoiceRecord[]): void {
    memoryInvoicesCache = invoices;
    try {
        fs.mkdirSync(path.dirname(SKAITA_INVOICES_PATH), { recursive: true });
        fs.writeFileSync(SKAITA_INVOICES_PATH, JSON.stringify(invoices, null, 2), 'utf-8');
    } catch {
        // non-fatal
    }
}

export function listSkaitaInvoices(): SkaitaInvoiceRecord[] {
    return [...readInvoicesFromDisk()];
}

export function createAutonomousSkaitaInvoice(input: {
    docType?: SkaitaDocumentType;
    paymentStatus?: SkaitaPaymentStatus;
    paymentTermDays?: number;
    buyerName: string;
    buyerCompanyCode: string;
    buyerVatCode?: string;
    buyerAddress?: string;
    buyerEmail?: string;
    warehouse?: string;
    lines: Array<{
        sku: string;
        ean?: string;
        title: string;
        unit?: string;
        qty: number;
        unitNetEur: number;
        discountPercent?: number;
        costNetEur?: number;
    }>;
}): SkaitaInvoiceRecord {
    const existing = readInvoicesFromDisk();
    const seq = String(sequenceCounter++).padStart(4, '0');
    const docType: SkaitaDocumentType = input.docType || 'PVM_SASKAITA_FAKTURA';
    const proformaNumber = `PRO-${seq}`;
    const invoiceNumber =
        docType === 'ISANKSTINE_SASKAITA'
            ? proformaNumber
            : docType === 'KREDITINE_SASKAITA'
              ? `KRED-${seq}`
              : `GILE-${seq}`;
    const waybillNumber = `IVAZ-${seq}`;
    const vatRatePercent = 21;

    const lines: SkaitaInvoiceLine[] = input.lines.map((l) => {
        const qty = Math.max(1, Number(l.qty) || 1);
        const discountPercent = Math.min(95, Math.max(0, Number(l.discountPercent || 0)));
        const rawUnitNet = Number(l.unitNetEur) || 0;
        const unitNetEur =
            Math.round(rawUnitNet * (1 - discountPercent / 100) * 100) / 100;
        const lineNet = Math.round(unitNetEur * qty * 100) / 100;
        const lineVatEur = Math.round(lineNet * (vatRatePercent / 100) * 100) / 100;
        const lineGrossEur = Math.round((lineNet + lineVatEur) * 100) / 100;
        const costNetEur =
            typeof l.costNetEur === 'number'
                ? Math.round(l.costNetEur * 100) / 100
                : Math.round(unitNetEur * 0.65 * 100) / 100;

        return {
            sku: l.sku.trim(),
            ean: (l.ean || '4770001000009').trim(),
            title: l.title.trim(),
            unit: (l.unit || 'vnt.').trim(),
            qty,
            unitNetEur,
            discountPercent,
            vatRatePercent,
            lineVatEur,
            lineGrossEur,
            costNetEur,
        };
    });

    const totalNetEur =
        Math.round(lines.reduce((s, l) => s + l.unitNetEur * l.qty, 0) * 100) / 100;
    const vatAmountEur = Math.round(totalNetEur * (vatRatePercent / 100) * 100) / 100;
    const totalGrossEur = Math.round((totalNetEur + vatAmountEur) * 100) / 100;

    const paymentTermDays = Math.max(1, Number(input.paymentTermDays || 14));
    const issueDate = new Date().toISOString().slice(0, 10);
    const dueDate = new Date(Date.now() + paymentTermDays * 86400 * 1000)
        .toISOString()
        .slice(0, 10);

    const record: SkaitaInvoiceRecord = {
        id: `inv-${seq}-${Date.now()}`,
        invoiceNumber,
        proformaNumber,
        waybillNumber,
        docType,
        paymentStatus: input.paymentStatus || 'LAUKIA_APMOKEJIMO',
        paymentTermDays,
        paidAt: null,
        sepaReference: null,
        issueDate,
        dueDate,
        sellerName: GILES_COMPANY_IDENTITY.legalName,
        sellerCompanyCode: GILES_COMPANY_IDENTITY.companyCode,
        sellerVatCode: GILES_COMPANY_IDENTITY.vatCode,
        sellerAddress: GILES_COMPANY_IDENTITY.address,
        sellerBankAccount: 'LT627300010128945112 (Swedbank, AB)',
        buyerName: input.buyerName.trim(),
        buyerCompanyCode: input.buyerCompanyCode.trim(),
        buyerVatCode: (input.buyerVatCode || 'LT100000000000').trim(),
        buyerAddress: (input.buyerAddress || 'Lietuva').trim(),
        buyerEmail: (input.buyerEmail || 'apskaita@klientas.lt').trim(),
        warehouse: (input.warehouse || 'KAUNAS_PAGRINDINIS').trim(),
        vatRatePercent,
        totalNetEur,
        vatAmountEur,
        totalGrossEur,
        amountInWordsLt: sumaZodziaisLt(totalGrossEur),
        skaitaSyncStatus: 'READY_FOR_SKAITA_EXPORT',
        lines,
    };

    saveInvoicesToDisk([record, ...existing]);
    return record;
}

export function updateSkaitaInvoiceStatus(
    invoiceIdOrNumber: string,
    paymentStatus: SkaitaPaymentStatus,
): SkaitaInvoiceRecord | null {
    const existing = readInvoicesFromDisk();
    const key = invoiceIdOrNumber.trim().toLowerCase();
    const idx = existing.findIndex(
        (inv) =>
            inv.id.toLowerCase() === key ||
            inv.invoiceNumber.toLowerCase() === key ||
            inv.proformaNumber.toLowerCase() === key,
    );
    if (idx === -1) return null;

    const updated: SkaitaInvoiceRecord = {
        ...existing[idx]!,
        paymentStatus,
        paidAt:
            paymentStatus === 'APMOKETA_PAVEDIMU'
                ? new Date().toISOString()
                : existing[idx]!.paidAt || null,
    };
    const next = [...existing];
    next[idx] = updated;
    saveInvoicesToDisk(next);
    return updated;
}

export function convertProformaToGileInvoice(
    invoiceIdOrNumber: string,
): SkaitaInvoiceRecord | null {
    const existing = readInvoicesFromDisk();
    const key = invoiceIdOrNumber.trim().toLowerCase();
    const idx = existing.findIndex(
        (inv) =>
            inv.id.toLowerCase() === key ||
            inv.invoiceNumber.toLowerCase() === key ||
            inv.proformaNumber.toLowerCase() === key,
    );
    if (idx === -1) return null;

    const target = existing[idx]!;
    const suffix = target.proformaNumber.replace(/^PRO-/i, '');
    const gileNo = target.invoiceNumber.startsWith('GILE-')
        ? target.invoiceNumber
        : `GILE-${suffix || String(sequenceCounter++).padStart(4, '0')}`;

    const updated: SkaitaInvoiceRecord = {
        ...target,
        docType: 'PVM_SASKAITA_FAKTURA',
        invoiceNumber: gileNo,
    };
    const next = [...existing];
    next[idx] = updated;
    saveInvoicesToDisk(next);
    return updated;
}

export function reconcileSepaBankStatement(statementText: string): {
    reconciledCount: number;
    matchedInvoiceIds: string[];
    invoices: SkaitaInvoiceRecord[];
} {
    const existing = readInvoicesFromDisk();
    const textUpper = (statementText || '').toUpperCase();
    const matchedInvoiceIds: string[] = [];

    const next = existing.map((inv) => {
        if (inv.paymentStatus === 'APMOKETA_PAVEDIMU') {
            return inv;
        }
        const hasPro =
            inv.proformaNumber && textUpper.includes(inv.proformaNumber.toUpperCase());
        const hasInv =
            inv.invoiceNumber && textUpper.includes(inv.invoiceNumber.toUpperCase());
        const grossStr = inv.totalGrossEur.toFixed(2);
        const hasBuyerAndAmount =
            textUpper.includes(grossStr) &&
            inv.buyerCompanyCode &&
            textUpper.includes(inv.buyerCompanyCode.toUpperCase());

        if (hasPro || hasInv || hasBuyerAndAmount) {
            matchedInvoiceIds.push(inv.id);
            const suffix = inv.proformaNumber.replace(/^PRO-/i, '');
            const convertedNo =
                inv.docType === 'ISANKSTINE_SASKAITA' || inv.invoiceNumber.startsWith('PRO-')
                    ? `GILE-${suffix || '0001'}`
                    : inv.invoiceNumber;
            return {
                ...inv,
                docType:
                    inv.docType === 'ISANKSTINE_SASKAITA'
                        ? ('PVM_SASKAITA_FAKTURA' as SkaitaDocumentType)
                        : inv.docType,
                invoiceNumber: convertedNo,
                paymentStatus: 'APMOKETA_PAVEDIMU' as SkaitaPaymentStatus,
                paidAt: new Date().toISOString(),
                sepaReference: `SEPA camt.053 (${grossStr} EUR)`,
            };
        }
        return inv;
    });

    if (matchedInvoiceIds.length > 0) {
        saveInvoicesToDisk(next);
    }

    return {
        reconciledCount: matchedInvoiceIds.length,
        matchedInvoiceIds,
        invoices: next,
    };
}

export function exportSkaitaSalesCsv(invoices?: SkaitaInvoiceRecord[]): string {
    const list = invoices && invoices.length > 0 ? invoices : listSkaitaInvoices();
    const header =
        'Dokumento_Nr;Data;Pirkejo_Pavadinimas;Imones_Kodas;PVM_Kodas;Prekes_Kodas_SKU;EAN;Prekes_Pavadinimas;Vnt;Kiekis;Kaina_Be_PVM;PVM_Proc;PVM_Suma;Suma_Su_PVM;Savikaina_Be_PVM;Sandelis';

    const rows: string[] = [header];
    for (const inv of list) {
        for (const line of inv.lines) {
            rows.push(
                [
                    inv.invoiceNumber,
                    inv.issueDate,
                    inv.buyerName.replace(/;/g, ','),
                    inv.buyerCompanyCode,
                    inv.buyerVatCode,
                    line.sku,
                    line.ean,
                    line.title.replace(/;/g, ','),
                    line.unit,
                    String(line.qty),
                    line.unitNetEur.toFixed(2),
                    String(line.vatRatePercent),
                    line.lineVatEur.toFixed(2),
                    line.lineGrossEur.toFixed(2),
                    line.costNetEur.toFixed(2),
                    inv.warehouse,
                ].join(';'),
            );
        }
    }
    return rows.join('\n');
}

export function exportSkaitaWriteoffActCsv(invoices?: SkaitaInvoiceRecord[]): string {
    const list = invoices && invoices.length > 0 ? invoices : listSkaitaInvoices();
    const header =
        'Akto_Nr;Data;Sandelis;Prekes_Kodas_SKU;Prekes_Pavadinimas;Vnt;Nurasyta_Kiekis;Savikaina_Be_PVM;Suma_Savikaina_Eur;Pagrindas_SF';
    const rows: string[] = [header];
    for (const inv of list) {
        const actNo = inv.invoiceNumber.replace('GILE-', 'NUR-');
        for (const line of inv.lines) {
            const totalCost = Math.round(line.costNetEur * line.qty * 100) / 100;
            rows.push(
                [
                    actNo,
                    inv.issueDate,
                    inv.warehouse,
                    line.sku,
                    line.title.replace(/;/g, ','),
                    line.unit,
                    String(line.qty),
                    line.costNetEur.toFixed(2),
                    totalCost.toFixed(2),
                    inv.invoiceNumber,
                ].join(';'),
            );
        }
    }
    return rows.join('\n');
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

export function exportVmiIsaf12Xml(
    invoices?: SkaitaInvoiceRecord[],
    periodStart = '',
    periodEnd = '',
): string {
    const list = invoices && invoices.length > 0 ? invoices : listSkaitaInvoices();
    const fallbackDay = new Date().toISOString().slice(0, 10);
    const effectiveStart = periodStart || list[list.length - 1]?.issueDate || fallbackDay;
    const effectiveEnd = periodEnd || list[0]?.issueDate || fallbackDay;
    const customersXml = list
        .map(
            (inv) => `      <Customer>
        <CustomerID>${escapeXml(inv.buyerCompanyCode)}</CustomerID>
        <VATRegistrationNumber>${escapeXml(inv.buyerVatCode || 'ND')}</VATRegistrationNumber>
        <RegistrationNumber>${escapeXml(inv.buyerCompanyCode)}</RegistrationNumber>
        <Country>LT</Country>
        <Name>${escapeXml(inv.buyerName)}</Name>
      </Customer>`,
        )
        .join('\n');

    const salesInvoicesXml = list
        .map(
            (inv) => `      <Invoice>
        <InvoiceNo>${escapeXml(inv.invoiceNumber)}</InvoiceNo>
        <CustomerInfo>
          <CustomerID>${escapeXml(inv.buyerCompanyCode)}</CustomerID>
          <VATRegistrationNumber>${escapeXml(inv.buyerVatCode || 'ND')}</VATRegistrationNumber>
          <RegistrationNumber>${escapeXml(inv.buyerCompanyCode)}</RegistrationNumber>
          <Country>LT</Country>
          <Name>${escapeXml(inv.buyerName)}</Name>
        </CustomerInfo>
        <InvoiceDate>${escapeXml(inv.issueDate)}</InvoiceDate>
        <InvoiceType>SF</InvoiceType>
        <SpecialTaxation></SpecialTaxation>
        <References></References>
        <VATPointDate>${escapeXml(inv.issueDate)}</VATPointDate>
        <DocumentTotals>
          <DocumentTotal>
            <TaxableValue>${inv.totalNetEur.toFixed(2)}</TaxableValue>
            <TaxCode>PVM1</TaxCode>
            <TaxPercentage>${inv.vatRatePercent}</TaxPercentage>
            <Amount>${inv.vatAmountEur.toFixed(2)}</Amount>
            <VATPointDate2>${escapeXml(inv.issueDate)}</VATPointDate2>
          </DocumentTotal>
        </DocumentTotals>
      </Invoice>`,
        )
        .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<iSAFFile xmlns="http://www.vmi.lt/cms/imas/isaf" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Header>
    <FileDescription>
      <FileVersion>i.SAF1.2</FileVersion>
      <FileDateCreated>${new Date().toISOString()}</FileDateCreated>
      <DataType>F</DataType>
      <SoftwareCompanyName>UAB Prototechnika Skaita / Giles Platform Bridge</SoftwareCompanyName>
      <SoftwareName>Giles E-Shop Autonomous Skaita Bridge</SoftwareName>
      <SoftwareVersion>1.2</SoftwareVersion>
      <RegistrationNumber>${GILES_COMPANY_IDENTITY.companyCode}</RegistrationNumber>
      <NumberOfParts>1</NumberOfParts>
      <PartNumber>1</PartNumber>
      <SelectionCriteria>
        <SelectionStartDate>${escapeXml(effectiveStart)}</SelectionStartDate>
        <SelectionEndDate>${escapeXml(effectiveEnd)}</SelectionEndDate>
      </SelectionCriteria>
    </FileDescription>
  </Header>
  <MasterFiles>
    <Customers>
${customersXml}
    </Customers>
  </MasterFiles>
  <SourceDocuments>
    <SalesInvoices>
${salesInvoicesXml}
    </SalesInvoices>
  </SourceDocuments>
</iSAFFile>`;
}

export interface SkaitaStockImportRow {
    sku: string;
    stock: number;
    costNetEur: number;
    retailGrossEur: number;
}

export interface SkaitaStockImportSummary {
    processedRows: number;
    matchedCatalogSkus: number;
    totalCatalogProducts: number;
    reconciledAt: string;
    updatedItems: Array<{
        sku: string;
        title: string;
        previousStock: number;
        newStock: number;
        costNetEur: number;
        retailGrossEur: number;
        retailNetEur: number;
    }>;
}

export function importSkaitaStockRows(rows: SkaitaStockImportRow[]): SkaitaStockImportSummary {
    const snap = getGilesCatalogSnapshot();
    const updatedItems: SkaitaStockImportSummary['updatedItems'] = [];
    let matchedCatalogSkus = 0;

    for (const r of rows) {
        const cleanSku = r.sku.trim().toLowerCase();
        const found = snap.products.find(
            (p) =>
                p.sku.toLowerCase() === cleanSku ||
                p.sku.toLowerCase().includes(cleanSku) ||
                (p.nameLt || p.name).toLowerCase().includes(cleanSku),
        );
        if (found) {
            matchedCatalogSkus++;
            const prevStock = found.stock ?? 10;
            found.stock = r.stock;
            found.price = r.retailGrossEur;
            updatedItems.push({
                sku: found.sku,
                title: found.nameLt || found.name,
                previousStock: prevStock,
                newStock: r.stock,
                costNetEur: r.costNetEur,
                retailGrossEur: r.retailGrossEur,
                retailNetEur: Math.round((r.retailGrossEur / 1.21) * 100) / 100,
            });
        } else {
            updatedItems.push({
                sku: r.sku,
                title: `Skaita sandėlio pozicija (${r.sku})`,
                previousStock: 0,
                newStock: r.stock,
                costNetEur: r.costNetEur,
                retailGrossEur: r.retailGrossEur,
                retailNetEur: Math.round((r.retailGrossEur / 1.21) * 100) / 100,
            });
        }
    }

    return {
        processedRows: rows.length,
        matchedCatalogSkus,
        totalCatalogProducts: snap.totalProducts,
        reconciledAt: new Date().toISOString(),
        updatedItems,
    };
}
