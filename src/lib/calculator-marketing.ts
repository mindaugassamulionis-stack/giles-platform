import type { CalculatorToolId } from './scientific-calculators';

export interface CalculatorRecommendedProductRef {
    sku: string;
    label: string;
    name: string;
    href: string;
    searchQuery: string;
}

export interface CalculatorComparisonRow {
    variant: string;
    whenToChoose: string;
    keyAdvantage: string;
    recommendedModels: string;
    recommendedProducts: CalculatorRecommendedProductRef[];
    vytautasPrompt: string;
}

export interface CalculatorMarketingContent {
    toolId: CalculatorToolId;
    commonMistake: string;
    whoAndWhat: string;
    threeSteps: [string, string, string];
    comparisonTitle: string;
    comparisonSubtitle: string;
    comparisonRows: CalculatorComparisonRow[];
}

export const CALCULATOR_MARKETING_BY_TOOL: Record<CalculatorToolId, CalculatorMarketingContent> = {
    boiler: {
        toolId: 'boiler',
        commonMistake:
            'Perkamas 2 kartus per didelio galingumo 24–32 kW katilas gerai apšiltintam A+/A++ namui (kuriam žiemą reikia vos 5–7 kW). Dėl per didelės minimalios galios katilas kas kelias minutes junginėjasi („taktuoja“), degina daugiau dujų ir greičiau dėvisi, arba 4 asmenų šeimai pasirenkamas momentinis ruošimas be boilerio ir prausiantis dviem dušais dingsta karštas vanduo.',
        whoAndWhat:
            'Skirta namo savininkams ir montuotojams, planuojantiems naują katilinę ar keičiantiems seną katilą. Tiksliai sužinosite, kokios šiluminės galios (kW) šaltinio ir kokios talpos (80–300 L) greitaeigio boilerio reikia būtent jūsų būsto plotui, šiltinimo klasei bei šeimos dydžiui.',
        threeSteps: [
            '1. Pasirinkite savo būsto plotą, energetinę klasę ir gyventojų skaičių.',
            '2. Peržiūrėkite vizualią namo šilumos schemą ir rekomenduojamą galią (kW) bei boilerio litražą.',
            '3. Išsirinkite tiksliai tinkančius katilus, šildytuvus ir katilinės priedus apačioje.',
        ],
        comparisonTitle: 'Palyginimas: kurį variantą rinktis jūsų atveju?',
        comparisonSubtitle: 'Trijų pagrindinių šildymo ir karšto vandens ruošimo schemų palyginimas pagal komfortą ir ekonomiškumą',
        comparisonRows: [
            {
                variant: 'Dvikontūris momentinis katilas (24 kW)',
                whenToChoose: 'Butams ir mažiems namams su 1 vonios kambariu, kai katilinėje nėra vietos pastatomam boileriui.',
                keyAdvantage: 'Kompaktiškas sprendimas ant sienos be atskiros vandens talpos; karštas vanduo ruošiamas tik atsukus čiaupą.',
                recommendedModels: 'Ferroli Bluehelix / Divacondens 24 kW + IMI Pneumatex Zeparo',
                recommendedProducts: [
                    {
                        sku: 'GI-FERROLI-001',
                        label: 'Ferroli kondensacinis katilas',
                        name: 'Ferroli kondensacinis katilas',
                        href: '/products?q=Ferroli',
                        searchQuery: 'Ferroli',
                    },
                    {
                        sku: '7895122',
                        label: 'IMI Pneumatex Zeparo ZUC 22',
                        name: 'IMI Pneumatex Zeparo ZUC 22',
                        href: '/products?q=7895122',
                        searchQuery: '7895122',
                    },
                ],
                vytautasPrompt:
                    'Domina variantas: Dvikontūris momentinis katilas (24 kW). Kokį konkretų katilo modelį ir katilinės priedus iš jūsų katalogo rekomenduojate mano apskaičiuotam plotui?',
            },
            {
                variant: 'Katilas su atskiru tūriniu boileriu (120–200 L)',
                whenToChoose: '3–5 asmenų šeimos namui su 2 vonios kambariais, vonia ar cirkuliacine karšto vandens linija.',
                keyAdvantage: 'Stabilus karšto vandens spaudimas keliuose čiaupuose vienu metu ir jokio katilo taktavimo.',
                recommendedModels: 'Vienkontūris katilas + 150–200 L boileris + Aquapresso A indas',
                recommendedProducts: [
                    {
                        sku: '7101003',
                        label: 'IMI Pneumatex Statico SD 25.3',
                        name: 'IMI Pneumatex Statico SD 25.3',
                        href: '/products?q=7101003',
                        searchQuery: '7101003',
                    },
                    {
                        sku: 'AQUAPRESSO',
                        label: 'IMI Pneumatex Aquapresso indas boileriui',
                        name: 'IMI Pneumatex Aquapresso indas boileriui',
                        href: '/products?q=Aquapresso',
                        searchQuery: 'Aquapresso',
                    },
                ],
                vytautasPrompt:
                    'Domina variantas: Katilas su atskiru tūriniu boileriu (120–200 L). Kokius konkrečius modelius ir priedus iš jūsų katalogo rekomenduojate mano apskaičiuotam plotui?',
            },
            {
                variant: 'Šilumos siurblys (oras–vanduo) + greitaeigis boileris',
                whenToChoose: 'A+ ir A++ klasės namams su grindiniu šildymu arba žematemperatūriais radiatoriais (35–45 °C).',
                keyAdvantage: 'Mažiausi eksploataciniai kaštai, tylus darbas ir pilna integracija su IMI Heimeier Dynacon kolektoriais.',
                recommendedModels: 'Žematemperatūris šilumos šaltinis + Zeparo ZUK + Statico SD',
                recommendedProducts: [
                    {
                        sku: '9330-06.800',
                        label: 'IMI Heimeier Dynacon Eclipse 6 kont.',
                        name: 'IMI Heimeier Dynacon Eclipse 6 kont.',
                        href: '/products?q=9330-06.800',
                        searchQuery: '9330-06.800',
                    },
                    {
                        sku: '7895122',
                        label: 'IMI Pneumatex Zeparo ZUC 22',
                        name: 'IMI Pneumatex Zeparo ZUC 22',
                        href: '/products?q=7895122',
                        searchQuery: '7895122',
                    },
                ],
                vytautasPrompt:
                    'Domina variantas: Šilumos siurblys (oras–vanduo) su greitaeigiu boileriu ir grindiniu šildymu. Kokius IMI Pneumatex ir Heimeier komponentus rekomenduojate šiam mazgui?',
            },
        ],
    },
    vessel: {
        toolId: 'vessel',
        commonMistake:
            'Grindinio šildymo sistemai (kurioje cirkuliuoja ~220–300 L vandens) iš akies nuperkamas mažas 12 L arba 18 L plėtimosi indas, arba prieš montuojant nesureguliuojamas oro pagalvės slėgis P0 sausame inde. Rezultatas: šildant katilui slėgis šoka iki 3 bar, apsauginis vožtuvas pradeda spjaudyti vandenį, o ryte sistema sustoja dėl per žemo slėgio.',
        whoAndWhat:
            'Skirta kiekvienam, kuris nori stabilaus katilinės slėgio be varvančių apsauginių vožtuvų ir oro kamščių. Sužinosite tikslų reikiamą plėtimosi indo tūrį (litrais) ir kokį pradinį oro slėgį (bar) nustatyti pagal savo namo aukštį.',
        threeSteps: [
            '1. Pasirinkite šildymo sistemos galią (kW), šildymo prietaisų tipą ir pastato aukštį.',
            '2. Peržiūrėkite vizualią membraninio indo pjūvio schemą, reikiamą tūrį (L) ir oro slėgį (bar).',
            '3. Išsirinkite tiksliai tinkančius IMI Pneumatex Statico indus, laikiklius ir apsauginius vožtuvus apačioje.',
        ],
        comparisonTitle: 'Palyginimas: kurį variantą rinktis jūsų atveju?',
        comparisonSubtitle: 'Kuo skiriasi šildymo sistemos ir geriamojo vandens (boilerio) plėtimosi indai',
        comparisonRows: [
            {
                variant: 'IMI Pneumatex Statico SD (šildymo sistemai, 3 bar)',
                whenToChoose: 'Uždaroms šildymo sistemoms (katilams, šilumos siurbliams, grindiniam šildymui ir radiatoriams).',
                keyAdvantage: 'Šveicariška Airproof butilo membrana išlaiko oro pagalvės slėgį net iki 10 kartų ilgiau nei įprasta EPDM guma.',
                recommendedModels: 'Statico SD 18.3 / 25.3 / 35.3 / 50.3 + DLV aptarnavimo čiaupas',
                recommendedProducts: [
                    {
                        sku: '7101003',
                        label: 'Statico SD 25.3 (3 bar)',
                        name: 'Statico SD 25.3 (3 bar)',
                        href: '/products?q=7101003',
                        searchQuery: '7101003',
                    },
                    {
                        sku: '7101004',
                        label: 'Statico SD 35.3 (3 bar)',
                        name: 'Statico SD 35.3 (3 bar)',
                        href: '/products?q=7101004',
                        searchQuery: '7101004',
                    },
                ],
                vytautasPrompt:
                    'Domina variantas: IMI Pneumatex Statico SD plėtimosi indas šildymo sistemai. Kokį tikslų litražą, DLV atjungimo vožtuvą ir konsolę rekomenduojate mano sistemai?',
            },
            {
                variant: 'IMI Pneumatex Aquapresso A (geriamam vandeniui / boileriui, iki 10 bar)',
                whenToChoose: 'Karšto vandens boileriams ir vandentiekio įvadui, kur darbinis slėgis siekia 4–8 bar.',
                keyAdvantage: 'Higieniška pratekėjimo konstrukcija (apsaugo nuo Legionella bakterijų) ir nerūdijančio plieno jungtis.',
                recommendedModels: 'Aquapresso A 12 / 19 / 25 / 35 + DSV apsauginis vožtuvas',
                recommendedProducts: [
                    {
                        sku: 'AQUAPRESSO-19',
                        label: 'IMI Pneumatex Aquapresso 19 L',
                        name: 'IMI Pneumatex Aquapresso 19 L',
                        href: '/products?q=Aquapresso',
                        searchQuery: 'Aquapresso',
                    },
                    {
                        sku: 'DSV-DGH',
                        label: 'Pneumatex DSV apsauginis vožtuvas',
                        name: 'Pneumatex DSV apsauginis vožtuvas',
                        href: '/products?q=DSV',
                        searchQuery: 'DSV',
                    },
                ],
                vytautasPrompt:
                    'Domina variantas: IMI Pneumatex Aquapresso A geriamojo vandens plėtimosi indas boileriui (iki 10 bar). Kokio tūrio indo ir apsauginio vožtuvo reikia mano boileriui?',
            },
            {
                variant: 'Pilnas katilinės slėgio ir nuorinimo mazgas (Statico SD + Zeparo)',
                whenToChoose: 'Kai norite vienu kartu išspręsti ir slėgio svyravimus, ir oro burbuliukų bei šlamo šalinimą iš sistemos.',
                keyAdvantage: 'Membrana apsaugoma nuo dumblo, o radiatoriai ir grindų kontūrai nebeužsiorina.',
                recommendedModels: 'IMI Pneumatex Statico SD + Zeparo ZUC / ZUK mikroburbulų separatorius',
                recommendedProducts: [
                    {
                        sku: '7101003',
                        label: 'Statico SD 25.3 plėtimosi indas',
                        name: 'Statico SD 25.3 plėtimosi indas',
                        href: '/products?q=7101003',
                        searchQuery: '7101003',
                    },
                    {
                        sku: '7895122',
                        label: 'Zeparo ZUC 22 separatorius',
                        name: 'Zeparo ZUC 22 separatorius',
                        href: '/products?q=7895122',
                        searchQuery: '7895122',
                    },
                ],
                vytautasPrompt:
                    'Domina pilnas katilinės slėgio ir nuorinimo mazgas (IMI Pneumatex Statico SD + Zeparo separatorius). Padėkite sukomplektuoti visas reikiamas dalis.',
            },
        ],
    },
    valve: {
        toolId: 'valve',
        commonMistake:
            'Vamzdžio ir balansinio vožtuvo skersmuo parenkamas tiesiog pagal katilo atvamzdį (pvz., visur dedamas siauras DN15), neįvertinus vandens greičio. Kai greitis viršija 0,75–1,0 m/s, vamzdynuose ir radiatoriuose atsiranda nuolatinis ūžimas, o tolimiausi antro aukšto kambariai lieka šalti, nes visas karštas vanduo sukasi per arčiausiai katilinės esantį kontūrą.',
        whoAndWhat:
            'Skirta montuotojams ir namų savininkams, norintiems tyliai veikiančios ir tolygiai šildančios sistemos. Per kelias sekundes sužinosite reikiamą vamzdžio skersmenį (DN15–DN50), pralaidumą Kv ir matysite, ar vandens greitis neviršija tylos ribos.',
        threeSteps: [
            '1. Pasirinkite šakos ar stovo šiluminę galią (kW) ir temperatūrų skirtumą ΔT.',
            '2. Peržiūrėkite vizualią vamzdžio pjūvio schemą, vandens greičio spidometrą ir rekomenduojamą DN.',
            '3. Išsirinkite tiksliai tinkančius IMI TA STAD balansinius vožtuvus ir slėgio reguliatorius apačioje.',
        ],
        comparisonTitle: 'Palyginimas: kurį variantą rinktis jūsų atveju?',
        comparisonSubtitle: 'Rankinis statinis balansavimas vs. automatinis dinaminis slėgio ir srauto palaikymas',
        comparisonRows: [
            {
                variant: 'IMI TA STAD (rankinis balansinis vožtuvas su matavimo nipeliais)',
                whenToChoose: 'Pagrindinėms katilinės šakoms, aukštų stovams, boilerio kontūrui ir pastovaus srauto sistemoms.',
                keyAdvantage: 'AMETAL lydinys (atsparus cinko išplovimui), tiksli skaitmeninė rankenėlė su „Memory stop“ ir matavimo nipeliai.',
                recommendedModels: 'IMI TA STAD DN15 (52-151-015), DN20 (52-151-020), DN25 (52-151-025)',
                recommendedProducts: [
                    {
                        sku: '52-151-020',
                        label: 'IMI TA STAD DN20 balansinis vožtuvas',
                        name: 'IMI TA STAD DN20 balansinis vožtuvas',
                        href: '/products?q=52-151-020',
                        searchQuery: '52-151-020',
                    },
                    {
                        sku: '52-151-025',
                        label: 'IMI TA STAD DN25 balansinis vožtuvas',
                        name: 'IMI TA STAD DN25 balansinis vožtuvas',
                        href: '/products?q=52-151-025',
                        searchQuery: '52-151-025',
                    },
                ],
                vytautasPrompt:
                    'Domina variantas: IMI TA STAD rankinis balansinis vožtuvas. Kokį DN skersmenį ir nustatymą rekomenduojate mano šakos galiai ir srautui?',
            },
            {
                variant: 'TA-Modulator / Danfoss ASV-PV (automatinis slėgio ir srauto palaikymas)',
                whenToChoose: 'Didesniems namams ir daugiabučiams, kur termostatinės galvutės ar pavaros nuolat uždarinėja atskirus kontūrus.',
                    keyAdvantage: 'Automatiškai kompensuoja slėgio šuolius – uždarius dalį radiatorių, kiti nepradeda švilpti ir ūžti.',
                recommendedModels: 'IMI TA-Modulator / TA-Compact-P / Danfoss ASV-PV + ASV-BD',
                recommendedProducts: [
                    {
                        sku: 'TA-MODULATOR',
                        label: 'IMI TA-Modulator dinaminis vožtuvas',
                        name: 'IMI TA-Modulator dinaminis vožtuvas',
                        href: '/products?q=TA-Modulator',
                        searchQuery: 'TA-Modulator',
                    },
                    {
                        sku: '003Z5501',
                        label: 'Danfoss ASV-PV slėgio reguliatorius',
                        name: 'Danfoss ASV-PV slėgio reguliatorius',
                        href: '/products?q=ASV-PV',
                        searchQuery: 'ASV-PV',
                    },
                ],
                vytautasPrompt:
                    'Domina variantas: Automatinis slėgio ir srauto palaikymas (TA-Modulator arba Danfoss ASV-PV). Kaip teisingai sukomplektuoti šią porą mano stovui?',
            },
            {
                variant: 'Individualus balansavimas prie prietaisų (IMI Heimeier Eclipse AFC)',
                whenToChoose: 'Kai namo stovai neturi atskirų balansinių vožtuvų ir norite srautą apriboti tiesiai prie kiekvieno radiatoriaus ar kolektoriaus.',
                keyAdvantage: 'Automatinis srauto ribotuvas palaiko tikslų l/h srautą nepriklausomai nuo diferencialinio slėgio svyravimų.',
                recommendedModels: 'IMI Heimeier Eclipse DN15 (3933-02.000) / Dynacon Eclipse kolektorius',
                recommendedProducts: [
                    {
                        sku: '3933-02.000',
                        label: 'IMI Heimeier Eclipse DN15 su AFC',
                        name: 'IMI Heimeier Eclipse DN15 su AFC',
                        href: '/products?q=3933-02.000',
                        searchQuery: '3933-02.000',
                    },
                    {
                        sku: '9330-06.800',
                        label: 'IMI Heimeier Dynacon Eclipse',
                        name: 'IMI Heimeier Dynacon Eclipse',
                        href: '/products?q=Dynacon',
                        searchQuery: 'Dynacon',
                    },
                ],
                vytautasPrompt:
                    'Domina automatinis balansavimas su IMI Heimeier Eclipse AFC. Kokius vožtuvus ir jungtis parinkti mano sistemai?',
            },
        ],
    },
    manifold: {
        toolId: 'manifold',
        commonMistake:
            'Perkamas per mažo kontūrų skaičiaus kolektorius ir vienas grindinio šildymo žiedas išvyniojamas po 110–130 metrų, arba įsigyjamas paprastas kolektorius be automatinio srauto palaikymo. Dėl per ilgo vamzdžio cirkuliacinis siurblys nebeįveikia pasipriešinimo, rotametrai rodo vos 0,5 l/min, o tolimiausių kambarių grindys lieka vėsios.',
        whoAndWhat:
            'Skirta įsirengiantiems grindinį šildymą ir norintiems tiksliai žinoti, kelių kontūrų (2–12) kolektoriaus, kiek metrų PE-Xa vamzdžio, kiek pavarų ir Eurokonuso jungčių reikės be likučių ar trūkumo.',
        threeSteps: [
            '1. Pasirinkite grindinio šildymo plotą (m²) ir vamzdžio klojimo žingsnį (10, 15 arba 20 cm).',
            '2. Peržiūrėkite vizualią kontūrų schemą, rekomenduojamą kolektoriaus dydį ir bendrą vamzdžio ilgį.',
            '3. Išsirinkite tiksliai tinkančius IMI Heimeier Dynacon Eclipse kolektorius, pavaras ir Eurokonusus apačioje.',
        ],
        comparisonTitle: 'Palyginimas: kurį variantą rinktis jūsų atveju?',
        comparisonSubtitle: 'Automatinis srauto palaikymas (AFC) vs. standartinis kolektorius su rotametrais',
        comparisonRows: [
            {
                variant: 'IMI Heimeier Dynacon Eclipse (su automatiniu srauto palaikymu AFC – nereikia rankinio balansavimo)',
                whenToChoose: 'Visiems šiuolaikiniams namams, kai norite vienodai šiltų grindų be sudėtingo hidraulinio derinimo.',
                keyAdvantage: 'Kiekviename kontūre tiesiog nustatote srautą (l/h) – kolektorius pats automatiškai palaiko srautą, net kai dalis kambarių atsijungia.',
                recommendedModels: 'IMI Heimeier Dynacon Eclipse 4–12 kontūrų (9330-xx.800) + EMO T pavaros',
                recommendedProducts: [
                    {
                        sku: '9330-06.800',
                        label: 'Dynacon Eclipse 6 kontūrų',
                        name: 'Dynacon Eclipse 6 kontūrų',
                        href: '/products?q=9330-06.800',
                        searchQuery: '9330-06.800',
                    },
                    {
                        sku: '9330-08.800',
                        label: 'Dynacon Eclipse 8 kontūrų',
                        name: 'Dynacon Eclipse 8 kontūrų',
                        href: '/products?q=9330-08.800',
                        searchQuery: '9330-08.800',
                    },
                ],
                vytautasPrompt:
                    'Domina variantas: IMI Heimeier Dynacon Eclipse kolektorius su automatiniu srauto palaikymu (AFC). Padėkite sukomplektuoti kolektorių, EMO T pavaras ir Eurokonusus pagal mano kontūrų skaičių.',
            },
            {
                variant: 'Standartinis nerūdijančio plieno kolektorius su rotametrais',
                whenToChoose: 'Standartiniams projektams, kai sistemą paleidžia ir visus kontūrus pagal projektą sukalibruoja santechnikas.',
                keyAdvantage: 'Skaidrūs srauto matuokliai (l/min) leidžia vizualiai matyti kiekvieno žiedo cirkuliaciją.',
                recommendedModels: 'Nerūdijančio plieno kolektorius + 3/4" Eurokonusai (0601-02.350)',
                recommendedProducts: [
                    {
                        sku: '0601-02.350',
                        label: 'Heimeier Eurokonusas G3/4 16x2',
                        name: 'Heimeier Eurokonusas G3/4 16x2',
                        href: '/products?q=Eurokonusas',
                        searchQuery: 'Eurokonusas',
                    },
                    {
                        sku: '1837-00.500',
                        label: 'IMI Heimeier EMO T 230V pavara',
                        name: 'IMI Heimeier EMO T 230V pavara',
                        href: '/products?q=1837-00.500',
                        searchQuery: '1837-00.500',
                    },
                ],
                vytautasPrompt:
                    'Domina standartinis grindinio šildymo kolektorius su rotametrais, 3/4" Eurokonusais ir 230V pavaromis. Kiek dalių reikės mano plotui?',
            },
            {
                variant: 'Zoninis grindinio šildymo automatizavimas (230V NC pavaros + termostatai)',
                whenToChoose: 'Kai norite atskirai reguliuoti miegamojo, svetainės ir vonios temperatūrą kiekviename kambaryje.',
                keyAdvantage: 'Termoelektrinės pavaros M30×1,5 uždaro tik tuos žiedus, kuriuose pasiekta norima temperatūra.',
                recommendedModels: 'IMI Heimeier EMO T 230V NC (1837-00.500) / Danfoss TWA-A pavaros',
                recommendedProducts: [
                    {
                        sku: '1837-00.500',
                        label: 'IMI Heimeier EMO T 230V NC',
                        name: 'IMI Heimeier EMO T 230V NC',
                        href: '/products?q=1837-00.500',
                        searchQuery: '1837-00.500',
                    },
                    {
                        sku: '088H0110',
                        label: 'Danfoss TWA-A 230V pavara',
                        name: 'Danfoss TWA-A 230V pavara',
                        href: '/products?q=088H0110',
                        searchQuery: '088H0110',
                    },
                ],
                vytautasPrompt:
                    'Domina grindinio šildymo kolektoriaus automatizavimas su 230V NC pavaromis. Kokias pavaras (Heimeier EMO T ar Danfoss TWA) parinkti mano kolektoriui?',
            },
        ],
    },
    radiator: {
        toolId: 'radiator',
        commonMistake:
            'Nuperkama standartinė M30×1,5 termostatinė galvutė ir bandoma ją užsukti ant Danfoss RA-N vožtuvo su „Click“ (23 mm) jungtimi, arba apatiniam radiatoriaus pajungimui (VK 50 mm) nuperkami šoniniai vožtuvai vietoj H-bloko („binoklio“). Dar viena dažna bėda – po vasaros užstrigusi vožtuvo adatėlė arba nevienodai šylantys radiatoriai.',
        whoAndWhat:
            'Skirta keičiantiems radiatorius ar termostatines galvutes. Vedlys užtikrina, kad galvutės sriegis (RA Click arba M30×1,5), vožtuvo korpusas, 50 mm H-blokas ir Eurokonuso jungtys 100 % derėtų tarpusavyje.',
        threeSteps: [
            '1. Pasirinkite radiatorių skaičių, vamzdžių pajungimo būdą (apatinis 50 mm arba šoninis) ir balansavimo tipą.',
            '2. Peržiūrėkite vizualią radiatoriaus mazgo schemą ir tikslų reikiamų detalių sąrašą.',
            '3. Išsirinkite tiksliai tinkančius termostatines galvutes, vožtuvus ir jungtis apačioje.',
        ],
        comparisonTitle: 'Palyginimas: kurį variantą rinktis jūsų atveju?',
        comparisonSubtitle: 'Danfoss RA Click vs. IMI Heimeier M30×1,5 vs. automatiniai Heimeier Eclipse vožtuvai',
        comparisonRows: [
            {
                variant: 'Danfoss RA Click (greita „Click“ jungtis be įrankių)',
                whenToChoose: 'Kai montuojate arba jau turite Danfoss RA-N / RA-DV serijos radiatorinius vožtuvus.',
                keyAdvantage: 'Užsifiksuoja vienu paspaudimu be veržliarakčio; skystinis jutiklis (Redia / Aero) reaguoja itin greitai.',
                recommendedModels: 'Danfoss Redia 013G2970 + Danfoss RA-N DN15 vožtuvas 013G0013',
                recommendedProducts: [
                    {
                        sku: '013G2970',
                        label: 'Danfoss Redia RA Click galvutė',
                        name: 'Danfoss Redia RA Click galvutė',
                        href: '/products?q=013G2970',
                        searchQuery: '013G2970',
                    },
                    {
                        sku: '013G0013',
                        label: 'Danfoss RA-N DN15 vožtuvas',
                        name: 'Danfoss RA-N DN15 vožtuvas',
                        href: '/products?q=013G0013',
                        searchQuery: '013G0013',
                    },
                ],
                vytautasPrompt:
                    'Domina variantas: Danfoss RA Click termostatinės galvutės ir RA-N / RLV-K vožtuvai. Padėkite sukomplektuoti pilną komplektą mano radiatoriams.',
            },
            {
                variant: 'IMI Heimeier M30×1,5 (universalus sriegis)',
                whenToChoose: 'Kai naudojate IMI Heimeier vožtuvus arba radiatorius su integruotu M30×1,5 termostatiniu įdėklu.',
                keyAdvantage: 'Populiariausias Europos sriegio standartas (M30×1,5) – tvirta metalinė veržlė ir vokiška K-galvutė.',
                recommendedModels: 'IMI Heimeier K-galvutė 6000-00.500 + V-exact II / Multilux H-blokas',
                recommendedProducts: [
                    {
                        sku: '6000-00.500',
                        label: 'IMI Heimeier K-galvutė M30x1,5',
                        name: 'IMI Heimeier K-galvutė M30x1,5',
                        href: '/products?q=6000-00.500',
                        searchQuery: '6000-00.500',
                    },
                    {
                        sku: '3850-02.000',
                        label: 'IMI Heimeier Multilux 50 mm H-blokas',
                        name: 'IMI Heimeier Multilux 50 mm H-blokas',
                        href: '/products?q=Multilux',
                        searchQuery: 'Multilux',
                    },
                ],
                vytautasPrompt:
                    'Domina variantas: IMI Heimeier K-galvutės (M30×1,5) ir Multilux / V-exact II vožtuvai. Kokias detales parinkti mano radiatorių skaičiui?',
            },
            {
                variant: 'IMI Heimeier Eclipse (automatinis srauto ribotuvas nevienodai šylantiems radiatoriams)',
                whenToChoose: 'Kai namuose dalis radiatorių kaista per stipriai, o tolimiausi lieka drungni arba vožtuvuose girdisi švilpimas.',
                keyAdvantage: 'Ant vožtuvo tiesiog nustatote srautą (10–150 l/h) ir kiekvienas radiatorius gauna tiksliai tiek šilumos, kiek reikia.',
                recommendedModels: 'IMI Heimeier Eclipse DN15 (3933-02.000) + K-galvutė M30×1,5',
                recommendedProducts: [
                    {
                        sku: '3933-02.000',
                        label: 'IMI Heimeier Eclipse DN15 su AFC',
                        name: 'IMI Heimeier Eclipse DN15 su AFC',
                        href: '/products?q=3933-02.000',
                        searchQuery: '3933-02.000',
                    },
                    {
                        sku: '6000-00.500',
                        label: 'IMI Heimeier K-galvutė M30x1,5',
                        name: 'IMI Heimeier K-galvutė M30x1,5',
                        href: '/products?q=6000-00.500',
                        searchQuery: '6000-00.500',
                    },
                ],
                vytautasPrompt:
                    'Domina variantas: IMI Heimeier Eclipse automatiniai srauto ribotuvai su K-galvutėmis. Kaip parinkti tiesius, kampinius ar H-bloko vožtuvus mano radiatoriams?',
            },
        ],
    },
};

