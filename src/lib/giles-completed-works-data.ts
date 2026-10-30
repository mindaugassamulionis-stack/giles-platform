export type CompletedWorkCategoryId =
    | 'all'
    | 'boiler_retrofits'
    | 'industrial_containers'
    | 'heat_pumps_boiler_rooms'
    | 'service_automation';

export interface CompletedWorkCategory {
    id: CompletedWorkCategoryId;
    label: string;
    shortDescription: string;
}

export interface GilesCompletedWorkItem {
    id: string;
    numLabel: string;
    category: Exclude<CompletedWorkCategoryId, 'all'>;
    categoryLabel: string;
    title: string;
    location: string;
    powerKw: string;
    fuelOrMedium: string;
    boilerModel: string;
    burnerOrEquipment: string;
    scopeExecuted: string;
    resultMetric: string;
    imageUrl: string;
    sourceImageUrl: string;
    sourcePageUrl: string;
    studioBackdropHex: '#EEEBE4';
    ctaHref: string;
    ctaLabel: string;
}

export interface GilesServicePillar {
    id: string;
    numLabel: string;
    title: string;
    subtitle: string;
    scopeBullets: string[];
    equipmentAndBrands: string[];
    turnaroundOrSla: string;
    priceReference: string;
    imageUrl: string;
    primaryHref: string;
    primaryCtaLabel: string;
}

export const GILES_COMPLETED_WORKS_CATEGORIES: readonly CompletedWorkCategory[] = [
    {
        id: 'all',
        label: 'Visi objektai (16)',
        shortDescription: 'Visi realizuoti katilinių, degiklių, konteinerinių modulių ir serviso projektai.',
    },
    {
        id: 'boiler_retrofits',
        label: 'Katilų perdarymas į granulinius',
        shortDescription: 'Viadrus U22/U26, Kalvis, Atmos, Buderus S111/G221, Dakon ir Stropuva katilų automatizavimas.',
    },
    {
        id: 'industrial_containers',
        label: 'Pramoninės ir konteinerinės katilinės',
        shortDescription: '100 kW – 2,0 MW konteinerinės biokuro, dujinės ir biodujų katilinės bei mobilios katilinės nuoma.',
    },
    {
        id: 'heat_pumps_boiler_rooms',
        label: 'Šilumos siurbliai ir katilinės',
        shortDescription: 'Šilumos mazgai, akumuliacinės talpos, karšto vandens paruošimas ir hidraulinis balansavimas.',
    },
    {
        id: 'service_automation',
        label: 'Servisas ir automatika',
        shortDescription: 'Garantinis ir pogarantinis servisas, GSM/SCADA telemetrija, degimo derinimas ir atsarginės dalys.',
    },
] as const;

export const GILES_BOILER_RETROFIT_CAPABILITIES = {
    supportedBoilers: [
        {
            brandAndSeries: 'Viadrus U22 / U26 / Hercules',
            material: 'Ketiniai sekcijiniai katilai (4–10 sekcijų)',
            typicalPowerKw: '15–58 kW',
            flangeSolution: 'Naujos CNC plieninės pakrovimo durelės su degiklio anga ir šilumokaičio ekonomaizeriais',
            recommendedBurner: 'Megatherm MPB 25 / MPB 35 arba Pelltech PV20a / PV30a',
        },
        {
            brandAndSeries: 'Kalvis 2-12, 2-16, 2-20, 2-30, 2-40',
            material: 'Plieniniai apatinio degimo kieto kuro katilai',
            typicalPowerKw: '12–40 kW',
            flangeSolution: 'Durelių adapteris su keraminiu izoliaciniu žiedu ir sraigtiniu tiektuvu (200–2000 kg bunkeris)',
            recommendedBurner: 'Megatherm MPB 10–35 kW su judančiomis ardelėmis',
        },
        {
            brandAndSeries: 'Atmos DC18S, DC25S, DC32S, DC50S',
            material: 'Dujų generaciniai kieto kuro katilai',
            typicalPowerKw: '18–50 kW',
            flangeSolution: 'Viršutinių arba apatinių durelių CNC flanšas, išsaugant galimybę kūrenti malkomis',
            recommendedBurner: 'Pelltech PV20a / PV30a arba Centrometal Cm Pelet-set 14–90 kW',
        },
        {
            brandAndSeries: 'Buderus Logano S111 / G221 & Dakon DOR 16–45',
            material: 'Plieniniai ir ketiniai viršutinio/apatinio degimo katilai',
            typicalPowerKw: '16–45 kW',
            flangeSolution: 'Šoninės arba priekinės angos montavimo plokštė su greito nuėmimo aklėmis',
            recommendedBurner: 'Pelltech PV20a arba Megatherm MPB 15–50 kW',
        },
        {
            brandAndSeries: 'Stropuva S15, S20, S40 & ZVAK / Vienybė',
            material: 'Ilgai degančios ir tradicinės konstrukcijos plieniniai katilai',
            typicalPowerKw: '15–40 kW',
            flangeSolution: 'Individualus tvirtinimo kakliukas su dūmų kanalų užsklandomis NK pakėlimui',
            recommendedBurner: 'Megatherm MPB 10–35 kW su automatiniu šlako valymu',
        },
        {
            brandAndSeries: 'Pramoniniai katilai (Verner, Ferroli, Kalvis-100..500)',
            material: 'Pramoniniai plieniniai ir ketiniai katilai',
            typicalPowerKw: '50–500 kW',
            flangeSolution: 'Pramoninis degiklio flanšas, kuro padavimo sraigtai A1/A2 ir kaskadinė automatika',
            recommendedBurner: 'Megatherm MPB PRO 50–300 kW / Pelltech PV100–PV500 / Verner',
        },
    ],
    namedPackages: [
        {
            code: 'GILES-LINK-LYDERIU-35',
            name: 'Komplektas „Link lyderių“ (10–35 kW katilams)',
            priceGrossEur: 2150,
            included:
                'Megatherm 10–35 kW granulių degiklis + 460 L granulių talpa + 1,5 m sraigtas + oro kompresorius šlako valymui + laidinis patalpos termostatas + montavimas, paleidimas ir 24 mėn. garantija.',
        },
        {
            code: 'GILES-NORD-KOMFORTUI-20',
            name: 'Komplektas „Nord komfortui“ (10–20 kW katilams)',
            priceGrossEur: 2350,
            included:
                'Pelltech PV20a (Estija) savaime išsivalantis degiklis + 460 L granulių talpa + 1,5 m sraigtas + 10 L oro kompresorius + laidinis termostatas + montavimas, derinimas ir 24 mėn. garantija.',
        },
        {
            code: 'GILES-VIDUTINIAMS-50',
            name: 'Komplektas „Vidutiniams“ (25–50 kW katilams)',
            priceGrossEur: 2690,
            included:
                'Megatherm MPB 15–50 kW degiklis su judančiomis ardelėmis + 460 L talpa + sraigtas su reduktoriumi + programuojamas termostatas + montavimas, dūmų analizė ir 24 mėn. garantija.',
        },
        {
            code: 'PONAST-KP08-SET',
            name: 'Automatinis V-klasės granulinis katilas PONAST KP08 (8 kW su 130 L bunkeriu)',
            priceGrossEur: 2890,
            included:
                'Pilnai automatinis V-emisijos klasės Čekijos gamintojo PONAST KP08 granulinis katilas (namams iki 100 m²) su integruotu 130 L kuro bunkeriu (tinkamas APVA kompensacijai).',
        },
    ],
} as const;

export const GILES_CONTAINER_BOILER_SPECS = [
    {
        code: 'MOB-ORO-15-90',
        title: 'Mobilus granulinis karšto oro šildytuvas (15–90 kW)',
        powerRange: '15–90 kW',
        medium: 'Tiesioginis karštas oras (iki 12 000 m³/val.)',
        application: 'Statybvietėms, angarams, sandėliams, dirbtuvėms ir renginių palapinėms',
        availability: 'Pardavimas ir nuoma',
    },
    {
        code: 'MOB-ORO-80-190',
        title: 'Mobilus dvigubo kuro / dyzelinis karšto oro generatorius (40–190 kW)',
        powerRange: '40–190 kW',
        medium: 'Karštas oras per lanksčius ortakius',
        application: 'Pramoniniams cechams, betonavimo darbams žiemą, žemės ūkio objektams',
        availability: 'Pardavimas ir skubi nuoma 24/7',
    },
    {
        code: 'PELLMOBIL-120',
        title: 'Mobili granulinė karšto vandens ir šildymo katilinė Pellmobil (110–120 kW)',
        powerRange: '110–120 kW',
        medium: 'Šildymo kontūras (T1/T2 80/60 °C) + BKV ruošimas',
        application: 'Mokykloms, darželiams, daugiabučiams ir komerciniams pastatams iki 2 500 m²',
        availability: 'Pardavimas ir sezoninė nuoma',
    },
    {
        code: 'GK-150-500',
        title: 'Konteinerinė hidraulinio šildymo biokuro katilinė GK-150 / GK-500',
        powerRange: '150–500 kW',
        medium: 'Vandens šildymo trasa PN6 bar + GSM/SCADA',
        application: 'Gamykloms, šiltnamiams, biurų ir logistikos pastatams (nereikia statybos leidimo)',
        availability: 'Gamyba Kaune, pardavimas ir ilgalaikė nuoma',
    },
    {
        code: 'GK-750-2000',
        title: 'Pramoninė modulinė biokuro ir biodujų katilinė GK-750 / GK-2000',
        powerRange: '750 kW – 2,0 MW',
        medium: 'Pramoninis šilumos tinklas su multiciklonu ir Walking-Floor sandėliu',
        application: 'Pramonės įmonėms, gyvenviečių katilinėms, biodujų jėgainėms ir grūdų džiovykloms',
        availability: 'Projektavimas 3D, gamyba ir montavimas iki rakto',
    },
] as const;

export const GILES_SERVICE_PILLARS: readonly GilesServicePillar[] = [
    {
        id: 'pillar-01-projektavimas-montavimas',
        numLabel: '01 / Katilinių projektavimas ir montavimas',
        title: 'Katilinių ir ŠVOK sistemų projektavimas (2D/3D) bei montavimas iki rakto',
        subtitle:
            'Techniniai ir darbo projektai vidaus šildymo, vandentiekio, nuotekų, konteinerinių bei dujinių katilinių ir kuro sandėlių įrengimui.',
        scopeBullets: [
            '3D konteinerinių, biokuro, dujinių katilinių ir kuro sandėliavimo patalpų projektavimas',
            'Pilnas katilinių surinkimas su apsauginėmis grupėmis, akumuliacinėmis talpomis ir cirkuliaciniais mazgais',
            'Grindinio šildymo (HERZ PE-RT / Comisa PEX-AL-PEX) ir kolektorinių spintų montavimas',
        ],
        equipmentAndBrands: ['HERZ', 'Centrometal', 'Verner', 'Ponast', 'Buderus', 'Viessmann', 'SANHA', 'Comisa'],
        turnaroundOrSla: 'Projektas per 3–5 d. d. · Montavimas per 1–5 d. d.',
        priceReference: 'Katilinės sąmata per 24 val. · Montavimas nuo 480 € be PVM',
        imageUrl: '/studio-assets/projects/giles-darbas-11.webp',
        primaryHref: '/vedlys',
        primaryCtaLabel: 'Skaičiuoti katilinės projektą',
    },
    {
        id: 'pillar-02-katilu-perdarymas',
        numLabel: '02 / Katilų perdarymas į granulinius',
        title: 'Senų kieto kuro katilų automatizavimas ir perdarymas į granulinius',
        subtitle:
            'Vietoje kieto kuro pakrovimo durelių sumontuojame CNC dureles su granulių degikliu, šilumokaičio ekonomaizerius ir 200–2000 kg kuro bunkerį.',
        scopeBullets: [
            'Tinka Viadrus U22/U26, Kalvis, Atmos, Stropuva, Dakon, Buderus S111/G221 ir pramoniniams katilams',
            'Montavimas per 4–6 val. be katilinės griovimo, išsaugant galimybę kūrenti malkomis',
            'Fiksuotos kainos komplektai su montavimu ir 2 m. garantija: „Link lyderių“ (2 150 €), „Nord komfortui“ (2 350 €)',
        ],
        equipmentAndBrands: ['Megatherm MPB', 'Pelltech PV20a/PV30a', 'Centrometal Cm Pelet-set', 'PellX', 'GX-Prometėjas'],
        turnaroundOrSla: 'Pilnas perdarymas ir paleidimas per 4–6 valandas',
        priceReference: 'Komplektas su montavimu ir 2 m. garantija – nuo 2 150 € su PVM',
        imageUrl: '/studio-assets/projects/giles-darbas-01.webp',
        primaryHref: '/vedlys',
        primaryCtaLabel: 'Atidaryti katilo perdarymo vedlį',
    },
    {
        id: 'pillar-03-servisas-atsargines-dalys',
        numLabel: '03 / Garantinis ir pogarantinis servisas',
        title: 'Granulių degiklių, katilų ir šilumos siurblių servisas (Tech Support / After-Sales)',
        subtitle:
            'Garantinis ir pogarantinis Centrometal, Bosch/Buderus, Viessmann, Ferroli, Verner, Protherm, Pelltech, Megatherm ir HERZ įrangos aptarnavimas visoje Lietuvoje.',
        scopeBullets: [
            'Skubus gedimų šalinimas (klaidos A01, uždegimo tenų, fotoelementų, sraigtų, ardelių ir valdiklių keitimas)',
            'Degimo parametrų matavimas ir derinimas dūmų analizatoriumi maksimaliam naudingumo koeficientui',
            'Nuosavas atsarginių dalių sandėlis Kaune ir Vilniuje 10+ metų į priekį (Ferroli SUN P, Pelltech, Megatherm, Verner)',
        ],
        equipmentAndBrands: ['Megatherm', 'Pelltech', 'Ferroli SUN P7/P12', 'Centrometal', 'Verner', 'Buderus', 'Viessmann'],
        turnaroundOrSla: 'Reakcija per 2–24 val. · Serviso tel. +370 693 97098 / +370 611 19158',
        priceReference: 'Diagnostika, derinimas ir atsarginių dalių tiekimas visoje LT',
        imageUrl: '/studio-assets/projects/giles-darbas-12.webp',
        primaryHref: '#serviso-iskvietimas',
        primaryCtaLabel: 'Iškviesti serviso inžinierių',
    },
    {
        id: 'pillar-04-balansavimas-renovacija',
        numLabel: '04 / Hidraulinis balansavimas ir renovacija',
        title: 'Šildymo sistemų renovacija, IMI TA / Danfoss balansavimas ir dūmtraukių įdėklai',
        subtitle:
            'Daugiabučių, mokyklų, darželių ir gamybinių pastatų vienvamzdžių bei dvivamzdžių šildymo sistemų modernizavimas ir stovų balansavimas.',
        scopeBullets: [
            'Automatiniai slėgio perkričio ir srauto reguliatoriai IMI TA STAD, STAP, TBV-CMP, Compact-P ir TA-Therm',
            'Radiatorių termostatika Heimeier V-exact / A-exact, Danfoss RA/RAS ir belaidė Watts WFHT automatika',
            'Nerūdijančio plieno rūgščiai atsparių dūmtraukių įdėklų ir izoliuotų kaminų montavimas',
        ],
        equipmentAndBrands: ['IMI TA', 'Heimeier', 'Pneumatex', 'Danfoss', 'Watts Industries', 'Wilo', 'Grundfos'],
        turnaroundOrSla: 'Matavimai su IMI TA Scope kompiuteriu ir balansavimo pasas',
        priceReference: 'Pagal stovų ir kontūrų skaičių · Specialios renovacijos nuolaidos iki -45 %',
        imageUrl: '/studio-assets/projects/giles-darbas-10.webp',
        primaryHref: '/skaiciuokle?tab=valve',
        primaryCtaLabel: 'Balansavimo skaičiuoklė',
    },
    {
        id: 'pillar-05-mobilios-konteinerines-nuoma',
        numLabel: '05 / Konteinerinės katilinės ir nuoma',
        title: 'Konteinerinių katilinių gamyba (100 kW – 2,0 MW) ir mobilių katilinių nuoma',
        subtitle:
            'Gamykloje surinktos konteinerinės biokuro, dujinės bei biodujų katilinės ir mobilūs 15–500 kW šilumos moduliai avarijų ar statybų metu.',
        scopeBullets: [
            '6 tipų mobilios katilinės: 15–90 kW ir 40–190 kW karšto oro, 110–120 kW Pellmobil karšto vandens, 150–500 kW hidraulinės',
            'Pramoniniai 250 kW, 500 kW, 750 kW ir 2,0 MW biokuro bei biodujų moduliai su multiciklonais',
            'Pastatoma be statybos leidimo ir prijungiama prie pastato šilumos trasos per 1–2 dienas',
        ],
        equipmentAndBrands: ['Gilės GK-100..GK-2500', 'Pellmobil', 'Megatherm MPB PRO', 'Verner', 'Thermostahl'],
        turnaroundOrSla: 'Mobilios katilinės pristatymas per 24 val. · Gamyba 4–8 sav.',
        priceReference: 'Nuoma nuo 690 € / mėn. be PVM · Pirkimas nuo 24 500 € be PVM',
        imageUrl: '/studio-assets/projects/giles-darbas-06.webp',
        primaryHref: '/pramonei',
        primaryCtaLabel: 'Konteinerinės katilinės ir nuoma',
    },
    {
        id: 'pillar-06-silumos-siurbliai-eksportas',
        numLabel: '06 / Šilumos siurbliai ir APVA kompensacijos',
        title: 'Haier R290 / Bosch šilumos siurbliai, kombinuoti boileriai ir APVA paraiškų dokumentacija',
        subtitle:
            'A++ klasės šilumos siurblių oras–vanduo bei oras–oras montavimas, Gorenje / Dražice / Centrometal boilerių parinkimas ir dokumentai APVA kompensacijoms.',
        scopeBullets: [
            'Haier Super Aqua Monoblock R290 ir Bosch Climate 3000i (2,6–5,3 kW šildymas iki -15 °C) sistemų montavimas',
            'Akumuliacinės talpos Gorenje ZV 50/200, kombinuoti nerūdijančio plieno boileriai Centrometal ir Dražice OKC',
            'Oficialūs techniniai pasai, V-klasės sertifikatai ir sąskaitos faktūros APVA katilų keitimo kompensacijai gauti',
        ],
        equipmentAndBrands: ['Haier', 'Bosch', 'Gorenje', 'Dražice', 'Centrometal', 'Ponast V-klasė', 'Zilmet'],
        turnaroundOrSla: 'Montavimas per 1–2 d. d. · Pilnas APVA dokumentų paketas',
        priceReference: 'Bosch Climate 3000i nuo 499 € · Haier ir katilų komplektai su APVA parama',
        imageUrl: '/studio-assets/projects/giles-darbas-15.webp',
        primaryHref: '/paketai',
        primaryCtaLabel: 'Peržiūrėti sisteminius paketus',
    },
] as const;

