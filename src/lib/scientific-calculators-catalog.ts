import { searchCatalogProductsPaged, type ListingProduct } from './catalog-listing';
import { resolveBrandLogo, resolveProductImageUrl, isExactPhotoSku } from './product-visuals';
import type { CalculatorToolId } from './scientific-calculators';

export interface CalculatorRecommendedProduct {
    id: string;
    sku: string;
    title: string;
    brand: string;
    brandLogoUrl: string;
    brandOrigin: string;
    priceEur: number;
    imageUrl: string;
    categoryName: string;
    roleLabel: string;
    matchReason: string;
    recommendedQty: number;
}

export interface CalculatorRecommendationParams {
    tool: CalculatorToolId;
    kw?: number;
    liters?: number;
    dn?: string;
    kv?: number;
    loops?: number;
    radiators?: number;
    connection?: string;
    control?: string;
}

interface SlotQuerySpec {
    roleLabel: string;
    queries: string[];
    brandFilter?: string;
    categoryFilter?: string;
    matchReason: string;
    recommendedQty: number;
    preferTitlePattern?: RegExp;
    avoidTitlePattern?: RegExp;
}

function buildSlotsForTool(params: CalculatorRecommendationParams): SlotQuerySpec[] {
    const kw = Number(params.kw) || 14;
    const liters = Number(params.liters) || 25;
    const dn = (params.dn || 'DN20').toUpperCase();
    const kv = Number(params.kv) || 2.2;
    const loops = Math.min(Math.max(Math.round(Number(params.loops) || 8), 2), 12);
    const radiators = Math.min(Math.max(Math.round(Number(params.radiators) || 6), 1), 30);
    const isBottomVk = params.connection !== 'side_dn15_angle' && params.connection !== 'side_dn15_straight';
    const isAfc = params.control !== 'standard_kv';

    switch (params.tool) {
        case 'boiler':
            return [
                {
                    roleLabel: '1. Šilumos šaltinis / vandens šildytuvas',
                    queries: ['Ferroli', 'šildytuvas', 'katilas'],
                    brandFilter: 'Ferroli',
                    matchReason: `Tinka projektinei ${kw.toFixed(1)} kW šildymo ir karšto vandens sistemai (LST EN 12831).`,
                    recommendedQty: 1,
                    avoidTitlePattern: /tarpinė|kamštis|aklė|flanšas/i,
                },
                {
                    roleLabel: '2. Sistemos plėtimosi indas (EN 12828)',
                    queries: [`Statico SD ${liters >= 35 ? 35 : 25}`, 'Statico SD', 'Statico'],
                    brandFilter: 'IMI Pneumatex',
                    matchReason: `Kompensuoja katilinės šiluminį vandens plėtimąsi prie ${kw.toFixed(1)} kW galios.`,
                    recommendedQty: 1,
                },
                {
                    roleLabel: '3. Automatinis oro ir purvo atskyriklis',
                    queries: ['Zeparo', 'Vento', 'nuorintuvas'],
                    brandFilter: 'IMI Pneumatex',
                    matchReason: 'Šalina mikrobubuliukus ir magnetitą iš katilo pirminio kontūro, saugo šilumokaitį.',
                    recommendedQty: 1,
                },
                {
                    roleLabel: '4. Katilinės balansinis ir uždarymo mazgas',
                    queries: ['STAD DN25', 'STAD DN20', 'Globo'],
                    brandFilter: 'IMI TA',
                    matchReason: `Užtikrina tikslų katilinės pirminio žiedo srautą (${Math.round((kw * 860) / 15)} l/h prie ΔT=15 K).`,
                    recommendedQty: 1,
                },
            ];

        case 'vessel':
            return [
                {
                    roleLabel: `1. Pagrindinis plėtimosi indas (${liters} l)`,
                    queries: [`Statico SD ${liters}`, `Statico ${liters}`, 'Statico SD', 'Aquapresso'],
                    brandFilter: 'IMI Pneumatex',
                    preferTitlePattern: new RegExp(`\\b${liters}\\b`, 'i'),
                    matchReason: `Boyle–Mariotte skaičiavimas (LST EN 12828): minimalus tūris padengiamas ${liters} l IMI Pneumatex indu su Airproof membrana.`,
                    recommendedQty: 1,
                },
                {
                    roleLabel: '2. Tvirtinimo konsolė / laikiklis (SMU)',
                    queries: ['SMU', 'konsolė', 'laikiklis', 'Statico'],
                    brandFilter: 'IMI Pneumatex',
                    preferTitlePattern: /smu|tvirtinimo|laikiklis|konsol/i,
                    matchReason: `Sieninis laikiklis plėtimosi indui iki ${liters} l saugiam pakabinimui katilinėje.`,
                    recommendedQty: 1,
                },
                {
                    roleLabel: '3. Atjungimo ir išleidimo vožtuvas (DLV)',
                    queries: ['DLV', 'Globo', 'atjungimo'],
                    preferTitlePattern: /dlv|globo|uždarymo|vožtuvas/i,
                    matchReason: 'Privalomas pagal EN 12828: leidžia patikrinti pradinį dujų slėgį P₀ neišleidžiant visos šildymo sistemos.',
                    recommendedQty: 1,
                },
                {
                    roleLabel: '4. Mikrobubuliukų ir šlamo separatorius',
                    queries: ['Zeparo', 'nuorintuvas'],
                    brandFilter: 'IMI Pneumatex',
                    matchReason: 'Stabdo oro patekimą į sistemą ir apsaugo plėtimosi indo membraną nuo deguonies korozijos.',
                    recommendedQty: 1,
                },
            ];

        case 'valve':
            return [
                {
                    roleLabel: `1. Rankinis balansinis vožtuvas (${dn})`,
                    queries: [`STAD ${dn}`, `STAD`, `TBV`],
                    brandFilter: 'IMI TA',
                    preferTitlePattern: new RegExp(dn.replace('DN', 'DN\\s*'), 'i'),
                    matchReason: `Apskaičiuotam Kv = ${kv.toFixed(2)} m³/h ir tyliajam darbinio srauto greičiui v ≤ 0,75 m/s (${dn}).`,
                    recommendedQty: 1,
                },
                {
                    roleLabel: `2. Automatinis / dinaminis vožtuvas (${dn})`,
                    queries: [`TA-Modulator`, `TBV-CM`, `ASV`, `Eclipse`],
                    matchReason: `Palaiko pastovų Δp ir automatiškai riboja projektinį srautą kontūre nepriklausomai nuo kitų šakų.`,
                    recommendedQty: 1,
                },
                {
                    roleLabel: '3. Katilinės sferinis uždarymo vožtuvas',
                    queries: [`Globo ${dn}`, 'Globo', 'uždarymo'],
                    brandFilter: 'IMI Heimeier',
                    matchReason: 'Mažo hidraulinio pasipriešinimo atjungimo vožtuvas stovo arba šakos aptarnavimui.',
                    recommendedQty: 1,
                },
                {
                    roleLabel: '4. Proporcinė / elektroterminė pavara',
                    queries: ['EMO T', 'TA-Slider', 'TWA'],
                    matchReason: 'Moduliaciniam arba dviejų padėčių (NC/NO) balansinio/reguliavimo vožtuvo valdymui iš automatikos.',
                    recommendedQty: 1,
                },
            ];

        case 'manifold':
            return [
                {
                    roleLabel: `1. Grindinio šildymo kolektorius (${loops} kontūr.)`,
                    queries: [`Dynacon Eclipse ${loops}`, 'Dynacon Eclipse', 'kolektorius'],
                    brandFilter: 'IMI Heimeier',
                    preferTitlePattern: new RegExp(`\\b${loops}\\b|dynacon`, 'i'),
                    matchReason: `Pagal LST EN 1264: ${loops} kontūrų nerūdijančio plieno kolektorius su integruotais AFC automatiniais srauto ribotuvais (l/min).`,
                    recommendedQty: 1,
                },
                {
                    roleLabel: `2. Elektroterminės pavaros M30×1,5 (${loops} vnt.)`,
                    queries: ['EMO T', 'TWA-A', 'pavara'],
                    preferTitlePattern: /emo t|twa|pavara/i,
                    matchReason: `Po 1 pavarą kiekvienam iš ${loops} grindinio šildymo kontūrų automatiniam patalpų temperatūros palaikymui.`,
                    recommendedQty: loops,
                },
                {
                    roleLabel: '3. Patalpos termostatas / zonų valdiklis',
                    queries: ['Icon', 'DEVIreg', 'Link HC', 'termostatas'],
                    brandFilter: 'Danfoss',
                    matchReason: 'Tiksliam grindų ir oro temperatūros reguliavimui su PWM šiluminės inercijos kompensacija.',
                    recommendedQty: Math.max(2, Math.ceil(loops / 2)),
                },
                {
                    roleLabel: `4. Eurokonusas G3/4 vamzdžiui (${loops * 2} vnt.)`,
                    queries: ['kūginė jungtis', 'G3/4', 'antgalis', 'užspaudimo'],
                    preferTitlePattern: /jungtis|antgalis|g3\/4|16/i,
                    matchReason: `Suspaudimo jungtys PE-Xa / PE-RT 16×2,0 mm vamzdžio prijungimui prie kolektoriaus atšakų (${loops * 2} vnt.).`,
                    recommendedQty: loops * 2,
                },
            ];

        case 'radiator':
        default:
            return [
                {
                    roleLabel: `1. Termostatinė galvutė (${radiators} vnt.)`,
                    queries: isAfc ? ['K-galvutė', 'Halo', 'Redia'] : ['Redia', 'Aero', 'K-galvutė'],
                    brandFilter: isAfc ? 'IMI Heimeier' : 'Danfoss',
                    preferTitlePattern: /galvutė|redia|aero|k-galvut/i,
                    matchReason: `Greitaeigis skystinis jutiklis tiksliam patalpos temperatūros palaikymui (${radiators} radiatoriams).`,
                    recommendedQty: radiators,
                },
                {
                    roleLabel: `2. Termostatinis vožtuvas (${isAfc ? 'AFC Eclipse' : 'RA-N Kv'})`,
                    queries: isAfc ? ['Eclipse', 'V-exact'] : ['RA-N', 'Eclipse'],
                    brandFilter: isAfc ? 'IMI Heimeier' : 'Danfoss',
                    preferTitlePattern: isAfc ? /eclipse/i : /ra-n|eclipse/i,
                    matchReason: isAfc
                        ? 'Automatinis srauto ribotuvas (AFC): tiesiogiai nustatomas l/h srautas (pvz. 69 l/h), sistema išsibalansuoja automatiškai.'
                        : 'Vožtuvas su išankstiniu Kv pralaidumo nustatymu pagal šakos slėgio nuostolį.',
                    recommendedQty: radiators,
                },
                {
                    roleLabel: isBottomVk
                        ? `3. Apatinio pajungimo H-blokas 50 mm (${radiators} vnt.)`
                        : `3. Grįžtamojo srauto atbulinis vožtuvas (${radiators} vnt.)`,
                    queries: isBottomVk ? ['Multilux', 'RLV-K', 'Vekolux'] : ['Regulux', 'RLV-S', 'Raditec'],
                    preferTitlePattern: isBottomVk ? /multilux|rlv-k|vekolux/i : /regulux|rlv-s|raditec/i,
                    matchReason: isBottomVk
                        ? 'Apatinio VK 50 mm pajungimo mazgas („binoklis“) su uždarymo ir išleidimo funkcija.'
                        : 'Grįžtamojo vamzdžio balansinis-uždaromasis detentas šoniniam radiatoriaus pajungimui.',
                    recommendedQty: radiators,
                },
                {
                    roleLabel: `4. Vamzdyno prijungimo jungtys (${radiators * 2} vnt.)`,
                    queries: ['srieginis antgalis', 'kūginė jungtis', 'adapteris'],
                    preferTitlePattern: /jungtis|antgalis|adapteris/i,
                    matchReason: `Daugiasluoksnio arba varinio vamzdžio prijungimui prie ${radiators} radiatorių mazgų (${radiators * 2} vnt.).`,
                    recommendedQty: radiators * 2,
                },
            ];
    }
}

