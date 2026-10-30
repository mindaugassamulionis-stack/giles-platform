export interface BrandVisualInfo {
  name: string
  logoPath: string
  origin: string
  specialty?: string
  accentHex: string
}

export const BRAND_LOGOS: Record<string, BrandVisualInfo> = {
  Danfoss: {
    name: "Danfoss",
    logoPath: "/images/brands/danfoss.svg",
    origin: "Danija · Termostatika ir automatika",
    specialty: "RA-N vožtuvai, Redia galvutės, Icon / DEVIreg valdikliai",
    accentHex: "#E2000F",
  },
  "IMI Heimeier": {
    name: "IMI Heimeier",
    logoPath: "/images/brands/imi-heimeier.svg",
    origin: "Vokietija · Vožtuvai ir kolektoriai",
    specialty: "Eclipse srauto ribotuvai, K-galvutės, Dynacon kolektoriai",
    accentHex: "#005A9C",
  },
  "IMI Pneumatex": {
    name: "IMI Pneumatex",
    logoPath: "/images/brands/imi-pneumatex.svg",
    origin: "Šveicarija · Plėtimosi indai ir nuorintuvai",
    specialty: "Statico / Aquapresso plėtimosi indai, Zeparo, Compresso",
    accentHex: "#004B87",
  },
  "IMI TA": {
    name: "IMI TA",
    logoPath: "/images/brands/imi-ta.svg",
    origin: "Švedija · Hidraulinis balansavimas",
    specialty: "STAD, STAF, TBV-C, TA-Modulator balansiniai vožtuvai",
    accentHex: "#003E70",
  },
  Ferroli: {
    name: "Ferroli",
    logoPath: "/images/brands/ferroli.svg",
    origin: "Italija · Katilai ir šilumos siurbliai",
    specialty: "Šildymo katilai, radiatoriai ir vandens šildytuvai",
    accentHex: "#F37021",
  },
  "ŠVOK Inžinerija": {
    name: "ŠVOK Inžinerija",
    logoPath: "/images/brands/svok-inzinerija.svg",
    origin: "ES · Sertifikuota ŠVOK komplektacija",
    specialty: "Montavimo ir automatikos priedai",
    accentHex: "#1E3A5F",
  },
  "GI-AUTOMATIKA": {
    name: "ŠVOK Inžinerija",
    logoPath: "/images/brands/svok-inzinerija.svg",
    origin: "ES · Sertifikuota ŠVOK komplektacija",
    specialty: "Montavimo ir automatikos priedai",
    accentHex: "#1E3A5F",
  },
  Comisa: {
    name: "Comisa",
    logoPath: "/images/brands/comisa.svg",
    origin: "Italija · Presuojamos ir žalvarinės jungtys",
    specialty: "Presuojami fitingai, kolektoriai, rutuliniai kranai, saulės sistemos",
    accentHex: "#D97706",
  },
  Viessmann: {
    name: "Viessmann",
    logoPath: "/images/brands/viessmann.svg",
    origin: "Vokietija · Kondensaciniai katilai ir saulės sistemos",
    specialty: "Vitodens 100-W / 200-W / 222-F katilai, Vitosol saulės kolektoriai",
    accentHex: "#EA580C",
  },
  Wilo: {
    name: "Wilo",
    logoPath: "/images/brands/wilo.svg",
    origin: "Vokietija · Cirkuliaciniai ir vandens siurbliai",
    specialty: "Stratos PICO, Yonos PICO, Star-Z, DrainLift, TWU/TWI siurbliai",
    accentHex: "#059669",
  },
  SANHA: {
    name: "SANHA",
    logoPath: "/images/brands/sanha.svg",
    origin: "Vokietija · Presuojamo vario ir plieno fitingai",
    specialty: "Presuojamos varinės jungtys ir juodo plieno srieginiai fitingai",
    accentHex: "#B91C1C",
  },
  Watts: {
    name: "Watts",
    logoPath: "/images/brands/watts.svg",
    origin: "ES / JAV · Hidroninė armatūra ir automatika",
    specialty: "KSG saugos grupės, DRV slėgio reduktoriai, Milux ir WFHT automatika",
    accentHex: "#0284C7",
  },
  "FV-Plast": {
    name: "FV-Plast",
    logoPath: "/images/brands/fv-plast.svg",
    origin: "Čekija · PPR vamzdynų sistemos",
    specialty: "PPR fitingai ir stabilizuoti vamzdžiai šildymui bei vandentiekiui",
    accentHex: "#16A34A",
  },
  Wavin: {
    name: "Wavin",
    logoPath: "/images/brands/wavin.svg",
    origin: "Nyderlandai · Vidaus, lauko ir betriukšmės nuotekos",
    specialty: "Wavin Asto betriukšmės nuotekos, vidaus ir lauko kanalizacija",
    accentHex: "#2563EB",
  },
  Centrometal: {
    name: "Centrometal",
    logoPath: "/images/brands/centrometal.svg",
    origin: "Kroatija · Kieto kuro ir granuliniai katilai",
    specialty: "EKO-CK P, PelTec, CentroPlus katilai, Cm Pelet-set degikliai, CAS talpos",
    accentHex: "#DC2626",
  },
  "Dražice": {
    name: "Dražice",
    logoPath: "/images/brands/drazice.svg",
    origin: "Čekija · Vandens šildytuvai (boileriai)",
    specialty: "OKC, OKCE, OKHE, OKCV kombinuoti ir netiesioginio šildymo boileriai",
    accentHex: "#0D9488",
  },
  Buderus: {
    name: "Buderus",
    logoPath: "/images/brands/buderus.svg",
    origin: "Vokietija · Dujiniai ir kieto kuro katilai",
    specialty: "Logamax plus GB172i/GB162, Logano G221/S111, Logamatic automatika",
    accentHex: "#1D4ED8",
  },
  Thermawool: {
    name: "Thermawool",
    logoPath: "/images/brands/thermawool.svg",
    origin: "ES · Mineralinės vatos vamzdžių izoliacija",
    specialty: "ThermaWool ALU folijuoti akmens vatos kevalai vamzdynams",
    accentHex: "#CA8A04",
  },
  HERZ: {
    name: "HERZ",
    logoPath: "/images/brands/herz.svg",
    origin: "Austrija · Katilinės armatūra ir kolektoriai",
    specialty: "Trieigiai pamaišymo vožtuvai, Teplomix mazgai, grindinio šildymo kolektoriai",
    accentHex: "#C2410C",
  },
  Gorenje: {
    name: "Gorenje",
    logoPath: "/images/brands/gorenje.svg",
    origin: "Slovėnija · Vandens šildytuvai",
    specialty: "TGR, GBFU, GBK, OGB, GV elektriniai ir kombinuoti boileriai",
    accentHex: "#0369A1",
  },
  Rotex: {
    name: "Rotex",
    logoPath: "/images/brands/rotex.svg",
    origin: "Vokietija · Kondensaciniai katilai ir šilumos siurbliai",
    specialty: "GSU kondensaciniai katilai su integruota talpa, HPSU šilumos siurbliai",
    accentHex: "#4F46E5",
  },
  Grundfos: {
    name: "Grundfos",
    logoPath: "/images/brands/grundfos.svg",
    origin: "Danija · Cirkuliaciniai ir giluminiai siurbliai",
    specialty: "ALPHA2, MAGNA1/3, COMFORT, SQE, SBA, Sololift2 siurbliai",
    accentHex: "#0F4C81",
  },
  Thermaflex: {
    name: "Thermaflex",
    logoPath: "/images/brands/thermaflex.svg",
    origin: "Nyderlandai · Polietileno šilumos izoliacija",
    specialty: "ThermaCompact IS ir ThermaEco vamzdžių šilumos izoliacija",
    accentHex: "#15803D",
  },
  Ferro: {
    name: "Ferro",
    logoPath: "/images/brands/ferro.svg",
    origin: "ES · Santechniniai maišytuvai ir dušo sistemos",
    specialty: "Rosa, Vasto, Zumba, Metalia, Smile, Padwa maišytuvai",
    accentHex: "#475569",
  },
  Zilmet: {
    name: "Zilmet",
    logoPath: "/images/brands/zilmet.svg",
    origin: "Italija · Hidroforo ir išsiplėtimo indai",
    specialty: "Hydro-Pro vandentiekio ir Cal-Pro šildymo plėtimosi indai",
    accentHex: "#B91C1C",
  },
  Junkers: {
    name: "Junkers",
    logoPath: "/images/brands/junkers.svg",
    origin: "Vokietija · Dujiniai šildymo katilai",
    specialty: "CeraclassSmart ZWA, CeraclassExcellence ZWC katilai ir automatika",
    accentHex: "#1E40AF",
  },
  Megatherm: {
    name: "Megatherm",
    logoPath: "/images/brands/megatherm.svg",
    origin: "ES · Granulių degikliai ir uždegimo tenai",
    specialty: "Automatiniai granulių degiklių komplektai ir 425W uždegimo tenai",
    accentHex: "#EA580C",
  },
  Pelltech: {
    name: "Pelltech",
    logoPath: "/images/brands/pelltech.svg",
    origin: "ES · Automatiniai granulių degikliai",
    specialty: "PV20a / PV30a savaime išsivalantys medienos granulių degikliai",
    accentHex: "#16A34A",
  },
  "Gilės Inžinerija": {
    name: "Gilės Inžinerija",
    logoPath: "/images/brands/giles-inzinerija.svg",
    origin: "Lietuva · Katilinės įranga, degikliai ir uždegimo tenai",
    specialty: "Kieto kuro katilai 25–150 kW, granulių degikliai, keramikiniai ir kvarciniai tenai",
    accentHex: "#0F766E",
  },
  "Gilės inžinerija": {
    name: "Gilės Inžinerija",
    logoPath: "/images/brands/giles-inzinerija.svg",
    origin: "Lietuva · Katilinės įranga, degikliai ir uždegimo tenai",
    specialty: "Kieto kuro katilai 25–150 kW, granulių degikliai, keramikiniai ir kvarciniai tenai",
    accentHex: "#0F766E",
  },
  "Giles Inzinerija": {
    name: "Gilės Inžinerija",
    logoPath: "/images/brands/giles-inzinerija.svg",
    origin: "Lietuva · Katilinės įranga, degikliai ir uždegimo tenai",
    specialty: "Kieto kuro katilai 25–150 kW, granulių degikliai, keramikiniai ir kvarciniai tenai",
    accentHex: "#0F766E",
  },
  KaTRI: {
    name: "KaTRI",
    logoPath: "/images/brands/katri.svg",
    origin: "Lietuva · Plieniniai 3 eigų katilai (P265GH)",
    specialty: "KaTRI 25–150 kW kieto kuro ir granulių šildymo katilai",
    accentHex: "#B91C1C",
  },
  Ponast: {
    name: "Ponast",
    logoPath: "/images/brands/ponast.svg",
    origin: "Čekija · Automatiniai granuliniai katilai",
    specialty: "KP 08–62 automatiniai V emisijos klasės granuliniai katilai",
    accentHex: "#B91C1C",
  },
  Bosch: {
    name: "Bosch",
    logoPath: "/images/brands/bosch.svg",
    origin: "Vokietija · Šildymo ir klimato sistemos",
    specialty: "Climate 3000i šilumos siurbliai oras–oras ir kondensacinė technika",
    accentHex: "#E11D48",
  },
  Haier: {
    name: "Haier",
    logoPath: "/images/brands/haier.svg",
    origin: "Tarptautinis · Šilumos siurbliai, VRF ir vandens šildytuvai",
    specialty: "Oras–vanduo R290/R32 šilumos siurbliai, HP80–HP250 boileriai, Nordic Split ir MRV",
    accentHex: "#005AAA",
  },
  haier: {
    name: "Haier",
    logoPath: "/images/brands/haier.svg",
    origin: "Tarptautinis · Šilumos siurbliai, VRF ir vandens šildytuvai",
    specialty: "Oras–vanduo R290/R32 šilumos siurbliai, HP80–HP250 boileriai, Nordic Split ir MRV",
    accentHex: "#005AAA",
  },
}

