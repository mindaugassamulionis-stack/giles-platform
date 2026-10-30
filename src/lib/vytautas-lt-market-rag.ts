export interface LtMarketStandardChunk {
    id:
        | 'soviet_1pipe_apartments'
        | 'renovated_jessica_apartments'
        | 'newer_2000_2016_collector_apartments'
        | 'modern_aplus_underfloor_homes'
        | 'private_houses_boiler_modernization_spares'
        | 'water_heaters_drazice_gorenje_dhw';
    title: string;
    keywords: string[];
    prioritySkus: string[];
    content: string;
}

export interface ClientTelemetryProductContext {
    id?: string;
    sku: string;
    title: string;
    brand?: string;
    category?: string;
    priceEur?: number;
    specs?: string;
}

export interface ClientTelemetry {
    currentPage?: 'pdp' | 'catalog' | 'paketai' | 'inzinerija' | 'calculator' | 'cart' | 'home' | string;
    currentPath?: string;
    currentProduct?: ClientTelemetryProductContext | null;
    recentlyViewedSkus?: string[];
    cartItems?: string[];
    activeCalculatorSummary?: string | null;
}

export const LT_MARKET_STANDARDS_CHUNKS: LtMarketStandardChunk[] = [
    {
        id: 'soviet_1pipe_apartments',
        title: 'Senos statybos sovietiniai daugiabučiai Lietuvoje (1960–1992 m.: blokiniai / stambiaplokščiai ir mūriniai)',
        keywords: [
            'soviet',
            'senos statybos',
            'senam daugiabu',
            'seno daugiabu',
            'blokini',
            'stambiaplokš',
            'chruščiov',
            'chrusciov',
            'brežnev',
            'breznev',
            'karolinišk',
            'karolinisk',
            'lazdyn',
            'žirmūn',
            'zirmun',
            'šeškin',
            'seskin',
            'justinišk',
            'justinisk',
            'eigul',
            'šilaini',
            'silaini',
            'dainav',
            'fabijonišk',
            'pašilaič',
            'viršulišk',
            'antakaln',
            'naujinink',
            'vienvamzd',
            'permyčk',
            'permyck',
            'by-pass',
            'bypass',
            'trumpikl',
            'ra-g',
            '013g1675',
            '013g1677',
            '013g2990',
            '1978',
            '1980',
            '1985',
            'nešyla radiator',
            'nesyla radiator',
            'šaltas radiator',
        ],
        prioritySkus: ['013G1675', '013G1677', '013G2990', 'POL./80-500'],
        content: [
            'CHUNK 1 — SENOS STATYBOS SOVIETINIAI DAUGIABUČIAI LIETUVOJE (1960–1992 m.: Karoliniškės, Lazdynai, Žirmūnai, Šeškinė, Justiniškės, Eiguliai, Šilainiai, Dainava, „chruščiovkės“ / „brežnevkės“):',
            '- Vamzdynas ir sistema: Vienvamzdė vertikalioji stovų sistema iš juodo plieninio vamzdžio DN15 (1/2") arba DN20 (3/4") su šoniniu pajungimu (500 mm centrų atstumas) ir privalomu apėjimo trumpikliu (by-pass / „permyčka“).',
            '- Dažniausia klientų ir meistrų klaida: Vienvamzdėje sistemoje pastato dvivamzdės sistemos vožtuvą su mažu pralaidumu (Danfoss RA-N su Kvs 0.65–0.90 arba Heimeier V-exact II / Eclipse). Dėl didelio hidraulinio pasipriešinimo 95% šilumos nueina per by-pass („permyčką“) stovą, o radiatorius lieka šaltas!',
            '- Tikslus sprendimas iš Gilės Inžinerija katalogo:',
            '  1) Vienvamzdei sistemai su by-pass PRIVALOMAS didelio pralaidumo gravitacinis/vienvamzdis vožtuvas: Danfoss RA-G 15 (SKU "013G1675", DN15 1/2", Kvs 2.30–2.88, kainynas: 31,34 € / 48,04 € su PVM) arba Danfoss RA-G 20 (SKU "013G1677", DN20 3/4", Kvs 3.74–3.81, 52,27 € su PVM), arba IMI Heimeier padidinto pralaidumo vožtuvas (mėlynas apsauginis dangtelis, Kvs >= 2.5–5.1).',
            '  2) Prie Danfoss RA-G vožtuvo montuojama greito reagavimo dujinė termostatinė galvutė Danfoss RA 2990 (SKU "013G2990", EAN 5702420048116, RA-Click jungtis, kainynas: 31,83 € / 41,26 € su PVM) arba Danfoss RA 2970 (SKU "013G2970", 24,85 €); prie Heimeier M30×1,5 vožtuvo — skystinė Heimeier K-galva (6000-00.500).',
            '  3) Radiatorius keitimui vienvamzdėje sistemoje: sekcijinis aliumininis radiatorius su plačiais kanalais ir mažu hidrauliniu pasipriešinimu Ferroli POL 500 (SKU "POL./80-500", 13,03 €/sekc., 500 mm tarp centrų, išbandytas centralizuoto šildymo slėgiui PN10–PN16). Draudžiama montuoti rutulinį kraną ant by-pass trumpiklio!',
        ].join('\n'),
    },
    {
        id: 'renovated_jessica_apartments',
        title: 'Renovuoti daugiabučiai Lietuvoje (JESSICA / APVA renovacija, dvivamzdė sistema su allokatoriais)',
        keywords: [
            'renovuot',
            'renovacij',
            'jessica',
            'apva',
            'dalikl',
            'alokator',
            'allokator',
            'dvivamzd',
            'balansin',
            'stad',
            'stap',
            'ra-n',
            '013g0014',
            '013g0013',
            'v-exact',
            '3711-02.000',
            '3712-02.000',
            'rlv-s',
            '003l0123',
            '003l0124',
            'regulux',
            'raditec',
        ],
        prioritySkus: ['013G0014', '3933-02.000', '52-151-014', '52-265-020', '013G2970'],
        content: [
            'CHUNK 2 — RENOVUOTI DAUGIABUČIAI LIETUVOJE (JESSICA / APVA PROGRAMA):',
            '- Sistema perdaroma į dvivamzdę su automatiniais stovų balansiniais vožtuvais (IMI TA STAD DN15 SKU "52-151-014" / DN20 SKU "52-151-220" + IMI TA STAP DN20 diferencinio slėgio reguliatorius SKU "52-265-020") ir šilumos dalikliais (allokatoriais) ant radiatorių.',
            '- Kiekvienam radiatoriui privalomas išankstinio nustatymo (pre-setting) dvivamzdės sistemos vožtuvas: Danfoss RA-N 15 tiesus (SKU "013G0014", EAN 5702420005027, kainynas: 27,95 € su PVM) / kampinis ("013G0013") arba IMI Heimeier V-exact II ("3711-02.000" / "3712-02.000") / IMI Heimeier Eclipse DN15 su automatiniu srauto ribotuvu (SKU "3933-02.000", 29,89 €).',
            '- Ant grįžtamojo vamzdžio montuojamas uždaromasis balansinis vožtuvas Heimeier Regulux / Raditec arba Danfoss RLV-S 15 ("003L0123" / "003L0124").',
        ].join('\n'),
    },
    {
        id: 'newer_2000_2016_collector_apartments',
        title: 'Naujesnės statybos daugiabučiai (2000–2016 m., B/C klasė, kolektorinė sistema, apatinis VK 50 mm pajungimas)',
        keywords: [
            'naujesnės statybos',
            'naujesnes statybos',
            '2000',
            '2005',
            '2008',
            '2010',
            '2012',
            '2015',
            'kolektorin',
            'apatin',
            'vk',
            'ventil kompakt',
            'binokl',
            'h-blok',
            'h formos',
            '50 mm',
            '50mm',
            'rlv-k',
            '003l0280',
            '003l0282',
            'vekolux',
            'multilux',
            '0382-02.000',
            'kermi',
            'purmo',
            'korado',
            'vogel',
            'm30',
            'ra click',
        ],
        prioritySkus: ['0382-02.000', '003L0282', '013G2990', '013G2970'],
        content: [
            'CHUNK 3 — NAUJESNĖS STATYBOS DAUGIABUČIAI (2000–2016 m., B ir C energetinė klasė, kolektorinė-šakotinė sistema su apskaita laiptinėje):',
            '- Į butą nuo laiptinės kolektoriaus grindyse paklotas 16×2.0 mm arba 20×2.0 mm daugiasluoksnis (PEX-AL-PEX / Comisa) vamzdis.',
            '- Radiatoriai — plieniniai plokštiniai su apatiniu (VK / Ventil Kompakt) pajungimu (50 mm tarp centrų dešinėje arba kairėje apačioje).',
            '- Tikslus sprendimas: Apatiniam pajungimui reikalingas H-formos mazgas („binoklis“ — IMI Heimeier Vekolux / Multilux DN15 SKU "0382-02.000" už 34,12 € arba Danfoss RLV-K tiesus "003L0280" / kampinis SKU "003L0282" už 38,36 € su PVM) + dvi 3/4" Eurokonusas suspaudžiamos jungtys 16×2.0 mm vamzdžiui.',
            '- Viršuje radiatoriaus jau yra gamyklinis termostatinis įdėklas — jam reikia TIK termostatinės galvos: jei įdėklas M30×1.5 (Kermi, Purmo, Korado, Vogel&Noot) -> Heimeier K-galva (6000-00.500) arba Danfoss RAW 5115; jei įdėklas Danfoss RA 23mm Click (senesni Brugman/Buderus) -> Danfoss RA 2990 (SKU "013G2990") arba RA 2970 (SKU "013G2970").',
        ].join('\n'),
    },
    {
        id: 'modern_aplus_underfloor_homes',
        title: 'Naujos statybos daugiabučiai, kotedžai ir A+ / A++ namai (2017–2026 m., grindinis šildymas)',
        keywords: [
            'naujos statybos',
            'kotedž',
            'kotedz',
            'a+',
            'a++',
            'grindin',
            'kolektor',
            'debitomač',
            'debitomac',
            'pex',
            'comisa',
            '88.20.415',
            'dynacon',
            '9330-06.800',
            'pavar',
            'emo t',
            '1837-00.500',
            '88.20.518',
            'twa-a',
            'termostat',
            'wfht',
            '9018586',
            'zonin',
        ],
        prioritySkus: ['88.20.415', '9330-06.800', '88.20.518', '9018586'],
        content: [
            'CHUNK 4 — NAUJOS STATYBOS DAUGIABUČIAI, KOTEDŽAI IR A+ / A++ NAMAI (2017–2026 m.):',
            '- Šildymas — 95% žematemperatūris grindinis šildymas (padavimas 28–36 °C).',
            '- Standartinė praktika: Comisa nikeliuotas žalvarinis kolektorius su debitomačiais (0.5–5 l/min, pvz. 6 kontūrų SKU "88.20.415", 227,79 €) arba IMI Heimeier Dynacon Eclipse nerūdijančio plieno kolektorius su AFC kasetėmis (SKU "9330-06.800", 389,50 €), 16×2.0 mm Comisa PEX-AL-PEX vamzdis (vieno kontūro ilgis ne daugiau kaip 80–100 m, žingsnis 15 cm gyvenamosiose zonose, 10 cm voniose ir palei vitrininius langus).',
            '- Zoninė automatika: ant kiekvieno kolektoriaus grįžtamojo ventilio (M30×1.5) sukama 230 V NC (normaliai uždara) termoelektrinė pavara (Comisa SKU "88.20.518" už 31,54 €, IMI Heimeier EMO T 1837-00.500 arba Danfoss TWA-A), jungiama į komutacinę dėžutę ir patalpų termostatus (Watts WFHT-LCD SKU "9018586" už 56,07 €).',
        ].join('\n'),
    },
    {
        id: 'private_houses_boiler_modernization_spares',
        title: 'Individualūs nuosavi namai, sodybos, katilinių modernizavimas ir granulių degiklių remontas Lietuvoje',
        keywords: [
            'nuosav',
            'individual',
            'sodyb',
            'katil',
            'katri',
            'katri3850020',
            'centrometal',
            '17526',
            'viessmann',
            'buderus',
            'viadrus',
            'kalvis',
            'vienyb',
            'atmos',
            'ferroli',
            'sun p7',
            'sun p12',
            'degikl',
            'granul',
            'pelltech',
            'pv20',
            'megatherm',
            'degkmpl',
            'tenas',
            'teno',
            'uždegimo',
            'uzdegimo',
            'užgeso',
            'uzgeso',
            'neuždega',
            'neuzdega',
            'katf0033292',
            '39833290',
            'katm39833425',
            'purkštuk',
            '030h8103',
            'akumuliacin',
            'teplomix',
            '1776603',
            'ksg',
            '0270132',
            'statico',
            '7101003',
        ],
        prioritySkus: [
            'KaTRI3850020',
            '1776603',
            '0270132',
            '7101003',
            'degkmpl140mg20',
            'degkmpl140pv20',
            'KatF0033292',
            'KatM39833425',
        ],
        content: [
            'CHUNK 5 — INDIVIDUALŪS NUOSAVI NAMAI, SODYBOS IR KATILINIŲ MODERNIZAVIMAS LIETUVOJE:',
            '- Šilumos nuostolių taisyklė Lietuvoje (-23 °C projektinė lauko temperatūra):',
            '  * A++ / A+ namas: 30–40 W/m² (150 m² -> 6–8 kW).',
            '  * B / C klasės (2000–2015 m. arba šiltintas 10–15 cm polistirenu): 55–65 W/m² (150 m² -> 10–12 kW).',
            '  * Senas nešiltintas rąstinis ar mūrinis namas (su oro tarpu): 90–120 W/m² (150 m² -> 15–20 kW).',
            '- Kieto kuro katilinė (KaTRI 25 kW SKU "KaTRI3850020" 1750 €, Centrometal EKO-CK P 25 kW SKU "17526" 1390,10 €, Ferroli SFL, Viessmann Vitoligno, Buderus Logano):',
            '  * PRIVALOMA akumuliacinė talpa (Centrometal CAS, 50 L / 1 kW katilo galios — pvz. 25 kW katilui 1000–1250 L), termostatinis grįžtamojo srauto įkrovimo mazgas >= 55–61 °C apsaugai nuo kondensato ir dervų (HERZ Teplomix DN25 61 °C SKU "1776603", 57,14 €), katilo apsauginė grupė 3 bar su manometru ir nuorintuvu (Watts KSG 30 SKU "0270132", 48,40 €), apsauginis aušinimo šilumokaitis su STS-20 vožtuvu, elektroninis cirkuliacinis siurblys (Wilo Yonos PICO 25/1-6 SKU "4248084", 385,99 € arba Grundfos ALPHA2) ir uždaras šildymo išsiplėtimo indas (IMI Pneumatex Statico SD 25.3 SKU "7101003", 149,62 € arba Zilmet = 10% viso sistemos vandens tūrio).',
            '- Seno katilo modernizavimas granulių degikliu („Gilės Inžinerijos“ arkliukas):',
            '  * Jei klientas jau turi gyvą kieto kuro katilą (Viadrus U22/U26, Kalvis, Vienybė, Atmos, Centrometal, Ferroli SFL, KaTRI), geriausias ROI — įmontuoti automatinį granulių degiklio komplektą: Megatherm 10–35 kW komplektas „Link lyderių“ (SKU "degkmpl140mg20", 2150,00 €) arba Pelltech PV20a/PV30a komplektas „Nord komfortui“ (SKU "degkmpl140pv20", 2350,00 €) su 1,5 m padavimo sraigtu, 460 L granulių talpa (SKU "23013009600X0", 220,00 €) ir automatika.',
            '- Atsarginės dalys ir greitas remontas žiemą (Gilės Inžinerijos linija):',
            '  * Kai užgesta granulių degiklis ir neuždega granulių: 80% atvejų perdegė uždegimo tenas (Ferroli SUN P7 / P12 patroninis/kvarcinis tenas 350 W, L=140 mm, Ø10 mm — SKU "KatF0033292", OEM kodas 39833290, kaina 35,00 €; arba Megatherm 425 W U formos metalinis tenas SKU "KatM39833425", 45,00 €; arba keraminis Si3N4 tenas Ø9.5mm / Ø9.9mm / Ø12.5mm) arba užsiteršė/sugedo fotoelementas (liepsnos jutiklis), skysto kuro degikliams — purkštukas Danfoss 030H8103.',
            '  * Pristatymas ir pagalba: prekes iš Vilniaus sandėlio pristatome visoje Lietuvoje per 2–5 d. d. (nemokamai nuo 50 €, kitu atveju pristatymas 3,99 €), pagalba ir sąmatos el. paštu info@gilesinzinerija.lt.',
        ].join('\n'),
    },
    {
        id: 'water_heaters_drazice_gorenje_dhw',
        title: 'Vandentiekis, boileriai (Dražice / Gorenje), geriamojo vandens plėtimosi indai ir nuotekos',
        keywords: [
            'boiler',
            'vandens šildytuv',
            'vandens sildytuv',
            'dražice',
            'drazice',
            'okc',
            'okc200ntr',
            'okc300ntrr-s',
            'gorenje',
            'surbl',
            'haier',
            'au082fycra',
            'aw082hvgha',
            'hp200m7c-f9',
            'hp80m8-9',
            'es10v',
            'es100v',
            'zv 25 s',
            'zv 100',
            'zv 300',
            'tgr',
            'gbfu',
            'tgrk80ng',
            'aquapresso',
            '7111020',
            'kalkėt',
            'kalket',
            'gręžin',
            'grezin',
            'sqe',
            '96510151',
            'nuotek',
            'drainlift',
            'sololift',
        ],
        prioritySkus: ['OKC200NTR', 'OKC300NTRR-S', 'TGRK80NG', 'ZV 100', 'HP200M7C-F9', 'AU082FYCRA(HW)', '7111020', '96510151'],
        content: [
            'CHUNK 6 — VANDENTIEKIS, BOILERIAI (DRAŽICE / GORENJE / HAIER), AKUMULIACINĖS TALPOS, ŠILUMOS SIURBLIAI IR NUOTEKOS:',
            '- Karšto vandens boileriai: Dražice OKC (kombinuoti su 1.0 m² šilumokaičiu ir 2.2 kW sausu keraminiu tenu, kuris tiesiogiai nesąveikauja su kalkėtu Lietuvos gręžinio vandeniu!), Dražice OKC 200 NTR (SKU "OKC200NTR", 760,00 €, su 1,45 m² / 32 kW šilumokaičiu katilams ir šilumos siurbliams), Dražice OKC 300 NTRR/SOL (SKU "OKC300NTRR-S", 1050,00 €, su 2 šilumokaičiais), Gorenje TGRK 80 NG (SKU "TGRK80NG", 269,00 €), Gorenje FTG 30..100 E5 plokšti boileriai (400–650 € su PVM), Gorenje GBU 50..120 E5 (370–480 € su PVM), Comfort U / GB 50..150 N su sausu tenu (300–450 € su PVM), mažos talpos GT 5 O / GT 5 U (130 € su PVM), greitaeigiai šilumos siurblių boileriai VLGM 200..300 (1 100–1 600 € su PVM), VLG400C1-1 (400 L, 2 000 € su PVM) ir 2-in-1 kombinuotas šilumos siurblio boileris su akumuliacine talpa ETT230/70 (230/70 L, 1 700 € su PVM).',
            '- Gorenje / TIKI ZV 25 S..ZV 300 akumuliacinės (buferinės) talpos šilumos siurbliams ir katilinėms (kainynas, 270 €–950 € su PVM): pakabinamos ZV 25 S (25 L, 270 €), ZV 50 S / ZV 50 (50 L, 320 € / 300 €), ZV 100 (100 L, 400 € / 370 €), ZV 100/8 su 8 atvamzdžiais (100 L, 450 €), pastatomos ZV 100 FS (100 L, 400 €), ZV 150 FS (150 L, 500 € / 480 €), ZV 200 (200 L, 800 € / 580 €) ir ZV 300 / ZV 300 C (300 L, 950 € su PVM).',
            '- Haier 2026 šilumos siurbliai ir vandens šildytuvai: oras–vanduo R32 monoblokai AU052FYCRA (2 280 €) / AU052FYCRB(HW) (5 kW, 3 170 € su PVM), AU082FYCRA (2 900 €) / AU082FYCRA(HW) (8 kW, 3 662 €), AU112FYCRA (4 300 €) / AU112FYCRA(HW) (11 kW, 5 949 €), AU162FYCRA (4 800 €) / AU162FYCRA(HW) (16 kW, 6 262 €); R290 šilumos siurbliai AW042HUGHA..AW16NHVGHA / AW062HVGHA (6 kW, 3 900 €) / AW082HUGHA (8 kW, 3 430 €) / AW082HVGHA (8 kW, 4 150 €) / AW102HVGHA (10 kW, 4 850 €) / AW162HVGHA (16 kW, 6 000 € su PVM) + vidiniai hidromoduliai HU102WAHYB / HU102F20AHYA su 200 L boileriu (2 609–6 424 € su PVM) bei komerciniai R290 Super Aqua Flexi AW26NMYGHA..AW40NMYGHA (26–40 kW, 8 629–9 730 € su PVM); R290 šilumos siurbliai–boileriai karštam vandeniui HP80M8-9..HP250M7C-F9 (80–250 L: HP80M8-9 1 682 €, HP110M8-9 1 430 €, HP150M8-9 1 505 €, HP200M7C-9 1 550 € / HP200M7C-F9 2 226 €, HP250M7C-F9 2 241 € / 2 200 € su PVM); Haier elektriniai katilai ES10V-F1 (9 kW, 990 €), ES50V-F3(EU) (14 kW, 1 040 €), ES80V-F3(EU) (21 kW, 1 130 €), ES100V-F3(EU) (28 kW, 1 230 € su PVM) ir elektriniai boileriai ES10V..ES100V (SQM1/SQM2 10–15 L 118–131 €, VH1 30–100 L 154–209 €, RM1 50–100 L 174–209 €, A3 30–100 L 129–184 €, plokšti TF7 / TF7W Wi-Fi 50–100 L 308–418 € su PVM).',
            '- Svarbi montavimo taisyklė: prie kiekvieno boilerio būtinas 6 bar apsauginis-atbulinis vožtuvas IR geriamojo vandens išsiplėtimo indas IMI Pneumatex Aquapresso AD 18.10 (SKU "7111020", 18 L, PN10, 168,40 €) arba Zilmet Hydro-Pro (8–18 L, PN10), kad šylant vandeniui nevarvėtų apsauginis vožtuvas.',
        ].join('\n'),
    },
];

