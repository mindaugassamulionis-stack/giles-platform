import Link from 'next/link';
import { HomeHero, LocalizedCompletedWorksHomeShowcase } from '../../components/home-hero';
import { GilesArtboardCatalogGrid } from '../../components/giles-artboard-catalog-grid';
import {
    GilesDoorConversionSchematic,
    GilesContainer20ftSchematic,
} from '../../components/giles-animated-schematics';
import { GilesMcpMarketingShowcase } from '../../components/giles-mcp-marketing-showcase';
import { getStore } from '../../lib/storefront-content';
import { getPopularProductPreviews } from '../../lib/catalog-listing';
import { assetUrl } from '../../lib/api';
import { getLocale } from 'next-intl/server';
import { resolveAppLocale } from '../../i18n/storefront-ui-copy';
import type { AppLocale } from '../../i18n/routing';

export const dynamic = 'force-dynamic';

const FEATURED_COMPLETED_WORK_ASSETS = [
    '/studio-assets/projects/giles-darbas-01.webp',
    '/studio-assets/projects/giles-darbas-02.webp',
    '/studio-assets/projects/giles-darbas-06.webp',
    '/studio-assets/projects/giles-darbas-08.webp',
    '/studio-assets/projects/giles-darbas-10.webp',
    '/studio-assets/projects/giles-darbas-11.webp',
] as const;
void FEATURED_COMPLETED_WORK_ASSETS;

interface HomePageSectionCopy {
    brandBarLabel: string;
    sec1Aria: string;
    sec1Kicker: string;
    sec1Title: string;
    sec1Subtitle: string;
    allCatalogLinkText: string;
    pillar1Kicker: string;
    pillar1Title: string;
    pillar1Desc: string;
    pillar1Bullets: [string, string, string];
    pillar1PrimaryCta: string;
    pillar1SecondaryCta: string;
    pillar2Kicker: string;
    pillar2Title: string;
    pillar2Desc: string;
    pillar2Bullets: [string, string, string];
    pillar2PrimaryCta: string;
    pillar3Kicker: string;
    pillar3Title: string;
    pillar3Desc: string;
    pillar3Bullets: [string, string, string];
    pillar3PrimaryCta: string;
    pillar3SecondaryCta: string;
    sec2Aria: string;
    sec2Kicker: string;
    sec2Title: string;
    sec2Lead: string;
    beforeBadge: string;
    beforeTitle: string;
    beforeBullets: [string, string, string, string];
    afterBadge: string;
    afterTitle: string;
    afterBullets: [string, string, string, string];
    steps: [string, string, string, string];
    sec2PrimaryCta: string;
    sec2SecondaryCta: string;
    sec2StockBadge: string;
    cad2HeaderLeft: string;
    cad2HeaderRight: string;
    cad2Aria: string;
    cad2OldTitle: string;
    cad2OldFuel: string;
    cad2OldReload: string;
    cad2OldDoor: string;
    cad2NewTitle: string;
    cad2NewBoiler: string;
    cad2NewAuto: string;
    sec2ImgAlt: string;
    sec2ProdBrand: string;
    sec2ProdTitle: string;
    sec2VatNetSuffix: string;
    sec4Aria: string;
    sec4Kicker: string;
    sec4Title: string;
    sec4Lead: string;
    indBoxes: Array<{ kicker: string; title: string; sub: string }>;
    sec4PrimaryCta: string;
    cad4HeaderLeft: string;
    cad4Aria: string;
    cad4ZoneATitle: string;
    cad4ZoneASub: string;
    cad4ZoneBTitle: string;
    cad4ZoneCTitle: string;
    cad4ZoneCSub: string;
    cad4ZoneDTitle: string;
    cad4ZoneDSub: string;
    cad4BottomDim: string;
    sec4ImgAlt: string;
    sec4ModelLabel: string;
    sec4ModelSub: string;
    sec5Aria: string;
    sec5Kicker: string;
    sec5Title: string;
    sec5Lead: string;
    sec5AllWorksCta: string;
    sec5IndustrialCta: string;
    sec6Aria: string;
    sec6Kicker: string;
    sec6Title: string;
    sec6Lead: string;
    calcPills: {
        boiler: string;
        vessel: string;
        valve: string;
        manifold: string;
        radiator: string;
    };
    proofBlocks: Array<{
        num: string;
        metric: string;
        title: string;
        desc: string;
    }>;
    consultKicker: string;
    consultTitle: string;
    consultLead: string;
    consultProjectQuoteCta: string;
}