const EXACT_PHOTO_SKU_FILES: Record<string, string> = {
  "013g1350": "/images/products/013g1350.webp",
  "013g1360": "/images/products/013g1360.webp",
  "013g2920": "/images/products/013g2920.webp",
  "013g2970": "/images/products/013g2970.webp",
  "013g2977": "/images/products/013g2977.webp",
  "013g2978": "/images/products/013g2978.webp",
  "013g2992": "/images/products/013g2992.webp",
  "013g3368": "/images/products/013g3368.webp",
  "013g3369": "/images/products/013g3369.webp",
  "013g5012": "/images/products/013g5012.webp",
  "013g5030": "/images/products/013g5030.webp",
  "013g5068": "/images/products/013g5068.webp",
  "013g5116": "/images/products/013g5116.webp",
  "013g5136": "/images/products/013g5136.webp",
  "013g5216": "/images/products/013g5216.webp",
  "013g6170": "/images/products/013g6170.webp",
  "014g0100": "/images/products/014g0100.webp",
  "0381-01.000": "/images/products/0381-01.000.webp",
  "0382-01.000": "/images/products/0382-01.000.webp",
  "0382-02.000": "/images/products/0382-02.000.webp",
  "0601-02.350": "/images/products/0601-02.350.webp",
  "0601-03.350": "/images/products/0601-03.350.webp",
  "0601-04.350": "/images/products/0601-04.350.webp",
  "088u0240": "/images/products/088u0240.webp",
  "140f1064": "/images/products/140f1064.webp",
  "140f1069": "/images/products/140f1069.webp",
  "2245-20.000": "/images/products/2245-20.000.webp",
  "3452-02.000": "/images/products/3452-02.000.webp",
  "3711-02.000": "/images/products/3711-02.000.webp",
  "3712-02.000": "/images/products/3712-02.000.webp",
  "3933-01.000": "/images/products/3933-01.000.webp",
  "3933-02.000": "/images/products/3933-02.000.webp",
  "3934-01.000": "/images/products/3934-01.000.webp",
  "3934-02.000": "/images/products/3934-02.000.webp",
  "3935-02.000": "/images/products/3935-02.000.webp",
  "3936-02.000": "/images/products/3936-02.000.webp",
  "3937-02.000": "/images/products/3937-02.000.webp",
  "3938-02.000": "/images/products/3938-02.000.webp",
  "3939-02.000": "/images/products/3939-02.000.webp",
  "3942-15.000": "/images/products/3942-15.000.webp",
  "52-133-215": "/images/products/52-133-215.webp",
  "52-134-215": "/images/products/52-134-215.webp",
  "52-151-009": "/images/products/52-151-009.webp",
  "52-151-014": "/images/products/52-151-014.webp",
  "52-151-020": "/images/products/52-151-020.webp",
  "52-151-025": "/images/products/52-151-025.webp",
  "52-151-209": "/images/products/52-151-209.webp",
  "52-151-214": "/images/products/52-151-214.webp",
  "52-151-220": "/images/products/52-151-220.webp",
  "52-153-014": "/images/products/52-153-014.webp",
  "52-153-020": "/images/products/52-153-020.webp",
  "52-153-025": "/images/products/52-153-025.webp",
  "52-153-032": "/images/products/52-153-032.webp",
  "52-153-040": "/images/products/52-153-040.webp",
  "52-153-050": "/images/products/52-153-050.webp",
  "52-182-820": "/images/products/52-182-820.webp",
  "52-182-825": "/images/products/52-182-825.webp",
  "52-182-832": "/images/products/52-182-832.webp",
  "52-182-840": "/images/products/52-182-840.webp",
  "52-182-850": "/images/products/52-182-850.webp",
  "52-182-865": "/images/products/52-182-865.webp",
  "52-182-880": "/images/products/52-182-880.webp",
  "52-182-890": "/images/products/52-182-890.webp",
  "52-182-891": "/images/products/52-182-891.webp",
  "52-182-892": "/images/products/52-182-892.webp",
  "7101001": "/images/products/7101001.webp",
  "7101002": "/images/products/7101002.webp",
  "7101003": "/images/products/7101003.webp",
  "7101004": "/images/products/7101004.webp",
  "7101005": "/images/products/7101005.webp",
  "7101006": "/images/products/7101006.webp",
  "7102015": "/images/products/7102015.webp",
  "7102016": "/images/products/7102016.webp",
  "7103001": "/images/products/7103001.webp",
  "7103002": "/images/products/7103002.webp",
  "7103003": "/images/products/7103003.webp",
  "7103004": "/images/products/7103004.webp",
  "7103005": "/images/products/7103005.webp",
  "7103006": "/images/products/7103006.webp",
  "7111017": "/images/products/7111017.webp",
  "7111020": "/images/products/7111020.webp",
  "7895122": "/images/products/7895122.webp",
  "8101411": "/images/products/8101411.webp",
  "8101413": "/images/products/8101413.webp",
  "8101414": "/images/products/8101414.webp",
  "9330-02.800": "/images/products/9330-02.800.webp",
  "9330-03.800": "/images/products/9330-03.800.webp",
  "9330-04.800": "/images/products/9330-04.800.webp",
  "9330-05.800": "/images/products/9330-05.800.webp",
  "9330-06.800": "/images/products/9330-06.800.webp",
  "9330-07.800": "/images/products/9330-07.800.webp",
  "9330-08.800": "/images/products/9330-08.800.webp",
  "9330-09.800": "/images/products/9330-09.800.webp",
  "9330-10.800": "/images/products/9330-10.800.webp",
  "9330-11.800": "/images/products/9330-11.800.webp",
  "003z0635": "/images/products/danfoss-003z0635.webp",
  "003z2286": "/images/products/danfoss-003z2286.webp",
  "082h3078": "/images/products/danfoss-082h3078.webp",
  "088u0532": "/images/products/danfoss-088u0532.webp",
  "082h0171": "/images/products/danfoss-082h0171.webp",
  "003z1215": "/images/products/danfoss-003z1215.webp",
  "003z4046": "/images/products/danfoss-003z4046.webp",
  "013g4276": "/images/products/danfoss-013g4276.webp",
  "013g4376": "/images/products/danfoss-013g4376.webp",
  "003z2151": "/images/products/danfoss-003z2151.webp",
  "088h0017": "/images/products/danfoss-088h0017.webp",
  "082h8059": "/images/products/danfoss-082h8059.webp",
  "003z1511": "/images/products/danfoss-003z1511.webp",
  "088l9280": "/images/products/danfoss-088l9280.webp",
  "003z1127": "/images/products/danfoss-003z1127.webp",
  "003z0514": "/images/products/danfoss-003z0514.webp",
  "003l1000": "/images/products/danfoss-003l1000.webp",
  "087b1184": "/images/products/danfoss-087b1184.webp",
  "003l6030": "/images/products/danfoss-003l6030.webp",
  "013g5065": "/images/products/danfoss-013g5065.webp",
  "088u0301": "/images/products/danfoss-088u0301.webp",
  "003l8153": "/images/products/danfoss-003l8153.webp",
  "013g3134": "/images/products/danfoss-013g3134.webp",
  "087n0011": "/images/products/danfoss-087n0011.webp",
  "003z0276": "/images/products/danfoss-003z0276.webp",
  "013g3096": "/images/products/danfoss-013g3096.webp",
  "082f1152": "/images/products/danfoss-082f1152.webp",
  "013g1675": "/images/products/giles-wp-013g1676.webp",
  "013g1677": "/images/products/danfoss-013g1679.webp",
  "013g1679": "/images/products/danfoss-013g1679.webp",
  "087n1110": "/images/products/danfoss-087n1110.webp",
  "088h3143": "/images/products/danfoss-088h3143.webp",
  "041e0000": "/images/products/danfoss-041e0000.webp",
  "013g2990": "/images/products/danfoss-013g2990.webp",
  "013g2991": "/images/products/danfoss-013g2990.webp",
  "013g3239": "/images/products/danfoss-013g3239.webp",
  "003l0282": "/images/products/danfoss-003l0282.webp",
  "013g6070": "/images/products/danfoss-013g6070.webp",
  "013g3300": "/images/products/danfoss-013g3300.webp",
  "013g0234": "/images/products/danfoss-013g0234.webp",
  "003z0104": "/images/products/danfoss-003z0104.webp",
  "013g0011": "/images/products/danfoss-013g0011.webp",
  "013g5215": "/images/products/danfoss-013g5215.webp",
  "003z4652": "/images/products/danfoss-003z4652.webp",
  "003l1824": "/images/products/danfoss-003l1824.webp",
  "katgr3981080": "/images/products/egip-katgr3981080.webp",
  "1801000w15265": "/images/products/egip-1801000w15265.webp",
  "katf0033292": "/images/products/egip-katf0033292.webp",
  "egip-gli52": "/images/products/egip-egip-gli52.webp",
  "katgr398300": "/images/products/egip-katgr398300.webp",
  "katmk3983350": "/images/products/egip-katmk3983350.webp",
  "katm3983300": "/images/products/egip-katm3983300.webp",
  "egip-gli59": "/images/products/egip-egip-gli59.webp",
  "katmk3983107": "/images/products/egip-katmk3983107.webp",
  "katgr3981018": "/images/products/egip-katgr3981018.webp",
  "katgr3981082": "/images/products/egip-katgr3981082.webp",
  "katgr3981035": "/images/products/egip-katgr3981035.webp",
  "katgr3981084": "/images/products/egip-katgr3981084.webp",
  "egip-gli57": "/images/products/egip-egip-gli57.webp",
  "egip-gli55": "/images/products/egip-egip-gli55.webp",
  "egip-gli54": "/images/products/egip-egip-gli54.webp",
  "katgr3981033": "/images/products/egip-katgr3981033.webp",
  "kaw7528121": "/images/products/egip-kaw7528121.webp",
  "katm39833425": "/images/products/egip-katm39833425.webp",
  "katm3983302": "/images/products/egip-katm3983302.webp",
  "katri3850150": "/images/products/egip-katri3850150.webp",
  "katri3850020": "/images/products/egip-katri3850020.webp",
  "o30h8103": "/images/products/egip-o30h8103.webp",
  "030h6308": "/images/products/egip-030h6308.webp",
  "030b0131": "/images/products/egip-030b0131.webp",
  "030h6906": "/images/products/egip-030h6906.webp",
  "030f4906": "/images/products/egip-030f4906.webp",
  "030f6912": "/images/products/egip-030f6912.webp",
  "030f6922": "/images/products/egip-030f6922.webp",
  "030f6156": "/images/products/egip-030f6156.webp",
  "23013009600x0": "/images/products/egip-23013009600x0.webp",
  "degkmpl140pv20": "/images/products/egip-degkmpl140pv20.webp",
  "degkmpl140mg20": "/images/products/egip-degkmpl140mg20.webp",
  "degkmpl50kv": "/images/products/egip-degkmpl50kv.webp",
  "katturbolizat": "/images/products/egip-katturbolizat.webp",
  "013g6075": "/images/products/giles-wp-013g6075.webp",
  "013g6180": "/images/products/giles-wp-013g6180.webp",
  "013g5010": "/images/products/giles-wp-013g5010.webp",
  "013g1676": "/images/products/giles-wp-013g1676.webp",
  "003l0123": "/images/products/giles-wp-rlv-s.webp",
  "003l0124": "/images/products/giles-wp-rlv-s.webp",
  "003l0125": "/images/products/giles-wp-rlv-s.webp",
  "003l0220": "/images/products/giles-wp-rlv-ks.webp",
  "003l0222": "/images/products/giles-wp-rlv-ks.webp",
  "013g4277": "/images/products/giles-wp-vhx4.webp",
  "7891125": "/images/products/giles-wp-pneumatex-7891125.webp",
  "141074": "/images/products/giles-wp-rotex-141074.webp",
  "141574": "/images/products/giles-wp-rotex-141574.webp",
  "2139420": "/images/products/giles-wp-wilo-2139420.webp",
  "88.20.070": "/images/products/giles-wp-comisa-8820070.webp",
  "88.21.195": "/images/products/giles-wp-comisa-88-21-195.webp",
  "zv200": "/images/products/giles-wp-gorenje-zv-200.webp",
  "zv50": "/images/products/giles-wp-gorenje-zv-50.webp",
  "tgrk80ng": "/images/products/giles-wp-gorenje-tgrk-80.webp",
  "ogb100sedd": "/images/products/giles-wp-gorenje-ogb-100-sedd.webp",
  "tc200-1zcr": "/images/products/giles-wp-gorenje-tc-200.webp",
  "efwh3000": "/images/products/giles-wp-gorenje-efwh-3000.webp",
  "2120661": "/images/products/giles-wp-wilo-yonos-maxo.webp",
  "2090455": "/images/products/giles-wp-wilo-stratos-d.webp",
  "4081532": "/images/products/giles-wp-wilo-wj-203.webp",
  "2528529": "/images/products/giles-wp-wilo-drainlift-con.webp",
  "96510151": "/images/products/giles-wp-grundfos-sqe-3-65.webp",
  "to10in": "/images/products/giles-wp-drazice-to-10-in.webp",
}