export const GILES_COMPATIBILITY_AND_TRAP_MATRIX: string = [
    '=== GILĖS INŽINERIJOS SUDERINAMUMO MATRICA IR KRITINIŲ INŽINERINIŲ SPĄSTŲ ŽINYNAS (GILES_COMPATIBILITY_AND_TRAP_MATRIX) ===',
    'SPĄSTAI #1: Termostatinių galvų ir vožtuvų sriegių nesuderinamumas (M30×1.5 vs Danfoss RA 23mm Click vs RTD vs M28×1.5):',
    '- IMI Heimeier (K-galva SKU "6000-00.500", DX, EMO T pavara SKU "1837-00.500"), Comisa (pavara SKU "88.20.518"), Oventrop, Honeywell ir dauguma Kermi/Purmo/Korado VK įdėklų turi M30×1.5 sriegį.',
    '- Danfoss RA-N (SKU "013G0013" kampinis, SKU "013G0014" tiesus) ir Danfoss RA-G (SKU "013G1675", SKU "013G1677") vožtuvai turi Danfoss RA 23 mm Click (užspaudžiamą) kaklelį!',
    '- KAIP DERA: Ant Danfoss RA-N / RA-G be adapterio tinka TIK Danfoss RA serijos galvos (Danfoss RA 2990 SKU "013G2990", RA 2991 SKU "013G2991", RA 2970 SKU "013G2970", RAX Inox SKU "013G6075").',
    '- KRITINĖ TAISYKLĖ: Tiesiai užsukti IMI Heimeier K-galvos (6000-00.500, M30×1.5) arba EMO T pavaros ant Danfoss RA-N / RA-G vožtuvo NEGALIMA! Norint ant Danfoss RA vožtuvo uždėti Heimeier K-galvą (M30×1.5) arba EMO T pavarą, PRIVALOMAS Heimeier adapteris Danfoss RA vožtuvams (SKU: "9702-24.700", perėjimas iš Danfoss RA į M30×1.5)! Ir atvirkščiai – ant Heimeier V-exact II / Eclipse (M30×1.5) Danfoss RA 2990 Click galva NETINKA (reikia Heimeier K-galvos 6000-00.500 arba Danfoss RAW / Redia M30×1.5 SKU "013G6170")! Senam Danfoss RTD sriegiui reikia RTD adapterio arba RTD galvos; Herz M28×1.5 vožtuvams reikia M28 adapterio.',
    '',
    'SPĄSTAI #2: Vienvamzdės (1-pipe) ir dvivamzdės (2-pipe) sistemos vožtuvų sumaišymas:',
    '- Vienvamzdėje sistemoje su by-pass („permyčka“ – visi sovietiniai daugiabučiai ir senos gravitacinės sistemos) DRAUDŽIAMA dėti dvivamzdį vožtuvą su mažu Kvs (Danfoss RA-N su Kvs 0.65–0.90 ar Heimeier V-exact II / Eclipse), nes dėl didelio pasipriešinimo vanduo nueis per by-pass ir radiatorius nešils!',
    '- Vienvamzdei sistemai tinka TIK didelio pralaidumo Danfoss RA-G 15 (SKU "013G1675", Kvs 2.88) / RA-G 20 (SKU "013G1677", Kvs 3.74) arba IMI Heimeier padidinto pralaidumo vožtuvas (mėlynas dangtelis, Kvs 2.5–5.1).',
    '',
    'SPĄSTAI #3: Comisa daugiasluoksnių vamzdžių (PEX-AL-PEX) ir presuojamų / Eurokonuso jungčių suderinamumas:',
    '- Comisa vamzdžiai: 16×2.0 mm (grindiniam šildymui ir radiatoriams), 20×2.0 mm (magistralėms / 2–3 radiatoriams), 26×3.0 mm ir 32×3.0 mm (stovams ir katilinės aprišimui).',
    '- KAIP DERA: Prie Comisa grindinio šildymo kolektorių (pvz. SKU "88.20.415") ir RLV-K / Multilux H-mazgų atšakų 16×2.0 mm vamzdis jungiamas 3/4" Eurokonuso (G3/4 × 16×2.0, SKU "88.03.116" / "0601-02.350") suspaudžiama jungtimi – SVARBU: sienelės storis privalo būti 2.0 mm (netinka 16×2.2 mm vamzdis be atitinkamo 16×2.2 įdėklo, nes netilps konuso įvorė arba pratekės!). Presuojamos Comisa Press jungtys presuojamos TH profiliu (turi dvigubą EPDM O-žiedą ir tefloninį dielektrinį žiedą, kuris apsaugo aliuminio sluoksnį nuo elektrocheminės korozijos su žalvariu!).',
    '',
    'SPĄSTAI #4: Šilumos siurblys (Oras-Vanduo / Geoterminis) + netinkamas mažo šilumokaičio boileris (Dražice OKC vs OKC NTR/HP):',
    '- Jei klientas prie šilumos siurblio (50–55 °C termofikatas, pvz. 8 kW oras-vanduo) stato standartinį pakabinamą Dražice OKC 125 / OKC 160 boilerį su mažu 0.68–1.08 m² (0.7 m²) gyvatuku, šilumos siurblys dėl per mažo šilumokaičio ploto negali atiduoti galios, krenta į High Pressure (aukšto slėgio) avariją ir šildo vandenį elektriniu tenu!',
    '- KAIP DERA: Prie šilumos siurblio privalomas pastatomas greitaeigis boileris su padidintu šilumokaičiu: Dražice OKC NTR/HP (200 L / 250 L / 300 L, šilumokaičio plotas 2.1–3.2 m²), Dražice OKC 300 NTRR/SOL (SKU "OKC300NTRR-S", su dviem sujungtais šilumokaičiais) arba mažiausiai Dražice OKC 200 NTR (SKU "OKC200NTR", 1.45 m² / 32 kW). O prie kieto kuro / granulinio katilo (70–80 °C) idealiai tinka Dražice OKC kombinuotas boileris (1.0 m² šilumokaitis + 2.2 kW sausas keraminis tenas vasarai).',
    '',
    'SPĄSTAI #5: Kieto kuro ir granulinių katilų (Centrometal, Ferroli SFL, Viessmann, Buderus, KaTRI) aprišimas – kur meistras padaro avariją:',
    '- 1) Žemos grįžtamosios temperatūros korozija (< 55 °C): Be Laddomat arba 3-eigio termostatinio įkrovimo vožtuvo (>= 55–61 °C, pvz. HERZ Teplomix DN25 61 °C SKU "1776603" arba Watts) šaltas grįžtamas vanduo iš sistemos sukelia kondensatą ir dervų tekėjimą katile, ir plieninis katilas prakiūra per 2–3 sezonus!',
    '- 2) Uždaros sistemos perkaitimo apsauga dingus elektrai: Kieto kuro katile uždaroje sistemoje privalomas aušinimo šilumokaitis su termostatiniu apsauginiu vožtuvu (Watts STS-20, 97 °C), prijungtas prie vandentiekio, + 2.5–3 bar apsauginė grupė (Watts KSG 30 SKU "0270132")!',
    '- 3) Granulių degiklio parinkimas katilui:',
    '  * Ferroli SFL 3 / SFL 4 (19–27 kW) -> Ferroli SUN P7 (13.7–34.1 kW) arba Pelltech PV20a (SKU "degkmpl140pv20") / Megatherm 10–35 kW (Komplektas „Link lyderių“ SKU "degkmpl140mg20", 2150 €).',
    '  * Ferroli SFL 5 / SFL 6 / SFL 7 (36–50 kW) -> Ferroli SUN P12 (30–55 kW) arba Pelltech PV30a / PV50b / Komplektas „Vidutiniams“ 15–50 kW (SKU "degkmpl50kv", 2550 €).',
    '  * Centrometal EKO-CK P (14–90 kW, pvz. 25 kW SKU "17526") ir KaTRI 25 kW (SKU "KaTRI3850020") -> Centrometal Cm Pelet-set arba Pelltech / Megatherm komplektai.',
    '',
    'SPĄSTAI #6: IMI TA (STAD + STAP) balansavimo pora ir IMI Pneumatex (Statico + Aquapresso + Zeparo) montavimo vietos:',
    '- IMI TA STAP ir STAD montavimo taisyklė: IMI TA STAP (diferencinio slėgio reguliatorius, pvz. DN20 SKU "52-265-020") statomas GRĮŽTAMAJAME (Return) vamzdyje, o IMI TA STAD (rankinis balansinis-matavimo ventilis, pvz. DN15 SKU "52-151-014" / DN20 SKU "52-151-220") – PADUODAMAJAME (Supply) vamzdyje, ir abu sujungiami impulsiniu kapiliariniu vamzdeliu!',
    '- IMI Pneumatex Zeparo montavimo vietos: Zeparo ZUV (mikroburbuliukų oro nuorintuvas) statomas KARŠČIAUSIOJE sistemos vietoje – PADUODAMAJAME (Supply) vamzdyje iškart už katilo! O Zeparo ZUD / ZUKM (šlamo ir magnetito separatorius) statomas GRĮŽTAMAJAME (Return) vamzdyje prieš cirkuliacinį siurblį ir katilą, kad magnetitas nesugadintų Wilo Yonos PICO (SKU "4248084") / Grundfos ALPHA2 elektroninio siurblio rotoriaus! Kombinuotas Zeparo ZUVS 20 (SKU "7891720") sujungia oro ir šlamo šalinimą.',
    '- IMI Pneumatex Statico vs Aquapresso: Statico SD (pvz. SKU "7101003", 25 L, PN3, darbinė temp. iki 120 °C) skirtas TIK šildymo sistemai! DRAUDŽIAMA dėti šildymo išsiplėtimo indą (Statico) ant geriamojo vandens boilerio (Dražice / Gorenje), nes neatlaikys vandentiekio slėgio (PN3 vs PN10), vanduo dvoks guma ir surūdys nepadengtas flanšas – geriamojo vandens boileriui PRIVALOMAS higieninis PN10 indas su nerūdijančiu flanšu ir butilo membrana: IMI Pneumatex Aquapresso AD 18.10 (SKU "7111020" / "7111017", PN10) arba Zilmet Hydro-Pro PN10!',
    '',
    'SPĄSTAI #7: Vario (SANHA), plastiko (FV-Plast PPR, Wavin) ir cinkuoto plieno kombinavimas:',
    '- Elektrocheminė korozija: Vandens srauto kryptimi DRAUDŽIAMA montuoti cinkuotą plieną po varinių (SANHA) vamzdžių (vario jonai nusėda ant cinko, suėda cinko sluoksnį ir vamzdis prakiūra!).',
    '- FV-Plast PPR virinami vamzdžiai šildymui privalo būti armuoti stiklo pluoštu (FASER) arba aliuminiu (STABI) su deguonies barjeru (EVOH), nes paprastas vandentiekio PPR vamzdis nuo 70 °C išlinksta („gyvatė“) ir praleidžia deguonį į šildymo sistemą!',
    '',
    'SPĄSTAI #8: Grindinio šildymo pavarų (EMO T 230V NC vs 24V ir NC vs NO) ir kolektoriaus maišymo mazgo parinkimas:',
    '- Jei kieto kuro katilas ar radiatoriai dirba 60–75 °C (pvz. 70 °C) režimu, į Comisa grindinio šildymo kolektorių (SKU "88.20.415") DRAUDŽIAMA paduoti tiesioginį 70 °C vandenį (sutrūkinės betono išlyginamasis sluoksnis, perkais grindys ir bus pažeistas vamzdis)! Būtinas kolektoriaus pamaišymo mazgas su termostatine galva ir kapiliariniu jutikliu (ribojantis temperatūrą į grindis iki 20–50 °C, darbinė 30–38 °C) bei cirkuliaciniu siurbliu (Wilo Yonos PICO 25/1-6 SKU "4248084")!',
    '- Pavaros (IMI Heimeier EMO T SKU "1837-00.500", Comisa SKU "88.20.518"): 95% atvejų naudojamos 230 V NC (Normally Closed – be įtampos uždarytos) su M30×1.5 sriegiu, kad atitiktų 230 V laidinius arba belaidžius komutatorius ir kambario termostatus (Watts WFHT-LCD SKU "9018586")!',
].join('\n');