export const GILES_COMPLETED_WORKS: readonly GilesCompletedWorkItem[] = [
    {
        id: 'darbas-01',
        numLabel: 'Mazgas #01',
        category: 'boiler_retrofits',
        categoryLabel: 'Katilų perdarymas į granulinius',
        title: 'Ketinio katilo Viadrus U26 perdarymas su Megatherm MPB granulių degikliu',
        location: 'Viadrus U26 + Megatherm MPB',
        powerKw: '25–35 kW',
        fuelOrMedium: 'Medienos granulės (DINplus 6–8 mm)',
        boilerModel: 'Viadrus U26 (ketinis sekcijinis kieto kuro katilas)',
        burnerOrEquipment: 'Megatherm MPB savaime išsivalantis degiklis + CNC durelių flanšas',
        scopeExecuted:
            'Vietoje apatinių pakrovimo durelių sumontuotos naujos CNC plieninės durelės su degiklio tvirtinimo anga, įdėtos šilumokaičio užsklandos (ekonomaizeriai), pajungtas padavimo sraigtas ir degiklio valdiklis.',
        resultMetric: 'Montavimas per 4–6 val. · 100 % automatinis režimas',
        imageUrl: '/studio-assets/projects/giles-darbas-01.webp',
        sourceImageUrl: 'https://www.gilesinzinerija.com/wp-content/uploads/2014/02/U26-MEGATHERM-1.jpg',
        sourcePageUrl: 'https://www.gilesinzinerija.com/montavimas/',
        studioBackdropHex: '#EEEBE4',
        ctaHref: '/vedlys?boiler=viadrus-u22',
        ctaLabel: 'Pritaikyti savo Viadrus katilui',
    },
    {
        id: 'darbas-02',
        numLabel: 'Mazgas #02',
        category: 'boiler_retrofits',
        categoryLabel: 'Katilų perdarymas į granulinius',
        title: 'Viadrus U26 katilinės mazgas su granulių bunkeriu ir sraigtiniu tiektuvu',
        location: 'Komplektas „Link lyderių“',
        powerKw: '10–35 kW',
        fuelOrMedium: 'Medienos granulės',
        boilerModel: 'Viadrus U26 + 460 L cinkuotas granulių bunkeris',
        burnerOrEquipment: 'Komplektas „Link lyderių“ (Megatherm 10–35 kW + 1,5 m sraigtas + oro kompresorius)',
        scopeExecuted:
            'Pilnas kieto kuro katilinės automatizavimas: pastatytas 460 L bunkeris, sumontuotas 1,5 m kuro padavimo sraigtas, pneumatinis šlako valymas kompresoriumi ir patalpos termostatas.',
        resultMetric: 'Autonominis darbas 7–10 parų be papildymo',
        imageUrl: '/studio-assets/projects/giles-darbas-02.webp',
        sourceImageUrl: 'https://www.gilesinzinerija.com/wp-content/uploads/2014/02/U26-MEGATHERM-3.jpg',
        sourcePageUrl: 'https://www.gilesinzinerija.com/montavimas/',
        studioBackdropHex: '#EEEBE4',
        ctaHref: '/vedlys?boiler=viadrus-u22',
        ctaLabel: 'Užsakyti „Link lyderių“ komplektą',
    },
    {
        id: 'darbas-03',
        numLabel: 'Mazgas #03',
        category: 'boiler_retrofits',
        categoryLabel: 'Katilų perdarymas į granulinius',
        title: 'Plieninio katilo Buderus Logano S111 automatizavimas granulių degikliu',
        location: 'Buderus Logano S111',
        powerKw: '16–32 kW',
        fuelOrMedium: 'Medienos granulės',
        boilerModel: 'Buderus Logano S111 plieninis kieto kuro katilas',
        burnerOrEquipment: 'Pelltech PV20a granulių degiklis + kuro bunkeris + automatika',
        scopeExecuted:
            'Pritaikytas tvirtinimo flanšas Buderus Logano S111 katilui, sumontuotas savaime išsivalantis degiklis ir atliktas degimo derinimas dūmų analizatoriumi.',
        resultMetric: 'Automatinis granulių tiekimas ir degimo kontrolė',
        imageUrl: '/studio-assets/projects/giles-darbas-03.webp',
        sourceImageUrl: 'https://www.gilesinzinerija.com/wp-content/uploads/2013/11/s111_buderus.jpg',
        sourcePageUrl: 'https://www.gilesinzinerija.com/galerija/',
        studioBackdropHex: '#EEEBE4',
        ctaHref: '/vedlys',
        ctaLabel: 'Patikrinti Buderus suderinamumą',
    },
    {
        id: 'darbas-04',
        numLabel: 'Mazgas #04',
        category: 'boiler_retrofits',
        categoryLabel: 'Katilų perdarymas į granulinius',
        title: 'Dakon DOR 32 katilo modernizavimas su Pelltech PV20a granulių degikliu',
        location: 'Dakon DOR 32 + Pelltech PV20a',
        powerKw: '32 kW',
        fuelOrMedium: 'Medienos granulės (6 mm)',
        boilerModel: 'Dakon DOR 32 plieninis kieto kuro katilas',
        burnerOrEquipment: 'Pelltech PV20a su rezerviniu akumuliatoriumi ir kompresoriumi',
        scopeExecuted:
            'Sumontuotas Pelltech PV20a degiklis su vidiniu sraigtu, saugos termostatu, automatiniu uždegimu ir galios moduliacija nuo 8 iki 20 kW.',
        resultMetric: 'Savaiminis užsikūrimas ir moduliacija 8–20 kW',
        imageUrl: '/studio-assets/projects/giles-darbas-04.webp',
        sourceImageUrl: 'https://www.gilesinzinerija.com/wp-content/uploads/2013/11/dakon_32_pv20.jpg',
        sourcePageUrl: 'https://www.gilesinzinerija.com/galerija/',
        studioBackdropHex: '#EEEBE4',
        ctaHref: '/vedlys',
        ctaLabel: 'Užsakyti „Nord komfortui“ komplektą',
    },
    {
        id: 'darbas-05',
        numLabel: 'Mazgas #05',
        category: 'boiler_retrofits',
        categoryLabel: 'Katilų perdarymas į granulinius',
        title: 'Kieto kuro katilo perdarymas su dvigubomis durelėmis ir granulių bunkeriu',
        location: 'CNC durelių flanšas + bunkeris',
        powerKw: '25 kW',
        fuelOrMedium: 'Medienos granulės / Malkos (pakaitinis kuras)',
        boilerModel: 'Kieto kuro katilas su dvigubomis pakrovimo durelėmis',
        burnerOrEquipment: 'Granulių degiklis + CNC durelės su greito nuėmimo akle + 460 L bunkeris',
        scopeExecuted:
            'Pagamintos papildomos durelės granulių degikliui, todėl prireikus kūrenti malkomis ar briketais degiklis atjungiamas nesugadinant originalių katilo durelių.',
        resultMetric: '2 kuro rūšys (granulės + malkos) be katilo keitimo',
        imageUrl: '/studio-assets/projects/giles-darbas-05.webp',
        sourceImageUrl: 'https://www.gilesinzinerija.com/wp-content/uploads/2013/11/DSCN0284.jpg',
        sourcePageUrl: 'https://www.gilesinzinerija.com/galerija/',
        studioBackdropHex: '#EEEBE4',
        ctaHref: '/vedlys',
        ctaLabel: 'Parinkti degiklį mano katilui',
    },
    {
        id: 'darbas-06',
        numLabel: 'Mazgas #06',
        category: 'industrial_containers',
        categoryLabel: 'Pramoninės ir konteinerinės katilinės',
        title: '500 kW pramoninė konteinerinė biokuro katilinė GK-500 (gamyklinis surinkimas)',
        location: 'Konteinerinė katilinė GK-500',
        powerKw: '500 kW',
        fuelOrMedium: 'Medienos granulės / biokuras',
        boilerModel: 'Gilės GK-500 konteinerinis biokuro modulis (6 058 × 2 438 × 2 896 mm)',
        burnerOrEquipment: 'Pramoninis katilas su judančiomis ardelėmis, multiciklonu ir GSM/SCADA',
        scopeExecuted:
            'Gamykloje surinktas, hidrauliškai išbandytas ir izoliuotas 500 kW konteinerinis šilumos modulis su automatiniu kuro padavimu, dūmų valymu ir nuotoline telemetrija.',
        resultMetric: 'Pilnas gamyklinis surinkimas ir hidraulinis išbandymas',
        imageUrl: '/studio-assets/projects/giles-darbas-06.webp',
        sourceImageUrl: 'https://www.gilesinzinerija.com/wp-content/uploads/2026/01/IMG_1231-500kw-scaled.jpg',
        sourcePageUrl: 'https://www.gilesinzinerija.com/mobilios-katilines/',
        studioBackdropHex: '#EEEBE4',
        ctaHref: '/pramonei',
        ctaLabel: 'GK-500 specifikacija ir ROI',
    },
    {
        id: 'darbas-07',
        numLabel: 'Mazgas #07',
        category: 'industrial_containers',
        categoryLabel: 'Pramoninės ir konteinerinės katilinės',
        title: '750 kW pramoninė konteinerinė biokuro katilinė GK-750',
        location: 'Pramoninis modulis GK-750',
        powerKw: '750 kW',
        fuelOrMedium: 'Medienos granulės / agropelletai / skiedra',
        boilerModel: 'Gilės GK-750 modulinė pramoninė biokuro katilinė',
        burnerOrEquipment: 'Sraigtinis kuro tiekimas + pneumatinis šilumokaičio valymas + dūmsiurbė',
        scopeExecuted:
            'Suprojektuota ir pagaminta 750 kW pramoninė katilinė su dažnio keitikliu valdoma dūmsiurbe, multiciklonu, automatiniu pelenų šalinimu ir 6 bar hidrauliniu mazgu.',
        resultMetric: 'Šildomas plotas iki 6 500 m² · Pilna telemetrija',
        imageUrl: '/studio-assets/projects/giles-darbas-07.webp',
        sourceImageUrl: 'https://www.gilesinzinerija.com/wp-content/uploads/2026/01/IMG_1280-750kw-scaled.jpeg',
        sourcePageUrl: 'https://www.gilesinzinerija.com/mobilios-katilines/',
        studioBackdropHex: '#EEEBE4',
        ctaHref: '/pramonei',
        ctaLabel: 'Skaičiuoti pramoninį atsipirkimą',
    },
    {
        id: 'darbas-08',
        numLabel: 'Mazgas #08',
        category: 'industrial_containers',
        categoryLabel: 'Pramoninės ir konteinerinės katilinės',
        title: '2,0 MW modulinė pramoninė katilinė su kuro sandėliu ir dūmų valymo sistema',
        location: 'Modulinis kompleksas GK-2000',
        powerKw: '2 000 kW (2,0 MW)',
        fuelOrMedium: 'Biokuras (skiedra G30–G50 / medienos granulės)',
        boilerModel: 'Gilės GK-2000 pramoninis kaskadinis katilinės kompleksas',
        burnerOrEquipment: 'Walking-Floor kuro sandėlis + multiciklonas + automatinis pelenų šalinimas',
        scopeExecuted:
            'Didelės galios pramoninis biokuro kompleksas su judančių grindų (Walking-Floor) kuro sandėliu, daugiapakopiu dūmų valymo filtru ir SCADA dispečeriniu valdymu.',
        resultMetric: 'Atitinka ES EcoDesign ir Aplinkos apsaugos normas',
        imageUrl: '/studio-assets/projects/giles-darbas-08.webp',
        sourceImageUrl: 'https://www.gilesinzinerija.com/wp-content/uploads/2026/01/IMG_1304-2mw-scaled.jpg',
        sourcePageUrl: 'https://www.gilesinzinerija.com/mobilios-katilines/',
        studioBackdropHex: '#EEEBE4',
        ctaHref: '/pramonei',
        ctaLabel: 'Gauti 1–2,5 MW pasiūlymą',
    },
    {
        id: 'darbas-09',
        numLabel: 'Mazgas #09',
        category: 'industrial_containers',
        categoryLabel: 'Pramoninės ir konteinerinės katilinės',
        title: 'Mobili konteinerinė katilinė (150–500 kW) nuomai, statyboms ir avariniam šildymui',
        location: 'Mobilios katilinės modulis',
        powerKw: '150–500 kW',
        fuelOrMedium: 'Medienos granulės / dyzelinas',
        boilerModel: 'Mobili hidraulinio šildymo katilinė ant priekabos / rėmo',
        burnerOrEquipment: 'Greito prijungimo DN50/DN65 movos + integruotas kuro bunkeris + GSM valdymas',
        scopeExecuted:
            'Paruoštas mobilus katilinės modulis skubiam pastatų šildymui avarijų, šilumos trasų rekonstrukcijos ar žiemos statybos darbų metu su pristatymu ir pajungimu.',
        resultMetric: 'Greito prijungimo DN50/DN65 hidraulinės jungtys',
        imageUrl: '/studio-assets/projects/giles-darbas-09.webp',
        sourceImageUrl: 'https://www.gilesinzinerija.com/wp-content/uploads/2026/01/IMG_2942-mobili-scaled.jpg',
        sourcePageUrl: 'https://www.gilesinzinerija.com/mobilios-katilines/',
        studioBackdropHex: '#EEEBE4',
        ctaHref: '/pramonei',
        ctaLabel: 'Užsakyti mobilios katilinės nuomą',
    },
    {
        id: 'darbas-10',
        numLabel: 'Mazgas #10',
        category: 'industrial_containers',
        categoryLabel: 'Pramoninės ir konteinerinės katilinės',
        title: '500 kW konteinerinė dujinė katilinė su kaskadiniais katilais ir dūmtraukiais',
        location: 'Stoginė dujinė katilinė',
        powerKw: '500 kW',
        fuelOrMedium: 'Gamtinės dujos',
        boilerModel: 'Stoginė konteinerinė dujinė katilinė',
        burnerOrEquipment: 'Kaskadiniai dujiniai katilai + nerūdijančio plieno dūmtraukiai + siurblių grupė',
        scopeExecuted:
            'Suprojektuota, pagaminta ir ant pastato stogo sumontuota 500 kW konteinerinė dujinė katilinė su kaskadine automatika ir nerūdijančio plieno dūmtraukių sistema.',
        resultMetric: 'Sumontuota ant stogo be vidaus ploto praradimo',
        imageUrl: '/studio-assets/projects/giles-darbas-10.webp',
        sourceImageUrl: 'https://www.gilesinzinerija.com/wp-content/uploads/2018/04/IMG_20171117_161616.jpg',
        sourcePageUrl: 'https://www.gilesinzinerija.com/katilines/',
        studioBackdropHex: '#EEEBE4',
        ctaHref: '/pramonei',
        ctaLabel: 'Konteinerinės katilinės projektas',
    },
    {
        id: 'darbas-11',
        numLabel: 'Mazgas #11',
        category: 'heat_pumps_boiler_rooms',
        categoryLabel: 'Šilumos siurbliai ir katilinės',
        title: '200 kW katilinės šilumos mazgas, paskirstymo kolektoriai ir balansavimo sistema',
        location: 'Hidraulinis šilumos mazgas',
        powerKw: '200 kW',
        fuelOrMedium: 'Šildymo kontūras',
        boilerModel: '200 kW pramoninis šilumos mazgas su paskirstymo kolektoriais',
        burnerOrEquipment: 'Elektroniniai cirkuliaciniai siurbliai + IMI TA STAD/STAP balansiniai vožtuvai + Pneumatex',
        scopeExecuted:
            'Sumontuotas 200 kW katilinės hidraulinis šilumos mazgas su pamaišymo vožtuvais, elektroniniais cirkuliaciniais siurbliais ir IMI TA srautų balansavimu.',
        resultMetric: 'Tikslus hidraulinis kontūrų srautų balansavimas',
        imageUrl: '/studio-assets/projects/giles-darbas-11.webp',
        sourceImageUrl: 'https://www.gilesinzinerija.com/wp-content/uploads/2018/04/IMG_20180116_170846.jpg',
        sourcePageUrl: 'https://www.gilesinzinerija.com/katilines/',
        studioBackdropHex: '#EEEBE4',
        ctaHref: '/skaiciuokle?tab=valve',
        ctaLabel: 'Skaičiuoti šilumos mazgą',
    },
    {
        id: 'darbas-12',
        numLabel: 'Mazgas #12',
        category: 'service_automation',
        categoryLabel: 'Servisas ir automatika',
        title: '25 kW katilinės vamzdyno, 2 šildymo kontūrų ir nuotolinės GSM telemetrijos įrengimas',
        location: 'Katilinės vamzdynas ir GSM',
        powerKw: '25 kW',
        fuelOrMedium: 'Skystas kuras / granulės',
        boilerModel: 'Automatinė katilinė su 2 kontūrų pamaišymo mazgu ir GSM valdymu',
        burnerOrEquipment: 'Danfoss / HERZ pamaišymo vožtuvai + GSM antena ir nuotolinis monitoringas',
        scopeExecuted:
            'Pilnas katilinės montavimas: vamzdynų pravedimas, 2 šildymo kontūrų grupės, išsiplėtimo indai, dūmtraukis ir GSM nuotolinio valdymo antena.',
        resultMetric: 'Pilnas montavimas iki rakto su nuotoline diagnostika',
        imageUrl: '/studio-assets/projects/giles-darbas-12.webp',
        sourceImageUrl: 'https://www.gilesinzinerija.com/wp-content/uploads/2018/06/DSC_0604.jpg',
        sourcePageUrl: 'https://www.gilesinzinerija.com/katilines/',
        studioBackdropHex: '#EEEBE4',
        ctaHref: '#serviso-iskvietimas',
        ctaLabel: 'Užsakyti automatiką ir servisą',
    },
    {
        id: 'darbas-13',
        numLabel: 'Mazgas #13',
        category: 'industrial_containers',
        categoryLabel: 'Pramoninės ir konteinerinės katilinės',
        title: '250 kW konteinerinė biokuro katilinė GK-250 su izoliuotu dūmtraukiu',
        location: 'Konteinerinė katilinė GK-250',
        powerKw: '250 kW',
        fuelOrMedium: 'Medienos granulės',
        boilerModel: 'Gilės GK-250 konteinerinė katilinė',
        burnerOrEquipment: '250 kW biokuro katilas + nerūdijančio plieno dūmtraukis + kuro bunkeris',
        scopeExecuted:
            'Pagaminta ir pastatyta 250 kW konteinerinė katilinė su išoriniu izoliuotu dūmtraukiu, sraigtiniu kuro tiekimu ir apsaugine hidraulika.',
        resultMetric: 'Pastatoma ant pamatinių blokų be statybos leidimo',
        imageUrl: '/studio-assets/projects/giles-darbas-13.webp',
        sourceImageUrl: 'https://www.gilesinzinerija.com/wp-content/uploads/2018/06/250kw.jpg',
        sourcePageUrl: 'https://www.gilesinzinerija.com/katilines/',
        studioBackdropHex: '#EEEBE4',
        ctaHref: '/pramonei',
        ctaLabel: 'GK-250 modulis pramonei',
    },
    {
        id: 'darbas-14',
        numLabel: 'Mazgas #14',
        category: 'industrial_containers',
        categoryLabel: 'Pramoninės ir konteinerinės katilinės',
        title: 'Pramoninė biodujų katilinė su aktyvuotos anglies dujų filtravimo sistema',
        location: 'Biodujų filtravimo ir katilinės mazgas',
        powerKw: '500 kW',
        fuelOrMedium: 'Biodujos / biokuras',
        boilerModel: 'Gilės biodujų ir biokuro pramoninis šilumos modulis',
        burnerOrEquipment: 'Biodujų filtrai + nerūdijančio plieno kolektoriai + pramoninis degiklis',
        scopeExecuted:
            'Suprojektuota ir sumontuota pramoninė biodujų katilinė su dviejų kolonų biodujų filtravimo sistema, nerūdijančio plieno dujotiekiu ir kondensato šalinimo mazgu.',
        resultMetric: 'Dviejų kolonų biodujų filtravimas ir nerūdijančio plieno kolektoriai',
        imageUrl: '/studio-assets/projects/giles-darbas-14.webp',
        sourceImageUrl: 'https://www.gilesinzinerija.com/wp-content/uploads/2026/01/bioduju-katiline-scaled.jpg',
        sourcePageUrl: 'https://www.gilesinzinerija.com/mobilios-katilines/',
        studioBackdropHex: '#EEEBE4',
        ctaHref: '/pramonei',
        ctaLabel: 'Biodujų ir pramoniniai sprendimai',
    },
    {
        id: 'darbas-15',
        numLabel: 'Mazgas #15',
        category: 'heat_pumps_boiler_rooms',
        categoryLabel: 'Šilumos siurbliai ir katilinės',
        title: '120 kW mobili granulinė karšto vandens ir šildymo katilinė Pellmobil',
        location: 'Pellmobil 120 kW su BKV mazgu',
        powerKw: '120 kW',
        fuelOrMedium: 'Medienos granulės (DINplus)',
        boilerModel: 'Pellmobil 120 kW su buitinio karšto vandens (BKV) ruošimo mazgu',
        burnerOrEquipment: '2×60 kW granulių katilai + plokštelinis šilumokaitis + akumuliacinė talpa',
        scopeExecuted:
            'Pilnai automatizuota 120 kW granulinė katilinė su integruotu sanitarinio karšto vandens ruošimo mazgu, akumuliacine talpa ir greito prijungimo jungtimis.',
        resultMetric: 'Šildymas ir karštas vanduo iki 2 500 m² pastatui',
        imageUrl: '/studio-assets/projects/giles-darbas-15.webp',
        sourceImageUrl: 'https://www.gilesinzinerija.com/wp-content/uploads/2024/01/karsto-vandens-120kw-1-scaled.jpg',
        sourcePageUrl: 'https://www.gilesinzinerija.com/mobilios-katilines/',
        studioBackdropHex: '#EEEBE4',
        ctaHref: '/paketai',
        ctaLabel: 'Katilinių ir BKV komplektai',
    },
    {
        id: 'darbas-16',
        numLabel: 'Mazgas #16',
        category: 'service_automation',
        categoryLabel: 'Servisas ir automatika',
        title: '80–190 kW pramoninis karšto oro šildytuvas su automatikos ir serviso mazgu',
        location: 'Karšto oro generatorius 80–190 kW',
        powerKw: '80–190 kW',
        fuelOrMedium: 'Granulės / dyzelinas (dvigubo kuro)',
        boilerModel: 'Mobilus pramoninis karšto oro generatorius',
        burnerOrEquipment: 'Aukšto slėgio ventiliatoriai + lankstūs ortakiai + serviso diagnostikos pultas',
        scopeExecuted:
            'Pramoninio karšto oro šildytuvo paleidimas, degiklio oro/kuro santykio sukalibravimas ir automatinio perkaitimo bei traukos apsaugos mazgo patikra.',
        resultMetric: 'Tiesioginis oro šildymas iki 12 000 m³/val. srautu',
        imageUrl: '/studio-assets/projects/giles-darbas-16.webp',
        sourceImageUrl: 'https://www.gilesinzinerija.com/wp-content/uploads/2025/03/karsto-oro-sildytuvas-80-190kw-scaled.jpg',
        sourcePageUrl: 'https://www.gilesinzinerija.com/mobilios-katilines/',
        studioBackdropHex: '#EEEBE4',
        ctaHref: '#serviso-iskvietimas',
        ctaLabel: 'Iškviesti serviso inžinierių',
    },
] as const;