export const EXACT_PHOTO_SKUS: Set<string> = new Set([
  ...Object.keys(EXACT_PHOTO_SKU_FILES),
  ...Object.keys(EXACT_PHOTO_SKU_FILES).map((k) => k.toUpperCase()),
])

export function isExactPhotoSku(sku?: string | null): boolean {
  if (!sku) return false
  return Boolean(EXACT_PHOTO_SKU_FILES[sku.trim().toLowerCase()])
}

export function resolveBrandLogo(
  brand?: string | null,
  fallbackText?: string | null,
): BrandVisualInfo {
  const raw = (brand ?? "").trim()
  if (raw && BRAND_LOGOS[raw]) {
    return BRAND_LOGOS[raw]
  }
  const combined = `${raw} ${fallbackText ?? ""}`.toLowerCase()
  if (combined.includes("comisa")) return BRAND_LOGOS["Comisa"]
  if (combined.includes("viessmann") || combined.includes("vitodens") || combined.includes("vitosol")) return BRAND_LOGOS["Viessmann"]
  if (combined.includes("wilo")) return BRAND_LOGOS["Wilo"]
  if (combined.includes("sanha")) return BRAND_LOGOS["SANHA"]
  if (combined.includes("watts")) return BRAND_LOGOS["Watts"]
  if (combined.includes("fv-plast") || combined.includes("fv plast")) return BRAND_LOGOS["FV-Plast"]
  if (combined.includes("wavin")) return BRAND_LOGOS["Wavin"]
  if (combined.includes("centrometal") || combined.includes("peltec") || combined.includes("centroplus")) return BRAND_LOGOS["Centrometal"]
  if (combined.includes("dražice") || combined.includes("drazice")) return BRAND_LOGOS["Dražice"]
  if (combined.includes("buderus") || combined.includes("logamax") || combined.includes("logano")) return BRAND_LOGOS["Buderus"]
  if (combined.includes("thermawool")) return BRAND_LOGOS["Thermawool"]
  if (combined.includes("herz")) return BRAND_LOGOS["HERZ"]
  if (combined.includes("gorenje")) return BRAND_LOGOS["Gorenje"]
  if (combined.includes("rotex")) return BRAND_LOGOS["Rotex"]
  if (combined.includes("grundfos") || combined.includes("alpha2") || combined.includes("magna1") || combined.includes("sololift")) return BRAND_LOGOS["Grundfos"]
  if (combined.includes("thermaflex") || combined.includes("thermacompact")) return BRAND_LOGOS["Thermaflex"]
  if (combined.includes("zilmet")) return BRAND_LOGOS["Zilmet"]
  if (combined.includes("junkers") || combined.includes("ceraclass")) return BRAND_LOGOS["Junkers"]
  if (combined.includes("megatherm")) return BRAND_LOGOS["Megatherm"]
  if (combined.includes("pelltech")) return BRAND_LOGOS["Pelltech"]
  if (combined.includes("ponast")) return BRAND_LOGOS["Ponast"]
  if (combined.includes("bosch") || combined.includes("cl3000")) return BRAND_LOGOS["Bosch"]
  if (combined.includes("katri") && !combined.includes("gilės") && !combined.includes("giles")) return BRAND_LOGOS["KaTRI"]
  if (combined.includes("gilės inžinerija") || combined.includes("giles inzinerija") || combined.includes("katri")) return BRAND_LOGOS["Gilės Inžinerija"]
  if (combined.includes("ferroli")) return BRAND_LOGOS["Ferroli"]
  if (combined.includes("ferro")) return BRAND_LOGOS["Ferro"]
  if (combined.includes("haier")) return BRAND_LOGOS["Haier"]
  if (combined.includes("heimeier")) return BRAND_LOGOS["IMI Heimeier"]
  if (combined.includes("pneumatex")) return BRAND_LOGOS["IMI Pneumatex"]
  if (combined.includes("imi ta") || raw.toLowerCase() === "ta" || combined.includes("tour & andersson")) {
    return BRAND_LOGOS["IMI TA"]
  }
  if (combined.includes("danfoss")) return BRAND_LOGOS["Danfoss"]
  if (
    !raw ||
    raw.toUpperCase() === "GI-AUTOMATIKA" ||
    combined.includes("gi-automatika") ||
    combined.includes("montavimo dėž") ||
    combined.includes("švok")
  ) {
    return BRAND_LOGOS["ŠVOK Inžinerija"]
  }
  return BRAND_LOGOS["Danfoss"]
}