const HOME_PAGE_COPY: Record<AppLocale, HomePageSectionCopy> = {
    lt: {
        brandBarLabel: 'Prekiaujame ir montuojame (28 gamintojai)',
        sec1Aria: '01 / Specializacija – Trys kryptys – viena inžinerinė komanda',
        sec1Kicker: '01 / Specializacija',
        sec1Title: 'Trys kryptys – viena inžinerinė komanda',
        sec1Subtitle:
            'Ne tik parduodame įrangą – suprojektuojame, pagaminame, sumontuojame ir prižiūrime visoje Lietuvoje.',
        allCatalogLinkText: 'Visos 6 337 katalogo prekės',
        pillar1Kicker: '01 / NAMŲ ŪKIAMS',
        pillar1Title: 'Namų katilinės, šilumos siurbliai ir 6 337 prekių parduotuvė',
        pillar1Desc:
            'Katilai, granulių degikliai, Haier R290 šilumos siurbliai, Danfoss ir HERZ automatika, Gorenje boileriai bei grindinio šildymo kolektoriai.',
        pillar1Bullets: [
            '• 6 337 aktyvių pozicijų su kainomis su PVM ir be PVM',
            '• Paruošti katilinių ir grindinio šildymo komplektai',
            '• Atsiėmimas ir konsultacija Vilniuje bei Kaune',
        ],
        pillar1PrimaryCta: 'Atidaryti el. parduotuvę (6 337)',
        pillar1SecondaryCta: 'Paruošti paketai',
        pillar2Kicker: '02 / KATILO PERDARYMAS',
        pillar2Title: 'Kieto kuro katilo perdarymas į automatinį granulinį',
        pillar2Desc:
            'Vietoje kuro pakrovimo durelių sumontuojame Megatherm MPB arba Pelltech granulių degiklį su automatiniu tiektuvu. Katilas lieka tas pats, o malkų kasdien krauti nebereikia.',
        pillar2Bullets: [
            '• Tinka Viadrus, Kalvis, Atmos, Stropuva, Buderus katilams',
            '• Montavimas per 4–6 valandas be katilinės griovimo',
            '• Automatinis uždegimas, moduliacija ir savaiminis valymas',
        ],
        pillar2PrimaryCta: 'Ar mano katilui tinka? Patikrinti',
        pillar3Kicker: '03 / PRAMONEI IR STATYBAI',
        pillar3Title: 'Konteinerinės katilinės 150–500 kW ir B2B montuotojų portalas',
        pillar3Desc:
            'Gaminame, parduodame ir nuomojame mobilias konteinerines katilines gamykloms, sandėliams ir statybvietėms. ŠVOK montuotojams – registruota B2B zona su didmeninėmis nuolaidomis.',
        pillar3Bullets: [
            '• Konteinerinės katilinės pirkimui ir nuomai (150–500 kW)',
            '• B2B partnerių portalas su administracijos patvirtinimu',
            '• Oficialios PVM sąskaitos faktūros ir sąmatos pagal objektą',
        ],
        pillar3PrimaryCta: 'Konteinerinės katilinės',
        pillar3SecondaryCta: 'Montuotojų B2B',
        sec2Aria: '02 / Flagmanas – Senas katilas. Naujas gyvenimas.',
        sec2Kicker: '02 / Flagmanas · Katilo perdarymas',
        sec2Title: 'Senas katilas. Naujas gyvenimas.',
        sec2Lead:
            'Turite patikimą ketinį arba plieninį kieto kuro katilą? Nekeiskite visos katilinės – į esamas dureles su CNC flanšu sumontuojame automatinį granulių degiklį Megatherm MPB su sraigtiniu tiektuvu ir valdikliu.',
        beforeBadge: 'Prieš modernizaciją',
        beforeTitle: 'Rankinis kūrenimas malkomis/anglimis',
        beforeBullets: [
            '• Rankinis malkų ar anglių krovimas kas 4–6 valandas',
            '• Svyruojanti temperatūra namuose (nuo +25 °C iki +16 °C ryte)',
            '• Dūmai, suodžiai ir nuolatinis budėjimas prie katilo žiemą',
            '• Iki 30 % šilumos išlekia per kaminą be galios moduliacijos',
        ],
        afterBadge: 'Po 4–6 val. montavimo',
        afterTitle: 'Su Megatherm granulių degikliu',
        afterBullets: [
            '• Automatinis uždegimas, šnekinis padavimas ir galios moduliacija',
            '• Savaiminis judančių ardelių valymas (tinka ir agro granulėms)',
            '• 6–10 dienų autonominis darbas iš 350 L granulių bunkerio',
            '• Tiksli kambario temperatūra ir valdymas telefonu (ecoMAX)',
        ],
        steps: ['Apžiūra objekte', 'Komplekto parinkimas', 'Montavimas ir paleidimas', 'Servisas sezono metu'],
        sec2PrimaryCta: 'Paleisti katilo perdarymo vedlį',
        sec2SecondaryCta: 'Peržiūrėti degiklių komplektus',
        sec2StockBadge: 'Pilnas komplektas sandėlyje Kaune',
        cad2HeaderLeft: 'Katilo durelių modifikacijos brėžinys · M 1:10',
        cad2HeaderRight: 'CNC Flanšas Ø90–140 mm',
        cad2Aria: 'Kieto kuro katilo perdarymo į granulinį prieš ir po techninis brėžinys',
        cad2OldTitle: '[SENAS KATILAS: rankinis krovimas]',
        cad2OldFuel: 'Malkos / anglys',
        cad2OldReload: 'Krovimas kas 4 val.',
        cad2OldDoor: 'Apatinės pakuros durelės',
        cad2NewTitle: '[FLANŠAS + MPB DEGIKLIS + BUNKERIS]',
        cad2NewBoiler: 'Katilas',
        cad2NewAuto: 'Automatinis darbas 5–7 d.',
        sec2ImgAlt: 'Megatherm MPB NANI granulių degiklio komplektas su sraigtu',
        sec2ProdBrand: 'Megatherm · 8–35 kW su kuro tiekimo sraigtu',
        sec2ProdTitle: 'Granulių degiklio komplektas MPB NANI 35',
        sec2VatNetSuffix: 'be PVM',
        sec4Aria: '04 / Pramonei ir statybai – Konteinerinės katilinės 150–500 kW – pirkimui ir nuomai',
        sec4Kicker: '04 / Pramonei ir statybai · Gamyba · Pardavimas · Nuoma',
        sec4Title: 'Konteinerinės katilinės 150–500 kW – pirkimui ir nuomai',
        sec4Lead:
            'Pilnai gamykloje surinktos ir automatizuotos konteinerinės katilinės: kuras pristatomas mobiliais bunkeriais ir automatiškai tiekiamas į degimo kamerą. Statybvietei, gamyklai, sandėliui ar avariniam rezervui.',
        indBoxes: [
            {
                kicker: '01 / Mobilus bunkeris',
                title: '150–500 kW (iki 2,5 MW)',
                sub: 'Granulės, skiedra, durpės, dujos',
            },
            {
                kicker: '02 / Pirkimas',
                title: 'Nuolatinė katilinė įmonei',
                sub: 'Su dūmtraukiu, multiciklonu ir SCADA',
            },
            {
                kicker: '03 / Nuoma',
                title: 'Šiluma be CAPEX investicijų',
                sub: 'Atvežame ir paleidžiame per 24–48 val.',
            },
        ],
        sec4PrimaryCta: 'Konteinerinės katilinės ir nuomos sąlygos',
        cad4HeaderLeft: 'KONTEINERINĖS KATILINĖS PJŪVIS · GK-250 / GK-500 · M 1:25',
        cad4Aria: 'Konteinerinės katilinės GK-250 ir GK-500 pjūvio techninis CAD brėžinys',
        cad4ZoneATitle: '[ZONA A] KURO SANDĖLIS',
        cad4ZoneASub: 'Judančios grindys 12–24 t',
        cad4ZoneBTitle: '[ZONA B] KATILAS',
        cad4ZoneCTitle: '[ZONA C]',
        cad4ZoneCSub: 'Multiciklonas',
        cad4ZoneDTitle: '[ZONA D]',
        cad4ZoneDSub: 'Hidraulika',
        cad4BottomDim: 'L = 6 058 mm (20ft HC ISO konteineris) · H dūmtraukis = 6,5 m',
        sec4ImgAlt: 'Gilės Inžinerija GK-500 konteinerinė katilinė 150-500 kW',
        sec4ModelLabel: 'MODELIS GK-150 / GK-500',
        sec4ModelSub: 'Konteinerinė biokuro katilinė',
        sec5Aria: '05 / Realizuoti objektai ir atlikti darbai – Inžinerinė praktika nuo Kauno iki Klaipėdos',
        sec5Kicker: '05 / Realizuoti sprendimai (gilesinzinerija.com)',
        sec5Title: 'Inžinerinė praktika nuo Kauno iki Klaipėdos',
        sec5Lead:
            'Tikri UAB „Gilės inžinerija“ sumontuoti ir paleisti objektai Lietuvoje – nuo Viadrus U26 katilų perdarymo iki 500 kW – 2,0 MW pramoninių katilinių.',
        sec5AllWorksCta: 'Visi 16 atliktų darbų ir servisas',
        sec5IndustrialCta: 'Pramoniniai sprendimai',
        sec6Aria: '06 / Kodėl Gilės Inžinerija – Skaičiai ir faktai, ne pažadai',
        sec6Kicker: '06 / Kodėl Gilės Inžinerija',
        sec6Title: 'Skaičiai ir faktai, ne pažadai',
        sec6Lead:
            'Nuo 2011 m. kuriame ir prižiūrime šilumos inžinerijos sistemas namams, daugiabučiams ir gamybos įmonėms.',
        calcPills: {
            boiler: 'Katilo galia',
            vessel: 'Plėtimosi indas',
            valve: 'Balansavimas',
            manifold: 'Kolektoriai',
            radiator: 'Radiatoriai',
        },
        proofBlocks: [
            {
                num: '01 / Gamyba ir sandėlis',
                metric: '6 337 poz.',
                title: 'Nuosava gamyba ir sandėlis Kaune',
                desc: 'Eigulių g. 21, LT-51418 Kaunas ir Žirmūnų g. 68, LT-09124 Vilnius – gaminame katilus, CNC tvirtinimo flanšus, sraigtus bei palaikome 6 337 ŠVOK pozicijas vietoje.',
            },
            {
                num: '02 / Atsarginių dalių garantas',
                metric: '10+ metų',
                title: 'Atsarginės dalys 10+ metų į priekį',
                desc: 'Uždegimo tenai, fotoelementai, judančios ardelės, valdikliai ecoMAX ir sraigtai nuolat palaikomi sandėlyje net ir 2011 m. sumontuotiems mazgams.',
            },
            {
                num: '03 / Inžinerinis servisas',
                metric: 'Visoje LT',
                title: 'Serviso brigados visoje Lietuvoje',
                desc: 'Montuojame, paleidžiame, deriname degimą dūmų analizatoriumi ir vykdome sezoninę katilinių priežiūrą nuo Vilniaus ir Kauno iki Klaipėdos.',
            },
            {
                num: '04 / Dviejų lygių patikra',
                metric: 'AI + Inžinierius',
                title: 'Vytautas AI + vyr. inžinieriaus Dariaus patikra',
                desc: 'Greita pirminė mazgo atranka su AI inžinieriumi Vytautu ir asmeninė vyr. inžinieriaus Dariaus Šauklio suderinamumo patikra prieš išsiunčiant.',
            },
        ],
        consultKicker: 'Tiesioginė inžinieriaus konsultacija ir sąmatų skaičiavimas',
        consultTitle: 'Nežinote, nuo ko pradėti? Pasikalbėkite su inžinieriumi.',
        consultLead:
            'Vyr. inžinierius Darius Šauklys ir Gilės AI inžinierius Vytautas padės parinkti katilą, degiklį ar pilną katilinės sąmatą.',
        consultProjectQuoteCta: 'Projekto sąmata',
    },
    en: {
        brandBarLabel: 'Authorized distributor & installer (28 brands)',
        sec1Aria: '01 / Specialization – Three Directions – One Engineering Team',
        sec1Kicker: '01 / Specialization',
        sec1Title: 'Three Directions – One Engineering Team',
        sec1Subtitle:
            'We do not just sell equipment – we design, manufacture, install, and service boiler systems across Lithuania.',
        allCatalogLinkText: 'All 6,337 catalog items',
        pillar1Kicker: '01 / FOR HOUSEHOLDS',
        pillar1Title: 'Residential Boiler Rooms, Heat Pumps & 6,337-Item Store',
        pillar1Desc:
            'Boilers, pellet burners, Haier R290 heat pumps, Danfoss and HERZ hydronic controls, Gorenje cylinders, and underfloor heating manifolds.',
        pillar1Bullets: [
            '• 6,337 stocked items with prices incl. and excl. VAT',
            '• Pre-engineered boiler room & underfloor heating packages',
            '• Warehouse pickup & consultation in Vilnius and Kaunas',
        ],
        pillar1PrimaryCta: 'Open Online Store (6,337)',
        pillar1SecondaryCta: 'System Packages',
        pillar2Kicker: '02 / BOILER CONVERSION',
        pillar2Title: 'Solid-Fuel Boiler Conversion to Automatic Pellet Firing',
        pillar2Desc:
            'We mount a Megatherm MPB or Pelltech pellet burner with an automatic auger directly into your existing boiler loading door. Keep your boiler without daily firewood loading.',
        pillar2Bullets: [
            '• Fits Viadrus, Kalvis, Atmos, Stropuva, and Buderus boilers',
            '• Installed in 4–6 hours without demolishing your boiler room',
            '• Automatic ignition, power modulation & self-cleaning grate',
        ],
        pillar2PrimaryCta: 'Does it fit my boiler? Check now',
        pillar3Kicker: '03 / INDUSTRIAL & CONSTRUCTION',
        pillar3Title: 'Containerized Boiler Plants 150–500 kW & B2B Installer Portal',
        pillar3Desc:
            'We manufacture, sell, and rent mobile containerized boiler rooms for factories, warehouses, and construction sites. Registered B2B portal with wholesale trade discounts for HVAC installers.',
        pillar3Bullets: [
            '• Containerized boiler plants for sale & rent (150–500 kW)',
            '• Verified B2B installer portal with trade pricing',
            '• Official VAT invoices & custom project BOQ estimates',
        ],
        pillar3PrimaryCta: 'Containerized Boiler Rooms',
        pillar3SecondaryCta: 'Installer B2B Portal',
        sec2Aria: '02 / Flagship – Old Boiler. New Life.',
        sec2Kicker: '02 / Flagship · Boiler Conversion',
        sec2Title: 'Old Boiler. New Life.',
        sec2Lead:
            'Own a reliable cast-iron or steel solid-fuel boiler? Do not replace the entire boiler room – we mount an automatic Megatherm MPB pellet burner with a CNC door flange, screw auger, and controller.',
        beforeBadge: 'Before retrofit',
        beforeTitle: 'Manual firing with firewood / coal',
        beforeBullets: [
            '• Manual loading of firewood or coal every 4–6 hours',
            '• Fluctuating indoor temperatures (+25 °C down to +16 °C by morning)',
            '• Smoke, soot, and constant tending in winter',
            '• Up to 30% heat lost up the chimney without output modulation',
        ],
        afterBadge: 'After 4–6 hr installation',
        afterTitle: 'With Megatherm Pellet Burner',
        afterBullets: [
            '• Automatic ignition, screw auger feed & output modulation',
            '• Self-cleaning moving grate (handles wood & agro-pellets)',
            '• 6–10 days of autonomous operation from a 350 L pellet hopper',
            '• Stable room temperature & mobile app control (ecoMAX)',
        ],
        steps: ['On-site inspection', 'Kit selection', 'Installation & startup', 'Seasonal service'],
        sec2PrimaryCta: 'Launch Boiler Conversion Wizard',
        sec2SecondaryCta: 'View Pellet Burner Kits',
        sec2StockBadge: 'Complete kit in stock in Kaunas',
        cad2HeaderLeft: 'Boiler Door Retrofit Blueprint · Scale 1:10',
        cad2HeaderRight: 'CNC Flange Ø90–140 mm',
        cad2Aria: 'Solid-fuel boiler conversion to pellet firing before and after technical blueprint',
        cad2OldTitle: '[OLD BOILER: manual loading]',
        cad2OldFuel: 'Firewood / coal',
        cad2OldReload: 'Loading every 4 hrs',
        cad2OldDoor: 'Lower firebox door',
        cad2NewTitle: '[FLANGE + MPB BURNER + HOPPER]',
        cad2NewBoiler: 'Boiler',
        cad2NewAuto: 'Automatic run 5–7 days',
        sec2ImgAlt: 'Megatherm MPB NANI pellet burner kit with feed auger',
        sec2ProdBrand: 'Megatherm · 8–35 kW with screw feed auger',
        sec2ProdTitle: 'Pellet Burner Kit MPB NANI 35',
        sec2VatNetSuffix: 'excl. VAT',
        sec4Aria: '04 / Industrial & Construction – Containerized Boiler Plants 150–500 kW – Sale & Rental',
        sec4Kicker: '04 / Industrial & Construction · Manufacturing · Sale · Rental',
        sec4Title: 'Containerized Boiler Plants 150–500 kW – For Sale & Rent',
        sec4Lead:
            'Factory-assembled, fully automated containerized boiler rooms: fuel is delivered in mobile hoppers and automatically fed into the combustion chamber. For construction sites, factories, warehouses, or emergency backup.',
        indBoxes: [
            {
                kicker: '01 / Mobile hopper',
                title: '150–500 kW (up to 2.5 MW)',
                sub: 'Pellets, woodchips, peat, natural gas',
            },
            {
                kicker: '02 / Purchase',
                title: 'Permanent plant for facilities',
                sub: 'With chimney, multicyclone & SCADA',
            },
            {
                kicker: '03 / Rental',
                title: 'Heat without CAPEX outlay',
                sub: 'Delivered & commissioned in 24–48 hrs',
            },
        ],
        sec4PrimaryCta: 'Containerized Boiler Plants & Rental Terms',
        cad4HeaderLeft: 'CONTAINER BOILER PLANT SECTION · GK-250 / GK-500 · 1:25',
        cad4Aria: 'Containerized boiler room GK-250 and GK-500 cross-section technical CAD blueprint',
        cad4ZoneATitle: '[ZONE A] FUEL STORE',
        cad4ZoneASub: 'Walking floor 12–24 t',
        cad4ZoneBTitle: '[ZONE B] BOILER',
        cad4ZoneCTitle: '[ZONE C]',
        cad4ZoneCSub: 'Multicyclone',
        cad4ZoneDTitle: '[ZONE D]',
        cad4ZoneDSub: 'Hydronics',
        cad4BottomDim: 'L = 6,058 mm (20ft HC ISO container) · Chimney H = 6.5 m',
        sec4ImgAlt: 'Gilės Inžinerija GK-500 containerized boiler plant 150-500 kW',
        sec4ModelLabel: 'MODEL GK-150 / GK-500',
        sec4ModelSub: 'Containerized biomass boiler plant',
        sec5Aria: '05 / Completed Projects & Installations – Engineering Practice Across Lithuania',
        sec5Kicker: '05 / Completed Solutions (gilesinzinerija.com)',
        sec5Title: 'Engineering Practice from Kaunas to Klaipėda',
        sec5Lead:
            'Real installations engineered and commissioned by UAB “Gilės inžinerija” – from residential Viadrus U26 retrofits to 500 kW – 2.0 MW industrial boiler plants.',
        sec5AllWorksCta: 'All 16 Completed Projects & Service',
        sec5IndustrialCta: 'Industrial Solutions',
        sec6Aria: '06 / Why Gilės Inžinerija – Facts & Figures, Not Promises',
        sec6Kicker: '06 / Why Gilės Inžinerija',
        sec6Title: 'Facts & Figures, Not Promises',
        sec6Lead:
            'Since 2011 we have engineered, manufactured, and maintained heating systems for homes, apartment buildings, and industrial plants.',
        calcPills: {
            boiler: 'Boiler Output',
            vessel: 'Expansion Vessel',
            valve: 'Balancing',
            manifold: 'Manifolds',
            radiator: 'Radiators',
        },
        proofBlocks: [
            {
                num: '01 / Factory & Warehouse',
                metric: '6,337 SKUs',
                title: 'In-House Manufacturing & Kaunas Warehouse',
                desc: 'Eigulių St. 21, LT-51418 Kaunas & Žirmūnų St. 68, LT-09124 Vilnius – we manufacture boilers, CNC mounting flanges, and augers while stocking 6,337 HVAC items.',
            },
            {
                num: '02 / Spare Parts Guarantee',
                metric: '10+ years',
                title: 'Spare Parts Guaranteed 10+ Years Ahead',
                desc: 'Ignition elements, photo-sensors, moving grates, ecoMAX controllers, and augers kept in stock even for systems installed back in 2011.',
            },
            {
                num: '03 / Field Engineering Service',
                metric: 'Nationwide',
                title: 'Service Crews Across Lithuania',
                desc: 'We install, commission, tune combustion with flue-gas analyzers, and perform seasonal boiler maintenance from Vilnius and Kaunas to Klaipėda.',
            },
            {
                num: '04 / Dual Verification',
                metric: 'AI + Engineer',
                title: 'Vytautas AI + Chief Engineer Darius Sign-off',
                desc: 'Fast initial node selection with AI engineer Vytautas followed by personal compatibility verification by Chief Engineer Darius Šauklys before dispatch.',
            },
        ],
        consultKicker: 'Direct Engineering Consultation & Project Estimation',
        consultTitle: 'Not sure where to start? Speak with an engineer.',
        consultLead:
            'Chief Engineer Darius Šauklys and Gilės AI engineer Vytautas will help select the right boiler, burner, or complete boiler room bill of materials.',
        consultProjectQuoteCta: 'Project Quote',
    },
    pl: {
        brandBarLabel: 'Sprzedaż hurtowa, detaliczna i montaż (28 producentów)',
        sec1Aria: '01 / Specjalizacja – Trzy kierunki – jeden zespół inżynieryjny',
        sec1Kicker: '01 / Specjalizacja',
        sec1Title: 'Trzy kierunki – jeden zespół inżynieryjny',
        sec1Subtitle:
            'Nie tylko sprzedajemy urządzenia – projektujemy, produkujemy, montujemy i serwisujemy kotłownie.',
        allCatalogLinkText: 'Wszystkie 6 337 pozycji katalogu',
        pillar1Kicker: '01 / DLA DOMÓW',
        pillar1Title: 'Kotłownie domowe, pompy ciepła i sklep z 6 337 produktami',
        pillar1Desc:
            'Kotły, palniki peletowe, pompy ciepła Haier R290, automatyka Danfoss i HERZ, bojlery Gorenje oraz rozdzielacze ogrzewania podłogowego.',
        pillar1Bullets: [
            '• 6 337 aktywnych pozycji z cenami z VAT i bez VAT',
            '• Gotowe zestawy kotłowni i ogrzewania podłogowego',
            '• Odbiór na miejscu oraz doradztwo w Wilnie i Kownie',
        ],
        pillar1PrimaryCta: 'Otwórz sklep internetowy (6 337)',
        pillar1SecondaryCta: 'Gotowe pakiety',
        pillar2Kicker: '02 / MODERNIZACJA KOTŁA',
        pillar2Title: 'Przeróbka kotła stałopalnego na automatyczny peletowy',
        pillar2Desc:
            'W miejsce drzwiczek załadunkowych montujemy palnik peletowy Megatherm MPB lub Pelltech z automatycznym podajnikiem. Kocioł zostaje ten sam – bez codziennego dokładania drewna.',
        pillar2Bullets: [
            '• Pasuje do kotłów Viadrus, Kalvis, Atmos, Stropuva, Buderus',
            '• Montaż w 4–6 godzin bez przebudowy kotłowni',
            '• Automatyczna zapalarka, modulacja mocy i samoczyszczenie',
        ],
        pillar2PrimaryCta: 'Czy pasuje do mojego kotła? Sprawdź',
        pillar3Kicker: '03 / PRZEMYSŁ I BUDOWNICTWO',
        pillar3Title: 'Kotłownie kontenerowe 150–500 kW i portal instalatora B2B',
        pillar3Desc:
            'Produkujemy, sprzedajemy i wynajmujemy mobilne kotłownie kontenerowe dla fabryk, magazynów i budów. Dla instalatorów HVAC – strefa B2B z rabatami hurtowymi.',
        pillar3Bullets: [
            '• Kotłownie kontenerowe na sprzedaż i wynajem (150–500 kW)',
            '• Portal partnerów B2B z weryfikacją konta',
            '• Faktury VAT UE oraz kosztorysy inwestorskie',
        ],
        pillar3PrimaryCta: 'Kotłownie kontenerowe',
        pillar3SecondaryCta: 'Portal B2B instalatorów',
        sec2Aria: '02 / Flagowe rozwiązanie – Stary kocioł. Nowe życie.',
        sec2Kicker: '02 / Flagowe rozwiązanie · Modernizacja kotła',
        sec2Title: 'Stary kocioł. Nowe życie.',
        sec2Lead:
            'Masz sprawdzony żeliwny lub stalowy kocioł stałopalny? Nie wymieniaj całej kotłowni – w istniejące drzwiczki z kołnierzem CNC montujemy automatyczny palnik peletowy Megatherm MPB z podajnikiem ślimakowym i sterownikiem.',
        beforeBadge: 'Przed modernizacją',
        beforeTitle: 'Ręczne palenie drewnem / węglem',
        beforeBullets: [
            '• Ręczne dokładanie drewna lub węgla co 4–6 godzin',
            '• Wahania temperatury w domu (od +25 °C do +16 °C rano)',
            '• Dym, sadza i ciągłe dyżurowanie przy kotle zimą',
            '• Do 30% ciepła ucieka w komin bez modulacji mocy',
        ],
        afterBadge: 'Po 4–6 godz. montażu',
        afterTitle: 'Z palnikiem peletowym Megatherm',
        afterBullets: [
            '• Automatyczne rozpalanie, podawanie ślimakowe i modulacja mocy',
            '• Samoczyszczący ruszt ruchomy (również na agropellet)',
            '• 6–10 dni pracy autonomicznej z zasobnika 350 L',
            '• Stabilna temperatura w domu i sterowanie z telefonu (ecoMAX)',
        ],
        steps: ['Wizja lokalna', 'Dobór zestawu', 'Montaż i uruchomienie', 'Serwis w sezonie'],
        sec2PrimaryCta: 'Uruchom kreator modernizacji kotła',
        sec2SecondaryCta: 'Zobacz zestawy palników',
        sec2StockBadge: 'Pełny zestaw w magazynie w Kownie',
        cad2HeaderLeft: 'Rysunek modyfikacji drzwiczek kotła · Skala 1:10',
        cad2HeaderRight: 'Kołnierz CNC Ø90–140 mm',
        cad2Aria: 'Rysunek techniczny przeróbki kotła stałopalnego na peletowy przed i po',
        cad2OldTitle: '[STARY KOCIOŁ: załadunek ręczny]',
        cad2OldFuel: 'Drewno / węgiel',
        cad2OldReload: 'Załadunek co 4 godz.',
        cad2OldDoor: 'Dolne drzwiczki paleniska',
        cad2NewTitle: '[KOŁNIERZ + PALNIK MPB + ZASOBNIK]',
        cad2NewBoiler: 'Kocioł',
        cad2NewAuto: 'Praca automatyczna 5–7 dni',
        sec2ImgAlt: 'Zestaw palnika peletowego Megatherm MPB NANI z podajnikiem',
        sec2ProdBrand: 'Megatherm · 8–35 kW z podajnikiem ślimakowym',
        sec2ProdTitle: 'Zestaw palnika peletowego MPB NANI 35',
        sec2VatNetSuffix: 'bez VAT',
        sec4Aria: '04 / Przemysł i budownictwo – Kotłownie kontenerowe 150–500 kW – sprzedaż i wynajem',
        sec4Kicker: '04 / Przemysł i budownictwo · Produkcja · Sprzedaż · Wynajem',
        sec4Title: 'Kotłownie kontenerowe 150–500 kW – sprzedaż i wynajem',
        sec4Lead:
            'W pełni zmontowane fabrycznie i zautomatyzowane kotłownie kontenerowe: paliwo dostarczane w mobilnych zasobnikach i automatycznie podawane do komory spalania. Na plac budowy, do fabryki, magazynu lub jako rezerwa awaryjna.',
        indBoxes: [
            {
                kicker: '01 / Mobilny zasobnik',
                title: '150–500 kW (do 2,5 MW)',
                sub: 'Pellet, zrębka, torf, gaz',
            },
            {
                kicker: '02 / Zakup',
                title: 'Stała kotłownia dla firmy',
                sub: 'Z kominem, multicyklonem i SCADA',
            },
            {
                kicker: '03 / Wynajem',
                title: 'Ciepło bez inwestycji CAPEX',
                sub: 'Dostawa i uruchomienie w 24–48 godz.',
            },
        ],
        sec4PrimaryCta: 'Kotłownie kontenerowe i warunki wynajmu',
        cad4HeaderLeft: 'PRZEKRÓJ KOTŁOWNI KONTENEROWEJ · GK-250 / GK-500 · M 1:25',
        cad4Aria: 'Rysunek techniczny CAD przekroju kotłowni kontenerowej GK-250 i GK-500',
        cad4ZoneATitle: '[STREFA A] MAGAZYN PALIWA',
        cad4ZoneASub: 'Ruchoma podłoga 12–24 t',
        cad4ZoneBTitle: '[STREFA B] KOCIOŁ',
        cad4ZoneCTitle: '[STREFA C]',
        cad4ZoneCSub: 'Multicyklon',
        cad4ZoneDTitle: '[STREFA D]',
        cad4ZoneDSub: 'Hydraulika',
        cad4BottomDim: 'L = 6 058 mm (kontener 20ft HC ISO) · Komin H = 6,5 m',
        sec4ImgAlt: 'Kotłownia kontenerowa Gilės Inžinerija GK-500 150-500 kW',
        sec4ModelLabel: 'MODEL GK-150 / GK-500',
        sec4ModelSub: 'Kontenerowa kotłownia biomasowa',
        sec5Aria: '05 / Zrealizowane obiekty i wdrożenia – Praktyka inżynieryjna od Kowna po Kłajpedę',
        sec5Kicker: '05 / Zrealizowane wdrożenia (gilesinzinerija.com)',
        sec5Title: 'Praktyka inżynieryjna od Kowna po Kłajpedę',
        sec5Lead:
            'Rzeczywiste instalacje zmontowane i uruchomione przez UAB „Gilės inžinerija” – od modernizacji kotłów Viadrus U26 po kotłownie przemysłowe 500 kW – 2,0 MW.',
        sec5AllWorksCta: 'Wszystkie 16 realizacji i serwis',
        sec5IndustrialCta: 'Rozwiązania przemysłowe',
        sec6Aria: '06 / Dlaczego Gilės Inžinerija – Liczby i fakty, nie obietnice',
        sec6Kicker: '06 / Dlaczego Gilės Inžinerija',
        sec6Title: 'Liczby i fakty, nie obietnice',
        sec6Lead:
            'Od 2011 roku projektujemy, produkujemy i serwisujemy systemy techniki grzewczej dla domów, wspólnot mieszkaniowych i zakładów przemysłowych.',
        calcPills: {
            boiler: 'Moc kotła',
            vessel: 'Naczynie wzbiorcze',
            valve: 'Równoważenie',
            manifold: 'Rozdzielacze',
            radiator: 'Grzejniki',
        },
        proofBlocks: [
            {
                num: '01 / Produkcja i magazyn',
                metric: '6 337 poz.',
                title: 'Własna produkcja i magazyn w Kownie',
                desc: 'Eigulių g. 21, LT-51418 Kowno i Žirmūnų g. 68, LT-09124 Wilno – produkujemy kotły, kołnierze CNC, podajniki ślimakowe oraz utrzymujemy 6 337 pozycji HVAC od ręki.',
            },
            {
                num: '02 / Gwarancja części zamiennych',
                metric: '10+ lat',
                title: 'Części zamienne dostępne przez 10+ lat',
                desc: 'Zapalarki, fotokomórki, ruszty ruchome, sterowniki ecoMAX i ślimaki stale w magazynie nawet dla zestawów zamontowanych w 2011 r.',
            },
            {
                num: '03 / Serwis inżynieryjny',
                metric: 'Cała LT',
                title: 'Brygady serwisowe i uruchomieniowe',
                desc: 'Montujemy, uruchamiamy, regulujemy spalanie analizatorem spalin i prowadzimy sezonowy serwis kotłowni domowych oraz przemysłowych.',
            },
            {
                num: '04 / Dwustopniowa weryfikacja',
                metric: 'AI + Inżynier',
                title: 'Weryfikacja Vytautas AI + gł. inż. Darius',
                desc: 'Szybki dobór wstępny z asystentem inżynieryjnym Vytautas oraz osobista kontrola kompatybilności przez głównego inżyniera Dariusa Šauklysa przed wysyłką.',
            },
        ],
        consultKicker: 'Bezpośrednie doradztwo inżynieryjne i wycena inwestycji',
        consultTitle: 'Nie wiesz, od czego zacząć? Porozmawiaj z inżynierem.',
        consultLead:
            'Główny inżynier Darius Šauklys oraz inżynier AI Vytautas pomogą dobrać kocioł, palnik lub pełny kosztorys kotłowni.',
        consultProjectQuoteCta: 'Wycena projektu',
    },
    ru: {
        brandBarLabel: 'Поставляем и монтируем (28 производителей)',
        sec1Aria: '01 / Специализация – Три направления – одна инженерная команда',
        sec1Kicker: '01 / Специализация',
        sec1Title: 'Три направления – одна инженерная команда',
        sec1Subtitle:
            'Мы не просто продаем оборудование – проектируем, производим, монтируем и обслуживаем котельные.',
        allCatalogLinkText: 'Все 6 337 товаров каталога',
        pillar1Kicker: '01 / ДЛЯ ДОМА',
        pillar1Title: 'Домашние котельные, тепловые насосы и магазин на 6 337 позиций',
        pillar1Desc:
            'Котлы, пеллетные горелки, тепловые насосы Haier R290, автоматика Danfoss и HERZ, бойлеры Gorenje и коллекторы теплого пола.',
        pillar1Bullets: [
            '• 6 337 позиций в наличии с ценами с НДС и без НДС',
            '• Готовые комплекты котельных и теплого пола',
            '• Самовывоз и консультация инженера в Вильнюсе и Каунасе',
        ],
        pillar1PrimaryCta: 'Открыть интернет-магазин (6 337)',
        pillar1SecondaryCta: 'Готовые пакеты',
        pillar2Kicker: '02 / МОДЕРНИЗАЦИЯ КОТЛА',
        pillar2Title: 'Перевод твердотопливного котла на автоматические пеллеты',
        pillar2Desc:
            'Вместо загрузочной дверцы устанавливаем пеллетную горелку Megatherm MPB или Pelltech с автоподатчиком. Котел остается прежним, а дрова больше не нужно подкладывать.',
        pillar2Bullets: [
            '• Подходит для котлов Viadrus, Kalvis, Atmos, Stropuva, Buderus',
            '• Монтаж за 4–6 часов без переделки котельной',
            '• Авторозжиг, модуляция мощности и самоочистка колосников',
        ],
        pillar2PrimaryCta: 'Подойдет ли к моему котлу? Проверить',
        pillar3Kicker: '03 / ПРОМЫШЛЕННОСТЬ И СТРОИТЕЛЬСТВО',
        pillar3Title: 'Контейнерные котельные 150–500 кВт и B2B портал монтажников',
        pillar3Desc:
            'Производим, продаем и сдаем в аренду мобильные контейнерные котельные для заводов, складов и стройплощадок. Для монтажников ОВиК – B2B портал с оптовыми скидками.',
        pillar3Bullets: [
            '• Контейнерные котельные: покупка и аренда (150–500 кВт)',
            '• B2B портал партнеров с подтверждением статуса',
            '• Официальные счета-фактуры НДС и объектные сметы',
        ],
        pillar3PrimaryCta: 'Контейнерные котельные',
        pillar3SecondaryCta: 'B2B для монтажников',
        sec2Aria: '02 / Флагман – Старый котел. Новая жизнь.',
        sec2Kicker: '02 / Флагман · Модернизация котла',
        sec2Title: 'Старый котел. Новая жизнь.',
        sec2Lead:
            'У вас надежный чугунный или стальной твердотопливный котел? Не меняйте всю котельную – в штатную дверцу через ЧПУ-фланец мы установим пеллетную горелку Megatherm MPB со шнеком и контроллером.',
        beforeBadge: 'До модернизации',
        beforeTitle: 'Ручная топка дровами / углем',
        beforeBullets: [
            '• Ручная загрузка дров или угля каждые 4–6 часов',
            '• Перепады температуры в доме (от +25 °C до +16 °C к утру)',
            '• Дым, сажа и постоянное дежурство у котла зимой',
            '• До 30 % тепла улетает в трубу без модуляции мощности',
        ],
        afterBadge: 'После 4–6 ч. монтажа',
        afterTitle: 'С пеллетной горелкой Megatherm',
        afterBullets: [
            '• Автоматический розжиг, шнековая подача и модуляция мощности',
            '• Самоочистка подвижных колосников (работает и на агропеллетах)',
            '• 6–10 дней автономной работы от бункера 350 л',
            '• Точная температура в доме и управление со смартфона (ecoMAX)',
        ],
        steps: ['Осмотр объекта', 'Подбор комплекта', 'Монтаж и пуск', 'Сезонный сервис'],
        sec2PrimaryCta: 'Запустить мастер модернизации котла',
        sec2SecondaryCta: 'Смотреть комплекты горелок',
        sec2StockBadge: 'Полный комплект на складе в Каунасе',
        cad2HeaderLeft: 'Чертеж модификации дверцы котла · М 1:10',
        cad2HeaderRight: 'ЧПУ Фланец Ø90–140 мм',
        cad2Aria: 'Технический чертеж перевода твердотопливного котла на пеллеты до и после',
        cad2OldTitle: '[СТАРЫЙ КОТЕЛ: ручная топка]',
        cad2OldFuel: 'Дрова / уголь',
        cad2OldReload: 'Загрузка каждые 4 ч.',
        cad2OldDoor: 'Нижняя дверца топки',
        cad2NewTitle: '[ФЛАНЕЦ + ГОРЕЛКА MPB + БУНКЕР]',
        cad2NewBoiler: 'Котел',
        cad2NewAuto: 'Автономная работа 5–7 дн.',
        sec2ImgAlt: 'Комплект пеллетной горелки Megatherm MPB NANI со шнеком',
        sec2ProdBrand: 'Megatherm · 8–35 кВт со шнеком подачи топлива',
        sec2ProdTitle: 'Комплект пеллетной горелки MPB NANI 35',
        sec2VatNetSuffix: 'без НДС',
        sec4Aria: '04 / Промышленность и строительство – Контейнерные котельные 150–500 кВт – продажа и аренда',
        sec4Kicker: '04 / Промышленность и строительство · Производство · Продажа · Аренда',
        sec4Title: 'Контейнерные котельные 150–500 кВт – покупка и аренда',
        sec4Lead:
            'Полностью собранные на заводе автоматизированные контейнерные котельные: топливо доставляется мобильными бункерами и автоматически подается в камеру сгорания. Для стройплощадок, цехов, складов и аварийного резерва.',
        indBoxes: [
            {
                kicker: '01 / Мобильный бункер',
                title: '150–500 кВт (до 2,5 МВт)',
                sub: 'Пеллеты, щепа, торф, газ',
            },
            {
                kicker: '02 / Покупка',
                title: 'Постоянная котельная предприятию',
                sub: 'С дымоходом, мультициклоном и SCADA',
            },
            {
                kicker: '03 / Аренда',
                title: 'Тепло без капитальных затрат CAPEX',
                sub: 'Доставка и запуск за 24–48 ч.',
            },
        ],
        sec4PrimaryCta: 'Контейнерные котельные и условия аренды',
        cad4HeaderLeft: 'РАЗРЕЗ КОНТЕЙНЕРНОЙ КОТЕЛЬНОЙ · GK-250 / GK-500 · М 1:25',
        cad4Aria: 'Технический CAD-чертеж разреза контейнерной котельной GK-250 и GK-500',
        cad4ZoneATitle: '[ЗОНА A] СКЛАД ТОПЛИВА',
        cad4ZoneASub: 'Подвижный пол 12–24 т',
        cad4ZoneBTitle: '[ЗОНА B] КОТЕЛ',
        cad4ZoneCTitle: '[ЗОНА C]',
        cad4ZoneCSub: 'Мультициклон',
        cad4ZoneDTitle: '[ЗОНА D]',
        cad4ZoneDSub: 'Гидравлика',
        cad4BottomDim: 'L = 6 058 мм (20ft HC ISO контейнер) · Дымоход H = 6,5 м',
        sec4ImgAlt: 'Контейнерная котельная Gilės Inžinerija GK-500 150-500 кВт',
        sec4ModelLabel: 'МОДЕЛЬ GK-150 / GK-500',
        sec4ModelSub: 'Контейнерная биокотельная',
        sec5Aria: '05 / Реализованные объекты и выполненные работы – Инженерная практика по всей Литве',
        sec5Kicker: '05 / Реализованные решения (gilesinzinerija.com)',
        sec5Title: 'Инженерная практика от Каунаса до Клайпеды',
        sec5Lead:
            'Реальные объекты, смонтированные и запущенные UAB «Gilės inžinerija» – от модернизации котлов Viadrus U26 до промышленных котельных 500 кВт – 2,0 МВт.',
        sec5AllWorksCta: 'Все 16 выполненных объектов и сервис',
        sec5IndustrialCta: 'Промышленные решения',
        sec6Aria: '06 / Почему Gilės Inžinerija – Цифры и факты, а не обещания',
        sec6Kicker: '06 / Почему Gilės Inžinerija',
        sec6Title: 'Цифры и факты, а не обещания',
        sec6Lead:
            'С 2011 года проектируем, производим и обслуживаем системы теплотехники для частных домов, многоквартирных зданий и промышленных предприятий.',
        calcPills: {
            boiler: 'Мощность котла',
            vessel: 'Расширительный бак',
            valve: 'Балансировка',
            manifold: 'Коллекторы',
            radiator: 'Радиаторы',
        },
        proofBlocks: [
            {
                num: '01 / Производство и склад',
                metric: '6 337 поз.',
                title: 'Собственное производство и склад в Каунасе',
                desc: 'ул. Эйгулю 21, LT-51418 Каунас и ул. Жирмуну 68, LT-09124 Вильнюс – производим котлы, ЧПУ-фланцы, шнеки и поддерживаем 6 337 позиций ОВиК на складе.',
            },
            {
                num: '02 / Гарантия запчастей',
                metric: '10+ лет',
                title: 'Запчасти в наличии на 10+ лет вперед',
                desc: 'ТЭНы розжига, фотоэлементы, подвижные колосники, контроллеры ecoMAX и шнеки постоянно на складе даже для узлов, установленных в 2011 г.',
            },
            {
                num: '03 / Инженерный сервис',
                metric: 'Вся Литва',
                title: 'Сервисные бригады по всей Литве',
                desc: 'Монтируем, запускаем, настраиваем горение газоанализатором и проводим сезонное обслуживание котельных от Вильнюса и Каунаса до Клайпеды.',
            },
            {
                num: '04 / Двухуровневая проверка',
                metric: 'AI + Инженер',
                title: 'Проверка Vytautas AI + гл. инженера Дарюса',
                desc: 'Быстрый первичный подбор узла с AI-инженером Витаутасом и личная проверка совместимости главным инженером Дарюсом Шауклисом перед отгрузкой.',
            },
        ],
        consultKicker: 'Прямая консультация инженера и расчет сметы',
        consultTitle: 'Не знаете, с чего начать? Поговорите с инженером.',
        consultLead:
            'Главный инженер Дарюс Шауклис и AI-инженер Витаутас помогут подобрать котел, горелку или полную смету котельной.',
        consultProjectQuoteCta: 'Смета проекта',
    },
};