export function getCalculatorPageJsonLd() {
    return {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'SoftwareApplication',
                name: 'Gilės Inžinerija 5-in-1 interaktyvus ŠVOK įrangos parinkimo vedlys',
                applicationCategory: 'EngineeringApplication',
                operatingSystem: 'Web',
                offers: {
                    '@type': 'Offer',
                    price: '0.00',
                    priceCurrency: 'EUR',
                },
                description:
                    'Interaktyvi šildymo katilo galios (kW), plėtimosi indo tūrio (L), grindinio šildymo kolektoriaus kontūrų, balansinių vožtuvų DN ir radiatorių mazgų skaičiuoklė su tiesioginiu prekių parinkimu.',
            },
            {
                '@type': 'FAQPage',
                mainEntity: [
                    {
                        '@type': 'Question',
                        name: 'Kaip teisingai pasirinkti katilo galią (kW) ir boilerio talpą pagal namo plotą?',
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: 'Katilo galia parenkama pagal pastato plotą ir energetinę klasę: A+/A++ klasės 140 m² namui šildymui pakanka 5–7 kW šilumos šaltinio ir 150–200 L tūrinio boilerio 4 asmenų šeimai. Per didelio galingumo 24 kW katilas be akumuliacinės talpos ar boilerio nuolat junginėsis (taktuos).',
                        },
                    },
                    {
                        '@type': 'Question',
                        name: 'Kuo skiriasi IMI Pneumatex Statico SD ir Aquapresso A plėtimosi indai?',
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: 'IMI Pneumatex Statico SD (3 bar) yra skirtas uždaroms šildymo sistemoms (katilams, grindiniam šildymui, radiatoriams), o Aquapresso A (iki 10 bar, su pratekėjimu ir nerūdijančio plieno jungtimi) yra skirtas geriamam vandeniui ir karšto vandens boileriams.',
                        },
                    },
                    {
                        '@type': 'Question',
                        name: 'Kodėl grindiniam šildymui verta rinktis IMI Heimeier Dynacon Eclipse kolektorių?',
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: 'Dynacon Eclipse turi integruotą automatinį srauto palaikymą (AFC) kiekviename kontūre. Nustačius reikiamą srautą (l/h), kolektorius pats automatiškai išlygina srautus tarp trumpų ir ilgų žiedų be rankinio balansavimo.',
                        },
                    },
                    {
                        '@type': 'Question',
                        name: 'Kaip nesupainioti Danfoss RA Click ir M30×1,5 termostatinių galvučių?',
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: 'Danfoss RA-N ir RA-DV vožtuvai turi 23 mm kaklelį su grioveliu, todėl jiems tinka Danfoss RA Click galvutės (pvz., 013G2970 Redia). IMI Heimeier ir dauguma integruotų VK radiatorių naudoja srieginę M30×1,5 jungtį (pvz., Heimeier K-galvutė 6000-00.500).',
                        },
                    },
                ],
            },
        ],
    };
}
