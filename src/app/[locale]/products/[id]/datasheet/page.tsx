import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCatalogProduct, storeIdOrThrow } from '../../../../../lib/catalog';
import {
    findCompatibleCatalogProducts,
    type ProductCompatibilityResult,
} from '@platform/database/services/product-compatibility-rag';
import { assetUrl } from '../../../../../lib/api';
import {
    parseV3Description,
    getProductUxGuide,
    resolveProductBrandInfo,
    resolveProductImageUrl,
    formatCleanCatalogProductTitle,
    extractCardTechChips,
} from '../../../../../lib/v3-description';
import { DatasheetPrintButton } from '../../../../../components/datasheet-print-button';
import { CheckCircle2, FileText, Wrench } from 'lucide-react';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string; id: string }> };

const cleanDash = (s: string) => s.replace(/\u2014/g, '–').replace(/[\u00A9\u00AE\u2122]/g, '');

function inferDimensionalMetrics(input: {
    sku: string;
    title: string;
    category: string;
    subtypeId: string;
}): {
    diagramType: 'vessel' | 'manifold' | 'valve' | 'head' | 'boiler';
    portLabel: string;
    heightMm: string;
    widthMm: string;
    pressurePn: string;
    tempMax: string;
    mountingNote: string;
} {
    const combined = `${input.sku} ${input.title} ${input.category}`.toLowerCase();
    const dnMatch = combined.match(/\b(dn\s*\d+)\b/i);
    const threadMatch = combined.match(/\b(g\s*\d+\/\d+|r\s*\d+\/\d+|m30\s*[x×]\s*1[.,]5|ra\s*click|23\s*mm)\b/i);
    const volMatch = combined.match(/\b(\d{1,4})\s*l\b|\bsd[-\s]*(\d{1,3})\b|\bad[-\s]*(\d{1,3})\b/i);
    const loopsMatch = combined.match(/\b(\d{1,2})\s*(?:kont|žied|zied)/i) || input.sku.match(/^9330-(\d{2})\./);

    if (combined.includes('statico') || combined.includes('aquapresso') || combined.includes('indas')) {
        const liters = Number(volMatch?.[1] || volMatch?.[2] || volMatch?.[3] || 25);
        const diameter = liters <= 18 ? 'Ø 280 mm' : liters <= 35 ? 'Ø 354 mm' : liters <= 80 ? 'Ø 409 mm' : 'Ø 480 mm';
        const height = liters <= 18 ? '410 mm' : liters <= 35 ? '465 mm' : liters <= 80 ? '670 mm' : '850 mm';
        const isPotable = combined.includes('aquapresso') || combined.includes('10 bar');
        return {
            diagramType: 'vessel',
            portLabel: isPotable ? 'G 3/4" (DN20) srieginė jungtis' : 'G 3/4" (DN20) sistemos jungtis',
            heightMm: height,
            widthMm: diameter,
            pressurePn: isPotable ? 'PN10 (10 bar)' : 'PN3 / PN6 (3–6 bar)',
            tempMax: '70 °C (membrana) / 120 °C (sistema)',
            mountingNote: 'Vertikalus montavimas su aptarnavimo čiaupu DLV ir sienine konsole',
        };
    }

    if (combined.includes('kolektor') || combined.includes('dynacon')) {
        const loops = Number(loopsMatch?.[1] || 6);
        const lengthMm = `${160 + loops * 50} mm`;
        return {
            diagramType: 'manifold',
            portLabel: `G 1" magistralė + ${loops} × G 3/4" Eurokonusas`,
            heightMm: '325 mm (komplekto aukštis)',
            widthMm: lengthMm,
            pressurePn: 'PN6 (6 bar)',
            tempMax: '70 °C (grindinis šildymas)',
            mountingNote: 'Horizontalus montavimas kolektorinėje spintoje (žingsnis 50 mm)',
        };
    }

    if (combined.includes('galvut') || combined.includes('redia') || combined.includes('pavara') || combined.includes('emo')) {
        const isRaClick = combined.includes('click') || input.sku.toLowerCase().startsWith('013g');
        return {
            diagramType: 'head',
            portLabel: isRaClick ? 'Danfoss RA Click (Ø 23 mm)' : 'M30 × 1,5 (ISO 228)',
            heightMm: '82 mm',
            widthMm: 'Ø 54 mm',
            pressurePn: 'PN10',
            tempMax: '120 °C (šiluminis nešiklis)',
            mountingNote: 'Horizontalus montavimas ant vožtuvo ašies (laisva oro cirkuliacija)',
        };
    }

    if (combined.includes('katil') || combined.includes('boiler') || combined.includes('ferroli')) {
        return {
            diagramType: 'boiler',
            portLabel: 'G 3/4" šildymo kontūras / G 1/2" KV',
            heightMm: '700 mm',
            widthMm: '420 × 320 mm',
            pressurePn: 'PN3 (katilas) / PN6 (boileris)',
            tempMax: '85 °C',
            mountingNote: 'Sieninis arba pastatomas montavimas su apsauginiu vožtuvu',
        };
    }

    const dn = dnMatch ? dnMatch[1].toUpperCase().replace(/\s+/g, '') : 'DN20';
    const thread = threadMatch ? threadMatch[1].toUpperCase() : dn === 'DN15' ? 'G 1/2"' : dn === 'DN25' ? 'G 1"' : 'G 3/4"';
    const length = dn === 'DN15' ? '85 mm' : dn === 'DN25' ? '125 mm' : '105 mm';
    return {
        diagramType: 'valve',
        portLabel: `${dn} (${thread}) ISO 228 vidinis sriegis`,
        heightMm: '92 mm',
        widthMm: length,
        pressurePn: 'PN20 (20 bar)',
        tempMax: '120 °C (nuo -20 °C iki +120 °C)',
        mountingNote: 'Montuoti pagal srauto rodyklę (→) ant korpuso, paliekant prieigą matavimo nipeliams',
    };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const product = await getCatalogProduct(id);
    if (!product) return { title: 'Techninis gaminio pasas nerastas | Gilės Inžinerija' };
    const cleanTitle = formatCleanCatalogProductTitle(product.name, product.sku, product.brand);
    return {
        title: `Techninis gaminio pasas: ${cleanTitle} (${product.sku}) | Gilės Inžinerija`,
        description: `Oficialus techninis gaminio pasas, 2D matmenų brėžinys, hidraulinė specifikacija ir montavimo atmintinė gaminiui ${cleanTitle} (SKU ${product.sku}).`,
    };
}