export interface ResolvedProductVisual {
  kind: "photo"
  imageUrl: string
  seriesImageUrl: string
  brand: BrandVisualInfo
}

export function resolveProductVisual(input: {
  sku?: string | null
  title?: string | null
  brand?: string | null
  category?: string | null
  imageUrl?: string | { url?: string } | null
  images?: Array<{ url?: string } | string> | null
  seriesImageUrl?: string | null
  attributes?: Record<string, any> | null
}): ResolvedProductVisual {
  const firstFromImages =
    Array.isArray(input.images) && input.images.length > 0
      ? typeof input.images[0] === "string"
        ? input.images[0]
        : input.images[0]?.url
      : null
  const effectiveImageUrl = input.imageUrl ?? firstFromImages ?? input.seriesImageUrl
  const resolvedUrl = resolveProductImageUrl({
    ...input,
    imageUrl: effectiveImageUrl,
  })
  const brandInfo = resolveBrandLogo(input.brand, `${input.title ?? ""} ${input.sku ?? ""}`)
  return {
    kind: "photo",
    imageUrl: resolvedUrl,
    seriesImageUrl: input.seriesImageUrl?.trim() || resolvedUrl,
    brand: brandInfo,
  }
}

export function resolveProductImageUrl(input: {
  sku?: string | null
  title?: string | null
  brand?: string | null
  category?: string | null
  imageUrl?: string | { url?: string } | null
  seriesImageUrl?: string | null
  attributes?: Record<string, any> | null
}): string {
  const rawImg =
    typeof input.imageUrl === "string"
      ? input.imageUrl.trim()
      : input.imageUrl && typeof input.imageUrl === "object" && typeof (input.imageUrl as any).url === "string"
        ? (input.imageUrl as any).url.trim()
        : ""
  const seriesImg =
    (typeof input.seriesImageUrl === "string" && input.seriesImageUrl.trim()) ||
    (input.attributes && typeof input.attributes === "object" && typeof input.attributes.seriesImageUrl === "string"
      ? input.attributes.seriesImageUrl.trim()
      : "") ||
    (input.attributes && typeof input.attributes === "object" && typeof input.attributes.ui_fallback_image === "string"
      ? input.attributes.ui_fallback_image.trim()
      : "")
  const existing = rawImg || seriesImg
  const skuLower = (input.sku ?? "").trim().toLowerCase()
  const title = (input.title ?? "").toLowerCase()
  const brand = (input.brand ?? "").toLowerCase()
  const category = (input.category ?? "").toLowerCase()
  const combined = `${skuLower} ${title} ${brand} ${category}`

  // Guard: never allow legacy DB imageUrl to show waterheater/boiler on a Ferroli plug/reducer/nipple/kit/gasket
  const isFerroliAccessory =
    skuLower.startsWith("gi-ferroli-") && skuLower !== "gi-ferroli-004" &&
    !title.includes("vandens šildytuvas") && !title.includes("boileris")
  if (
    (existing.startsWith("/images/products/") ||
      existing.startsWith("/manufacturer-assets/") ||
      existing.startsWith("/studio-assets/")) &&
    existing.endsWith(".webp") &&
    !(isFerroliAccessory && (existing.includes("family-ferroli-waterheater.webp") || existing.includes("family-ferroli-boiler.webp")))
  ) {
    return existing
  }

  if (skuLower && EXACT_PHOTO_SKU_FILES[skuLower]) {
    return EXACT_PHOTO_SKU_FILES[skuLower]
  }

  // Brand-specific studio-cleaned fallbacks for newly imported Gilės Inžinerija & EGIP brands
  if (brand.includes("viessmann")) return "/images/products/giles-sk03485-9e215646.webp"
  if (brand.includes("buderus")) return "/images/products/giles-gb162-giles-inzinerija-3572b90f.webp"
  if (brand.includes("centrometal")) return "/images/products/giles-tb1-281955e9.webp"
  if (brand.includes("dražice") || brand.includes("drazice")) return "/images/products/giles-2110000-fa135952.webp"
  if (brand.includes("gorenje")) return "/images/products/giles-gbk-150-lnrn-56e35654.webp"
  if (brand.includes("wilo")) return "/images/products/giles-2543605-d624a36e.webp"
  if (brand.includes("grundfos")) return "/images/products/giles-alpha2-32-40-230v-pn10-88220ba9.webp"
  if (brand.includes("comisa")) return "/images/products/giles-8826005-e1409650886687-b0fa6b47.webp"
  if (brand.includes("sanha")) return "/images/products/giles-akle-j-80e6de5d.webp"
  if (brand.includes("watts")) return "/images/products/giles-wattsflow-ol1-a77a368f.webp"
  if (brand.includes("fv-plast")) return "/images/products/giles-1304432624242-ab6d3a1b.webp"
  if (brand.includes("wavin")) return "/images/products/giles-2160010061-4725ede0.webp"
  if (brand.includes("thermawool")) return "/images/products/giles-thermawool-giles-inzinerija-392ab0d4.webp"
  if (brand.includes("thermaflex")) return "/images/products/giles-thermacompact-is-s-giles-inzinerija-298e1b4e.webp"
  if (brand.includes("herz")) return "/images/products/giles-1213704-091350da.webp"
  if (brand.includes("rotex")) return "/images/products/giles-141577-rotex-b8d20881.webp"
  if (brand.includes("ferro") && !brand.includes("ferroli")) return "/images/products/giles-ban11-giles-inzinerija-467e2943.webp"
  if (brand.includes("zilmet")) return "/images/products/giles-hidro-96c5c72b.webp"
  if (brand.includes("junkers")) return "/images/products/giles-cmr757c1010-d429dad3.webp"
  if (brand.includes("megatherm")) return "/images/products/egip-degkmpl140mg20.webp"
  if (brand.includes("pelltech")) return "/images/products/egip-degkmpl140pv20.webp"
  if (brand.includes("haier")) return "/images/products/haier-2026-au082fycra-hw.webp"
  if (brand.includes("gilės inžinerija") || brand.includes("giles inzinerija")) return "/images/products/egip-katri3850020.webp"

  // 1. Ferroli family (Title-First: brackets, plugs/reducers/nipples/kits, water heaters, radiators, boilers)
  if (brand.includes("ferroli") || skuLower.startsWith("pol.") || skuLower.startsWith("gi-ferroli")) {
    if (title.includes("laikiklis") || title.includes("konsolė") || title.includes("tvirtinim") || skuLower === "gi-ferroli-004") {
      return "/images/products/family-mounting-bracket.webp"
    }
    if (
      title.includes("vandens šildytuvas") ||
      title.includes("vandens sildytuvas") ||
      title.includes("boileris") ||
      title.includes("akumuliacin")
    ) {
      return "/images/products/family-ferroli-waterheater.webp"
    }
    if (
      title.includes("aklė") ||
      title.includes("akle") ||
      title.includes("kamšt") ||
      title.includes("kamst") ||
      title.includes("perėjim") ||
      title.includes("perejim") ||
      title.includes("jungt") ||
      title.includes("nipel") ||
      title.includes("fiting") ||
      title.includes("komplekt") ||
      title.includes("tarpin") ||
      skuLower.startsWith("gi-ferroli-")
    ) {
      return "/images/products/family-brass-fitting.webp"
    }
    return "/images/products/family-ferroli-boiler.webp"
  }

  // 2. Brackets / consoles / mounting boxes across all brands
  if (
    title.includes("laikiklis") ||
    title.includes("konsolė") ||
    title.includes("tvirtinim") ||
    title.includes("montavimo dėžė") ||
    skuLower === "gi-automatika-002"
  ) {
    return "/images/products/family-mounting-bracket.webp"
  }

  // 3. Electro-thermal & motorized actuators (pavaros)
  if (
    title.includes("pavara") ||
    title.includes("pavaroms") ||
    title.includes("emo t") ||
    title.includes("emo ") ||
    title.includes("twa") ||
    title.includes("abn") ||
    title.includes("ta-slider") ||
    title.includes("ta-mc")
  ) {
    return "/images/products/family-actuator.webp"
  }

  // 4. Pipe fittings, compression couplings, threaded adapters
  if (
    category.includes("vamzdynų jungtys") ||
    title.includes("srieginis antgalis") ||
    title.includes("kūginė jungtis") ||
    title.includes("užspaudimo") ||
    title.includes("išorinis sriegis") ||
    title.includes("vidinis sriegis") ||
    title.includes("veržlė") ||
    title.includes("štuceris")
  ) {
    if (title.includes("globo")) {
      return "/images/products/0601-02.350.webp"
    }
    if (title.includes("kampinis adapteris") || skuLower.startsWith("013g13")) {
      return "/images/products/013g1350.webp"
    }
    return "/images/products/family-brass-fitting.webp"
  }

  // 5. IMI Pneumatex expansion vessels, pressurization & air/dirt separators
  if (brand.includes("pneumatex") || category.includes("plėtimosi") || category.includes("oro atskyrikliai")) {
    if (
      category.includes("oro atskyrikliai") ||
      title.includes("zeparo") ||
      title.includes("vento") ||
      title.includes("nuorint") ||
      title.includes("purvo") ||
      title.includes("atskyr")
    ) {
      return "/images/products/7895122.webp"
    }
    if (
      title.includes("compresso") ||
      title.includes("transfero") ||
      title.includes("simply") ||
      title.includes("pleno") ||
      title.includes("stotelė") ||
      title.includes("valdiklis") ||
      skuLower.startsWith("810")
    ) {
      return "/images/products/8101411.webp"
    }
    if (title.includes("aquapresso") || title.includes("geriamo") || skuLower.startsWith("711")) {
      return "/images/products/7111020.webp"
    }
    if (
      title.includes("statico sg") ||
      title.includes("1000") ||
      title.includes("1500") ||
      title.includes("2000") ||
      title.includes("800") ||
      title.includes("600") ||
      skuLower.startsWith("7102")
    ) {
      return "/images/products/7102015.webp"
    }
    if (title.includes(".10") || title.includes("10 bar") || skuLower.startsWith("7103")) {
      return "/images/products/7103003.webp"
    }
    return "/images/products/7101003.webp"
  }

  // 6. Floor heating manifolds & controllers (Grindinis šildymas ir kolektoriai)
  if (category.includes("grindinis šildymas") || title.includes("kolektori")) {
    if (brand.includes("danfoss") || skuLower.startsWith("088") || skuLower.startsWith("013g33")) {
      if (title.includes("valdiklis") || title.includes("icon") || skuLower.startsWith("088u")) {
        return "/images/products/088u0240.webp"
      }
      return "/images/products/013g3368.webp"
    }
    return "/images/products/9330-06.800.webp"
  }

  // 7. Boiler & room automation / thermostats (Katilinės automatika ir pavaros)
  if (category.includes("katilinės automatika") || title.includes("termostatas") || title.includes("valdiklis")) {
    if (title.includes("link hc") || title.includes("zonų") || skuLower.startsWith("014g01")) {
      return "/images/products/014g0100.webp"
    }
    if (title.includes("juodas") || skuLower.includes("1069")) {
      return "/images/products/140f1069.webp"
    }
    return "/images/products/140f1064.webp"
  }

  // 8. Balancing & control valves (Balansiniai ir reguliavimo vožtuvai)
  if (category.includes("balansiniai") || brand.includes("imi ta")) {
    if (
      title.includes("staf") ||
      title.includes("stag") ||
      title.includes("flanš") ||
      title.includes("dn 65") ||
      title.includes("dn 80") ||
      title.includes("dn 100") ||
      title.includes("dn 125") ||
      title.includes("dn 150") ||
      skuLower.startsWith("52-182")
    ) {
      return "/images/products/52-182-840.webp"
    }
    if (
      title.includes("tbv") ||
      title.includes("compact") ||
      title.includes("modulator") ||
      title.includes("ab-qm") ||
      title.includes("asv") ||
      skuLower.startsWith("52-133") ||
      skuLower.startsWith("52-134")
    ) {
      return "/images/products/52-133-215.webp"
    }
    if (brand.includes("heimeier") || title.includes("globo") || skuLower.startsWith("0601")) {
      return "/images/products/0601-02.350.webp"
    }
    if (title.includes("stad-c") || skuLower.startsWith("52-153")) {
      return "/images/products/52-153-020.webp"
    }
    return "/images/products/52-151-014.webp"
  }

  // 9. Radiators, H-blocks & return valves (Radiatoriai ir konvektoriai)
  if (category.includes("radiatoriai")) {
    if (title.includes("multilux") || title.includes("vekolux") || title.includes("vekotec")) {
      return "/images/products/0382-02.000.webp"
    }
    return "/images/products/0381-01.000.webp"
  }

  // 10. Thermostatic heads & valves (Termostatinės galvutės ir vožtuvai)
  if (brand.includes("heimeier")) {
    if (title.includes("eclipse") || skuLower.startsWith("393") || skuLower.startsWith("394")) {
      return "/images/products/3933-02.000.webp"
    }
    if (title.includes("calypso") || skuLower.startsWith("345")) {
      return "/images/products/3452-02.000.webp"
    }
    if (title.includes("raditec") || title.includes("regulux") || title.includes("regutec") || skuLower.startsWith("038")) {
      return "/images/products/0382-01.000.webp"
    }
    if (title.includes("galvutė") || title.includes("k-galvutė") || title.includes("halo")) {
      return "/images/products/013g2970.webp"
    }
    return "/images/products/3712-02.000.webp"
  }

  if (combined.includes("kapiliar") || combined.includes("distancin")) {
    return "/images/products/013g2992.webp"
  }
  if (combined.includes("ventili") || combined.includes("vožtuv")) {
    return "/images/products/3711-02.000.webp"
  }

  return "/images/products/013g2970.webp"
}