export function filterCompletedWorksByCategory(
    category: CompletedWorkCategoryId,
): readonly GilesCompletedWorkItem[] {
    if (category === 'all') {
        return GILES_COMPLETED_WORKS;
    }
    return GILES_COMPLETED_WORKS.filter((item) => item.category === category);
}

type SupportedLocale = 'lt' | 'en' | 'pl' | 'ru';

function normalizeLocaleKey(raw?: string | null): SupportedLocale {
    const clean = (raw || 'lt').toLowerCase().trim();
    if (clean.startsWith('en')) return 'en';
    if (clean.startsWith('pl')) return 'pl';
    if (clean.startsWith('ru')) return 'ru';
    return 'lt';
}

const COMPLETED_WORKS_CATEGORIES_I18N: Record<
    Exclude<SupportedLocale, 'lt'>,
    readonly CompletedWorkCategory[]
> = {
    en: [
        {
            id: 'all',
            label: 'All projects (16)',
            shortDescription: 'All completed boiler room, pellet burner, containerized module, and service projects.',
        },
        {
            id: 'boiler_retrofits',
            label: 'Solid-fuel to pellet boiler conversions',
            shortDescription: 'Automation of Viadrus U22/U26, Kalvis, Atmos, Buderus S111/G221, Dakon, and Stropuva boilers.',
        },
        {
            id: 'industrial_containers',
            label: 'Industrial & containerized boiler rooms',
            shortDescription: '100 kW – 2.0 MW containerized biomass, gas, and biogas boiler plants plus mobile rental units.',
        },
        {
            id: 'heat_pumps_boiler_rooms',
            label: 'Heat pumps & hydronic boiler rooms',
            shortDescription: 'Hydronic plant rooms, buffer tanks, domestic hot water preparation, and hydronic balancing.',
        },
        {
            id: 'service_automation',
            label: 'Service & automation',
            shortDescription: 'Warranty and post-warranty service, GSM/SCADA telemetry, combustion tuning, and spare parts.',
        },
    ],
    pl: [
        {
            id: 'all',
            label: 'Wszystkie realizacje (16)',
            shortDescription: 'Wszystkie zrealizowane projekty kotłowni, palników, modułów kontenerowych i serwisu.',
        },
        {
            id: 'boiler_retrofits',
            label: 'Modernizacja kotłów na pellet',
            shortDescription: 'Automatyzacja kotłów Viadrus U22/U26, Kalvis, Atmos, Buderus S111/G221, Dakon i Stropuva.',
        },
        {
            id: 'industrial_containers',
            label: 'Kotłownie przemysłowe i kontenerowe',
            shortDescription: 'Kotłownie kontenerowe na biomasę, gaz i biogaz 100 kW – 2,0 MW oraz wynajem kotłowni mobilnych.',
        },
        {
            id: 'heat_pumps_boiler_rooms',
            label: 'Pompy ciepła i węzły cieplne',
            shortDescription: 'Węzły cieplne, zbiorniki buforowe, przygotowanie CWU oraz równoważenie hydrauliczne.',
        },
        {
            id: 'service_automation',
            label: 'Serwis i automatyka',
            shortDescription: 'Serwis gwarancyjny i pogwarancyjny, telemetria GSM/SCADA, regulacja spalania i części zamienne.',
        },
    ],
    ru: [
        {
            id: 'all',
            label: 'Все объекты (16)',
            shortDescription: 'Все реализованные проекты котельных, горелок, контейнерных модулей и сервисного обслуживания.',
        },
        {
            id: 'boiler_retrofits',
            label: 'Переоборудование котлов на пеллеты',
            shortDescription: 'Автоматизация котлов Viadrus U22/U26, Kalvis, Atmos, Buderus S111/G221, Dakon и Stropuva.',
        },
        {
            id: 'industrial_containers',
            label: 'Промышленные и контейнерные котельные',
            shortDescription: 'Контейнерные биомассовые, газовые и биогазовые котельные 100 кВт – 2,0 МВт и аренда мобильных котельных.',
        },
        {
            id: 'heat_pumps_boiler_rooms',
            label: 'Тепловые насосы и котельные',
            shortDescription: 'Тепловые пункты, буферные емкости, подготовка ГВС и гидравлическая балансировка.',
        },
        {
            id: 'service_automation',
            label: 'Сервис и автоматика',
            shortDescription: 'Гарантийный и послегарантийный сервис, GSM/SCADA телеметрия, настройка горения и запчасти.',
        },
    ],
};

const SERVICE_PILLARS_I18N: Record<
    Exclude<SupportedLocale, 'lt'>,
    readonly GilesServicePillar[]