export default async function ProductDatasheetPage({ params }: Props) {
    const { locale, id } = await params;
    const product = await getCatalogProduct(id);
    if (!product) notFound();

    const brandInfo = resolveProductBrandInfo({
        brand: product.brand,
        title: product.name,
        sku: product.sku,
        description: product.description,
    });
    const cleanTitle = formatCleanCatalogProductTitle(product.name, product.sku, brandInfo.name);
    const resolvedImage = resolveProductImageUrl({
        sku: product.sku,
        title: cleanTitle,
        brand: brandInfo.name,
        category: product.category,
        imageUrl: product.image,
    });

    const parsed = parseV3Description(product.description);
    const uxGuide = getProductUxGuide({
        title: cleanTitle,
        category: product.category,
        brand: brandInfo.name,
        sku: product.sku,
        rawDescription: product.description,
    });
    const techChips = extractCardTechChips(cleanTitle, product.sku);
    const dims = inferDimensionalMetrics({
        sku: product.sku,
        title: cleanTitle,
        category: product.category,
        subtypeId: uxGuide.subtypeId,
    });

    const storeId = await storeIdOrThrow().catch(() => '');
    const compatibility = storeId
        ? await findCompatibleCatalogProducts({
              storeId,
              productId: product.id,
              sku: product.sku,
              limit: 4,
          }).catch((): ProductCompatibilityResult | null => null)
        : null;

    const grossEuros =
        product.priceCents != null && product.priceCents > 0 ? product.priceCents / 100 : product.price;

    const specRows =
        parsed.specRows.length > 0
            ? parsed.specRows
            : [
                  { param: 'Gamintojas', value: brandInfo.name },
                  { param: 'Gamintojo kodas (SKU)', value: product.sku },
                  { param: 'Prijungimo sriegis ir DN', value: dims.portLabel },
                  { param: 'Darbinis slėgis (PN)', value: dims.pressurePn },
                  { param: 'Maksimali darbinė temperatūra', value: dims.tempMax },
                  { param: 'Gabaritiniai matmenys (L × H)', value: `${dims.widthMm} × ${dims.heightMm}` },
                  { param: 'Paskirties kategorija', value: cleanDash(product.category) },
              ];

    return (
        <main className="min-h-screen bg-[#F7F6F3] text-stone-900 py-6 md:py-10 print:bg-white print:py-0">
            <div className="container mx-auto max-w-4xl px-4 print:max-w-none print:px-0">
                {/* Top Navigation & Print Action Bar */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
                    <Link
                        href={`/${locale}/products/${product.id}`}
                        className="inline-flex items-center gap-1.5 rounded-sm border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-900 hover:border-stone-900 transition-colors"
                    >
                        <span>← Grįžti į prekės kortelę</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/${locale}/uzklausa?kodas=${encodeURIComponent(product.sku)}`}
                            className="inline-flex items-center gap-1.5 rounded-sm border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-900 hover:border-stone-900 transition-colors"
                        >
                            <FileText className="h-3.5 w-3.5 text-[var(--secondary)]" aria-hidden="true" />
                            <span>Įtraukti į sąmatos užklausą (RFQ)</span>
                        </Link>
                        <DatasheetPrintButton />
                    </div>
                </div>

                {/* Official A4 Technical Datasheet Sheet */}
                <article
                    data-testid="technical-datasheet-sheet"
                    className="rounded-md border border-stone-300 bg-white p-6 sm:p-8 shadow-xs space-y-6 print:border-0 print:p-4 print:shadow-none"
                >
                    {/* Header: Gilės Inžinerija · Techninis gaminio pasas + Brand Logo + SKU */}
                    <header className="border-b-2 border-stone-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-[var(--primary)]">
                                Gilės Inžinerija · Techninis gaminio pasas (Technical Datasheet)
                            </p>
                            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 leading-snug">
                                {cleanDash(cleanTitle)}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 pt-1">
                                <span>
                                    Gamintojas: <strong className="text-stone-900">{brandInfo.name}</strong>
                                </span>
                                <span>·</span>
                                <span className="font-mono font-semibold text-stone-900">
                                    SKU: {product.sku}
                                </span>
                                <span>·</span>
                                <span>Mazgas: {cleanDash(uxGuide.subtypeTitle)}</span>
                                {grossEuros > 0 && (
                                    <>
                                        <span>·</span>
                                        <span className="font-semibold text-stone-900">
                                            Katalogo kaina: {grossEuros.toFixed(2).replace('.', ',')} € su PVM
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 self-start sm:self-center rounded-sm border border-stone-200 bg-stone-50 px-3.5 py-2 shrink-0">
                            <img
                                src={assetUrl(brandInfo.logoPath)}
                                alt={brandInfo.name}
                                className="h-6 w-auto object-contain"
                            />
                            <div className="text-right">
                                <p className="text-[11px] font-bold text-stone-900">{brandInfo.name}</p>
                                <p className="text-[10px] text-stone-600">{cleanDash(brandInfo.origin)}</p>
                            </div>
                        </div>
                    </header>

                    {/* Section 1: Product Photo + 2D Engineering Dimension & Connection Schematic (SVG) */}
                    <section
                        aria-label="Gaminio vaizdas ir 2D matmenų brėžinys"
                        className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch"
                    >
                        {/* Product Photo */}
                        <div className="md:col-span-5 rounded-sm border border-stone-200 bg-white p-4 flex flex-col justify-between">
                            <div className="aspect-square flex items-center justify-center p-3">
                                <img
                                    src={assetUrl(resolvedImage)}
                                    alt={cleanDash(cleanTitle)}
                                    className="max-h-56 w-auto object-contain"
                                />
                            </div>
                            <div className="border-t border-stone-200 pt-2.5 mt-2 flex flex-wrap gap-1.5">
                                {techChips.map((chip) => (
                                    <span
                                        key={chip}
                                        className="rounded-xs border border-stone-300 bg-stone-50 px-2 py-0.5 text-[11px] font-semibold text-stone-800"
                                    >
                                        {chip}
                                    </span>
                                ))}
                                <span className="rounded-xs border border-stone-300 bg-stone-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-stone-900">
                                    {dims.pressurePn}
                                </span>
                            </div>
                        </div>

                        {/* 2D Dimensional SVG Schematic */}
                        <div className="md:col-span-7 rounded-sm border border-stone-200 bg-[#F7F6F3] p-4 flex flex-col justify-between">
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <h2 className="text-xs font-bold text-stone-900">
                                    2D Inžinerinė matmenų ir prijungimo schema (A4 brėžinys)
                                </h2>
                                <span className="font-mono text-[11px] font-semibold text-stone-700">
                                    {dims.portLabel}
                                </span>
                            </div>

                            <div className="rounded-xs border border-stone-300 bg-white p-3">
                                <svg
                                    viewBox="0 0 420 210"
                                    className="w-full h-auto"
                                    role="img"
                                    aria-label={`2D matmenų brėžinys ${cleanTitle} (${product.sku})`}
                                >
                                    {/* Outer Dimension Frame */}
                                    <rect x="8" y="8" width="404" height="194" fill="#FFFFFF" stroke="#D6D3D1" strokeWidth="1" />

                                    {/* Horizontal Dimension Line L */}
                                    <line x1="75" y1="32" x2="345" y2="32" stroke="#0284C7" strokeWidth="1.5" />
                                    <line x1="75" y1="24" x2="75" y2="42" stroke="#0284C7" strokeWidth="1.5" />
                                    <line x1="345" y1="24" x2="345" y2="42" stroke="#0284C7" strokeWidth="1.5" />
                                    <text x="210" y="25" textAnchor="middle" fill="#0B192C" fontSize="11" fontWeight="700">
                                        L = {dims.widthMm}
                                    </text>

                                    {/* Vertical Dimension Line H */}
                                    <line x1="378" y1="55" x2="378" y2="165" stroke="#0284C7" strokeWidth="1.5" />
                                    <line x1="370" y1="55" x2="386" y2="55" stroke="#0284C7" strokeWidth="1.5" />
                                    <line x1="370" y1="165" x2="386" y2="165" stroke="#0284C7" strokeWidth="1.5" />
                                    <text x="372" y="112" textAnchor="end" fill="#0B192C" fontSize="10" fontWeight="700">
                                        H = {dims.heightMm}
                                    </text>

                                    {/* Centerline */}
                                    <line x1="45" y1="115" x2="355" y2="115" stroke="#A8A29E" strokeWidth="1" strokeDasharray="5 3" />

                                    {/* Left & Right Threaded Connection Ports */}
                                    <rect x="75" y="92" width="38" height="46" rx="2" fill="#F5F5F4" stroke="#1C1917" strokeWidth="1.75" />
                                    <rect x="307" y="92" width="38" height="46" rx="2" fill="#F5F5F4" stroke="#1C1917" strokeWidth="1.75" />

                                    {/* Main Hydraulic / Vessel / Manifold Body */}
                                    <rect x="113" y="76" width="194" height="78" rx="6" fill="#FAFAF9" stroke="#1C1917" strokeWidth="2" />

                                    {/* Top Spindle / Actuator / Air Valve Port */}
                                    <rect x="184" y="52" width="52" height="24" rx="2" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.75" />
                                    <text x="210" y="68" textAnchor="middle" fill="#0B192C" fontSize="9.5" fontWeight="700">
                                        SKU {product.sku}
                                    </text>

                                    {/* Flow Direction Arrow */}
                                    <line x1="145" y1="115" x2="265" y2="115" stroke="#DC2626" strokeWidth="2.2" />
                                    <polygon points="265,110 277,115 265,120" fill="#DC2626" />
                                    <text x="210" y="106" textAnchor="middle" fill="#DC2626" fontSize="10" fontWeight="700">
                                        Srauto kryptis →
                                    </text>

                                    {/* Port & Pressure Annotations */}
                                    <text x="94" y="156" textAnchor="middle" fill="#1C1917" fontSize="9.5" fontWeight="600">
                                        Įvadas
                                    </text>
                                    <text x="326" y="156" textAnchor="middle" fill="#1C1917" fontSize="9.5" fontWeight="600">
                                        Išvadas
                                    </text>
                                    <text x="210" y="186" textAnchor="middle" fill="#44403C" fontSize="10" fontWeight="600">
                                        Jungtis: {dims.portLabel} · {dims.pressurePn} · Tmax {dims.tempMax}
                                    </text>
                                </svg>
                            </div>

                            <p className="text-[11px] text-stone-600 mt-2 leading-snug">
                                <strong className="text-stone-900">Montavimo kryptis ir pastaba:</strong> {cleanDash(dims.mountingNote)}.
                            </p>
                        </div>
                    </section>

                    {/* Section 2: Full Technical Specifications Table */}
                    <section aria-label="Pilna techninė specifikacija" className="space-y-2.5">
                        <h2 className="text-sm font-bold text-stone-900 border-b border-stone-200 pb-1.5">
                            1. Hidrauliniai, elektriniai ir konstrukciniai parametrai ({product.sku})
                        </h2>
                        <table className="w-full border-collapse text-xs sm:text-sm border border-stone-300">
                            <thead>
                                <tr className="bg-stone-100 border-b border-stone-300 text-left text-xs text-stone-700">
                                    <th scope="col" className="px-4 py-2 font-semibold">Techninis rodiklis</th>
                                    <th scope="col" className="px-4 py-2 text-right font-semibold">Reikšmė / Standartas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-200">
                                {specRows.map((row) => (
                                    <tr key={`${row.param}-${row.value}`} className="hover:bg-stone-50">
                                        <th scope="row" className="px-4 py-2 text-left font-medium text-stone-700">
                                            {cleanDash(row.param)}
                                        </th>
                                        <td className="px-4 py-2 text-right font-mono font-semibold text-stone-900">
                                            {cleanDash(row.value)}
                                        </td>
                                    </tr>
                                ))}
                                <tr>
                                    <th scope="row" className="px-4 py-2 text-left font-medium text-stone-700">
                                        Darbinis slėgis (PN) ir temperatūra
                                    </th>
                                    <td className="px-4 py-2 text-right font-mono font-semibold text-stone-900">
                                        {dims.pressurePn} · {dims.tempMax}
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row" className="px-4 py-2 text-left font-medium text-stone-700">
                                        Prijungimo sriegis ir matmenys
                                    </th>
                                    <td className="px-4 py-2 text-right font-mono font-semibold text-stone-900">
                                        {dims.portLabel} · {dims.widthMm} × {dims.heightMm}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    {/* Section 3: What's in the Box + 4-Step Installer Mounting Checklist */}
                    <section
                        aria-label="Komplektacija ir montavimo atmintinė"
                        className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2"
                    >
                        <div className="rounded-sm border border-stone-300 bg-white p-4 space-y-2.5">
                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                                <span>2. Kas įeina į gamyklinį komplektą</span>
                            </div>
                            <ul className="space-y-1.5 text-xs text-stone-800">
                                {uxGuide.whatYouGet.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <span className="font-bold text-emerald-700">✓</span>
                                        <span className="leading-relaxed">{cleanDash(item)}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="pt-2 border-t border-stone-200">
                                <p className="text-xs font-bold text-[var(--secondary)] mb-1">
                                    Papildomai rekomenduojama montavimui:
                                </p>
                                <ul className="space-y-1 text-xs text-stone-700">
                                    {uxGuide.whatYouNeed.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <span className="font-bold text-[var(--secondary)]">+</span>
                                            <span className="leading-relaxed">{cleanDash(item)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="rounded-sm border border-stone-300 bg-[#F7F6F3] p-4 space-y-2.5">
                            <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                                <Wrench className="h-4 w-4 text-[var(--primary)] shrink-0" aria-hidden="true" />
                                <span>3. Montavimo eiga meistrams (4 žingsniai)</span>
                            </div>
                            <ol className="space-y-2 text-xs text-stone-800">
                                {uxGuide.steps.map((step, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-xs bg-stone-900 text-[10px] font-bold text-white mt-0.5">
                                            {idx + 1}
                                        </span>
                                        <div>
                                            <strong className="text-stone-900">{cleanDash(step.title)}:</strong>{' '}
                                            <span className="text-stone-700">{cleanDash(step.detail)}</span>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </section>

                    {/* Section 4: Compatible System Parts (if available) */}
                    {compatibility && compatibility.compatibleProducts.length > 0 && (
                        <section aria-label="Suderinamos mazgo dalys" className="space-y-2 pt-1">
                            <h2 className="text-sm font-bold text-stone-900 border-b border-stone-200 pb-1.5">
                                4. Suderinamos mazgo dalys ir poriniai komponentai
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                                {compatibility.compatibleProducts.map((cp) => (
                                    <div
                                        key={cp.id}
                                        className="rounded-xs border border-stone-200 bg-stone-50 p-2.5 flex items-center justify-between gap-3"
                                    >
                                        <div>
                                            <span className="font-mono font-bold text-stone-900">SKU {cp.sku}</span>
                                            <p className="font-semibold text-stone-800">
                                                {cleanDash(formatCleanCatalogProductTitle(cp.name, cp.sku))}
                                            </p>
                                            <p className="text-[11px] text-stone-600">{cleanDash(cp.pairingReasonLt)}</p>
                                        </div>
                                        <span className="font-mono font-bold text-stone-900 whitespace-nowrap">
                                            {cp.price.toFixed(2).replace('.', ',')} €
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Datasheet Footer */}
                    <footer className="border-t border-stone-300 pt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-600">
                        <span>
                            UAB „Gilės inžinerija“ – Šildymo, santechnikos ir inžinerinių sistemų centras · info@gilesinzinerija.lt
                        </span>
                        <span className="font-mono">
                            Dokumento kodas: DS-{product.sku} · 24 mėn. gamintojo garantija
                        </span>
                    </footer>
                </article>
            </div>
        </main>
    );
}