export default async function HomePage({
    params,
}: {
    params?: Promise<{ locale?: string }>;
}) {
    const resolvedRouteParams = params ? await params : undefined;
    const [_flagshipProducts, store, rawLocale] = await Promise.all([
        getPopularProductPreviews(12),
        getStore(),
        resolvedRouteParams?.locale
            ? Promise.resolve(resolvedRouteParams.locale)
            : getLocale(),
    ]);
    const locale = resolveAppLocale(rawLocale);
    const rawStoreName = (store?.name || 'GILĖS INŽINERIJA').trim();
    const storeName = /suradai|fill\.lt/i.test(rawStoreName) ? 'GILĖS INŽINERIJA' : rawStoreName;
    const p = HOME_PAGE_COPY[locale];

    return (
        <main className="min-h-screen bg-[#F5F3EE] text-[#11161B]">
            <HomeHero storeName={storeName} locale={locale} />

            <section className="border-b border-[#E2DDD3] bg-[#F5F3EE] py-5">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
                    <span className="tabular-nums text-xs font-semibold text-[#5B6470]">
                        {p.brandBarLabel}
                    </span>
                    <div className="flex flex-wrap items-center gap-6 text-base sm:text-lg font-extrabold text-[#5B6470]">
                        <span>Megatherm</span>
                        <span>Danfoss</span>
                        <span>HERZ</span>
                        <span>Haier</span>
                        <span>Centrometal</span>
                        <span>Pelltech</span>
                        <span>Gorenje</span>
                        <span>Buderus</span>
                    </div>
                </div>
            </section>

            <section
                data-testid="home-three-directions"
                aria-label={p.sec1Aria}
                className="py-12 md:py-16 bg-[#F5F3EE] border-b border-[#E2DDD3]"
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                        <div className="space-y-1.5 max-w-2xl">
                            <span className="tabular-nums text-xs font-bold text-[#C2410C] block">
                                {p.sec1Kicker}
                            </span>
                            <h2 className="text-2xl md:text-4xl font-extrabold text-[#11161B] leading-tight">
                                {p.sec1Title}
                            </h2>
                            <p className="text-sm text-[#5B6470]">
                                {p.sec1Subtitle}
                            </p>
                        </div>
                        <Link
                            href={`/${locale}/products`}
                            className="text-sm font-bold text-[#C2410C] hover:text-[#11161B] whitespace-nowrap"
                        >
                            {p.allCatalogLinkText}
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 border-t border-l border-[#E2DDD3]">
                        <div className="border-r border-b border-[#E2DDD3] bg-[#FFFFFF] p-6 sm:p-7 rounded-none flex flex-col justify-between gap-6">
                            <div className="space-y-3">
                                <span className="tabular-nums text-xs font-bold text-[#5B6470] block">
                                    {p.pillar1Kicker}
                                </span>
                                <h3 className="text-xl font-extrabold text-[#11161B] leading-snug">
                                    {p.pillar1Title}
                                </h3>
                                <p className="text-sm text-[#5B6470] leading-relaxed">
                                    {p.pillar1Desc}
                                </p>
                                <ul className="space-y-1.5 text-xs text-[#2A323B] pt-1">
                                    {p.pillar1Bullets.map((b) => (
                                        <li key={b}>{b}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="pt-4 border-t border-[#E2DDD3] flex flex-wrap gap-2">
                                <Link
                                    href={`/${locale}/products`}
                                    className="inline-flex items-center rounded-none bg-[#11161B] hover:bg-[#C2410C] px-4 py-2.5 text-xs font-bold text-white whitespace-nowrap transition-colors"
                                >
                                    {p.pillar1PrimaryCta}
                                </Link>
                                <Link
                                    href={`/${locale}/paketai`}
                                    className="inline-flex items-center rounded-none border border-[#D5CFC3] bg-white hover:border-[#11161B] px-3.5 py-2.5 text-xs font-semibold text-[#11161B] whitespace-nowrap transition-colors"
                                >
                                    {p.pillar1SecondaryCta}
                                </Link>
                            </div>
                        </div>

                        <div className="border-r border-b border-[#E2DDD3] bg-[#11161B] text-[#F5F3EE] p-6 sm:p-7 rounded-none flex flex-col justify-between gap-6">
                            <div className="space-y-3">
                                <span className="tabular-nums text-xs font-bold text-[#FF8A3D] block">
                                    {p.pillar2Kicker}
                                </span>
                                <h3 className="text-xl font-extrabold text-white leading-snug">
                                    {p.pillar2Title}
                                </h3>
                                <p className="text-sm text-[#C9D0D8] leading-relaxed">
                                    {p.pillar2Desc}
                                </p>
                                <ul className="space-y-1.5 text-xs text-[#C9D0D8] pt-1">
                                    {p.pillar2Bullets.map((b) => (
                                        <li key={b}>{b}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="pt-4 border-t border-[#2C3742] flex flex-wrap gap-2">
                                <Link
                                    href={`/${locale}/vedlys`}
                                    className="inline-flex items-center rounded-none bg-[#C2410C] hover:bg-[#9A3412] px-4 py-2.5 text-xs font-bold text-white whitespace-nowrap transition-colors"
                                >
                                    {p.pillar2PrimaryCta}
                                </Link>
                            </div>
                        </div>

                        <div className="border-r border-b border-[#E2DDD3] bg-[#FFFFFF] p-6 sm:p-7 rounded-none flex flex-col justify-between gap-6">
                            <div className="space-y-3">
                                <span className="tabular-nums text-xs font-bold text-[#5B6470] block">
                                    {p.pillar3Kicker}
                                </span>
                                <h3 className="text-xl font-extrabold text-[#11161B] leading-snug">
                                    {p.pillar3Title}
                                </h3>
                                <p className="text-sm text-[#5B6470] leading-relaxed">
                                    {p.pillar3Desc}
                                </p>
                                <ul className="space-y-1.5 text-xs text-[#2A323B] pt-1">
                                    {p.pillar3Bullets.map((b) => (
                                        <li key={b}>{b}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="pt-4 border-t border-[#E2DDD3] flex flex-wrap gap-2">
                                <Link
                                    href={`/${locale}/pramonei`}
                                    className="inline-flex items-center rounded-none bg-[#11161B] hover:bg-[#C2410C] px-4 py-2.5 text-xs font-bold text-white whitespace-nowrap transition-colors"
                                >
                                    {p.pillar3PrimaryCta}
                                </Link>
                                <Link
                                    href={`/${locale}/b2b`}
                                    className="inline-flex items-center rounded-none border border-[#D5CFC3] bg-white hover:border-[#11161B] px-3.5 py-2.5 text-xs font-semibold text-[#11161B] whitespace-nowrap transition-colors"
                                >
                                    {p.pillar3SecondaryCta}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section
                data-testid="home-flagship-conversion"
                aria-label={p.sec2Aria}
                className="py-12 md:py-16 bg-white border-b border-[#E2DDD3]"
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        <div className="lg:col-span-7 space-y-5">
                            <span className="tabular-nums text-xs font-bold text-[#C2410C] block">
                                {p.sec2Kicker}
                            </span>
                            <h2 className="text-2xl md:text-4xl font-extrabold text-[#11161B] leading-tight">
                                {p.sec2Title}
                            </h2>
                            <p className="text-sm sm:text-base text-[#2A323B] leading-relaxed max-w-2xl">
                                {p.sec2Lead}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 border-t border-l border-[#E2DDD3]">
                                <div className="border-r border-b border-[#E2DDD3] bg-[#F5F3EE] p-5 rounded-none space-y-3">
                                    <span className="inline-block bg-[#2A323B] text-white px-2.5 py-0.5 text-xs font-bold">
                                        {p.beforeBadge}
                                    </span>
                                    <h3 className="text-base font-extrabold text-[#11161B]">
                                        {p.beforeTitle}
                                    </h3>
                                    <ul className="space-y-2 text-xs text-[#2A323B] leading-relaxed">
                                        {p.beforeBullets.map((b) => (
                                            <li key={b}>{b}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="border-r border-b border-[#E2DDD3] bg-[#FFFFFF] p-5 rounded-none space-y-3">
                                    <span className="inline-block bg-[#C2410C] text-white px-2.5 py-0.5 text-xs font-bold">
                                        {p.afterBadge}
                                    </span>
                                    <h3 className="text-base font-extrabold text-[#11161B]">
                                        {p.afterTitle}
                                    </h3>
                                    <ul className="space-y-2 text-xs text-[#11161B] leading-relaxed font-medium">
                                        {p.afterBullets.map((b) => (
                                            <li key={b}>{b}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <ol className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                                {p.steps.map((label, idx) => {
                                    const num = `0${idx + 1}`;
                                    return (
                                        <li
                                            key={num}
                                            className="pt-3 border-t border-[#E2DDD3] flex flex-col gap-1"
                                        >
                                            <span className="tabular-nums text-xs font-bold text-[#C2410C]">
                                                {num}
                                            </span>
                                            <span className="text-xs font-bold text-[#11161B]">
                                                {label}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ol>

                            <div className="flex flex-wrap gap-3 pt-1">
                                <Link
                                    href={`/${locale}/vedlys`}
                                    className="inline-flex items-center rounded-none bg-[#C2410C] hover:bg-[#9A3412] px-5 py-3 text-sm font-bold text-white whitespace-nowrap transition-colors"
                                >
                                    {p.sec2PrimaryCta}
                                </Link>
                                <Link
                                    href={`/${locale}/products?q=MPB`}
                                    className="inline-flex items-center rounded-none border border-[#11161B] bg-white hover:bg-[#F5F3EE] px-5 py-3 text-sm font-semibold text-[#11161B] whitespace-nowrap transition-colors"
                                >
                                    {p.sec2SecondaryCta}
                                </Link>
                            </div>
                        </div>

                        <div className="lg:col-span-5">
                            <div className="border border-[#E2DDD3] bg-[#EEEBE4] p-5 sm:p-6 rounded-none space-y-4">
                                <div className="flex items-center justify-between gap-2 text-xs border-b border-[#D5CFC3] pb-3">
                                    <span className="font-bold text-[#157A3B] inline-flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-[#157A3B]" />
                                        {p.sec2StockBadge}
                                    </span>
                                    <span className="font-mono font-bold text-[#11161B]">
                                        MPB-NANI-35
                                    </span>
                                </div>

                                <GilesDoorConversionSchematic
                                    locale={locale}
                                    testId="home-conversion-cad-blueprint"
                                />

                                <div className="h-44 sm:h-48 w-full bg-[#EEEBE4] p-3 flex items-center justify-center border border-[#D5CFC3]">
                                    <img
                                        src={assetUrl('/images/products/giles-studio-01-mpb-nani-35-50.webp')}
                                        alt={p.sec2ImgAlt}
                                        className="max-h-full max-w-full object-contain mix-blend-multiply"
                                    />
                                </div>
                                <div className="flex items-end justify-between gap-3 pt-1">
                                    <div>
                                        <span className="text-xs font-bold text-[#9A3412] block">
                                            {p.sec2ProdBrand}
                                        </span>
                                        <span className="font-extrabold text-[#11161B] text-base block mt-0.5">
                                            {p.sec2ProdTitle}
                                        </span>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-xl font-extrabold text-[#11161B] whitespace-nowrap block tabular-nums">
                                            2 350,00 €
                                        </span>
                                        <span className="text-xs text-[#5B6470] block tabular-nums">
                                            1 942,15 € {p.sec2VatNetSuffix}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <GilesArtboardCatalogGrid locale={locale} />

            <section
                data-testid="home-industrial-container-block"
                aria-label={p.sec4Aria}
                className="py-12 md:py-16 bg-[#11161B] text-[#F5F3EE] border-b border-[#2C3742]"
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        <div className="lg:col-span-7 space-y-5">
                            <span className="font-mono text-xs font-bold text-[#FF8A3D] block">
                                {p.sec4Kicker}
                            </span>
                            <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight">
                                {p.sec4Title}
                            </h2>
                            <p className="text-sm sm:text-base text-[#C9D0D8] leading-relaxed max-w-2xl">
                                {p.sec4Lead}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-l border-[#2C3742]">
                                {p.indBoxes.map((box) => (
                                    <div
                                        key={box.kicker}
                                        className="border-r border-b border-[#2C3742] bg-[#1B232C] p-4 rounded-none"
                                    >
                                        <span className="font-mono text-xs text-[#FF8A3D] block">
                                            {box.kicker}
                                        </span>
                                        <span className="font-bold text-white text-sm block mt-1">
                                            {box.title}
                                        </span>
                                        <span className="text-xs text-[#A3ADB8]">
                                            {box.sub}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-wrap gap-3 pt-2">
                                <Link
                                    href={`/${locale}/pramonei`}
                                    className="inline-flex items-center rounded-none bg-[#C2410C] hover:bg-[#9A3412] px-5 py-3 text-sm font-bold text-white whitespace-nowrap transition-colors"
                                >
                                    {p.sec4PrimaryCta}
                                </Link>
                                <a
                                    href="tel:+37061119158"
                                    className="inline-flex items-center rounded-none border border-[#3A4652] bg-[#1B232C] hover:border-[#FF8A3D] px-5 py-3 text-sm font-semibold text-white whitespace-nowrap transition-colors"
                                >
                                    Darius Šauklys: +370 611 19158
                                </a>
                            </div>
                        </div>

                        <div className="lg:col-span-5">
                            <div className="border border-[#2C3742] bg-[#1B232C] p-5 rounded-none space-y-3.5">
                                <GilesContainer20ftSchematic
                                    locale={locale}
                                    testId="home-container-cad-blueprint"
                                />

                                <div className="h-44 w-full bg-[#EEEBE4] p-3 flex items-center justify-center">
                                    <img
                                        src={assetUrl('/images/products/giles-studio-22-container-boiler-500kw.webp')}
                                        alt={p.sec4ImgAlt}
                                        className="max-h-full max-w-full object-contain mix-blend-multiply"
                                    />
                                </div>
                                <div className="flex items-center justify-between text-xs text-[#C9D0D8] pt-1">
                                    <span className="font-mono text-[#FF8A3D] font-bold">
                                        {p.sec4ModelLabel}
                                    </span>
                                    <span>{p.sec4ModelSub}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section
                id="projektai"
                data-testid="home-realized-projects"
                aria-label={p.sec5Aria}
                className="py-12 md:py-16 bg-[#F5F3EE] border-b border-[#E2DDD3]"
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                        <div className="space-y-1.5 max-w-2xl">
                            <span className="tabular-nums text-xs font-bold text-[#C2410C] block">
                                {p.sec5Kicker}
                            </span>
                            <h2 className="text-2xl md:text-4xl font-extrabold text-[#11161B] leading-tight">
                                {p.sec5Title}
                            </h2>
                            <p className="text-sm text-[#5B6470]">
                                {p.sec5Lead}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                href={`/${locale}/inzinerija#atlikti-darbai`}
                                className="inline-flex items-center rounded-none bg-[#11161B] hover:bg-[#C2410C] px-4 py-2.5 text-xs font-bold text-white whitespace-nowrap transition-colors min-h-[44px]"
                            >
                                {p.sec5AllWorksCta}
                            </Link>
                            <Link
                                href={`/${locale}/pramonei`}
                                className="text-sm font-bold text-[#C2410C] hover:text-[#11161B] whitespace-nowrap"
                            >
                                {p.sec5IndustrialCta}
                            </Link>
                        </div>
                    </div>

                    <LocalizedCompletedWorksHomeShowcase locale={locale} />
                </div>
            </section>

            <GilesMcpMarketingShowcase locale={locale} />

            <section
                id="zinios"
                data-testid="home-why-giles-proof"
                aria-label={p.sec6Aria}
                className="py-12 md:py-16 bg-white border-b border-[#E2DDD3]"
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                        <div className="space-y-1.5 max-w-2xl">
                            <span className="tabular-nums text-xs font-bold text-[#C2410C] block">
                                {p.sec6Kicker}
                            </span>
                            <h2 className="text-2xl md:text-4xl font-extrabold text-[#11161B] leading-tight">
                                {p.sec6Title}
                            </h2>
                            <p className="text-sm text-[#5B6470]">
                                {p.sec6Lead}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs font-semibold">
                            <Link
                                href={`/${locale}/skaiciuokle?tab=boiler`}
                                className="border border-[#E2DDD3] bg-[#F5F3EE] hover:border-[#11161B] px-3 py-1.5 text-[#11161B] whitespace-nowrap"
                            >
                                {p.calcPills.boiler}
                            </Link>
                            <Link
                                href={`/${locale}/skaiciuokle?tab=vessel`}
                                className="border border-[#E2DDD3] bg-[#F5F3EE] hover:border-[#11161B] px-3 py-1.5 text-[#11161B] whitespace-nowrap"
                            >
                                {p.calcPills.vessel}
                            </Link>
                            <Link
                                href={`/${locale}/skaiciuokle?tab=valve`}
                                className="border border-[#E2DDD3] bg-[#F5F3EE] hover:border-[#11161B] px-3 py-1.5 text-[#11161B] whitespace-nowrap"
                            >
                                {p.calcPills.valve}
                            </Link>
                            <Link
                                href={`/${locale}/skaiciuokle?tab=manifold`}
                                className="border border-[#E2DDD3] bg-[#F5F3EE] hover:border-[#11161B] px-3 py-1.5 text-[#11161B] whitespace-nowrap"
                            >
                                {p.calcPills.manifold}
                            </Link>
                            <Link
                                href={`/${locale}/skaiciuokle?tab=radiator`}
                                className="border border-[#E2DDD3] bg-[#F5F3EE] hover:border-[#11161B] px-3 py-1.5 text-[#11161B] whitespace-nowrap"
                            >
                                {p.calcPills.radiator}
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-[#E2DDD3]">
                        {p.proofBlocks.map((item) => (
                            <div
                                key={item.num}
                                className="border-r border-b border-[#E2DDD3] bg-[#F5F3EE] p-6 rounded-none flex flex-col justify-between gap-4"
                            >
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-mono text-xs font-bold text-[#C2410C]">
                                            {item.num}
                                        </span>
                                        <span className="bg-[#11161B] text-white px-2 py-0.5 text-xs font-bold">
                                            {item.metric}
                                        </span>
                                    </div>
                                    <h3 className="text-base font-extrabold text-[#11161B] leading-snug">
                                        {item.title}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-[#2A323B] leading-relaxed">
                                        {item.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-8 border-t-2 border-[#11161B] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="space-y-1.5 max-w-2xl">
                            <span className="tabular-nums text-xs font-bold text-[#C2410C] block">
                                {p.consultKicker}
                            </span>
                            <h2 className="text-2xl md:text-3xl font-extrabold text-[#11161B] leading-tight">
                                {p.consultTitle}
                            </h2>
                            <p className="text-sm text-[#5B6470]">
                                {p.consultLead}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                            <a
                                href="tel:+37061119158"
                                className="inline-flex items-center justify-center rounded-none bg-[#C2410C] hover:bg-[#9A3412] px-5 py-3.5 text-sm font-bold text-white whitespace-nowrap transition-colors"
                            >
                                +370 611 19158 (Darius)
                            </a>
                            <a
                                href="mailto:info@gilesinzinerija.lt"
                                className="inline-flex items-center justify-center rounded-none border border-[#11161B] bg-white hover:bg-[#F5F3EE] px-5 py-3.5 text-sm font-bold text-[#11161B] whitespace-nowrap transition-colors"
                            >
                                info@gilesinzinerija.lt
                            </a>
                            <Link
                                href={`/${locale}/uzklausa`}
                                className="inline-flex items-center justify-center rounded-none bg-[#11161B] hover:bg-[#C2410C] px-5 py-3.5 text-sm font-bold text-white whitespace-nowrap transition-colors"
                            >
                                {p.consultProjectQuoteCta}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