> = {
    en: [
        {
            id: 'pillar-01-projektavimas-montavimas',
            numLabel: '01 / Boiler Room Design & Turnkey Installation',
            title: '2D/3D Boiler Room & HVAC System Engineering and Turnkey Installation',
            subtitle:
                'Technical and working designs for indoor heating, plumbing, wastewater, containerized and gas boiler rooms, and fuel storage facilities.',
            scopeBullets: [
                '3D engineering of containerized, biomass, and gas boiler rooms and pellet storage rooms',
                'Complete boiler room assembly with safety groups, buffer tanks, and circulation manifolds',
                'Underfloor heating (HERZ PE-RT / Comisa PEX-AL-PEX) and manifold cabinet installation',
            ],
            equipmentAndBrands: ['HERZ', 'Centrometal', 'Verner', 'Ponast', 'Buderus', 'Viessmann', 'SANHA', 'Comisa'],
            turnaroundOrSla: 'Design in 3–5 business days · Installation in 1–5 business days',
            priceReference: 'Boiler room quote within 24h · Installation from 480 € excl. VAT',
            imageUrl: '/studio-assets/projects/giles-darbas-11.webp',
            primaryHref: '/vedlys',
            primaryCtaLabel: 'Configure boiler room project',
        },
        {
            id: 'pillar-02-katilu-perdarymas',
            numLabel: '02 / Solid-Fuel to Pellet Boiler Conversion',
            title: 'Automation & Conversion of Existing Solid-Fuel Boilers to Pellet Operation',
            subtitle:
                'We replace the solid-fuel loading door with a custom CNC door and pellet burner, add heat-exchanger turbulators, and connect a 200–2000 kg hopper.',
            scopeBullets: [
                'Fits Viadrus U22/U26, Kalvis, Atmos, Stropuva, Dakon, Buderus S111/G221, and industrial boilers',
                'Installed in 4–6 hours without demolishing the boiler room while preserving wood firing capability',
                'Fixed-price turnkey kits with installation & 2-year warranty: "Link lyderių" (2,150 €), "Nord komfortui" (2,350 €)',
            ],
            equipmentAndBrands: ['Megatherm MPB', 'Pelltech PV20a/PV30a', 'Centrometal Cm Pelet-set', 'PellX', 'GX-Prometėjas'],
            turnaroundOrSla: 'Full conversion and commissioning in 4–6 hours',
            priceReference: 'Complete kit with installation & 2-year warranty – from 2,150 € incl. VAT',
            imageUrl: '/studio-assets/projects/giles-darbas-01.webp',
            primaryHref: '/vedlys',
            primaryCtaLabel: 'Open 4-step conversion wizard',
        },
        {
            id: 'pillar-03-servisas-atsargines-dalys',
            numLabel: '03 / Warranty & Post-Warranty Service',
            title: 'Pellet Burner, Boiler & Heat Pump Service (Tech Support / After-Sales)',
            subtitle:
                'Nationwide warranty and post-warranty service for Centrometal, Bosch/Buderus, Viessmann, Ferroli, Verner, Protherm, Pelltech, Megatherm, and HERZ equipment.',
            scopeBullets: [
                'Rapid fault resolution (Error A01, ceramic igniters, photo sensors, augers, grates, and controllers)',
                'Flue gas analyzer combustion measurement and tuning for maximum thermal efficiency',
                'In-house spare parts warehouse in Kaunas and Vilnius stocked 10+ years ahead (Ferroli SUN P, Pelltech, Megatherm, Verner)',
            ],
            equipmentAndBrands: ['Megatherm', 'Pelltech', 'Ferroli SUN P7/P12', 'Centrometal', 'Verner', 'Buderus', 'Viessmann'],
            turnaroundOrSla: 'Response within 2–24h · Service line +370 693 97098 / +370 611 19158',
            priceReference: 'Diagnostics, combustion tuning, and spare parts delivery nationwide',
            imageUrl: '/studio-assets/projects/giles-darbas-12.webp',
            primaryHref: '#serviso-iskvietimas',
            primaryCtaLabel: 'Book service engineer visit',
        },
        {
            id: 'pillar-04-balansavimas-renovacija',
            numLabel: '04 / Hydronic Balancing & Renovation',
            title: 'Heating System Renovation, IMI TA / Danfoss Balancing & Flue Liners',
            subtitle:
                'Modernization and riser balancing of single-pipe and two-pipe heating systems in apartment buildings, schools, kindergartens, and industrial plants.',
            scopeBullets: [
                'Automatic differential pressure and flow controllers IMI TA STAD, STAP, TBV-CMP, Compact-P, and TA-Therm',
                'Radiator thermostatic valves Heimeier V-exact / A-exact, Danfoss RA/RAS, and wireless Watts WFHT zoning',
                'Acid-resistant stainless-steel chimney liners and insulated twin-wall flue installation',
            ],
            equipmentAndBrands: ['IMI TA', 'Heimeier', 'Pneumatex', 'Danfoss', 'Watts Industries', 'Wilo', 'Grundfos'],
            turnaroundOrSla: 'Measurements with IMI TA Scope computer & official balancing certificate',
            priceReference: 'Priced per riser and loop count · Renovation project discounts up to -45%',
            imageUrl: '/studio-assets/projects/giles-darbas-10.webp',
            primaryHref: '/skaiciuokle?tab=valve',
            primaryCtaLabel: 'Hydronic balancing calculator',
        },
        {
            id: 'pillar-05-mobilios-konteinerines-nuoma',
            numLabel: '05 / Containerized Boiler Rooms & Rental',
            title: 'Manufacturing of Containerized Boiler Rooms (100 kW – 2.0 MW) & Mobile Rental',
            subtitle:
                'Factory-built containerized biomass, gas, and biogas boiler plants plus mobile 15–500 kW heat modules for emergencies or winter construction.',
            scopeBullets: [
                '6 types of mobile boiler units: 15–90 kW and 40–190 kW hot-air, 110–120 kW Pellmobil DHW/heating, 150–500 kW hydronic',
                'Industrial 250 kW, 500 kW, 750 kW, and 2.0 MW biomass and biogas modules with multicyclones',
                'Installed without a building permit and connected to the building heating main in 1–2 days',
            ],
            equipmentAndBrands: ['Gilės GK-100..GK-2500', 'Pellmobil', 'Megatherm MPB PRO', 'Verner', 'Thermostahl'],
            turnaroundOrSla: 'Mobile boiler delivery within 24h · Custom build in 4–8 weeks',
            priceReference: 'Rental from 690 € / month excl. VAT · Purchase from 24,500 € excl. VAT',
            imageUrl: '/studio-assets/projects/giles-darbas-06.webp',
            primaryHref: '/pramonei',
            primaryCtaLabel: 'Container boiler rooms & rental',
        },
        {
            id: 'pillar-06-silumos-siurbliai-eksportas',
            numLabel: '06 / Heat Pumps & APVA State Grants',
            title: 'Haier R290 / Bosch Heat Pumps, Combined Cylinders & APVA Grant Documentation',
            subtitle:
                'Installation of A++ air-to-water and air-to-air heat pumps, Gorenje / Dražice / Centrometal cylinders, and full documentation for APVA boiler replacement grants.',
            scopeBullets: [
                'Haier Super Aqua Monoblock R290 and Bosch Climate 3000i (2.6–5.3 kW heating down to -15 °C) installation',
                'Buffer tanks Gorenje ZV 50/200, stainless-steel combined cylinders Centrometal and Dražice OKC',
                'Official technical passports, Class-5 emission certificates, and VAT invoices for APVA grant reimbursement',
            ],
            equipmentAndBrands: ['Haier', 'Bosch', 'Gorenje', 'Dražice', 'Centrometal', 'Ponast Class-5', 'Zilmet'],
            turnaroundOrSla: 'Installation in 1–2 business days · Complete APVA document package',
            priceReference: 'Bosch Climate 3000i from 499 € · Haier & boiler kits eligible for APVA support',
            imageUrl: '/studio-assets/projects/giles-darbas-15.webp',
            primaryHref: '/paketai',
            primaryCtaLabel: 'View complete system packages',
        },
    ],
    pl: [
        {
            id: 'pillar-01-projektavimas-montavimas',
            numLabel: '01 / Projektowanie i montaż kotłowni',
            title: 'Projektowanie (2D/3D) oraz montaż kotłowni i instalacji HVAC pod klucz',
            subtitle:
                'Projekty techniczne i wykonawcze instalacji grzewczych, wod-kan, kotłowni kontenerowych, gazowych oraz składów paliwa.',
            scopeBullets: [
                'Projektowanie 3D kotłowni kontenerowych, biomasowych, gazowych i magazynów paliwa',
                'Kompletny montaż kotłowni z grupami bezpieczeństwa, buforami i układami pompowo-mieszającymi',
                'Montaż ogrzewania podłogowego (HERZ PE-RT / Comisa PEX-AL-PEX) i szafek rozdzielaczowych',
            ],
            equipmentAndBrands: ['HERZ', 'Centrometal', 'Verner', 'Ponast', 'Buderus', 'Viessmann', 'SANHA', 'Comisa'],
            turnaroundOrSla: 'Projekt w 3–5 dni rob. · Montaż w 1–5 dni rob.',
            priceReference: 'Kosztorys kotłowni w 24h · Montaż od 480 € netto',
            imageUrl: '/studio-assets/projects/giles-darbas-11.webp',
            primaryHref: '/vedlys',
            primaryCtaLabel: 'Oblicz projekt kotłowni',
        },
        {
            id: 'pillar-02-katilu-perdarymas',
            numLabel: '02 / Modernizacja kotłów na pellet',
            title: 'Automatyzacja i przeróbka starych kotłów stałopaliwowych na pellet',
            subtitle:
                'Zamiast drzwiczek zasypowych montujemy drzwiczki CNC z palnikiem pelletowym, zawirowywacze spalin oraz zasobnik 200–2000 kg.',
            scopeBullets: [
                'Pasuje do kotłów Viadrus U22/U26, Kalvis, Atmos, Stropuva, Dakon, Buderus S111/G221 i przemysłowych',
                'Montaż w 4–6 godzin bez przebudowy kotłowni z zachowaniem możliwości palenia drewnem',
                'Zestawy w stałej cenie z montażem i 2-letnią gwarancją: „Link lyderių” (2 150 €), „Nord komfortui” (2 350 €)',
            ],
            equipmentAndBrands: ['Megatherm MPB', 'Pelltech PV20a/PV30a', 'Centrometal Cm Pelet-set', 'PellX', 'GX-Prometėjas'],
            turnaroundOrSla: 'Pełna modernizacja i uruchomienie w 4–6 godzin',
            priceReference: 'Zestaw z montażem i 2-letnią gwarancją – od 2 150 € z VAT',
            imageUrl: '/studio-assets/projects/giles-darbas-01.webp',
            primaryHref: '/vedlys',
            primaryCtaLabel: 'Otwórz kreator modernizacji kotła',
        },
        {
            id: 'pillar-03-servisas-atsargines-dalys',
            numLabel: '03 / Serwis gwarancyjny i pogwarancyjny',
            title: 'Serwis palników pelletowych, kotłów i pomp ciepła (Tech Support / After-Sales)',
            subtitle:
                'Gwarancyjny i pogwarancyjny serwis urządzeń Centrometal, Bosch/Buderus, Viessmann, Ferroli, Verner, Protherm, Pelltech, Megatherm i HERZ.',
            scopeBullets: [
                'Szybkie usuwanie awarii (błąd A01, wymiana zapalarek, fotokomórek, podajników, rusztów i sterowników)',
                'Pomiar i regulacja parametrów spalania analizatorem spalin dla maksymalnej sprawności',
                'Własny magazyn części zamiennych w Kownie i Wilnie na 10+ lat (Ferroli SUN P, Pelltech, Megatherm, Verner)',
            ],
            equipmentAndBrands: ['Megatherm', 'Pelltech', 'Ferroli SUN P7/P12', 'Centrometal', 'Verner', 'Buderus', 'Viessmann'],
            turnaroundOrSla: 'Reakcja w 2–24h · Tel. serwisu +370 693 97098 / +370 611 19158',
            priceReference: 'Diagnostyka, regulacja spalania i dostawa części zamiennych',
            imageUrl: '/studio-assets/projects/giles-darbas-12.webp',
            primaryHref: '#serviso-iskvietimas',
            primaryCtaLabel: 'Wezwij inżyniera serwisu',
        },
        {
            id: 'pillar-04-balansavimas-renovacija',
            numLabel: '04 / Równoważenie hydrauliczne i renowacja',
            title: 'Modernizacja instalacji grzewczych, równoważenie IMI TA / Danfoss i wkłady kominowe',
            subtitle:
                'Modernizacja jednorurowych i dwururowych instalacji grzewczych oraz równoważenie pionów w budynkach wielorodzinnych, szkołach i zakładach.',
            scopeBullets: [
                'Automatyczne regulatory różnicy ciśnień i przepływu IMI TA STAD, STAP, TBV-CMP, Compact-P i TA-Therm',
                'Armatura termostatyczna Heimeier V-exact / A-exact, Danfoss RA/RAS i bezprzewodowa automatyka Watts WFHT',
                'Montaż kwasoodpornych wkładów kominowych ze stali nierdzewnej i kominów izolowanych',
            ],
            equipmentAndBrands: ['IMI TA', 'Heimeier', 'Pneumatex', 'Danfoss', 'Watts Industries', 'Wilo', 'Grundfos'],
            turnaroundOrSla: 'Pomiary komputerem IMI TA Scope i protokół równoważenia',
            priceReference: 'Wycena wg liczby pionów i obiegów · Rabaty renowacyjne do -45%',
            imageUrl: '/studio-assets/projects/giles-darbas-10.webp',
            primaryHref: '/skaiciuokle?tab=valve',
            primaryCtaLabel: 'Kalkulator równoważenia',
        },
        {
            id: 'pillar-05-mobilios-konteinerines-nuoma',
            numLabel: '05 / Kotłownie kontenerowe i wynajem',
            title: 'Produkcja kotłowni kontenerowych (100 kW – 2,0 MW) oraz wynajem kotłowni mobilnych',
            subtitle:
                'Zmontowane fabrycznie kotłownie kontenerowe na biomasę, gaz i biogaz oraz mobilne moduły grzewcze 15–500 kW na czas awarii lub budowy.',
            scopeBullets: [
                '6 typów kotłowni mobilnych: 15–90 kW i 40–190 kW nadmuchowe, 110–120 kW Pellmobil wodne, 150–500 kW hydrauliczne',
                'Przemysłowe moduły biomasowe i biogazowe 250 kW, 500 kW, 750 kW i 2,0 MW z multicyklonami',
                'Posadowienie bez pozwolenia na budowę i podłączenie do sieci cieplnej w 1–2 dni',
            ],
            equipmentAndBrands: ['Gilės GK-100..GK-2500', 'Pellmobil', 'Megatherm MPB PRO', 'Verner', 'Thermostahl'],
            turnaroundOrSla: 'Dostawa kotłowni mobilnej w 24h · Produkcja 4–8 tyg.',
            priceReference: 'Wynajem od 690 € / mies. netto · Zakup od 24 500 € netto',
            imageUrl: '/studio-assets/projects/giles-darbas-06.webp',
            primaryHref: '/pramonei',
            primaryCtaLabel: 'Kotłownie kontenerowe i wynajem',
        },
        {
            id: 'pillar-06-silumos-siurbliai-eksportas',
            numLabel: '06 / Pompy ciepła i dotacje APVA',
            title: 'Pompy ciepła Haier R290 / Bosch, bojlery kombinowane i dokumentacja do dotacji',
            subtitle:
                'Montaż pomp ciepła powietrze–woda i powietrze–powietrze klasy A++, dobór zasobników Gorenje / Dražice / Centrometal oraz dokumenty do dotacji.',
            scopeBullets: [
                'Montaż systemów Haier Super Aqua Monoblock R290 oraz Bosch Climate 3000i (grzanie do -15 °C)',
                'Zbiorniki buforowe Gorenje ZV 50/200, bojlery ze stali nierdzewnej Centrometal oraz Dražice OKC',
                'Oficjalne paszporty techniczne, certyfikaty V klasy i faktury VAT do rozliczenia dotacji wymiany kotła',
            ],
            equipmentAndBrands: ['Haier', 'Bosch', 'Gorenje', 'Dražice', 'Centrometal', 'Ponast V-klasa', 'Zilmet'],
            turnaroundOrSla: 'Montaż w 1–2 dni rob. · Pełny pakiet dokumentów dotacyjnych',
            priceReference: 'Bosch Climate 3000i od 499 € · Zestawy Haier i kotłów z dofinansowaniem',
            imageUrl: '/studio-assets/projects/giles-darbas-15.webp',
            primaryHref: '/paketai',
            primaryCtaLabel: 'Zobacz pakiety systemowe',
        },
    ],
    ru: [
        {
            id: 'pillar-01-projektavimas-montavimas',
            numLabel: '01 / Проектирование и монтаж котельных',
            title: 'Проектирование (2D/3D) и монтаж котельных и систем ОВиК под ключ',
            subtitle:
                'Технические и рабочие проекты систем внутреннего отопления, водоснабжения, канализации, контейнерных и газовых котельных и складов топлива.',
            scopeBullets: [
                '3D-проектирование контейнерных, биомассовых, газовых котельных и топливных складов',
                'Полная сборка котельных с группами безопасности, буферными емкостями и насосно-смесительными узлами',
                'Монтаж теплого пола (HERZ PE-RT / Comisa PEX-AL-PEX) и коллекторных шкафов',
            ],
            equipmentAndBrands: ['HERZ', 'Centrometal', 'Verner', 'Ponast', 'Buderus', 'Viessmann', 'SANHA', 'Comisa'],
            turnaroundOrSla: 'Проект за 3–5 раб. дн. · Монтаж за 1–5 раб. дн.',
            priceReference: 'Смета котельной за 24 ч. · Монтаж от 480 € без НДС',
            imageUrl: '/studio-assets/projects/giles-darbas-11.webp',
            primaryHref: '/vedlys',
            primaryCtaLabel: 'Рассчитать проект котельной',
        },
        {
            id: 'pillar-02-katilu-perdarymas',
            numLabel: '02 / Переоборудование котлов на пеллеты',
            title: 'Автоматизация и переоборудование твердотопливных котлов на пеллеты',
            subtitle:
                'Вместо загрузочной дверцы устанавливаем ЧПУ-дверцу с пеллетной горелкой, турбулизаторы теплообменника и бункер на 200–2000 кг.',
            scopeBullets: [
                'Подходит для Viadrus U22/U26, Kalvis, Atmos, Stropuva, Dakon, Buderus S111/G221 и промышленных котлов',
                'Монтаж за 4–6 часов без демонтажа котельной с сохранением возможности топки дровами',
                'Комплекты фиксированной цены с монтажом и гарантией 2 года: «Link lyderių» (2 150 €), «Nord komfortui» (2 350 €)',
            ],
            equipmentAndBrands: ['Megatherm MPB', 'Pelltech PV20a/PV30a', 'Centrometal Cm Pelet-set', 'PellX', 'GX-Prometėjas'],
            turnaroundOrSla: 'Полное переоборудование и пусконаладка за 4–6 часов',
            priceReference: 'Комплект с монтажом и гарантией 2 года – от 2 150 € с НДС',
            imageUrl: '/studio-assets/projects/giles-darbas-01.webp',
            primaryHref: '/vedlys',
            primaryCtaLabel: 'Открыть мастер модернизации котла',
        },
        {
            id: 'pillar-03-servisas-atsargines-dalys',
            numLabel: '03 / Гарантийный и послегарантийный сервис',
            title: 'Сервис пеллетных горелок, котлов и тепловых насосов (Tech Support / After-Sales)',
            subtitle:
                'Гарантийное и послегарантийное обслуживание оборудования Centrometal, Bosch/Buderus, Viessmann, Ferroli, Verner, Protherm, Pelltech, Megatherm и HERZ по всей Литве.',
            scopeBullets: [
                'Срочное устранение неисправностей (ошибка A01, замена ТЭНов розжига, фотодатчиков, шнеков, колосников и контроллеров)',
                'Измерение и настройка параметров горения газоанализатором для максимального КПД',
                'Собственный склад запчастей в Каунасе и Вильнюсе на 10+ лет вперед (Ferroli SUN P, Pelltech, Megatherm, Verner)',
            ],
            equipmentAndBrands: ['Megatherm', 'Pelltech', 'Ferroli SUN P7/P12', 'Centrometal', 'Verner', 'Buderus', 'Viessmann'],
            turnaroundOrSla: 'Реакция за 2–24 ч. · Тел. сервиса +370 693 97098 / +370 611 19158',
            priceReference: 'Диагностика, настройка и поставка запчастей по всей Литве',
            imageUrl: '/studio-assets/projects/giles-darbas-12.webp',
            primaryHref: '#serviso-iskvietimas',
            primaryCtaLabel: 'Вызвать сервисного инженера',
        },
        {
            id: 'pillar-04-balansavimas-renovacija',
            numLabel: '04 / Гидравлическая балансировка и реновация',
            title: 'Реновация систем отопления, балансировка IMI TA / Danfoss и вкладыши дымоходов',
            subtitle:
                'Модернизация однотрубных и двухтрубных систем отопления и балансировка стояков многоквартирных домов, школ, детских садов и предприятий.',
            scopeBullets: [
                'Автоматические регуляторы перепада давления и расхода IMI TA STAD, STAP, TBV-CMP, Compact-P и TA-Therm',
                'Радиаторная термостатика Heimeier V-exact / A-exact, Danfoss RA/RAS и беспроводная автоматика Watts WFHT',
                'Монтаж кислотостойких вкладышей дымоходов из нержавеющей стали и утепленных дымоходов',
            ],
            equipmentAndBrands: ['IMI TA', 'Heimeier', 'Pneumatex', 'Danfoss', 'Watts Industries', 'Wilo', 'Grundfos'],
            turnaroundOrSla: 'Измерения компьютером IMI TA Scope и паспорт балансировки',
            priceReference: 'По количеству стояков и контуров · Специальные скидки на реновацию до -45%',
            imageUrl: '/studio-assets/projects/giles-darbas-10.webp',
            primaryHref: '/skaiciuokle?tab=valve',
            primaryCtaLabel: 'Калькулятор балансировки',
        },
        {
            id: 'pillar-05-mobilios-konteinerines-nuoma',
            numLabel: '05 / Контейнерные котельные и аренда',
            title: 'Производство контейнерных котельных (100 кВт – 2,0 МВт) и аренда мобильных котельных',
            subtitle:
                'Собранные на заводе контейнерные биомассовые, газовые и биогазовые котельные и мобильные тепловые модули 15–500 кВт на время аварий или стройки.',
            scopeBullets: [
                '6 типов мобильных котельных: 15–90 кВт и 40–190 кВт воздушные, 110–120 кВт Pellmobil водяные, 150–500 кВт гидравлические',
                'Промышленные модули 250 кВт, 500 кВт, 750 кВт и 2,0 МВт на биотопливе и биогазе с мультициклонами',
                'Устанавливаются без разрешения на строительство и подключаются к теплотрассе здания за 1–2 дня',
            ],
            equipmentAndBrands: ['Gilės GK-100..GK-2500', 'Pellmobil', 'Megatherm MPB PRO', 'Verner', 'Thermostahl'],
            turnaroundOrSla: 'Доставка мобильной котельной за 24 ч. · Производство 4–8 нед.',
            priceReference: 'Аренда от 690 € / мес. без НДС · Покупка от 24 500 € без НДС',
            imageUrl: '/studio-assets/projects/giles-darbas-06.webp',
            primaryHref: '/pramonei',
            primaryCtaLabel: 'Контейнерные котельные и аренда',
        },
        {
            id: 'pillar-06-silumos-siurbliai-eksportas',
            numLabel: '06 / Тепловые насосы и компенсации APVA',
            title: 'Тепловые насосы Haier R290 / Bosch, комбинированные бойлеры и документы для APVA',
            subtitle:
                'Монтаж тепловых насосов воздух–вода и воздух–воздух класса A++, подбор бойлеров Gorenje / Dražice / Centrometal и документы для компенсации APVA.',
            scopeBullets: [
                'Монтаж систем Haier Super Aqua Monoblock R290 и Bosch Climate 3000i (обогрев 2,6–5,3 кВт до -15 °C)',
                'Буферные емкости Gorenje ZV 50/200, комбинированные бойлеры из нержавейки Centrometal и Dražice OKC',
                'Официальные техпаспорта, сертификаты V класса и счета-фактуры для получения компенсации APVA',
            ],
            equipmentAndBrands: ['Haier', 'Bosch', 'Gorenje', 'Dražice', 'Centrometal', 'Ponast V-класс', 'Zilmet'],
            turnaroundOrSla: 'Монтаж за 1–2 раб. дн. · Полный пакет документов APVA',
            priceReference: 'Bosch Climate 3000i от 499 € · Комплекты Haier и котлов с поддержкой APVA',
            imageUrl: '/studio-assets/projects/giles-darbas-15.webp',
            primaryHref: '/paketai',
            primaryCtaLabel: 'Посмотреть системные пакеты',
        },
    ],
};

