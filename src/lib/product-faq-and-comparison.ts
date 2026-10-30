import type { V3SpecRow } from './v3-description';

export interface ProductComparisonRow {
    criterion: string;
    thisModel: string;
    standardAlternative: string;
    painPointSolution: string;
}

export interface ProductFaqItem {
    question: string;
    answer: string;
}

export interface ProductFaqAndComparisonResult {
    comparisonHeading: string;
    comparisonTable: ProductComparisonRow[];
    faqItems: ProductFaqItem[];
    jsonLd: {
        '@context': 'https://schema.org';
        '@graph': Array<Record<string, unknown>>;
    };
}

export interface ProductFaqAndComparisonInput {
    title: string;
    sku: string;
    brand?: string | null;
    category?: string | null;
    priceEur: number;
    subtypeKey?: string | null;
    specs?: V3SpecRow[];
    image?: string | null;
    description?: string | null;
    inStock?: boolean;
}

function buildSubtypeComparisonRows(input: {
    title: string;
    sku: string;
    brand: string;
    subtypeKey: string;
}): ProductComparisonRow[] {
    const { title, sku, brand, subtypeKey } = input;
    const modelLabel = `${brand} ${sku}`;
    const lower = `${title} ${sku} ${subtypeKey}`.toLowerCase();

    if (subtypeKey.includes('thermostatic-head') || /termostatinė galvutė|redia|k-galvut/i.test(lower)) {
        const isRaClick = /ra\s*click|\b013g/i.test(lower);
        return [
            {
                criterion: 'Prijungimo lizdas ir fiksavimas',
                thisModel: isRaClick
                    ? `${modelLabel}: greita Danfoss RA „Click“ (23 mm) jungtis be raktų`
                    : `${modelLabel}: tvirta metalinė M30×1,5 veržlė su tikslia eiga`,
                standardAlternative: 'Universalios plastikinės galvutės su pigiais adapteriais',
                painPointSolution:
                    'Panaikina dažniausią Reddit pirkėjų klaidą, kai netyčia nuperkama M30×1,5 galvutė Danfoss RA vožtuvui (arba atvirkščiai) ir galvutė nukrenta arba neuždaro štoko.',
            },
            {
                criterion: 'Jutiklio reakcijos greitis ir tikslumas',
                thisModel: 'Skystinis (bellows) termo-elementas su greita reakcija (±0,2 K histerezė)',
                standardAlternative: 'Pigūs vaškiniai / kieto užpildo elementai (vėluoja 25–40 min.)',
                painPointSolution:
                    'Apsaugo nuo kambario perkaitimo šviečiant saulei ir palaiko tolygią temperatūrą be nuolatinio rankinio sukiojimo.',
            },
            {
                criterion: 'Apsauga nuo užstrigimo ir užšalimo',
                thisModel: 'Integruota „*“ apsauga nuo užšalimo (~7–8 °C) ir temperatūros ribojimo kaiščiai',
                standardAlternative: 'Bazinė rankenėlė be ribotuvų ir silpna grąžinimo spyruoklė',
                painPointSolution:
                    'Sumažina riziką, kad po vasaros sezono vožtuvo adatėlė liks įstrigusi uždaroje padėtyje arba kad negyvenamoje patalpoje užšals radiatorius.',
            },
        ];
    }

    if (subtypeKey.includes('thermostatic-valve') || /eclipse|ra-n|v-exact|termostatinis vožtuvas/i.test(lower)) {
        const hasAfc = /eclipse|ra-dv|afc/i.test(lower);
        return [
            {
                criterion: 'Srauto balansavimas ir apsauga nuo triukšmo',
                thisModel: hasAfc
                    ? `${modelLabel}: automatinis srauto ribotuvas (AFC 10–150 l/h) tiesiai ant vožtuvo`
                    : `${modelLabel}: tikslus išankstinis Kv nustatymas su skale`,
                standardAlternative: 'Paprastas radiatorinis ventilis be išankstinio srauto ribojimo',
                painPointSolution:
                    'Išsprendžia dvi didžiausias problemas: švilpiančius radiatorius (kai užsidaro kiti kambariai) ir šaltus tolimiausius antro aukšto radiatorius.',
            },
            {
                criterion: 'Korpuso metalurgija ir riebokšlio servisas',
                thisModel: 'Korozijai atsparus bronzos / nikeliuoto žalvario korpusas su keičiamu riebokšliu',
                standardAlternative: 'Plonasienis štampuotas žalvaris su nekeičiama šerdimi',
                painPointSolution:
                    'Pradėjus rasoti štokui po 10 metų, riebokšlį galima pakeisti neišleidžiant vandens iš šildymo sistemos.',
            },
            {
                criterion: 'Montavimo kryptis ir hidraulinis darbas',
                thisModel: 'Aiški srauto krypties rodyklė ant korpuso tyliam darbui iki Δp = 60 kPa',
                standardAlternative: 'Jautrus srauto krypčiai vožtuvas, kuris sumontavus atbulai pradeda kalenti',
                painPointSolution:
                    'Apsaugo nuo garsaus „kulkosvaidžio“ bildesio (water hammer), kuris atsiranda kai vanduo teka prieš vožtuvo lėkštelę.',
            },
        ];
    }

    if (subtypeKey.includes('expansion-vessel') || /statico|aquapresso|plėtimosi ind/i.test(lower)) {
        const isPotable = /aquapresso/i.test(lower);
        return [
            {
                criterion: 'Membranos technologija ir dujų sulaikymas',
                thisModel: isPotable
                    ? `${modelLabel}: higieniška pratekėjimo butilo membrana iki 10 bar`
                    : `${modelLabel}: šveicariška IMI Pneumatex Airproof butilo pūslė`,
                standardAlternative: 'Standartinis plėtimosi indas su porėta EPDM diafragma',
                painPointSolution:
                    'Išsprendžia problemą, kai per paprastą EPDM gumą išeina oras, indas prisipildo vandens ir 3 bar apsauginis vožtuvas pradeda spjaudyti vandenį ant katilinės grindų.',
            },
            {
                criterion: 'Tinkamumas terpei (šildymas vs. geriamas vanduo)',
                thisModel: isPotable
                    ? 'Sertifikuota geriamam vandeniui ir boileriams (nerūdijančio plieno atvamzdis)'
                    : 'Optimizuota uždaroms šildymo ir šaldymo sistemoms (EN 12828)',
                standardAlternative: 'Dažytas plieninis atvamzdis, linkęs rūdyti deguonies turinčiame vandenyje',
                painPointSolution:
                    'Apsaugo nuo flanšo prarūdijimo ir užстояjusio vandens kvapo karšto vandens kontūre.',
            },
            {
                criterion: 'Pradinio slėgio P0 patikra ir aptarnavimas',
                thisModel: 'Suderinama su Pneumatex DLV uždarymo ir išleidimo mova greitai P0 patikrai',
                standardAlternative: 'Prijungimas tiesiai į vamzdį be atjungimo ir išleidimo galimybės',
                painPointSolution:
                    'Leidžia patikrinti tikrąjį oro pagalvės slėgį P0 sausame inde neišleidžiant visos namo šildymo sistemos.',
            },
        ];
    }

    if (subtypeKey.includes('manifold') || /dynacon|kolektor/i.test(lower)) {
        return [
            {
                criterion: 'Kontūrų balansavimo būdas',
                thisModel: `${modelLabel}: tikslus srauto paskirstymas kiekvienam grindinio šildymo žiedui`,
                standardAlternative: 'Baziniai kolektoriai be hidraulinio srauto stabilizavimo',
                painPointSolution:
                    'Išsprendžia problemą, kai trumpi vonios kontūrai „pavagia“ visą srautą, o ilgų svetainės žiedų rotametrai rodo 0,5 l/min ir grindys lieka šaltos.',
            },
            {
                criterion: 'Korpuso medžiaga ir ilgaamžiškumas',
                thisModel: 'Aukštos kokybės nerūdijantis plienas / žalvaris su EPDM sandarinimu',
                standardAlternative: 'Surenkami kelių dalių kolektoriai su daugybe srieginių sujungimų',
                painPointSolution:
                    'Minimalus sujungimų skaičius apsaugo nuo lašėjimo kolektoriaus spintelėje po kelių šildymo sezonų.',
            },
            {
                criterion: 'Pavarų ir vamzdžių prijungimo standartas',
                thisModel: 'Standartinis M30×1,5 sriegis pavaroms ir G3/4" Eurokonus jungtys vamzdžiams',
                standardAlternative: 'Nestandartiniai sriegiai, reikalaujantys specialių perėjimų',
                painPointSolution:
                    'Tiesiogiai tinka 24V / 230V NC terminės pavaros (pvz., EMO T / TWA) ir visi standartiniai 16×2,0 mm Eurokonus adapteriai.',
            },
        ];
    }

    if (subtypeKey.includes('balancing') || /\bstad\b|\bstaf\b|\btbv\b|balansin/i.test(lower)) {
        return [
            {
                criterion: 'Medžiagos atsparumas (AMETAL®) ir patikimumas',
                thisModel: `${modelLabel}: patentuotas IMI TA AMETAL® lydinys, atsparus cinko išplovimui`,
                standardAlternative: 'Įprastas žalvaris (CW617N), linkęs į koroziją ir šerdies užkepimą',
                painPointSolution:
                    'Vožtuvas neužkepa ir nepradeda leisti per štoką net po 15–20 metų eksploatacijos.',
            },
            {
                criterion: 'Tikslus srauto matavimas ir „Memory stop“',
                thisModel: 'Dviguba skaitmeninė apsisukimų skalė, matavimo nipeliai ir „Memory stop“ fiksatorius',
                standardAlternative: 'Rutulinis čiaupas arba ventilis be apsisukimų skalės',
                painPointSolution:
                    'Uždarius stovą remontui ir vėl jį atidarius, nebereikia iš naujo kviesti inžinieriaus su matavimo prietaisu — nustatymas išlieka užfiksuotas.',
            },
            {
                criterion: 'Akustinis komfortas vamzdyne',
                thisModel: 'Srauto charakteristika pritaikyta tyliam darbui be kavitacijos',
                standardAlternative: 'Siauras čiaupas, sukeliantis ūžimą ir vibraciją vamzdžiuose',
                painPointSolution:
                    'Tolygiai paskirsto šilumą tarp 1 ir 2 aukšto bei boilerio gyvatuko be vamzdžių gaudesio.',
            },
        ];
    }

    return [
        {
            criterion: 'Sriegio ir geometrijos tikslumas',
            thisModel: `${modelLabel}: sertifikuotas gamyklinis matmuo pagal EN / ISO standartą`,
            standardAlternative: 'Nežinomos kilmės analogas su platesnėmis sriegio tolerancijomis',
            painPointSolution:
                'Garantuoja 100 % sandarumą sujungiant su Danfoss, IMI Heimeier, Pneumatex ir IMI TA mazgais be papildomų perėjimų.',
        },
        {
            criterion: 'Medžiagos ir sandarinimo atsparumas',
            thisModel: 'Karščiui (iki 95–120 °C), slėgiui ir glikoliui atsparios medžiagos',
            standardAlternative: 'Buitinės klasės detalės, prarandančios elastingumą šildymo kontūre',
            painPointSolution:
                'Apsaugo nuo mikro-pratekėjimų, kai šildymo sistema žiemą įkaista, o vasarą atvėsta.',
        },
        {
            criterion: 'Suderinamumas ir aptarnavimas',
            thisModel: 'Tiesioginis suderinamumas pagal originalų artikulą (SKU) kataloge',
            standardAlternative: 'Universalios detalės, kurias tenka pritaikyti vietoje',
            painPointSolution:
                'Sutaupo antrą kelionę į parduotuvę montavimo metu — detalė tiksliai atitinka projekto specifikaciją.',
        },
    ];
}