export function formatCleanCatalogProductTitle(
  title: string,
  sku?: string | null,
  brandName?: string | null,
): string {
  const cleanSku = (sku ?? "").trim()
  const skuUpper = cleanSku.toUpperCase()
  let raw = (title ?? "")
    .replace(/[\u00A9\u00AE\u2122]/g, "")
    .replace(/\u2014/g, "–")
    .trim()

  // Strip trailing marketing/application sentence after dash (e.g. " – tinka visiems...")
  raw = raw.replace(/\s+[—–-]\s+[^—–-]*\.\s*$/, "").trim()

  // Fix common wholesaler typos
  raw = raw
    .replace(/\bnerūdyjančio\s+pl\.(?:\s+plieno)?/gi, "nerūdijančio plieno")
    .replace(/\bnerūdijančio\s+pl\.(?:\s+plieno)?/gi, "nerūdijančio plieno")
    .replace(/\bnerūdyjančio\b/gi, "nerūdijančio plieno")
    .replace(/\bnerūdijančio\s+plieno\s+plieno\b/gi, "nerūdijančio plieno")
    .replace(/\bmatinimas\b/gi, "maitinimas")
    .replace(/\bdujinu\b/gi, "dujiniu")

  // Strip trailing " –" or " -" or "..." left at end of titles
  raw = raw.replace(/(?:\s+[—–-]|\s*…|\s*\.{3})+\s*$/, "").trim()

  // 1. Raw wholesaler description for Danfoss RA thermostatic sensor heads (013G2970, 013G2990, etc.)
  if (
    /^standartinis,?\s*įmontuotas\s+daviklis/i.test(raw) ||
    (/daviklis\s+su\s+dujin/i.test(raw) && (!skuUpper || skuUpper.startsWith("013G")))
  ) {
    const tempMatch = raw.match(/(\d+\s*[–-]\s*\d+)\s*°?\s*C/i)
    const tempRange = tempMatch
      ? `${tempMatch[1].replace(/\s*[–-]\s*/g, "–").replace(/\s+/g, "")} °C`
      : "5–21 °C"
    const modelDigits = skuUpper.match(/^013G(\d{4})$/)?.[1]
    const modelLabel = modelDigits ? `RA ${modelDigits}` : skuUpper ? `RA ${skuUpper}` : "RA 2970"
    return `Danfoss ${modelLabel} termostatinė galvutė (${tempRange})`
  }

  // 2. Raw English IMI TA STAD / STAF balancing valve titles
  if (
    /\bstad\b.*\bbal(?:\.|ancing)?\s*valve\b/i.test(raw) ||
    /\bbal\.?\s*valve\s+balancing\s+pre-setting/i.test(raw) ||
    /stad\s+bal\.valve/i.test(raw)
  ) {
    const dnMatch = raw.match(/\b(DN\s*\d+)/i)
    const dn = dnMatch ? dnMatch[1].replace(/\s+/g, "").toUpperCase() : null
    const threadMatch = raw.match(/\b([GR]\s*\d+(?:\/\d+)?)\b/i)
    const thread = threadMatch ? threadMatch[1].replace(/\s+/g, "").toUpperCase() : null
    const pnMatch = raw.match(/\b(PN\s*\d+)\b/i)
    const pn = pnMatch ? pnMatch[1].replace(/\s+/g, "").toUpperCase() : null
    const suffixParts = [thread, pn].filter(Boolean)
    return `IMI TA STAD${dn ? ` ${dn}` : ""} balansinis vožtuvas${suffixParts.length > 0 ? ` (${suffixParts.join(", ")})` : ""}`
  }

  if (/\bstaf\b.*\bbal(?:\.|ancing)?\s*valve\b/i.test(raw)) {
    const dnMatch = raw.match(/\b(DN\s*\d+)/i)
    const dn = dnMatch ? dnMatch[1].replace(/\s+/g, "").toUpperCase() : null
    const pnMatch = raw.match(/\b(PN\s*\d+)\b/i)
    const pn = pnMatch ? pnMatch[1].replace(/\s+/g, "").toUpperCase() : null
    return `IMI TA STAF${dn ? ` ${dn}` : ""} flanšinis balansinis vožtuvas${pn ? ` (${pn})` : ""}`
  }

  // 3. Bare "RA ventilio korpusas" fragment
  if (/^ra\s+ventilio\s+korpusas$/i.test(raw)) {
    return `Danfoss RA-N termostatinio vožtuvo korpusas${cleanSku ? ` (${cleanSku})` : ""}`
  }

  // 4. Raw German IMI Pneumatex Zubehör-DSV mounting console / valve titles
  if (/^zubeh[oö]r[- ]*dsv\b/i.test(raw)) {
    const cleanedSpec = raw
      .replace(/^zubeh[oö]r[- ]*/i, "")
      .replace(/\s+[–-]\s+\S+$/, "")
      .trim()
    return `IMI Pneumatex ${cleanedSpec} tvirtinimo konsolė ir montavimo mazgas Statico indams${cleanSku ? ` – ${cleanSku}` : ""}`
  }

  if (!raw) {
    const resolvedBrand = (brandName ?? "").trim()
    if (resolvedBrand && cleanSku) return `${resolvedBrand} ŠVOK komponentas (${cleanSku})`
    return cleanSku ? `ŠVOK komponentas (${cleanSku})` : "ŠVOK komponentas"
  }

  return raw
}