const COMPLETED_WORKS_I18N: Record<
    string,
    Record<
        Exclude<SupportedLocale, 'lt'>,
        Pick<
            GilesCompletedWorkItem,
            | 'numLabel'
            | 'categoryLabel'
            | 'title'
            | 'location'
            | 'fuelOrMedium'
            | 'boilerModel'
            | 'burnerOrEquipment'
            | 'scopeExecuted'
            | 'resultMetric'
            | 'ctaLabel'
        >
    >
> = {
    'darbas-01': {
        en: {
            numLabel: 'Assembly #01',
            categoryLabel: 'Solid-fuel to pellet boiler conversions',
            title: 'Cast-iron Viadrus U26 boiler conversion with Megatherm MPB pellet burner',
            location: 'Viadrus U26 + Megatherm MPB',
            fuelOrMedium: 'Wood pellets (DINplus 6–8 mm)',
            boilerModel: 'Viadrus U26 (cast-iron sectional solid-fuel boiler)',
            burnerOrEquipment: 'Megatherm MPB self-cleaning burner + CNC door flange',
            scopeExecuted:
                'Replaced the lower loading door with a custom CNC steel door with burner port, installed heat-exchanger turbulators (economizers), and connected the feed auger and burner controller.',
            resultMetric: 'Installed in 4–6 hours · 100% automatic operation',
            ctaLabel: 'Configure for my Viadrus boiler',
        },
        pl: {
            numLabel: 'Węzeł #01',
            categoryLabel: 'Modernizacja kotłów na pellet',
            title: 'Przeróbka żeliwnego kotła Viadrus U26 z palnikiem pelletowym Megatherm MPB',
            location: 'Viadrus U26 + Megatherm MPB',
            fuelOrMedium: 'Pellet drzewny (DINplus 6–8 mm)',
            boilerModel: 'Viadrus U26 (żeliwny kocioł członowy na paliwo stałe)',
            burnerOrEquipment: 'Samoczyszczący palnik Megatherm MPB + flansza drzwiczek CNC',
            scopeExecuted:
                'Zamiast dolnych drzwiczek zamontowano stalowe drzwiczki CNC z otworem pod palnik, włożono zawirowywacze spalin (ekonomizery) oraz podłączono podajnik ślimakowy i sterownik.',
            resultMetric: 'Montaż w 4–6 godz. · 100% praca automatyczna',
            ctaLabel: 'Dobierz do mojego kotła Viadrus',
        },
        ru: {
            numLabel: 'Узел #01',
            categoryLabel: 'Переоборудование котлов на пеллеты',
            title: 'Переоборудование чугунного котла Viadrus U26 с пеллетной горелкой Megatherm MPB',
            location: 'Viadrus U26 + Megatherm MPB',
            fuelOrMedium: 'Древесные пеллеты (DINplus 6–8 мм)',
            boilerModel: 'Viadrus U26 (чугунный секционный твердотопливный котел)',
            burnerOrEquipment: 'Самоочищающаяся горелка Megatherm MPB + ЧПУ-фланец дверцы',
            scopeExecuted:
                'Вместо нижней загрузочной дверцы установлена новая стальная ЧПУ-дверца с окном под горелку, установлены турбулизаторы (экономайзеры), подключены шнек подачи и контроллер.',
            resultMetric: 'Монтаж за 4–6 ч. · 100% автоматический режим',
            ctaLabel: 'Подобрать для моего котла Viadrus',
        },
    },
    'darbas-02': {
        en: {
            numLabel: 'Assembly #02',
            categoryLabel: 'Solid-fuel to pellet boiler conversions',
            title: 'Viadrus U26 boiler room assembly with pellet hopper and screw feeder',
            location: '"Link lyderių" kit',
            fuelOrMedium: 'Wood pellets',
            boilerModel: 'Viadrus U26 + 460 L galvanized pellet hopper',
            burnerOrEquipment: '"Link lyderių" kit (Megatherm 10–35 kW + 1.5 m auger + air compressor)',
            scopeExecuted:
                'Full solid-fuel boiler room automation: installed 460 L hopper, 1.5 m feed auger, pneumatic slag cleaning with compressor, and room thermostat.',
            resultMetric: 'Autonomous operation for 7–10 days without refilling',
            ctaLabel: 'Order "Link lyderių" kit',
        },
        pl: {
            numLabel: 'Węzeł #02',
            categoryLabel: 'Modernizacja kotłów na pellet',
            title: 'Zestaw kotłowni Viadrus U26 z zasobnikiem pelletu i podajnikiem ślimakowym',
            location: 'Zestaw „Link lyderių”',
            fuelOrMedium: 'Pellet drzewny',
            boilerModel: 'Viadrus U26 + ocynkowany zasobnik pelletu 460 L',
            burnerOrEquipment: 'Zestaw „Link lyderių” (Megatherm 10–35 kW + podajnik 1,5 m + kompresor)',
            scopeExecuted:
                'Pełna automatyzacja kotłowni stałopaliwowej: ustawiono zasobnik 460 L, zamontowano podajnik 1,5 m, pneumatyczne czyszczenie szlaki kompresorem i termostat pokojowy.',
            resultMetric: 'Praca autonomiczna 7–10 dni bez dosypywania',
            ctaLabel: 'Zamów zestaw „Link lyderių”',
        },
        ru: {
            numLabel: 'Узел #02',
            categoryLabel: 'Переоборудование котлов на пеллеты',
            title: 'Узел котельной Viadrus U26 с бункером для пеллет и шнековым питателем',
            location: 'Комплект «Link lyderių»',
            fuelOrMedium: 'Древесные пеллеты',
            boilerModel: 'Viadrus U26 + оцинкованный бункер 460 л',
            burnerOrEquipment: 'Комплект «Link lyderių» (Megatherm 10–35 кВт + шнек 1,5 м + компрессор)',
            scopeExecuted:
                'Полная автоматизация твердотопливной котельной: установлен бункер 460 л, шнек подачи 1,5 м, пневматическая очистка шлака компрессором и комнатный термостат.',
            resultMetric: 'Автономная работа 7–10 суток без дозагрузки',
            ctaLabel: 'Заказать комплект «Link lyderių»',
        },
    },
    'darbas-03': {
        en: {
            numLabel: 'Assembly #03',
            categoryLabel: 'Solid-fuel to pellet boiler conversions',
            title: 'Steel boiler Buderus Logano S111 automation with pellet burner',
            location: 'Buderus Logano S111',
            fuelOrMedium: 'Wood pellets',
            boilerModel: 'Buderus Logano S111 steel solid-fuel boiler',
            burnerOrEquipment: 'Pelltech PV20a pellet burner + fuel hopper + controller',
            scopeExecuted:
                'Fitted custom mounting flange for Buderus Logano S111 boiler, installed self-cleaning burner, and tuned combustion with a flue gas analyzer.',
            resultMetric: 'Automatic pellet feeding and combustion control',
            ctaLabel: 'Check Buderus compatibility',
        },
        pl: {
            numLabel: 'Węzeł #03',
            categoryLabel: 'Modernizacja kotłów na pellet',
            title: 'Automatyzacja stalowego kotła Buderus Logano S111 palnikiem pelletowym',
            location: 'Buderus Logano S111',
            fuelOrMedium: 'Pellet drzewny',
            boilerModel: 'Stalowy kocioł stałopaliwowy Buderus Logano S111',
            burnerOrEquipment: 'Palnik pelletowy Pelltech PV20a + zasobnik paliwa + automatyka',
            scopeExecuted:
                'Dopasowano flanszę montażową do kotła Buderus Logano S111, zamontowano samoczyszczący palnik oraz wykonano analizę i regulację spalin.',
            resultMetric: 'Automatyczne podawanie pelletu i kontrola spalania',
            ctaLabel: 'Sprawdź kompatybilność Buderus',
        },
        ru: {
            numLabel: 'Узел #03',
            categoryLabel: 'Переоборудование котлов на пеллеты',
            title: 'Автоматизация стального котла Buderus Logano S111 пеллетной горелкой',
            location: 'Buderus Logano S111',
            fuelOrMedium: 'Древесные пеллеты',
            boilerModel: 'Стальной твердотопливный котел Buderus Logano S111',
            burnerOrEquipment: 'Пеллетная горелка Pelltech PV20a + бункер + автоматика',
            scopeExecuted:
                'Изготовлен монтажный фланец для котла Buderus Logano S111, установлена самоочищающаяся горелка и выполнена настройка горения газоанализатором.',
            resultMetric: 'Автоматическая подача пеллет и контроль горения',
            ctaLabel: 'Проверить совместимость Buderus',
        },
    },
    'darbas-04': {
        en: {
            numLabel: 'Assembly #04',
            categoryLabel: 'Solid-fuel to pellet boiler conversions',
            title: 'Dakon DOR 32 boiler retrofit with Pelltech PV20a pellet burner',
            location: 'Dakon DOR 32 + Pelltech PV20a',
            fuelOrMedium: 'Wood pellets (6 mm)',
            boilerModel: 'Dakon DOR 32 steel solid-fuel boiler',
            burnerOrEquipment: 'Pelltech PV20a with backup battery and pneumatic cleaning',
            scopeExecuted:
                'Installed Pelltech PV20a burner with internal dosing auger, safety thermostat, automatic ignition, and 8–20 kW power modulation.',
            resultMetric: 'Automatic ignition and 8–20 kW modulation',
            ctaLabel: 'Order "Nord komfortui" kit',
        },
        pl: {
            numLabel: 'Węzeł #04',
            categoryLabel: 'Modernizacja kotłów na pellet',
            title: 'Modernizacja kotła Dakon DOR 32 z palnikiem pelletowym Pelltech PV20a',
            location: 'Dakon DOR 32 + Pelltech PV20a',
            fuelOrMedium: 'Pellet drzewny (6 mm)',
            boilerModel: 'Stalowy kocioł stałopaliwowy Dakon DOR 32',
            burnerOrEquipment: 'Pelltech PV20a z akumulatorem awaryjnym i kompresorem',
            scopeExecuted:
                'Zamontowano palnik Pelltech PV20a z wewnętrznym ślimakiem dozującym, termostatem bezpieczeństwa, automatycznym rozpalaniem i modulacją mocy 8–20 kW.',
            resultMetric: 'Samoczynne rozpalanie i modulacja 8–20 kW',
            ctaLabel: 'Zamów zestaw „Nord komfortui”',
        },
        ru: {
            numLabel: 'Узел #04',
            categoryLabel: 'Переоборудование котлов на пеллеты',
            title: 'Модернизация котла Dakon DOR 32 с пеллетной горелкой Pelltech PV20a',
            location: 'Dakon DOR 32 + Pelltech PV20a',
            fuelOrMedium: 'Древесные пеллеты (6 мм)',
            boilerModel: 'Стальной твердотопливный котел Dakon DOR 32',
            burnerOrEquipment: 'Pelltech PV20a с резервным аккумулятором и компрессором',
            scopeExecuted:
                'Установлена горелка Pelltech PV20a с внутренним шнеком, защитным термостатом, авторозжигом и модуляцией мощности от 8 до 20 кВт.',
            resultMetric: 'Автоматический розжиг и модуляция 8–20 кВт',
            ctaLabel: 'Заказать комплект «Nord komfortui»',
        },
    },
    'darbas-05': {
        en: {
            numLabel: 'Assembly #05',
            categoryLabel: 'Solid-fuel to pellet boiler conversions',
            title: 'Solid-fuel boiler conversion with dual door system and pellet hopper',
            location: 'CNC door flange + hopper',
            fuelOrMedium: 'Wood pellets / Firewood (dual fuel)',
            boilerModel: 'Solid-fuel boiler with dual loading doors',
            burnerOrEquipment: 'Pellet burner + CNC door with quick-release blanking plate + 460 L hopper',
            scopeExecuted:
                'Manufactured an auxiliary door for the pellet burner so the burner can be detached when firing firewood or briquettes without modifying the original boiler door.',
            resultMetric: 'Dual-fuel flexibility (pellets + wood) without replacing boiler',
            ctaLabel: 'Select burner for my boiler',
        },
        pl: {
            numLabel: 'Węzeł #05',
            categoryLabel: 'Modernizacja kotłów na pellet',
            title: 'Przeróbka kotła stałopaliwowego z podwójnymi drzwiczkami i zasobnikiem',
            location: 'Flansza drzwiczek CNC + zasobnik',
            fuelOrMedium: 'Pellet drzewny / Drewno (paliwo zamienne)',
            boilerModel: 'Kocioł na paliwo stałe z podwójnymi drzwiczkami zasypowymi',
            burnerOrEquipment: 'Palnik pelletowy + drzwiczki CNC z zaślepką + zasobnik 460 L',
            scopeExecuted:
                'Wykonano dodatkowe drzwiczki pod palnik pelletowy, co pozwala na szybkie odłączenie palnika i palenie drewnem lub brykietem bez naruszania oryginalnych drzwiczek.',
            resultMetric: '2 rodzaje paliwa (pellet + drewno) bez wymiany kotła',
            ctaLabel: 'Dobierz palnik do mojego kotła',
        },
        ru: {
            numLabel: 'Узел #05',
            categoryLabel: 'Переоборудование котлов на пеллеты',
            title: 'Переоборудование твердотопливного котла с двойной дверцей и бункером',
            location: 'ЧПУ-фланец дверцы + бункер',
            fuelOrMedium: 'Древесные пеллеты / Дрова (резервное топливо)',
            boilerModel: 'Твердотопливный котел с двойной загрузочной дверцей',
            burnerOrEquipment: 'Пеллетная горелка + ЧПУ-дверца с быстросъемной заглушкой + бункер 460 л',
            scopeExecuted:
                'Изготовлена дополнительная дверца для пеллетной горелки: при необходимости топки дровами или брикетами горелка снимается без повреждения оригинальной дверцы котла.',
            resultMetric: '2 вида топлива (пеллеты + дрова) без замены котла',
            ctaLabel: 'Подобрать горелку к моему котлу',
        },
    },
    'darbas-06': {
        en: {
            numLabel: 'Assembly #06',
            categoryLabel: 'Industrial & containerized boiler rooms',
            title: '500 kW industrial containerized biomass boiler plant GK-500 (factory build)',
            location: 'Containerized boiler room GK-500',
            fuelOrMedium: 'Wood pellets / biomass',
            boilerModel: 'Gilės GK-500 containerized biomass module (6,058 × 2,438 × 2,896 mm)',
            burnerOrEquipment: 'Industrial boiler with moving grates, multicyclone, and GSM/SCADA',
            scopeExecuted:
                'Factory-assembled, hydrostatically pressure-tested, and insulated 500 kW containerized heat module with automatic fuel feeding, flue gas cleaning, and remote telemetry.',
            resultMetric: 'Full factory assembly and hydrostatic pressure test',
            ctaLabel: 'GK-500 specification & ROI',
        },
        pl: {
            numLabel: 'Węzeł #06',
            categoryLabel: 'Kotłownie przemysłowe i kontenerowe',
            title: 'Przemysłowa kontenerowa kotłownia biomasowa 500 kW GK-500 (montaż fabryczny)',
            location: 'Kotłownia kontenerowa GK-500',
            fuelOrMedium: 'Pellet drzewny / biomasa',
            boilerModel: 'Kontenerowy moduł biomasowy Gilės GK-500 (6 058 × 2 438 × 2 896 mm)',
            burnerOrEquipment: 'Kocioł przemysłowy z rusztem ruchomym, multicyklonem i GSM/SCADA',
            scopeExecuted:
                'Zmontowany fabrycznie, poddany próbie ciśnieniowej i zaizolowany moduł grzewczy 500 kW z automatycznym podawaniem paliwa, odpylaniem spalin i zdalną telemetrią.',
            resultMetric: 'Pełny montaż fabryczny i próba ciśnieniowa',
            ctaLabel: 'Specyfikacja GK-500 i zwrot ROI',
        },
        ru: {
            numLabel: 'Узел #06',
            categoryLabel: 'Промышленные и контейнерные котельные',
            title: 'Промышленная контейнерная биомассовая котельная 500 кВт GK-500 (заводская сборка)',
            location: 'Контейнерная котельная GK-500',
            fuelOrMedium: 'Древесные пеллеты / биотопливо',
            boilerModel: 'Контейнерный биомассовый модуль Gilės GK-500 (6 058 × 2 438 × 2 896 мм)',
            burnerOrEquipment: 'Промышленный котел с подвижными колосниками, мультициклоном и GSM/SCADA',
            scopeExecuted:
                'Собранный на заводе, гидравлически испытанный и утепленный контейнерный тепловой модуль 500 кВт с автоподачей топлива, очисткой дымовых газов и телеметрией.',
            resultMetric: 'Полная заводская сборка и гидравлические испытания',
            ctaLabel: 'Спецификация GK-500 и расчет ROI',
        },
    },
    'darbas-07': {
        en: {
            numLabel: 'Assembly #07',
            categoryLabel: 'Industrial & containerized boiler rooms',
            title: '750 kW industrial containerized biomass boiler plant GK-750',
            location: 'Industrial module GK-750',
            fuelOrMedium: 'Wood pellets / agropellets / wood chips',
            boilerModel: 'Gilės GK-750 modular industrial biomass boiler plant',
            burnerOrEquipment: 'Screw fuel conveyor + pneumatic heat-exchanger cleaning + induced draft fan',
            scopeExecuted:
                'Engineered and manufactured a 750 kW industrial boiler plant with VFD-controlled flue draft fan, multicyclone, automatic de-ashing, and 6 bar hydronic manifold.',
            resultMetric: 'Heated area up to 6,500 m² · Full telemetry',
            ctaLabel: 'Calculate industrial payback',
        },
        pl: {
            numLabel: 'Węzeł #07',
            categoryLabel: 'Kotłownie przemysłowe i kontenerowe',
            title: 'Przemysłowa kontenerowa kotłownia biomasowa 750 kW GK-750',
            location: 'Moduł przemysłowy GK-750',
            fuelOrMedium: 'Pellet drzewny / agropellet / zrębka',
            boilerModel: 'Modułowa przemysłowa kotłownia biomasowa Gilės GK-750',
            burnerOrEquipment: 'Podajnik ślimakowy + pneumatyczne czyszczenie wymiennika + wentylator wyciągowy',
            scopeExecuted:
                'Zaprojektowano i wyprodukowano kotłownię przemysłową 750 kW z wentylatorem spalin z falownikiem, multicyklonem, automatycznym odpopielaniem i układem hydraulicznym 6 bar.',
            resultMetric: 'Ogrzewana powierzchnia do 6 500 m² · Pełna telemetria',
            ctaLabel: 'Oblicz przemysłowy zwrot ROI',
        },
        ru: {
            numLabel: 'Узел #07',
            categoryLabel: 'Промышленные и контейнерные котельные',
            title: 'Промышленная контейнерная биомассовая котельная 750 кВт GK-750',
            location: 'Промышленный модуль GK-750',
            fuelOrMedium: 'Древесные пеллеты / агропеллеты / щепа',
            boilerModel: 'Модульная промышленная биомассовая котельная Gilės GK-750',
            burnerOrEquipment: 'Шнековая подача топлива + пневмоочистка теплообменника + дымосос',
            scopeExecuted:
                'Спроектирована и изготовлена промышленная котельная 750 кВт с дымососом на частотном приводе, мультициклоном, автоматическим золоудалением и гидравлическим узлом 6 бар.',
            resultMetric: 'Отапливаемая площадь до 6 500 м² · Полная телеметрия',
            ctaLabel: 'Рассчитать промышленную окупаемость',
        },
    },
    'darbas-08': {
        en: {
            numLabel: 'Assembly #08',
            categoryLabel: 'Industrial & containerized boiler rooms',
            title: '2.0 MW modular industrial boiler plant with Walking-Floor fuel store & flue filtration',
            location: 'Modular complex GK-2000',
            fuelOrMedium: 'Biomass (wood chips G30–G50 / wood pellets)',
            boilerModel: 'Gilės GK-2000 industrial cascade boiler complex',
            burnerOrEquipment: 'Walking-Floor fuel bunker + multicyclone + automatic ash extraction',
            scopeExecuted:
                'High-output industrial biomass complex featuring a hydraulic Walking-Floor fuel bunker, multi-stage flue gas filter, and SCADA supervisory control.',
            resultMetric: 'Meets EU EcoDesign and environmental emission standards',
            ctaLabel: 'Request 1–2.5 MW proposal',
        },
        pl: {
            numLabel: 'Węzeł #08',
            categoryLabel: 'Kotłownie przemysłowe i kontenerowe',
            title: 'Modułowa kotłownia przemysłowa 2,0 MW z magazynem paliwa i systemem odpylania spalin',
            location: 'Kompleks modułowy GK-2000',
            fuelOrMedium: 'Biomasa (zrębka G30–G50 / pellet drzewny)',
            boilerModel: 'Przemysłowy kaskadowy kompleks kotłowni Gilės GK-2000',
            burnerOrEquipment: 'Magazyn paliwa Walking-Floor + multicyklon + automatyczne odpopielanie',
            scopeExecuted:
                'Kompleks biomasowy dużej mocy z hydrauliczną ruchomą podłogą (Walking-Floor), wielostopniowym filtrem spalin oraz systemem nadrzędnym SCADA.',
            resultMetric: 'Spełnia normy UE EcoDesign i ochrony środowiska',
            ctaLabel: 'Uzyskaj ofertę 1–2,5 MW',
        },
        ru: {
            numLabel: 'Узел #08',
            categoryLabel: 'Промышленные и контейнерные котельные',
            title: 'Модульная промышленная котельная 2,0 МВт со складом топлива и системой очистки дыма',
            location: 'Модульный комплекс GK-2000',
            fuelOrMedium: 'Биотопливо (щепа G30–G50 / древесные пеллеты)',
            boilerModel: 'Промышленный каскадный котельный комплекс Gilės GK-2000',
            burnerOrEquipment: 'Склад топлива Walking-Floor + мультициклон + автоматическое золоудаление',
            scopeExecuted:
                'Промышленный биомассовый комплекс большой мощности со складом топлива с подвижным полом (Walking-Floor), многоступенчатым фильтром дымовых газов и диспетчеризацией SCADA.',
            resultMetric: 'Соответствует нормам ЕС EcoDesign и экологическим требованиям',
            ctaLabel: 'Получить предложение 1–2,5 МВт',
        },
    },
    'darbas-09': {
        en: {
            numLabel: 'Assembly #09',
            categoryLabel: 'Industrial & containerized boiler rooms',
            title: 'Mobile containerized boiler plant (150–500 kW) for rental, construction & emergency heating',
            location: 'Mobile boiler module',
            fuelOrMedium: 'Wood pellets / diesel',
            boilerModel: 'Mobile hydronic heating boiler room on trailer / skid frame',
            burnerOrEquipment: 'Quick-connect DN50/DN65 couplings + integrated fuel hopper + GSM telemetry',
            scopeExecuted:
                'Prepared mobile boiler module for rapid building heating during emergencies, district heating line reconstruction, or winter construction with delivery and hookup.',
            resultMetric: 'Quick-connect DN50/DN65 hydronic couplings',
            ctaLabel: 'Book mobile boiler rental',
        },
        pl: {
            numLabel: 'Węzeł #09',
            categoryLabel: 'Kotłownie przemysłowe i kontenerowe',
            title: 'Mobilna kotłownia kontenerowa (150–500 kW) na wynajem, budowy i ogrzewanie awaryjne',
            location: 'Moduł kotłowni mobilnej',
            fuelOrMedium: 'Pellet drzewny / olej napędowy',
            boilerModel: 'Mobilna kotłownia wodna na przyczepie / ramie',
            burnerOrEquipment: 'Szybkozłącza DN50/DN65 + zintegrowany zasobnik paliwa + sterowanie GSM',
            scopeExecuted:
                'Przygotowany mobilny moduł kotłowni do szybkiego ogrzewania budynków podczas awarii, modernizacji sieci cieplnych lub prac budowlanych zimą wraz z dostawą.',
            resultMetric: 'Szybkozłącza hydrauliczne DN50/DN65',
            ctaLabel: 'Zamów wynajem kotłowni mobilnej',
        },
        ru: {
            numLabel: 'Узел #09',
            categoryLabel: 'Промышленные и контейнерные котельные',
            title: 'Мобильная контейнерная котельная (150–500 кВт) для аренды, стройки и аварийного отопления',
            location: 'Модуль мобильной котельной',
            fuelOrMedium: 'Древесные пеллеты / дизель',
            boilerModel: 'Мобильная водогрейная котельная на шасси / раме',
            burnerOrEquipment: 'Быстроразъемные муфты DN50/DN65 + встроенный бункер + GSM-управление',
            scopeExecuted:
                'Подготовлен мобильный модуль котельной для оперативного отопления зданий при авариях, реконструкции теплотрасс или зимних строительных работах с доставкой и подключением.',
            resultMetric: 'Быстроразъемные гидравлические соединения DN50/DN65',
            ctaLabel: 'Заказать аренду мобильной котельной',
        },
    },
    'darbas-10': {
        en: {
            numLabel: 'Assembly #10',
            categoryLabel: 'Industrial & containerized boiler rooms',
            title: '500 kW rooftop containerized gas boiler plant with cascade boilers and flues',
            location: 'Rooftop gas boiler room',
            fuelOrMedium: 'Natural gas',
            boilerModel: 'Rooftop containerized gas boiler plant',
            burnerOrEquipment: 'Cascade gas boilers + stainless-steel flues + pump station',
            scopeExecuted:
                'Engineered, manufactured, and crane-lifted onto a building roof a 500 kW containerized gas boiler room with cascade automation and stainless-steel flue system.',
            resultMetric: 'Rooftop installation with zero indoor floor space lost',
            ctaLabel: 'Containerized boiler project',
        },
        pl: {
            numLabel: 'Węzeł #10',
            categoryLabel: 'Kotłownie przemysłowe i kontenerowe',
            title: 'Kontenerowa kotłownia gazowa 500 kW z kaskadą kotłów i kominami',
            location: 'Dachowa kotłownia gazowa',
            fuelOrMedium: 'Gaz ziemny',
            boilerModel: 'Dachowa kontenerowa kotłownia gazowa',
            burnerOrEquipment: 'Kaskadowe kotły gazowe + kominy ze stali nierdzewnej + grupa pompowa',
            scopeExecuted:
                'Zaprojektowano, wyprodukowano i zamontowano na dachu budynku kontenerową kotłownię gazową 500 kW z automatyką kaskadową i kominami ze stali nierdzewnej.',
            resultMetric: 'Montaż na dachu bez utraty powierzchni wewnętrznej',
            ctaLabel: 'Projekt kotłowni kontenerowej',
        },
        ru: {
            numLabel: 'Узел #10',
            categoryLabel: 'Промышленные и контейнерные котельные',
            title: 'Контейнерная газовая котельная 500 кВт с каскадными котлами и дымоходами',
            location: 'Крышная газовая котельная',
            fuelOrMedium: 'Природный газ',
            boilerModel: 'Крышная контейнерная газовая котельная',
            burnerOrEquipment: 'Каскадные газовые котлы + дымоходы из нержавеющей стали + насосная группа',
            scopeExecuted:
                'Спроектирована, изготовлена и смонтирована на кровле здания контейнерная газовая котельная 500 кВт с каскадной автоматикой и дымоходами из нержавейки.',
            resultMetric: 'Монтаж на крыше без потери внутренней площади здания',
            ctaLabel: 'Проект контейнерной котельной',
        },
    },
    'darbas-11': {
        en: {
            numLabel: 'Assembly #11',
            categoryLabel: 'Heat pumps & hydronic boiler rooms',
            title: '200 kW boiler room hydronic plant, distribution manifolds & balancing system',
            location: 'Hydronic heating substation',
            fuelOrMedium: 'Hydronic heating circuit',
            boilerModel: '200 kW industrial hydronic plant with distribution headers',
            burnerOrEquipment: 'Electronic circulation pumps + IMI TA STAD/STAP balancing valves + Pneumatex',
            scopeExecuted:
                'Installed 200 kW boiler room hydronic substation with mixing valves, electronic circulation pumps, and IMI TA circuit flow balancing.',
            resultMetric: 'Precision hydronic balancing across all heating circuits',
            ctaLabel: 'Size hydronic substation',
        },
        pl: {
            numLabel: 'Węzeł #11',
            categoryLabel: 'Pompy ciepła i węzły cieplne',
            title: 'Węzeł cieplny kotłowni 200 kW, rozdzielacze obiegów i system równoważenia',
            location: 'Hydrauliczny węzeł cieplny',
            fuelOrMedium: 'Obieg grzewczy',
            boilerModel: 'Przemysłowy węzeł cieplny 200 kW z kolektorami rozdzielczymi',
            burnerOrEquipment: 'Elektroniczne pompy obiegowe + zawory równoważące IMI TA STAD/STAP + Pneumatex',
            scopeExecuted:
                'Zamontowano hydrauliczny węzeł cieplny kotłowni 200 kW z zaworami mieszającymi, elektronicznymi pompami obiegowymi oraz równoważeniem przepływów IMI TA.',
            resultMetric: 'Precyzyjne równoważenie hydrauliczne obiegów grzewczych',
            ctaLabel: 'Oblicz węzeł cieplny',
        },
        ru: {
            numLabel: 'Узел #11',
            categoryLabel: 'Тепловые насосы и котельные',
            title: 'Тепловой узел котельной 200 кВт, распределительные коллекторы и система балансировки',
            location: 'Гидравлический тепловой узел',
            fuelOrMedium: 'Отопительный контур',
            boilerModel: 'Промышленный тепловой узел 200 кВт с распределительными коллекторами',
            burnerOrEquipment: 'Электронные циркуляционные насосы + балансировочные клапаны IMI TA STAD/STAP + Pneumatex',
            scopeExecuted:
                'Смонтирован гидравлический тепловой узел котельной 200 кВт со смесительными клапанами, электронными насосами и балансировкой потоков IMI TA.',
            resultMetric: 'Точная гидравлическая балансировка контуров',
            ctaLabel: 'Рассчитать тепловой узел',
        },
    },
    'darbas-12': {
        en: {
            numLabel: 'Assembly #12',
            categoryLabel: 'Service & automation',
            title: '25 kW boiler room piping, 2 heating zones & remote GSM telemetry installation',
            location: 'Boiler room piping & GSM',
            fuelOrMedium: 'Liquid fuel / pellets',
            boilerModel: 'Automated boiler room with 2-zone mixing manifold and GSM control',
            burnerOrEquipment: 'Danfoss / HERZ mixing valves + GSM antenna and remote monitoring',
            scopeExecuted:
                'Turnkey boiler room installation: piping layout, 2 heating zone pump groups, expansion vessels, chimney connection, and GSM remote control antenna.',
            resultMetric: 'Turnkey installation with remote diagnostics',
            ctaLabel: 'Order automation & service',
        },
        pl: {
            numLabel: 'Węzeł #12',
            categoryLabel: 'Serwis i automatyka',
            title: 'Montaż orurowania kotłowni 25 kW, 2 obiegów grzewczych i zdalnej telemetrii GSM',
            location: 'Orurowanie kotłowni i GSM',
            fuelOrMedium: 'Paliwo płynne / pellet',
            boilerModel: 'Automatyczna kotłownia z układem mieszającym 2 obiegów i sterowaniem GSM',
            burnerOrEquipment: 'Zawory mieszające Danfoss / HERZ + antena GSM i zdalny monitoring',
            scopeExecuted:
                'Kompleksowy montaż kotłowni: prowadzenie rurociągów, grupy pompowe 2 obiegów grzewczych, naczynia wzbiorcze, komin i antena zdalnego nadzoru GSM.',
            resultMetric: 'Montaż pod klucz ze zdalną diagnostyką',
            ctaLabel: 'Zamów automatykę i serwis',
        },
        ru: {
            numLabel: 'Узел #12',
            categoryLabel: 'Сервис и автоматика',
            title: 'Монтаж обвязки котельной 25 кВт, 2 контуров отопления и удаленной GSM-телеметрии',
            location: 'Обвязка котельной и GSM',
            fuelOrMedium: 'Жидкое топливо / пеллеты',
            boilerModel: 'Автоматическая котельная со смесительным узлом на 2 контура и GSM-управлением',
            burnerOrEquipment: 'Смесительные клапаны Danfoss / HERZ + GSM-антенна и удаленный мониторинг',
            scopeExecuted:
                'Полный монтаж котельной: разводка трубопроводов, насосные группы 2 контуров отопления, расширительные баки, дымоход и GSM-антенна диспетчеризации.',
            resultMetric: 'Монтаж под ключ с удаленной диагностикой',
            ctaLabel: 'Заказать автоматику и сервис',
        },
    },
    'darbas-13': {
        en: {
            numLabel: 'Assembly #13',
            categoryLabel: 'Industrial & containerized boiler rooms',
            title: '250 kW containerized biomass boiler plant GK-250 with insulated chimney',
            location: 'Containerized boiler room GK-250',
            fuelOrMedium: 'Wood pellets',
            boilerModel: 'Gilės GK-250 containerized boiler plant',
            burnerOrEquipment: '250 kW biomass boiler + stainless-steel insulated chimney + fuel hopper',
            scopeExecuted:
                'Manufactured and positioned a 250 kW containerized boiler plant with external insulated chimney, screw fuel feeder, and safety hydronics.',
            resultMetric: 'Placed on foundation blocks without a building permit',
            ctaLabel: 'GK-250 industrial module',
        },
        pl: {
            numLabel: 'Węzeł #13',
            categoryLabel: 'Kotłownie przemysłowe i kontenerowe',
            title: 'Kontenerowa kotłownia biomasowa 250 kW GK-250 z izolowanym kominem',
            location: 'Kotłownia kontenerowa GK-250',
            fuelOrMedium: 'Pellet drzewny',
            boilerModel: 'Kotłownia kontenerowa Gilės GK-250',
            burnerOrEquipment: 'Kocioł biomasowy 250 kW + komin ze stali nierdzewnej + zasobnik paliwa',
            scopeExecuted:
                'Wyprodukowano i posadowiono kontenerową kotłownię 250 kW z zewnętrznym izolowanym kominem, ślimakowym podawaniem paliwa i hydrauliką bezpieczeństwa.',
            resultMetric: 'Posadowienie na bloczkach fundamentowych bez pozwolenia na budowę',
            ctaLabel: 'Moduł przemysłowy GK-250',
        },
        ru: {
            numLabel: 'Узел #13',
            categoryLabel: 'Промышленные и контейнерные котельные',
            title: 'Контейнерная биомассовая котельная 250 кВт GK-250 с утепленным дымоходом',
            location: 'Контейнерная котельная GK-250',
            fuelOrMedium: 'Древесные пеллеты',
            boilerModel: 'Контейнерная котельная Gilės GK-250',
            burnerOrEquipment: 'Биомассовый котел 250 кВт + утепленный дымоход из нержавейки + бункер',
            scopeExecuted:
                'Изготовлена и установлена контейнерная котельная 250 кВт с наружным утепленным дымоходом, шнековой подачей топлива и защитной гидравликой.',
            resultMetric: 'Установка на фундаментные блоки без разрешения на строительство',
            ctaLabel: 'Промышленный модуль GK-250',
        },
    },
    'darbas-14': {
        en: {
            numLabel: 'Assembly #14',
            categoryLabel: 'Industrial & containerized boiler rooms',
            title: 'Industrial biogas boiler plant with activated-carbon gas filtration system',
            location: 'Biogas filtration & boiler plant',
            fuelOrMedium: 'Biogas / biomass',
            boilerModel: 'Gilės biogas and biomass industrial heat module',
            burnerOrEquipment: 'Biogas filters + stainless-steel headers + industrial burner',
            scopeExecuted:
                'Engineered and installed an industrial biogas boiler plant with a dual-column activated-carbon biogas filtration train, stainless-steel gas piping, and condensate trap.',
            resultMetric: 'Dual-column biogas filtration and stainless-steel manifolds',
            ctaLabel: 'Biogas & industrial solutions',
        },
        pl: {
            numLabel: 'Węzeł #14',
            categoryLabel: 'Kotłownie przemysłowe i kontenerowe',
            title: 'Przemysłowa kotłownia biogazowa z systemem filtracji gazu na węglu aktywnym',
            location: 'Węzeł filtracji biogazu i kotłownia',
            fuelOrMedium: 'Biogaz / biomasa',
            boilerModel: 'Przemysłowy moduł grzewczy na biogaz i biomasę Gilės',
            burnerOrEquipment: 'Filtry biogazu + kolektory ze stali nierdzewnej + palnik przemysłowy',
            scopeExecuted:
                'Zaprojektowano i zamontowano przemysłową kotłownię biogazową z dwukolumnową stacją filtracji biogazu, rurociągiem ze stali nierdzewnej i odwadniaczem kondensatu.',
            resultMetric: 'Dwukolumnowa filtracja biogazu i kolektory ze stali nierdzewnej',
            ctaLabel: 'Rozwiązania biogazowe i przemysłowe',
        },
        ru: {
            numLabel: 'Узел #14',
            categoryLabel: 'Промышленные и контейнерные котельные',
            title: 'Промышленная биогазовая котельная с угольной системой фильтрации газа',
            location: 'Узел фильтрации биогаза и котельная',
            fuelOrMedium: 'Биогаз / биотопливо',
            boilerModel: 'Промышленный тепловой модуль на биогазе и биотопливе Gilės',
            burnerOrEquipment: 'Фильтры биогаза + коллекторы из нержавеющей стали + промышленная горелка',
            scopeExecuted:
                'Спроектирована и смонтирована промышленная биогазовая котельная с двухколонной системой фильтрации биогаза, газопроводом из нержавейки и узлом отвода конденсата.',
            resultMetric: 'Двухколонная фильтрация биогаза и коллекторы из нержавейки',
            ctaLabel: 'Биогазовые и промышленные решения',
        },
    },
    'darbas-15': {
        en: {
            numLabel: 'Assembly #15',
            categoryLabel: 'Heat pumps & hydronic boiler rooms',
            title: '120 kW mobile pellet hot-water & heating boiler plant Pellmobil',
            location: 'Pellmobil 120 kW with DHW substation',
            fuelOrMedium: 'Wood pellets (DINplus)',
            boilerModel: 'Pellmobil 120 kW with domestic hot water (DHW) preparation module',
            burnerOrEquipment: '2×60 kW pellet boilers + plate heat exchanger + buffer tank',
            scopeExecuted:
                'Fully automated 120 kW pellet boiler room with integrated sanitary hot-water substation, buffer tank, and quick-connect couplings.',
            resultMetric: 'Space heating and DHW for buildings up to 2,500 m²',
            ctaLabel: 'Boiler room & DHW packages',
        },
        pl: {
            numLabel: 'Węzeł #15',
            categoryLabel: 'Pompy ciepła i węzły cieplne',
            title: 'Mobilna kotłownia pelletowa CO i CWU Pellmobil 120 kW',
            location: 'Pellmobil 120 kW z modułem CWU',
            fuelOrMedium: 'Pellet drzewny (DINplus)',
            boilerModel: 'Pellmobil 120 kW z węzłem przygotowania ciepłej wody użytkowej (CWU)',
            burnerOrEquipment: '2×60 kW kotły pelletowe + płytowy wymiennik ciepła + zbiornik buforowy',
            scopeExecuted:
                'W pełni zautomatyzowana kotłownia pelletowa 120 kW ze zintegrowanym węzłem CWU, buforem oraz szybkozłączami hydraulicznymi.',
            resultMetric: 'Ogrzewanie i ciepła woda dla budynku do 2 500 m²',
            ctaLabel: 'Pakiety kotłowni i CWU',
        },
        ru: {
            numLabel: 'Узел #15',
            categoryLabel: 'Тепловые насосы и котельные',
            title: 'Мобильная пеллетная котельная отопления и ГВС Pellmobil 120 кВт',
            location: 'Pellmobil 120 кВт с узлом ГВС',
            fuelOrMedium: 'Древесные пеллеты (DINplus)',
            boilerModel: 'Pellmobil 120 кВт с узлом подготовки горячего водоснабжения (ГВС)',
            burnerOrEquipment: '2×60 кВт пеллетных котла + пластинчатый теплообменник + буферная емкость',
            scopeExecuted:
                'Полностью автоматизированная пеллетная котельная 120 кВт со встроенным узлом санитарной горячей воды, буферным баком и быстроразъемными соединениями.',
            resultMetric: 'Отопление и ГВС для зданий площадью до 2 500 м²',
            ctaLabel: 'Комплекты котельных и ГВС',
        },
    },
    'darbas-16': {
        en: {
            numLabel: 'Assembly #16',
            categoryLabel: 'Service & automation',
            title: '80–190 kW industrial hot-air heater with automation & service control unit',
            location: 'Hot-air generator 80–190 kW',
            fuelOrMedium: 'Pellets / diesel (dual-fuel)',
            boilerModel: 'Mobile industrial hot-air generator',
            burnerOrEquipment: 'High-pressure fans + flexible air ducts + service diagnostic panel',
            scopeExecuted:
                'Commissioning of industrial hot-air heater, calibration of burner air-to-fuel ratio, and testing of overheat and draft safety interlocks.',
            resultMetric: 'Direct warm-air heating up to 12,000 m³/h airflow',
            ctaLabel: 'Book service engineer',
        },
        pl: {
            numLabel: 'Węzeł #16',
            categoryLabel: 'Serwis i automatyka',
            title: 'Przemysłowa nagrzewnica powietrza 80–190 kW z automatyką i modułem serwisowym',
            location: 'Generator gorącego powietrza 80–190 kW',
            fuelOrMedium: 'Pellet / olej napędowy (dwupaliwowy)',
            boilerModel: 'Mobilny przemysłowy generator gorącego powietrza',
            burnerOrEquipment: 'Wentylatory wysokociśnieniowe + rękawy elastyczne + pulpit diagnostyczny',
            scopeExecuted:
                'Uruchomienie przemysłowej nagrzewnicy powietrza, kalibracja stosunku powietrze/paliwo palnika oraz kontrola zabezpieczeń przed przegrzaniem.',
            resultMetric: 'Bezpośredni nadmuch ciepłego powietrza do 12 000 m³/h',
            ctaLabel: 'Wezwij inżyniera serwisu',
        },
        ru: {
            numLabel: 'Узел #16',
            categoryLabel: 'Сервис и автоматика',
            title: 'Промышленный воздухонагреватель 80–190 кВт с узлом автоматики и сервиса',
            location: 'Генератор горячего воздуха 80–190 кВт',
            fuelOrMedium: 'Пеллеты / дизель (двухтопливный)',
            boilerModel: 'Мобильный промышленный генератор горячего воздуха',
            burnerOrEquipment: 'Вентиляторы высокого давления + гибкие воздуховоды + пульт диагностики',
            scopeExecuted:
                'Пусконаладка промышленного воздухонагревателя, калибровка соотношения воздух/топливо горелки и проверка автоматики защиты от перегрева и тяги.',
            resultMetric: 'Прямой воздушный обогрев потоком до 12 000 м³/ч',
            ctaLabel: 'Вызвать сервисного инженера',
        },
    },
};