export function buildProductFaqAndComparison(
    input: ProductFaqAndComparisonInput,
): ProductFaqAndComparisonResult {
    const brand = (input.brand || 'Danfoss').trim();
    const sku = (input.sku || 'N/A').trim();
    const title = (input.title || '').trim();
    const category = (input.category || 'ŠVOK ir santechnikos įranga').trim();
    const subtypeKey = (input.subtypeKey || 'general-hvac').trim();
    const priceFormatted = `${input.priceEur.toFixed(2).replace('.', ',')} €`;

    const comparisonHeading =
        'Palyginimas: kuo ši prekė skiriasi nuo alternatyvų ir kada rinktis būtent ją?';
    const comparisonTable = buildSubtypeComparisonRows({
        title,
        sku,
        brand,
        subtypeKey,
    });

    const specSummary =
        input.specs && input.specs.length > 0
            ? input.specs
                .slice(0, 4)
                .map((s) => `${s.param}: ${s.value}`)
                .join(', ')
            : `Gamintojas: ${brand}, kodas: ${sku}, kategorija: ${category}`;

    const faqItems: ProductFaqItem[] = [
        {
            question: `Ar ${title} (${sku}) tiks mano esamai šildymo sistemai?`,
            answer: `Taip, ${brand} gaminys (kodas ${sku}) yra suprojektuotas pagal Europos ŠVOK standartus (${specSummary}). Prieš montuojant patikrinkite prijungimo sriegį ar skersmenį (pvz., DN15 1/2", DN20 3/4", M30×1,5 arba Danfoss RA Click) — puslapyje esantis konsultantas Vytautas automatiškai parodo su šiuo kodu derančias dalis.`,
        },
        {
            question: `Kuo ${brand} ${sku} skiriasi nuo pigesnių analogų ir kokią problemą išsprendžia?`,
            answer: `${comparisonTable[0].thisModel}. Praktikoje tai išsprendžia vieną dažniausių šildymo sistemų problemų: ${comparisonTable[0].painPointSolution}`,
        },
        {
            question: `Kokių papildomų detalių reikia norint sumontuoti ${sku} be papildomo vizito į parduotuvę?`,
            answer: `Montuojant ${title} (${sku}), rekomenduojame iš karto pasitikrinti prijungimo jungtis (pvz., Eurokonus adapterius, redukcinius perėjimus arba atitinkamą porinį mazgą — vožtuvo korpusą, termostatinę galvutę ar apsauginę grupę). Visus tiesiogiai derančius komponentus su kainomis (${priceFormatted} už šią poziciją) rasite bloke „Vytautas rekomenduoja“ šiame puslapyje.`,
        },
        {
            question: `Kaip išvengti dažniausios klaidos montuojant šį mazgą (${sku})?`,
            answer: `Svarbiausia taisyklė: ${comparisonTable[2]?.painPointSolution || comparisonTable[1]?.painPointSolution} Montuokite tik išjungę cirkuliacinį siurblį ir išleidę slėgį iš aptarnaujamos šakos, o kūginėse bei O-žiedo jungtyse nenaudokite pakulų ant plokščios tarpinės lizdo.`,
        },
    ];

    const jsonLd = {
        '@context': 'https://schema.org' as const,
        '@graph': [
            {
                '@type': 'Product',
                name: title,
                sku,
                description: input.description || `${title} (${brand}, kodas ${sku})`,
                image: input.image ? [input.image] : undefined,
                brand: {
                    '@type': 'Brand',
                    name: brand,
                },
                category,
                offers: {
                    '@type': 'Offer',
                    price: input.priceEur.toFixed(2),
                    priceCurrency: 'EUR',
                    availability:
                        input.inStock === false
                            ? 'https://schema.org/OutOfStock'
                            : 'https://schema.org/InStock',
                },
            },
            {
                '@type': 'FAQPage',
                mainEntity: faqItems.map((item) => ({
                    '@type': 'Question',
                    name: item.question,
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: item.answer,
                    },
                })),
            },
        ],
    };

    return {
        comparisonHeading,
        comparisonTable,
        faqItems,
        jsonLd,
    };
}