function toRecommendedCard(
    item: ListingProduct,
    slot: SlotQuerySpec,
): CalculatorRecommendedProduct {
    const title = item.nameLt || item.name || item.sku;
    const brandInfo = resolveBrandLogo(item.brandName, title);
    const imageUrl = resolveProductImageUrl({
        sku: item.sku,
        title,
        brand: brandInfo.name,
        category: item.categoryName,
        imageUrl: item.imageUrl,
    });

    return {
        id: item.id,
        sku: item.sku,
        title,
        brand: brandInfo.name,
        brandLogoUrl: brandInfo.logoPath,
        brandOrigin: brandInfo.origin,
        priceEur: item.price > 0 ? item.price : 0,
        imageUrl,
        categoryName: item.categoryName || 'ŠVOK įranga',
        roleLabel: slot.roleLabel,
        matchReason: slot.matchReason,
        recommendedQty: slot.recommendedQty,
    };
}

export async function getCalculatorRecommendations(
    params: CalculatorRecommendationParams,
): Promise<CalculatorRecommendedProduct[]> {
    const slots = buildSlotsForTool(params);
    const pickedIds = new Set<string>();
    const results: CalculatorRecommendedProduct[] = [];

    for (const slot of slots) {
        let bestCandidate: ListingProduct | null = null;

        for (const q of slot.queries) {
            const paged = await searchCatalogProductsPaged({
                q,
                brand: slot.brandFilter,
                page: 1,
                pageSize: 16,
            });

            const candidates = paged.items.filter((item) => {
                if (pickedIds.has(item.id)) return false;
                const title = `${item.nameLt || ''} ${item.name || ''}`;
                if (slot.avoidTitlePattern && slot.avoidTitlePattern.test(title)) return false;
                return true;
            });

            if (candidates.length > 0) {
                candidates.sort((a, b) => {
                    const aTitle = `${a.nameLt || ''} ${a.name || ''}`;
                    const bTitle = `${b.nameLt || ''} ${b.name || ''}`;
                    const aPref = slot.preferTitlePattern?.test(aTitle) ? 0 : 1;
                    const bPref = slot.preferTitlePattern?.test(bTitle) ? 0 : 1;
                    if (aPref !== bPref) return aPref - bPref;

                    const aExact = isExactPhotoSku(a.sku) ? 0 : 1;
                    const bExact = isExactPhotoSku(b.sku) ? 0 : 1;
                    if (aExact !== bExact) return aExact - bExact;
                    return 0;
                });

                bestCandidate = candidates[0];
                break;
            }
        }

        // If brand-filtered query yielded nothing, retry without brand filter
        if (!bestCandidate) {
            for (const q of slot.queries) {
                const paged = await searchCatalogProductsPaged({
                    q,
                    page: 1,
                    pageSize: 16,
                });
                const candidate = paged.items.find((item) => !pickedIds.has(item.id));
                if (candidate) {
                    bestCandidate = candidate;
                    break;
                }
            }
        }

        if (bestCandidate) {
            pickedIds.add(bestCandidate.id);
            results.push(toRecommendedCard(bestCandidate, slot));
        }
    }

    // Ensure at least 4 cards by filling from store flagship pool if any slot missed
    if (results.length < 4) {
        const fallbackPool = await searchCatalogProductsPaged({ page: 1, pageSize: 24 });
        for (const item of fallbackPool.items) {
            if (results.length >= 4) break;
            if (pickedIds.has(item.id)) continue;
            pickedIds.add(item.id);
            const fallbackSlot = slots[results.length] ?? {
                roleLabel: `${results.length + 1}. Sistemos komplektavimo mazgas`,
                queries: [],
                matchReason: 'Suderinama sertifikuota ŠVOK sistemos dalis iš Gilės Inžinerija katalogo.',
                recommendedQty: 1,
            };
            results.push(toRecommendedCard(item, fallbackSlot));
        }
    }

    return results;
}