export interface GilesBoilerRetrofitCapabilities {
    readonly supportedBoilers: ReadonlyArray<{
        readonly brandAndSeries: string;
        readonly material: string;
        readonly typicalPowerKw: string;
        readonly flangeSolution: string;
        readonly recommendedBurner: string;
    }>;
    readonly namedPackages: ReadonlyArray<{
        readonly code: string;
        readonly name: string;
        readonly priceGrossEur: number;
        readonly included: string;
    }>;
}

export interface GilesContainerBoilerSpec {
    readonly code: string;
    readonly title: string;
    readonly powerRange: string;
    readonly medium: string;
    readonly application: string;
    readonly availability: string;
}

const RETROFIT_CAPABILITIES_I18N: Record<
    Exclude<SupportedLocale, 'lt'>,
    GilesBoilerRetrofitCapabilities
> = {
    en: {
        supportedBoilers: [
            {
                brandAndSeries: 'Viadrus U22 / U26 / Hercules',
                material: 'Cast-iron sectional boilers (4–10 sections)',
                typicalPowerKw: '15–58 kW',
                flangeSolution: 'Custom CNC steel loading door with burner opening and heat-exchanger turbulators',
                recommendedBurner: 'Megatherm MPB 25 / MPB 35 or Pelltech PV20a / PV30a',
            },
            {
                brandAndSeries: 'Kalvis 2-12, 2-16, 2-20, 2-30, 2-40',
                material: 'Bottom-burning steel solid-fuel boilers',
                typicalPowerKw: '12–40 kW',
                flangeSolution: 'Door adapter with ceramic insulation ring and screw feeder (200–2000 kg hopper)',
                recommendedBurner: 'Megatherm MPB 10–35 kW with moving grates',
            },
            {
                brandAndSeries: 'Atmos DC18S, DC25S, DC32S, DC50S',
                material: 'Wood gasification solid-fuel boilers',
                typicalPowerKw: '18–50 kW',
                flangeSolution: 'Upper or lower door CNC flange while preserving firewood burning capability',
                recommendedBurner: 'Pelltech PV20a / PV30a or Centrometal Cm Pelet-set 14–90 kW',
            },
            {
                brandAndSeries: 'Buderus Logano S111 / G221 & Dakon DOR 16–45',
                material: 'Steel and cast-iron top/bottom-burning boilers',
                typicalPowerKw: '16–45 kW',
                flangeSolution: 'Side or front port mounting plate with quick-release blanking covers',
                recommendedBurner: 'Pelltech PV20a or Megatherm MPB 15–50 kW',
            },
            {
                brandAndSeries: 'Stropuva S15, S20, S40 & ZVAK / Vienybė',
                material: 'Long-burning cylindrical and traditional steel boilers',
                typicalPowerKw: '15–40 kW',
                flangeSolution: 'Custom curved mounting neck with flue channel baffles for higher efficiency',
                recommendedBurner: 'Megatherm MPB 10–35 kW with automatic slag cleaning',
            },
            {
                brandAndSeries: 'Industrial boilers (Verner, Ferroli, Kalvis-100..500)',
                material: 'Industrial steel and cast-iron boilers',
                typicalPowerKw: '50–500 kW',
                flangeSolution: 'Industrial burner flange, A1/A2 fuel feed augers, and cascade automation',
                recommendedBurner: 'Megatherm MPB PRO 50–300 kW / Pelltech PV100–PV500 / Verner',
            },
        ],
        namedPackages: [
            {
                code: 'GILES-LINK-LYDERIU-35',
                name: '"Link lyderių" Kit (for 10–35 kW boilers)',
                priceGrossEur: 2150,
                included:
                    'Megatherm 10–35 kW pellet burner + 460 L pellet hopper + 1.5 m auger + slag cleaning air compressor + wired room thermostat + installation, commissioning & 24-month warranty.',
            },
            {
                code: 'GILES-NORD-KOMFORTUI-20',
                name: '"Nord komfortui" Kit (for 10–20 kW boilers)',
                priceGrossEur: 2350,
                included:
                    'Pelltech PV20a (Estonia) self-cleaning burner + 460 L pellet hopper + 1.5 m auger + 10 L air compressor + wired thermostat + installation, tuning & 24-month warranty.',
            },
            {
                code: 'GILES-VIDUTINIAMS-50',
                name: '"Vidutiniams" Kit (for 25–50 kW boilers)',
                priceGrossEur: 2690,
                included:
                    'Megatherm MPB 15–50 kW moving-grate burner + 460 L hopper + geared auger + programmable thermostat + installation, flue gas analysis & 24-month warranty.',
            },
            {
                code: 'PONAST-KP08-SET',
                name: 'Automatic Class-5 Pellet Boiler PONAST KP08 (8 kW with 130 L hopper)',
                priceGrossEur: 2890,
                included:
                    'Fully automatic Class-5 emission Czech-made PONAST KP08 pellet boiler (for homes up to 100 m²) with integrated 130 L fuel hopper (eligible for APVA grant).',
            },
        ],
    },
    pl: {
        supportedBoilers: [
            {
                brandAndSeries: 'Viadrus U22 / U26 / Hercules',
                material: 'Żeliwne kotły członowe (4–10 członów)',
                typicalPowerKw: '15–58 kW',
                flangeSolution: 'Nowe stalowe drzwiczki CNC z otworem pod palnik i zawirowywaczami spalin',
                recommendedBurner: 'Megatherm MPB 25 / MPB 35 lub Pelltech PV20a / PV30a',
            },
            {
                brandAndSeries: 'Kalvis 2-12, 2-16, 2-20, 2-30, 2-40',
                material: 'Stalowe kotły dolnego spalania na paliwo stałe',
                typicalPowerKw: '12–40 kW',
                flangeSolution: 'Adapter drzwiczek z pierścieniem ceramicznym i podajnikiem (zasobnik 200–2000 kg)',
                recommendedBurner: 'Megatherm MPB 10–35 kW z rusztem ruchomym',
            },
            {
                brandAndSeries: 'Atmos DC18S, DC25S, DC32S, DC50S',
                material: 'Kotły zgazowujące drewno (pirolityczne)',
                typicalPowerKw: '18–50 kW',
                flangeSolution: 'Flansza CNC drzwiczek górnych lub dolnych z zachowaniem możliwości palenia drewnem',
                recommendedBurner: 'Pelltech PV20a / PV30a lub Centrometal Cm Pelet-set 14–90 kW',
            },
            {
                brandAndSeries: 'Buderus Logano S111 / G221 & Dakon DOR 16–45',
                material: 'Stalowe i żeliwne kotły górnego/dolnego spalania',
                typicalPowerKw: '16–45 kW',
                flangeSolution: 'Boczna lub przednia płyta montażowa z szybkozłącznymi zaślepkami',
                recommendedBurner: 'Pelltech PV20a lub Megatherm MPB 15–50 kW',
            },
            {
                brandAndSeries: 'Stropuva S15, S20, S40 & ZVAK / Vienybė',
                material: 'Kotły cylindryczne długiego palenia i tradycyjne kotły stalowe',
                typicalPowerKw: '15–40 kW',
                flangeSolution: 'Indywidualny króciec montażowy z przegrodami spalin podnoszącymi sprawność',
                recommendedBurner: 'Megatherm MPB 10–35 kW z automatycznym czyszczeniem szlaki',
            },
            {
                brandAndSeries: 'Kotły przemysłowe (Verner, Ferroli, Kalvis-100..500)',
                material: 'Przemysłowe kotły stalowe i żeliwne',
                typicalPowerKw: '50–500 kW',
                flangeSolution: 'Przemysłowa flansza palnika, podajniki A1/A2 oraz automatyka kaskadowa',
                recommendedBurner: 'Megatherm MPB PRO 50–300 kW / Pelltech PV100–PV500 / Verner',
            },
        ],
        namedPackages: [
            {
                code: 'GILES-LINK-LYDERIU-35',
                name: 'Zestaw „Link lyderių” (do kotłów 10–35 kW)',
                priceGrossEur: 2150,
                included:
                    'Palnik pelletowy Megatherm 10–35 kW + zasobnik 460 L + podajnik 1,5 m + kompresor do czyszczenia szlaki + przewodowy termostat pokojowy + montaż, uruchomienie i 24 mies. gwarancji.',
            },
            {
                code: 'GILES-NORD-KOMFORTUI-20',
                name: 'Zestaw „Nord komfortui” (do kotłów 10–20 kW)',
                priceGrossEur: 2350,
                included:
                    'Samoczyszczący palnik Pelltech PV20a (Estonia) + zasobnik 460 L + podajnik 1,5 m + kompresor 10 L + termostat przewodowy + montaż, regulacja i 24 mies. gwarancji.',
            },
            {
                code: 'GILES-VIDUTINIAMS-50',
                name: 'Zestaw „Vidutiniams” (do kotłów 25–50 kW)',
                priceGrossEur: 2690,
                included:
                    'Palnik Megatherm MPB 15–50 kW z rusztem ruchomym + zasobnik 460 L + podajnik z motoreduktorem + programowalny termostat + montaż, analiza spalin i 24 mies. gwarancji.',
            },
            {
                code: 'PONAST-KP08-SET',
                name: 'Automatyczny kocioł pelletowy V klasy PONAST KP08 (8 kW z zasobnikiem 130 L)',
                priceGrossEur: 2890,
                included:
                    'W pełni automatyczny czeski kocioł pelletowy V klasy PONAST KP08 (dla domów do 100 m²) ze zintegrowanym zasobnikiem 130 L (kwalifikuje się do dotacji).',
            },
        ],
    },
    ru: {
        supportedBoilers: [
            {
                brandAndSeries: 'Viadrus U22 / U26 / Hercules',
                material: 'Чугунные секционные котлы (4–10 секций)',
                typicalPowerKw: '15–58 kW',
                flangeSolution: 'Новая стальная ЧПУ-дверца с окном под горелку и турбулизаторами теплообменника',
                recommendedBurner: 'Megatherm MPB 25 / MPB 35 или Pelltech PV20a / PV30a',
            },
            {
                brandAndSeries: 'Kalvis 2-12, 2-16, 2-20, 2-30, 2-40',
                material: 'Стальные твердотопливные котлы нижнего горения',
                typicalPowerKw: '12–40 kW',
                flangeSolution: 'Адаптер дверцы с керамическим кольцом и шнековым питателем (бункер 200–2000 кг)',
                recommendedBurner: 'Megatherm MPB 10–35 кВт с подвижными колосниками',
            },
            {
                brandAndSeries: 'Atmos DC18S, DC25S, DC32S, DC50S',
                material: 'Газогенераторные (пиролизные) котлы',
                typicalPowerKw: '18–50 kW',
                flangeSolution: 'ЧПУ-фланец верхней или нижней дверцы с сохранением возможности топки дровами',
                recommendedBurner: 'Pelltech PV20a / PV30a или Centrometal Cm Pelet-set 14–90 кВт',
            },
            {
                brandAndSeries: 'Buderus Logano S111 / G221 & Dakon DOR 16–45',
                material: 'Стальные и чугунные котлы верхнего/нижнего горения',
                typicalPowerKw: '16–45 kW',
                flangeSolution: 'Боковая или фронтальная монтажная плита с быстросъемными заглушками',
                recommendedBurner: 'Pelltech PV20a или Megatherm MPB 15–50 кВт',
            },
            {
                brandAndSeries: 'Stropuva S15, S20, S40 & ZVAK / Vienybė',
                material: 'Котлы длительного горения и традиционные стальные котлы',
                typicalPowerKw: '15–40 kW',
                flangeSolution: 'Индивидуальная монтажная горловина с заслонками дымовых каналов для повышения КПД',
                recommendedBurner: 'Megatherm MPB 10–35 кВт с автоматической очисткой шлака',
            },
            {
                brandAndSeries: 'Промышленные котлы (Verner, Ferroli, Kalvis-100..500)',
                material: 'Промышленные стальные и чугунные котлы',
                typicalPowerKw: '50–500 kW',
                flangeSolution: 'Промышленный фланец горелки, шнеки подачи A1/A2 и каскадная автоматика',
                recommendedBurner: 'Megatherm MPB PRO 50–300 кВт / Pelltech PV100–PV500 / Verner',
            },
        ],
        namedPackages: [
            {
                code: 'GILES-LINK-LYDERIU-35',
                name: 'Комплект «Link lyderių» (для котлов 10–35 кВт)',
                priceGrossEur: 2150,
                included:
                    'Пеллетная горелка Megatherm 10–35 кВт + бункер 460 л + шнек 1,5 м + компрессор очистки шлака + проводной комнатный термостат + монтаж, пусконаладка и гарантия 24 мес.',
            },
            {
                code: 'GILES-NORD-KOMFORTUI-20',
                name: 'Комплект «Nord komfortui» (для котлов 10–20 кВт)',
                priceGrossEur: 2350,
                included:
                    'Самоочищающаяся горелка Pelltech PV20a (Эстония) + бункер 460 л + шнек 1,5 м + компрессор 10 л + проводной термостат + монтаж, настройка и гарантия 24 мес.',
            },
            {
                code: 'GILES-VIDUTINIAMS-50',
                name: 'Комплект «Vidutiniams» (для котлов 25–50 кВт)',
                priceGrossEur: 2690,
                included:
                    'Горелка Megatherm MPB 15–50 кВт с подвижными колосниками + бункер 460 л + шнек с редуктором + программируемый термостат + монтаж, газоанализ и гарантия 24 мес.',
            },
            {
                code: 'PONAST-KP08-SET',
                name: 'Автоматический пеллетный котел V класса PONAST KP08 (8 кВт с бункером 130 л)',
                priceGrossEur: 2890,
                included:
                    'Полностью автоматический пеллетный котел V класса эмиссии PONAST KP08 (Чехия, для домов до 100 м²) со встроенным бункером 130 л (подходит для компенсации APVA).',
            },
        ],
    },
};