export function selectRelevantLtMarketChunks(
    combinedQueryText: string,
    telemetry?: ClientTelemetry | null,
): LtMarketStandardChunk[] {
    return retrieveLtMarketStandardsChunks(combinedQueryText, telemetry);
}

export function retrieveLtMarketStandardsChunks(
    combinedQueryText: string,
    telemetry?: ClientTelemetry | null,
): LtMarketStandardChunk[] {
    const telemetryText = [
        telemetry?.currentProduct?.sku,
        telemetry?.currentProduct?.title,
        telemetry?.currentProduct?.category,
        ...(telemetry?.recentlyViewedSkus || []),
    ]
        .filter(Boolean)
        .join(' ');
    const fullText = `${combinedQueryText || ''} ${telemetryText}`.toLowerCase();

    const scored = LT_MARKET_STANDARDS_CHUNKS.map((chunk) => {
        let score = 0;
        for (const kw of chunk.keywords) {
            if (fullText.includes(kw.toLowerCase())) {
                score += kw.length >= 6 ? 3 : 2;
            }
        }
        for (const sku of chunk.prioritySkus) {
            if (fullText.includes(sku.toLowerCase())) {
                score += 5;
            }
        }
        return { chunk, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const matched = scored.filter((s) => s.score > 0).map((s) => s.chunk);
    if (matched.length > 0) {
        return matched.slice(0, 3);
    }
    return [
        LT_MARKET_STANDARDS_CHUNKS[0],
        LT_MARKET_STANDARDS_CHUNKS[4],
    ];
}

export function formatLtMarketStandardsRagBlock(
    combinedQueryText: string,
    telemetry?: ClientTelemetry | null,
): {
    chunks: LtMarketStandardChunk[];
    prioritySkus: string[];
    promptSection: string;
} {
    const chunks = retrieveLtMarketStandardsChunks(combinedQueryText, telemetry);
    const prioritySkus = Array.from(new Set(chunks.flatMap((c) => c.prioritySkus)));
    const promptSection = [
        '=== LIETUVOS DAUGIABUČIŲ, INDIVIDUALIŲ NAMŲ IR ŠVOK RINKOS STANDARTŲ RAG ŽINIŲ BAZĖ ===',
        ...chunks.map((c) => c.content),
        '',
        GILES_COMPATIBILITY_AND_TRAP_MATRIX,
    ].join('\n\n');

    return {
        chunks,
        prioritySkus,
        promptSection,
    };
}

export function formatSilentClientTelemetryBlock(
    telemetry?: ClientTelemetry | null,
): string {
    if (!telemetry) return '';
    const lines: string[] = [];

    if (telemetry.currentPage || telemetry.currentPath) {
        lines.push(
            `- Dabartinis puslapis: ${telemetry.currentPage || 'storefront'}${telemetry.currentPath ? ` (${telemetry.currentPath})` : ''}`,
        );
    }
    if (telemetry.currentProduct && (telemetry.currentProduct.sku || telemetry.currentProduct.title)) {
        const p = telemetry.currentProduct;
        lines.push(
            `- Klientas ŠIUO METU atsidaręs ir žiūri konkrečią prekę (currentProduct): SKU="${p.sku}", Pavadinimas="${p.title}"${p.brand ? `, Gamintojas="${p.brand}"` : ''}${p.category ? `, Kategorija="${p.category}"` : ''}${typeof p.priceEur === 'number' ? `, Kaina=${p.priceEur.toFixed(2)} €` : ''}${p.specs ? `, Specifikacija="${p.specs}"` : ''}`,
        );
    }
    if (Array.isArray(telemetry.recentlyViewedSkus) && telemetry.recentlyViewedSkus.length > 0) {
        lines.push(`- Šioje sesijoje neseniai peržiūrėtos prekės: ${telemetry.recentlyViewedSkus.slice(0, 5).join(', ')}`);
    }
    if (Array.isArray(telemetry.cartItems) && telemetry.cartItems.length > 0) {
        lines.push(`- Kliento krepšelyje šiuo metu yra: ${telemetry.cartItems.slice(0, 8).join('; ')}`);
    }
    if (telemetry.activeCalculatorSummary) {
        lines.push(`- Šioje sesijoje aktyviai naudota skaičiuoklė: ${telemetry.activeCalculatorSummary}`);
    }

    if (lines.length === 0) return '';

    return [
        '=== SILENT_CLIENT_TELEMETRY (TYLUS KLIENTO ELGSENOS KONTEKSTAS — NAUDOK TIK KAI AKTUALU!) ===',
        ...lines,
        'KRITINĖ SILENT_CLIENT_TELEMETRY TAISYKLĖ:',
        '- NIEKADA nekartok šabloninių frazių kaip „Matau pagal jūsų skaičiavimą...“ arba „Matau jūsų paiešką...“, kai klientas tiesiog sveikinasi, juokauja arba klausia nesusijusio klausimo!',
        '- Naudok SILENT_CLIENT_TELEMETRY TIK TADA, kai tai tiesiogiai padeda atsakyti į kliento klausimą (pavyzdžiui, kai klientas yra prekės puslapyje ir klausia „ką dar prie šito katilo/prekės reikia nusipirkti?“, „ar šitas tiks mano senam daugiabučiui?“, arba prašo patikrinti krepšelį). Tada iš karto suprask, apie kurią prekę (`currentProduct`) jis kalba, įvardink ją ir atsakyk kaip aukščiausio lygio vyriausiasis inžinierius!',
    ].join('\n');
}