const CONTAINER_SPECS_I18N: Record<
    Exclude<SupportedLocale, 'lt'>,
    readonly GilesContainerBoilerSpec[]
> = {
    en: [
        {
            code: 'MOB-ORO-15-90',
            title: 'Mobile pellet hot-air heater (15–90 kW)',
            powerRange: '15–90 kW',
            medium: 'Direct hot air (up to 12,000 m³/h)',
            application: 'For construction sites, hangars, warehouses, workshops, and event tents',
            availability: 'Sales & rental',
        },
        {
            code: 'MOB-ORO-80-190',
            title: 'Mobile dual-fuel / diesel hot-air generator (40–190 kW)',
            powerRange: '40–190 kW',
            medium: 'Hot air via flexible ducts',
            application: 'For industrial halls, winter concrete curing, and agricultural facilities',
            availability: 'Sales & 24/7 emergency rental',
        },
        {
            code: 'PELLMOBIL-120',
            title: 'Mobile pellet DHW & space-heating boiler plant Pellmobil (110–120 kW)',
            powerRange: '110–120 kW',
            medium: 'Heating loop (T1/T2 80/60 °C) + DHW preparation',
            application: 'For schools, kindergartens, apartment blocks, and commercial buildings up to 2,500 m²',
            availability: 'Sales & seasonal rental',
        },
        {
            code: 'GK-150-500',
            title: 'Containerized hydronic biomass boiler room GK-150 / GK-500',
            powerRange: '150–500 kW',
            medium: 'Hydronic heating main PN6 bar + GSM/SCADA',
            application: 'For factories, greenhouses, office and logistics buildings (no building permit required)',
            availability: 'Manufactured in Kaunas, sales & long-term rental',
        },
        {
            code: 'GK-750-2000',
            title: 'Industrial modular biomass & biogas boiler plant GK-750 / GK-2000',
            powerRange: '750 kW – 2.0 MW',
            medium: 'Industrial district heating network with multicyclone & Walking-Floor bunker',
            application: 'For industrial plants, district heating, biogas facilities, and grain dryers',
            availability: '3D engineering, manufacturing & turnkey installation',
        },
    ],
    pl: [
        {
            code: 'MOB-ORO-15-90',
            title: 'Mobilna pelletowa nagrzewnica powietrza (15–90 kW)',
            powerRange: '15–90 kW',
            medium: 'Bezpośrednie gorące powietrze (do 12 000 m³/h)',
            application: 'Na place budowy, do hal, magazynów, warsztatów i namiotów',
            availability: 'Sprzedaż i wynajem',
        },
        {
            code: 'MOB-ORO-80-190',
            title: 'Mobilny dwupaliwowy / olejowy generator gorącego powietrza (40–190 kW)',
            powerRange: '40–190 kW',
            medium: 'Gorące powietrze przez elastyczne rękawy',
            application: 'Dla hal przemysłowych, prac betoniarskich zimą i obiektów rolniczych',
            availability: 'Sprzedaż i pilny wynajem 24/7',
        },
        {
            code: 'PELLMOBIL-120',
            title: 'Mobilna kotłownia pelletowa CO i CWU Pellmobil (110–120 kW)',
            powerRange: '110–120 kW',
            medium: 'Obieg grzewczy (T1/T2 80/60 °C) + przygotowanie CWU',
            application: 'Dla szkół, przedszkoli, bloków i budynków komercyjnych do 2 500 m²',
            availability: 'Sprzedaż i wynajem sezonowy',
        },
        {
            code: 'GK-150-500',
            title: 'Kontenerowa wodna kotłownia biomasowa GK-150 / GK-500',
            powerRange: '150–500 kW',
            medium: 'Sieć grzewcza wodna PN6 bar + GSM/SCADA',
            application: 'Dla fabryk, szklarni, biurowców i centrów logistycznych (bez pozwolenia na budowę)',
            availability: 'Produkcja w Kownie, sprzedaż i wynajem długoterminowy',
        },
        {
            code: 'GK-750-2000',
            title: 'Przemysłowa modułowa kotłownia biomasowa i biogazowa GK-750 / GK-2000',
            powerRange: '750 kW – 2,0 MW',
            medium: 'Przemysłowa sieć cieplna z multicyklonem i magazynem Walking-Floor',
            application: 'Dla zakładów przemysłowych, ciepłowni osiedlowych, biogazowni i suszarni zbóż',
            availability: 'Projektowanie 3D, produkcja i montaż pod klucz',
        },
    ],
    ru: [
        {
            code: 'MOB-ORO-15-90',
            title: 'Мобильный пеллетный воздухонагреватель (15–90 кВт)',
            powerRange: '15–90 кВт',
            medium: 'Прямой горячий воздух (до 12 000 м³/ч)',
            application: 'Для стройплощадок, ангаров, складов, мастерских и шатров',
            availability: 'Продажа и аренда',
        },
        {
            code: 'MOB-ORO-80-190',
            title: 'Мобильный двухтопливный / дизельный генератор горячего воздуха (40–190 кВт)',
            powerRange: '40–190 кВт',
            medium: 'Горячий воздух через гибкие воздуховоды',
            application: 'Для промышленных цехов, прогрева бетона зимой и сельхозобъектов',
            availability: 'Продажа и срочная аренда 24/7',
        },
        {
            code: 'PELLMOBIL-120',
            title: 'Мобильная пеллетная котельная отопления и ГВС Pellmobil (110–120 кВт)',
            powerRange: '110–120 кВт',
            medium: 'Отопительный контур (T1/T2 80/60 °C) + подготовка ГВС',
            application: 'Для школ, детских садов, многоквартирных и коммерческих зданий до 2 500 м²',
            availability: 'Продажа и сезонная аренда',
        },
        {
            code: 'GK-150-500',
            title: 'Контейнерная водогрейная биомассовая котельная GK-150 / GK-500',
            powerRange: '150–500 кВт',
            medium: 'Водяная теплотрасса PN6 бар + GSM/SCADA',
            application: 'Для заводов, теплиц, офисных и логистических зданий (без разрешения на строительство)',
            availability: 'Производство в Каунасе, продажа и долгосрочная аренда',
        },
        {
            code: 'GK-750-2000',
            title: 'Промышленная модульная биомассовая и биогазовая котельная GK-750 / GK-2000',
            powerRange: '750 кВт – 2,0 МВт',
            medium: 'Промышленная теплосеть с мультициклоном и складом Walking-Floor',
            application: 'Для промышленных предприятий, районных котельных, биогазовых станций и зерносушилок',
            availability: '3D-проектирование, производство и монтаж под ключ',
        },
    ],
};

export function getLocalizedCompletedWorksCategories(
    locale?: string | null,
): readonly CompletedWorkCategory[] {
    const loc = normalizeLocaleKey(locale);
    if (loc === 'lt') return GILES_COMPLETED_WORKS_CATEGORIES;
    return COMPLETED_WORKS_CATEGORIES_I18N[loc];
}

export function getLocalizedServicePillars(
    locale?: string | null,
): readonly GilesServicePillar[] {
    const loc = normalizeLocaleKey(locale);
    if (loc === 'lt') return GILES_SERVICE_PILLARS;
    return SERVICE_PILLARS_I18N[loc];
}

export function getLocalizedBoilerRetrofitCapabilities(
    locale?: string | null,
): GilesBoilerRetrofitCapabilities {
    const loc = normalizeLocaleKey(locale);
    if (loc === 'lt') return GILES_BOILER_RETROFIT_CAPABILITIES;
    return RETROFIT_CAPABILITIES_I18N[loc];
}

export function getLocalizedContainerBoilerSpecs(
    locale?: string | null,
): readonly GilesContainerBoilerSpec[] {
    const loc = normalizeLocaleKey(locale);
    if (loc === 'lt') return GILES_CONTAINER_BOILER_SPECS;
    return CONTAINER_SPECS_I18N[loc];
}

export type LocalizedCompletedWorksBundle = GilesCompletedWorkItem[] & {
    works: GilesCompletedWorkItem[];
    items: GilesCompletedWorkItem[];
    pillars: readonly GilesServicePillar[];
    servicePillars: readonly GilesServicePillar[];
    categories: readonly CompletedWorkCategory[];
    retrofitCapabilities: GilesBoilerRetrofitCapabilities;
    containerSpecs: readonly GilesContainerBoilerSpec[];
};

export function getLocalizedCompletedWorks(
    locale?: string | null,
): LocalizedCompletedWorksBundle {
    const loc = normalizeLocaleKey(locale);
    const works: GilesCompletedWorkItem[] = GILES_COMPLETED_WORKS.map((item) => {
        if (loc === 'lt') return { ...item };
        const tr = COMPLETED_WORKS_I18N[item.id]?.[loc];
        if (!tr) return { ...item };
        return {
            ...item,
            ...tr,
        };
    });

    const pillars = getLocalizedServicePillars(loc);
    const categories = getLocalizedCompletedWorksCategories(loc);
    const retrofitCapabilities = getLocalizedBoilerRetrofitCapabilities(loc);
    const containerSpecs = getLocalizedContainerBoilerSpecs(loc);

    return Object.assign(works, {
        works,
        items: works,
        pillars,
        servicePillars: pillars,
        categories,
        retrofitCapabilities,
        containerSpecs,
    });
}

export function filterLocalizedCompletedWorksByCategory(
    category: CompletedWorkCategoryId,
    locale?: string | null,
): GilesCompletedWorkItem[] {
    const all = getLocalizedCompletedWorks(locale);
    if (category === 'all') {
        return all;
    }
    return all.filter((item) => item.category === category);
}

