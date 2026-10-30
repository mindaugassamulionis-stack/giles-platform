import crypto from 'node:crypto';

export type BalticCarrierId = 'omniva' | 'dpd' | 'lp_express' | 'venipak';

export interface BalticParcelTerminal {
    code: string;
    carrier: BalticCarrierId;
    carrierLabel: 'Omniva' | 'DPD Pickup' | 'LP Express' | 'Venipak';
    name: string;
    city: string;
    address: string;
    postalCode: string;
    hours: string;
}

export const BALTIC_CARRIER_OPTIONS: ReadonlyArray<{
    id: BalticCarrierId;
    label: BalticParcelTerminal['carrierLabel'];
    maxWeightKg: number;
}> = [
    { id: 'omniva', label: 'Omniva', maxWeightKg: 30 },
    { id: 'dpd', label: 'DPD Pickup', maxWeightKg: 31.5 },
    { id: 'lp_express', label: 'LP Express', maxWeightKg: 30 },
    { id: 'venipak', label: 'Venipak', maxWeightKg: 30 },
] as const;

export const BALTIC_PARCEL_TERMINALS: readonly BalticParcelTerminal[] = [
    // KAUNAS (16 terminals across Omniva, DPD Pickup, LP Express, Venipak)
    {
        code: 'LT-OMN-KAU-001',
        carrier: 'omniva',
        carrierLabel: 'Omniva',
        name: 'Kauno Hyper Maxima paštomatas',
        city: 'Kaunas',
        address: 'Kauno Hyper Maxima Savanorių pr. 255',
        postalCode: 'LT-50150',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-OMN-KAU-002',
        carrier: 'omniva',
        carrierLabel: 'Omniva',
        name: 'Kauno Akropolis paštomatas',
        city: 'Kaunas',
        address: 'Kauno Akropolis Karaliaus Mindaugo pr. 49',
        postalCode: 'LT-44333',
        hours: '08:00–22:00',
    },
    {
        code: 'LT-OMN-KAU-003',
        carrier: 'omniva',
        carrierLabel: 'Omniva',
        name: 'Kauno Mega paštomatas',
        city: 'Kaunas',
        address: 'Kauno Mega Islandijos pl. 32',
        postalCode: 'LT-47446',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-OMN-KAU-004',
        carrier: 'omniva',
        carrierLabel: 'Omniva',
        name: 'Kauno Eigulių IKI paštomatas',
        city: 'Kaunas',
        address: 'Kauno Eigulių IKI Ukmergės g. 36',
        postalCode: 'LT-49406',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-OMN-KAU-005',
        carrier: 'omniva',
        carrierLabel: 'Omniva',
        name: 'Kauno Draugystės Senukai paštomatas',
        city: 'Kaunas',
        address: 'Kauno Draugystės Senukai Draugystės g. 8C',
        postalCode: 'LT-51264',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-DPD-KAU-001',
        carrier: 'dpd',
        carrierLabel: 'DPD Pickup',
        name: 'DPD Pickup Kauno Hyper Maxima',
        city: 'Kaunas',
        address: 'Kauno Hyper Maxima Savanorių pr. 255',
        postalCode: 'LT-50150',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-DPD-KAU-002',
        carrier: 'dpd',
        carrierLabel: 'DPD Pickup',
        name: 'DPD Pickup Kauno Akropolis',
        city: 'Kaunas',
        address: 'Kauno Akropolis Karaliaus Mindaugo pr. 49',
        postalCode: 'LT-44333',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-DPD-KAU-003',
        carrier: 'dpd',
        carrierLabel: 'DPD Pickup',
        name: 'DPD Pickup Kauno Mega',
        city: 'Kaunas',
        address: 'Kauno Mega Islandijos pl. 32',
        postalCode: 'LT-47446',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-DPD-KAU-004',
        carrier: 'dpd',
        carrierLabel: 'DPD Pickup',
        name: 'DPD Pickup Kauno Eigulių IKI',
        city: 'Kaunas',
        address: 'Kauno Eigulių IKI Ukmergės g. 36',
        postalCode: 'LT-49406',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-LP-KAU-001',
        carrier: 'lp_express',
        carrierLabel: 'LP Express',
        name: 'LP Express Kauno Hyper Maxima',
        city: 'Kaunas',
        address: 'Kauno Hyper Maxima Savanorių pr. 255',
        postalCode: 'LT-50150',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-LP-KAU-002',
        carrier: 'lp_express',
        carrierLabel: 'LP Express',
        name: 'LP Express Kauno Draugystės Senukai',
        city: 'Kaunas',
        address: 'Kauno Draugystės Senukai Draugystės g. 8C',
        postalCode: 'LT-51264',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-LP-KAU-003',
        carrier: 'lp_express',
        carrierLabel: 'LP Express',
        name: 'LP Express Kauno Pramonės Maxima',
        city: 'Kaunas',
        address: 'Pramonės pr. 29',
        postalCode: 'LT-51270',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-LP-KAU-004',
        carrier: 'lp_express',
        carrierLabel: 'LP Express',
        name: 'LP Express Kauno Raudondvario pl. Lidl',
        city: 'Kaunas',
        address: 'Raudondvario pl. 94B',
        postalCode: 'LT-47180',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-VNP-KAU-001',
        carrier: 'venipak',
        carrierLabel: 'Venipak',
        name: 'Venipak Kauno Eigulių IKI paštomatas',
        city: 'Kaunas',
        address: 'Kauno Eigulių IKI Ukmergės g. 36',
        postalCode: 'LT-49406',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-VNP-KAU-002',
        carrier: 'venipak',
        carrierLabel: 'Venipak',
        name: 'Venipak Kauno Draugystės Senukai paštomatas',
        city: 'Kaunas',
        address: 'Kauno Draugystės Senukai Draugystės g. 8C',
        postalCode: 'LT-51264',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-VNP-KAU-003',
        carrier: 'venipak',
        carrierLabel: 'Venipak',
        name: 'Venipak Kauno Aleksoto Rimi paštomatas',
        city: 'Kaunas',
        address: 'Veiverių g. 150B',
        postalCode: 'LT-46391',
        hours: '00:00–24:00',
    },

    // VILNIUS (10 terminals)
    {
        code: 'LT-OMN-VLN-001',
        carrier: 'omniva',
        carrierLabel: 'Omniva',
        name: 'Vilniaus Akropolis Ozo paštomatas',
        city: 'Vilnius',
        address: 'Ozo g. 25',
        postalCode: 'LT-07150',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-OMN-VLN-002',
        carrier: 'omniva',
        carrierLabel: 'Omniva',
        name: 'Vilniaus Ukmergės Senukai paštomatas',
        city: 'Vilnius',
        address: 'Ukmergės g. 244',
        postalCode: 'LT-07160',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-OMN-VLN-003',
        carrier: 'omniva',
        carrierLabel: 'Omniva',
        name: 'Vilniaus Mindaugo Maxima paštomatas',
        city: 'Vilnius',
        address: 'Mindaugo g. 11',
        postalCode: 'LT-03225',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-DPD-VLN-001',
        carrier: 'dpd',
        carrierLabel: 'DPD Pickup',
        name: 'DPD Pickup Vilniaus Ozas',
        city: 'Vilnius',
        address: 'Ozo g. 18',
        postalCode: 'LT-08243',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-DPD-VLN-002',
        carrier: 'dpd',
        carrierLabel: 'DPD Pickup',
        name: 'DPD Pickup Vilniaus Panorama',
        city: 'Vilnius',
        address: 'Saltoniškių g. 9',
        postalCode: 'LT-08105',
        hours: '08:00–22:00',
    },
    {
        code: 'LT-DPD-VLN-003',
        carrier: 'dpd',
        carrierLabel: 'DPD Pickup',
        name: 'DPD Pickup Vilniaus Žirmūnų Rimi',
        city: 'Vilnius',
        address: 'Žirmūnų g. 64',
        postalCode: 'LT-09131',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-LP-VLN-001',
        carrier: 'lp_express',
        carrierLabel: 'LP Express',
        name: 'LP Express Vilniaus Akropolis',
        city: 'Vilnius',
        address: 'Ozo g. 25',
        postalCode: 'LT-07150',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-LP-VLN-002',
        carrier: 'lp_express',
        carrierLabel: 'LP Express',
        name: 'LP Express Vilniaus Savanorių Rimi',
        city: 'Vilnius',
        address: 'Kedrų g. 4',
        postalCode: 'LT-03116',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-VNP-VLN-001',
        carrier: 'venipak',
        carrierLabel: 'Venipak',
        name: 'Venipak Vilniaus Pilaitės Pupojos paštomatas',
        city: 'Vilnius',
        address: 'Vydūno g. 4',
        postalCode: 'LT-06204',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-VNP-VLN-002',
        carrier: 'venipak',
        carrierLabel: 'Venipak',
        name: 'Venipak Vilniaus Antakalnio IKI paštomatas',
        city: 'Vilnius',
        address: 'Nemenčinės pl. 2',
        postalCode: 'LT-10102',
        hours: '00:00–24:00',
    },

    // KLAIPĖDA (6 terminals)
    {
        code: 'LT-OMN-KLP-001',
        carrier: 'omniva',
        carrierLabel: 'Omniva',
        name: 'Klaipėdos Akropolis paštomatas',
        city: 'Klaipėda',
        address: 'Taikos pr. 61',
        postalCode: 'LT-91182',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-OMN-KLP-002',
        carrier: 'omniva',
        carrierLabel: 'Omniva',
        name: 'Klaipėdos Banginis Senukai paštomatas',
        city: 'Klaipėda',
        address: 'Šilutės pl. 35',
        postalCode: 'LT-94105',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-DPD-KLP-001',
        carrier: 'dpd',
        carrierLabel: 'DPD Pickup',
        name: 'DPD Pickup Klaipėdos BIG',
        city: 'Klaipėda',
        address: 'Taikos pr. 139',
        postalCode: 'LT-94284',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-LP-KLP-001',
        carrier: 'lp_express',
        carrierLabel: 'LP Express',
        name: 'LP Express Klaipėdos Liepojos Maxima',
        city: 'Klaipėda',
        address: 'Liepojos g. 10',
        postalCode: 'LT-92296',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-VNP-KLP-001',
        carrier: 'venipak',
        carrierLabel: 'Venipak',
        name: 'Venipak Klaipėdos Taikos Norfa paštomatas',
        city: 'Klaipėda',
        address: 'Taikos pr. 115',
        postalCode: 'LT-94230',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-VNP-KLP-002',
        carrier: 'venipak',
        carrierLabel: 'Venipak',
        name: 'Venipak Klaipėdos Šilutės IKI paštomatas',
        city: 'Klaipėda',
        address: 'Šilutės pl. 68',
        postalCode: 'LT-94217',
        hours: '00:00–24:00',
    },

    // ŠIAULIAI (5 terminals)
    {
        code: 'LT-OMN-SIA-001',
        carrier: 'omniva',
        carrierLabel: 'Omniva',
        name: 'Šiaulių Akropolis paštomatas',
        city: 'Šiauliai',
        address: 'Aido g. 8',
        postalCode: 'LT-78258',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-DPD-SIA-001',
        carrier: 'dpd',
        carrierLabel: 'DPD Pickup',
        name: 'DPD Pickup Šiaulių Saulės Miestas',
        city: 'Šiauliai',
        address: 'Tilžės g. 109',
        postalCode: 'LT-77159',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-LP-SIA-001',
        carrier: 'lp_express',
        carrierLabel: 'LP Express',
        name: 'LP Express Šiaulių Pramonės Senukai',
        city: 'Šiauliai',
        address: 'Pramonės g. 6',
        postalCode: 'LT-78148',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-VNP-SIA-001',
        carrier: 'venipak',
        carrierLabel: 'Venipak',
        name: 'Venipak Šiaulių Gegužių Rimi paštomatas',
        city: 'Šiauliai',
        address: 'Gegužių g. 30',
        postalCode: 'LT-78346',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-OMN-SIA-002',
        carrier: 'omniva',
        carrierLabel: 'Omniva',
        name: 'Šiaulių Tilžės Maxima paštomatas',
        city: 'Šiauliai',
        address: 'Tilžės g. 225',
        postalCode: 'LT-76200',
        hours: '00:00–24:00',
    },

    // PANEVĖŽYS (5 terminals)
    {
        code: 'LT-OMN-PNV-001',
        carrier: 'omniva',
        carrierLabel: 'Omniva',
        name: 'Panevėžio RYO paštomatas',
        city: 'Panevėžys',
        address: 'Savitiškio g. 61',
        postalCode: 'LT-37190',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-DPD-PNV-001',
        carrier: 'dpd',
        carrierLabel: 'DPD Pickup',
        name: 'DPD Pickup Panevėžio Babilonas',
        city: 'Panevėžys',
        address: 'Klaipėdos g. 143A',
        postalCode: 'LT-37371',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-LP-PNV-001',
        carrier: 'lp_express',
        carrierLabel: 'LP Express',
        name: 'LP Express Panevėžio Ukmergės Maxima',
        city: 'Panevėžys',
        address: 'Ukmergės g. 23',
        postalCode: 'LT-35177',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-VNP-PNV-001',
        carrier: 'venipak',
        carrierLabel: 'Venipak',
        name: 'Venipak Panevėžio Darbo Senukai paštomatas',
        city: 'Panevėžys',
        address: 'Darbo a. 7',
        postalCode: 'LT-35216',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-OMN-PNV-002',
        carrier: 'omniva',
        carrierLabel: 'Omniva',
        name: 'Panevėžio Smėlynės Norfa paštomatas',
        city: 'Panevėžys',
        address: 'Smėlynės g. 85',
        postalCode: 'LT-35112',
        hours: '00:00–24:00',
    },

    // ALYTUS (3 terminals)
    {
        code: 'LT-OMN-ALY-001',
        carrier: 'omniva',
        carrierLabel: 'Omniva',
        name: 'Alytaus Naujoji Maxima paštomatas',
        city: 'Alytus',
        address: 'Naujoji g. 90',
        postalCode: 'LT-62388',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-DPD-ALY-001',
        carrier: 'dpd',
        carrierLabel: 'DPD Pickup',
        name: 'DPD Pickup Alytaus Santaikos Maxima',
        city: 'Alytus',
        address: 'Santaikos g. 34G',
        postalCode: 'LT-62123',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-LP-ALY-001',
        carrier: 'lp_express',
        carrierLabel: 'LP Express',
        name: 'LP Express Alytaus Jazminų IKI',
        city: 'Alytus',
        address: 'Jazminų g. 32',
        postalCode: 'LT-63173',
        hours: '00:00–24:00',
    },

    // MARIJAMPOLĖ (3 terminals)
    {
        code: 'LT-OMN-MRJ-001',
        carrier: 'omniva',
        carrierLabel: 'Omniva',
        name: 'Marijampolės Bažnyčios Maxima paštomatas',
        city: 'Marijampolė',
        address: 'V. Kudirkos g. 3',
        postalCode: 'LT-68176',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-DPD-MRJ-001',
        carrier: 'dpd',
        carrierLabel: 'DPD Pickup',
        name: 'DPD Pickup Marijampolės Dariaus ir Girėno Senukai',
        city: 'Marijampolė',
        address: 'Dariaus ir Girėno g. 3A',
        postalCode: 'LT-68176',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-VNP-MRJ-001',
        carrier: 'venipak',
        carrierLabel: 'Venipak',
        name: 'Venipak Marijampolės Sporto Norfa paštomatas',
        city: 'Marijampolė',
        address: 'Sporto g. 50',
        postalCode: 'LT-68110',
        hours: '00:00–24:00',
    },

    // UTENA (2 terminals)
    {
        code: 'LT-OMN-UTN-001',
        carrier: 'omniva',
        carrierLabel: 'Omniva',
        name: 'Utenos Aušros Maxima paštomatas',
        city: 'Utena',
        address: 'Aušros g. 78',
        postalCode: 'LT-28150',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-LP-UTN-001',
        carrier: 'lp_express',
        carrierLabel: 'LP Express',
        name: 'LP Express Utenos Basanavičiaus Senukai',
        city: 'Utena',
        address: 'J. Basanavičiaus g. 52',
        postalCode: 'LT-28142',
        hours: '00:00–24:00',
    },

    // TELŠIAI (2 terminals)
    {
        code: 'LT-OMN-TLS-001',
        carrier: 'omniva',
        carrierLabel: 'Omniva',
        name: 'Telšių Luokės Norfa paštomatas',
        city: 'Telšiai',
        address: 'Luokės g. 74',
        postalCode: 'LT-87142',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-DPD-TLS-001',
        carrier: 'dpd',
        carrierLabel: 'DPD Pickup',
        name: 'DPD Pickup Telšių Žemaitės Maxima',
        city: 'Telšiai',
        address: 'Žemaitės g. 35',
        postalCode: 'LT-87133',
        hours: '00:00–24:00',
    },

    // TAURAGĖ (2 terminals)
    {
        code: 'LT-OMN-TRG-001',
        carrier: 'omniva',
        carrierLabel: 'Omniva',
        name: 'Tauragės Dariaus ir Girėno Maxima paštomatas',
        city: 'Tauragė',
        address: 'Dariaus ir Girėno g. 63',
        postalCode: 'LT-72209',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-LP-TRG-001',
        carrier: 'lp_express',
        carrierLabel: 'LP Express',
        name: 'LP Express Tauragės Gedimino Norfa',
        city: 'Tauragė',
        address: 'Gedimino g. 28',
        postalCode: 'LT-72266',
        hours: '00:00–24:00',
    },

    // DRUSKININKAI (2 terminals)
    {
        code: 'LT-OMN-DRS-001',
        carrier: 'omniva',
        carrierLabel: 'Omniva',
        name: 'Druskininkų Čiurlionio Maxima paštomatas',
        city: 'Druskininkai',
        address: 'M. K. Čiurlionio g. 99',
        postalCode: 'LT-66161',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-DPD-DRS-001',
        carrier: 'dpd',
        carrierLabel: 'DPD Pickup',
        name: 'DPD Pickup Druskininkų Veisiejų IKI',
        city: 'Druskininkai',
        address: 'Veisiejų g. 19',
        postalCode: 'LT-66209',
        hours: '00:00–24:00',
    },

    // MAŽEIKIAI (2 terminals)
    {
        code: 'LT-OMN-MZK-001',
        carrier: 'omniva',
        carrierLabel: 'Omniva',
        name: 'Mažeikių Eiffel paštomatas',
        city: 'Mažeikiai',
        address: 'Žemaitijos g. 72',
        postalCode: 'LT-89226',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-VNP-MZK-001',
        carrier: 'venipak',
        carrierLabel: 'Venipak',
        name: 'Venipak Mažeikių Ventos IKI paštomatas',
        city: 'Mažeikiai',
        address: 'Ventos g. 23',
        postalCode: 'LT-89112',
        hours: '00:00–24:00',
    },

    // JONAVA (2 terminals)
    {
        code: 'LT-OMN-JNV-001',
        carrier: 'omniva',
        carrierLabel: 'Omniva',
        name: 'Jonavos Žeimių Norfa paštomatas',
        city: 'Jonava',
        address: 'Žeimių g. 26A',
        postalCode: 'LT-55111',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-LP-JNV-001',
        carrier: 'lp_express',
        carrierLabel: 'LP Express',
        name: 'LP Express Jonavos Plento Maxima',
        city: 'Jonava',
        address: 'Plento g. 3',
        postalCode: 'LT-55196',
        hours: '00:00–24:00',
    },

    // KĖDAINIAI (2 terminals)
    {
        code: 'LT-OMN-KED-001',
        carrier: 'omniva',
        carrierLabel: 'Omniva',
        name: 'Kėdainių Basanavičiaus Maxima paštomatas',
        city: 'Kėdainiai',
        address: 'J. Basanavičiaus g. 93',
        postalCode: 'LT-57352',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-DPD-KED-001',
        carrier: 'dpd',
        carrierLabel: 'DPD Pickup',
        name: 'DPD Pickup Kėdainių Tilto Norfa',
        city: 'Kėdainiai',
        address: 'Tilto g. 2',
        postalCode: 'LT-57183',
        hours: '00:00–24:00',
    },

    // KAZLŲ RŪDA (2 terminals)
    {
        code: 'LT-OMN-KZR-001',
        carrier: 'omniva',
        carrierLabel: 'Omniva',
        name: 'Kazlų Rūdos Maironio Maxima paštomatas',
        city: 'Kazlų Rūda',
        address: 'Maironio g. 32',
        postalCode: 'LT-69406',
        hours: '00:00–24:00',
    },
    {
        code: 'LT-LP-KZR-001',
        carrier: 'lp_express',
        carrierLabel: 'LP Express',
        name: 'LP Express Kazlų Rūdos S. Daukanto IKI',
        city: 'Kazlų Rūda',
        address: 'S. Daukanto g. 19',
        postalCode: 'LT-69430',
        hours: '00:00–24:00',
    },
] as const;

function stripDiacritics(input: string): string {
    return input
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

export function normalizeCarrierId(
    carrier?: string | null,
): BalticCarrierId | 'all' {
    const raw = stripDiacritics(String(carrier || 'all').trim());
    if (!raw || raw === 'all' || raw === 'visi') return 'all';
    if (raw.includes('omniva') || raw === 'omn') return 'omniva';
    if (raw.includes('dpd')) return 'dpd';
    if (raw.includes('lp') || raw.includes('express') || raw.includes('lietuvos pastas')) {
        return 'lp_express';
    }
    if (raw.includes('venipak') || raw === 'vnp') return 'venipak';
    return 'all';
}

export function searchParcelTerminals(
    carrier: string = 'all',
    query: string = '',
): BalticParcelTerminal[] {
    const normalizedCarrier = normalizeCarrierId(carrier);
    const normalizedQuery = stripDiacritics(String(query || '').trim());
    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

    return BALTIC_PARCEL_TERMINALS.filter((terminal) => {
        if (normalizedCarrier !== 'all' && terminal.carrier !== normalizedCarrier) {
            return false;
        }
        if (tokens.length === 0) {
            return true;
        }
        const haystack = stripDiacritics(
            `${terminal.code} ${terminal.carrierLabel} ${terminal.city} ${terminal.name} ${terminal.address} ${terminal.postalCode}`,
        );
        return tokens.every((tok) => haystack.includes(tok));
    });
}

// ============================================================================
// 2. Cryptographic Payment Signers & Webhook Verifiers
// ============================================================================

export interface MontonioOrderPayload {
    accessKey: string;
    merchantReference: string;
    grandTotal: number;
    currency: 'EUR';
    notificationUrl: string;
    returnUrl: string;
    paymentStatus?: 'PENDING' | 'PAID' | 'VOIDED' | 'ABANDONED';
    lineItems?: Array<{
        name: string;
        quantity: number;
        finalPrice: number;
    }>;
    iat?: number;
    exp?: number;
}

function timingSafeCompareStrings(a: string, b: string): boolean {
    const bufA = Buffer.from(String(a || ''), 'utf8');
    const bufB = Buffer.from(String(b || ''), 'utf8');
    if (bufA.length !== bufB.length || bufA.length === 0) {
        return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Builds an RFC 7519 HS256 signed JWT for Montonio v2 orders & webhook callbacks.
 */
export function createMontonioOrderJwt(
    payload: MontonioOrderPayload,
    secretKey: string = process.env.MONTONIO_SECRET_KEY || 'giles_montonio_default_secret_2026',
): string {
    const nowSec = Math.floor(Date.now() / 1000);
    const header = { alg: 'HS256', typ: 'JWT' };
    const fullPayload: MontonioOrderPayload = {
        ...payload,
        currency: 'EUR',
        grandTotal: Math.round(Number(payload.grandTotal) * 100) / 100,
        iat: payload.iat ?? nowSec,
        exp: payload.exp ?? nowSec + 3600,
    };

    const encodedHeader = Buffer.from(JSON.stringify(header), 'utf8').toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(fullPayload), 'utf8').toString('base64url');
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const signature = crypto
        .createHmac('sha256', secretKey)
        .update(signingInput, 'utf8')
        .digest('base64url');

    return `${signingInput}.${signature}`;
}

export function verifyMontonioWebhookJwt(
    token: string,
    secretKey: string = process.env.MONTONIO_SECRET_KEY || 'giles_montonio_default_secret_2026',
): { valid: boolean; payload?: MontonioOrderPayload; error?: string } {
    if (!token || typeof token !== 'string') {
        return { valid: false, error: 'Missing Montonio JWT token' };
    }
    const parts = token.trim().split('.');
    if (parts.length !== 3) {
        return { valid: false, error: 'Malformed Montonio JWT structure' };
    }
    const [encodedHeader, encodedPayload, signature] = parts;
    if (!encodedHeader || !encodedPayload || !signature) {
        return { valid: false, error: 'Empty Montonio JWT segment' };
    }

    try {
        const header = JSON.parse(
            Buffer.from(encodedHeader, 'base64url').toString('utf8'),
        ) as { alg?: string };
        if (header.alg !== 'HS256') {
            return { valid: false, error: 'Unsupported Montonio JWT algorithm' };
        }

        const expectedSignature = crypto
            .createHmac('sha256', secretKey)
            .update(`${encodedHeader}.${encodedPayload}`, 'utf8')
            .digest('base64url');

        if (!timingSafeCompareStrings(signature, expectedSignature)) {
            return { valid: false, error: 'Invalid Montonio JWT HMAC-SHA256 signature' };
        }

        const payload = JSON.parse(
            Buffer.from(encodedPayload, 'base64url').toString('utf8'),
        ) as MontonioOrderPayload;

        const nowSec = Math.floor(Date.now() / 1000);
        if (typeof payload.exp === 'number' && payload.exp < nowSec - 60) {
            return { valid: false, error: 'Expired Montonio JWT token' };
        }

        return { valid: true, payload };
    } catch {
        return { valid: false, error: 'Failed to decode Montonio JWT payload' };
    }
}

export interface PayseraOrderParams {
    projectid: string;
    orderid: string;
    amount: number; // in cents
    currency: 'EUR';
    callbackurl: string;
    accepturl: string;
    cancelurl: string;
    status?: string;
    version?: string;
}

/**
 * Builds Paysera WebToPay URL-safe Base64 `data` + `sign` (MD5(data + signPassword)) + `hmacSignature` (HMAC-SHA256).
 */
export function createPayseraSignedPayload(
    params: PayseraOrderParams,
    signPassword: string = process.env.PAYSERA_SIGN_PASSWORD || 'giles_paysera_default_secret_2026',
): {
    data: string;
    sign: string;
    hmacSignature: string;
} {
    const query = new URLSearchParams({
        projectid: String(params.projectid),
        orderid: String(params.orderid),
        amount: String(Math.round(Number(params.amount))),
        currency: params.currency || 'EUR',
        callbackurl: params.callbackurl,
        accepturl: params.accepturl,
        cancelurl: params.cancelurl,
        version: params.version || '1.6',
        ...(params.status ? { status: String(params.status) } : {}),
    }).toString();

    const data = Buffer.from(query, 'utf8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    const sign = crypto
        .createHash('md5')
        .update(`${data}${signPassword}`, 'utf8')
        .digest('hex');

    const hmacSignature = crypto
        .createHmac('sha256', signPassword)
        .update(data, 'utf8')
        .digest('hex');

    return { data, sign, hmacSignature };
}

export function verifyPayseraCallback(
    input: {
        data?: string;
        ss1?: string;
        ss2?: string;
        sign?: string;
    },
    signPassword: string = process.env.PAYSERA_SIGN_PASSWORD || 'giles_paysera_default_secret_2026',
): {
    valid: boolean;
    params?: Record<string, string>;
    error?: string;
} {
    const data = String(input?.data || '').trim();
    if (!data) {
        return { valid: false, error: 'Missing Paysera data parameter' };
    }

    const expectedMd5 = crypto
        .createHash('md5')
        .update(`${data}${signPassword}`, 'utf8')
        .digest('hex');
    const expectedHmac = crypto
        .createHmac('sha256', signPassword)
        .update(data, 'utf8')
        .digest('hex');

    const candidateMd5 = String(input.ss1 || input.sign || '').trim().toLowerCase();
    const candidateHmac = String(input.ss2 || '').trim().toLowerCase();

    const md5Valid = candidateMd5
        ? timingSafeCompareStrings(candidateMd5, expectedMd5)
        : false;
    const hmacValid = candidateHmac
        ? timingSafeCompareStrings(candidateHmac, expectedHmac)
        : false;

    if (!md5Valid && !hmacValid) {
        return { valid: false, error: 'Invalid Paysera callback signature' };
    }

    if (candidateMd5 && !md5Valid) {
        return { valid: false, error: 'Invalid Paysera ss1 MD5 signature' };
    }
    if (candidateHmac && !hmacValid) {
        return { valid: false, error: 'Invalid Paysera ss2 HMAC-SHA256 signature' };
    }

    try {
        const standardBase64 = data.replace(/-/g, '+').replace(/_/g, '/');
        const decodedQuery = Buffer.from(standardBase64, 'base64').toString('utf8');
        const searchParams = new URLSearchParams(decodedQuery);
        const params: Record<string, string> = {};
        for (const [k, v] of searchParams.entries()) {
            params[k] = v;
        }
        return { valid: true, params };
    } catch {
        return { valid: false, error: 'Failed to decode Paysera data payload' };
    }
}

export function createStripeWebhookSignature(
    rawBody: string,
    webhookSecret: string = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_giles_default_secret_2026',
    timestampSeconds: number = Math.floor(Date.now() / 1000),
): string {
    const signedPayload = `${timestampSeconds}.${rawBody}`;
    const v1 = crypto
        .createHmac('sha256', webhookSecret)
        .update(signedPayload, 'utf8')
        .digest('hex');
    return `t=${timestampSeconds},v1=${v1}`;
}

export function verifyStripeWebhookSignature(
    rawBody: string,
    signatureHeader: string,
    webhookSecret: string = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_giles_default_secret_2026',
    toleranceSeconds: number = 300,
    nowSeconds: number = Math.floor(Date.now() / 1000),
): { valid: boolean; timestamp?: number; error?: string } {
    if (!signatureHeader || typeof signatureHeader !== 'string') {
        return { valid: false, error: 'Missing Stripe-Signature header' };
    }

    const pairs = signatureHeader.split(',').map((part) => part.trim());
    let timestampStr = '';
    const v1Signatures: string[] = [];

    for (const pair of pairs) {
        const [k, v] = pair.split('=');
        if (k === 't' && v) timestampStr = v;
        if (k === 'v1' && v) v1Signatures.push(v);
    }

    const timestamp = Number(timestampStr);
    if (!Number.isFinite(timestamp) || timestamp <= 0 || v1Signatures.length === 0) {
        return { valid: false, error: 'Malformed Stripe-Signature header' };
    }

    if (Math.abs(nowSeconds - timestamp) > toleranceSeconds) {
        return {
            valid: false,
            error: 'Stripe webhook timestamp outside replay tolerance window',
        };
    }

    const expectedV1 = crypto
        .createHmac('sha256', webhookSecret)
        .update(`${timestamp}.${rawBody}`, 'utf8')
        .digest('hex');

    const matched = v1Signatures.some((sig) =>
        timingSafeCompareStrings(sig.toLowerCase(), expectedV1.toLowerCase()),
    );
    if (!matched) {
        return { valid: false, error: 'Invalid Stripe HMAC-SHA256 signature' };
    }

    return { valid: true, timestamp };
}

// ============================================================================
// 3. Paid Webhook Order Ledger
// ============================================================================

export interface PaidWebhookOrderEntry {
    orderId: string;
    provider: 'montonio' | 'paysera' | 'stripe';
    amountEur?: number;
    paidAt: string;
}

const paidWebhookOrdersLedger: PaidWebhookOrderEntry[] = [];

export function recordPaidWebhookOrder(entry: PaidWebhookOrderEntry): void {
    const existingIdx = paidWebhookOrdersLedger.findIndex(
        (item) => item.orderId.toLowerCase() === entry.orderId.toLowerCase(),
    );
    if (existingIdx >= 0) {
        paidWebhookOrdersLedger[existingIdx] = entry;
    } else {
        paidWebhookOrdersLedger.unshift(entry);
    }
}

export function getPaidWebhookOrders(): PaidWebhookOrderEntry[] {
    return [...paidWebhookOrdersLedger];
}

export function resetPaidWebhookOrders(): void {
    paidWebhookOrdersLedger.length = 0;
}

// ============================================================================
// 4. A6 (105x148 mm) Carrier Shipping Label & Code-128 SVG Barcode Generator
// ============================================================================

export interface A6ShippingLabelInput {
    orderId: string;
    carrier?: string;
    terminalCode?: string;
    recipientName?: string;
    recipientPhone?: string;
    recipientAddress?: string;
    weightKg?: number;
}

export interface A6ShippingLabelResult {
    orderId: string;
    carrier: BalticCarrierId;
    carrierLabel: string;
    terminalCode: string;
    terminalName: string;
    terminalAddress: string;
    terminalCity: string;
    terminalPostalCode: string;
    trackingNumber: string;
    sender: string;
    recipientName: string;
    recipientPhone: string;
    weightKg: number;
    dimensionsMm: '105x148';
    svg: string;
    html: string;
}

function escapeXml(input: string): string {
    return String(input || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderCode128BarsSvg(codeText: string): string {
    const clean = String(codeText || 'LT000000000').toUpperCase();
    const bars: string[] = [];
    let x = 24;
    // Start pattern
    const startPattern = [2, 1, 1, 2, 3, 2];
    for (let i = 0; i < startPattern.length; i++) {
        const w = startPattern[i]! * 1.4;
        if (i % 2 === 0) {
            bars.push(`<rect x="${x.toFixed(1)}" y="6" width="${w.toFixed(1)}" height="56" fill="#11161B"/>`);
        }
        x += w;
    }
    for (let idx = 0; idx < clean.length; idx++) {
        const charCode = clean.charCodeAt(idx);
        const widths = [
            ((charCode >> 0) & 1) + 1,
            ((charCode >> 1) & 1) + 1,
            ((charCode >> 2) & 1) + 1,
            ((charCode >> 3) & 1) + 1,
            ((charCode >> 4) & 1) + 1,
            ((charCode >> 5) & 1) + 1,
        ];
        for (let b = 0; b < widths.length; b++) {
            const w = widths[b]! * 1.35;
            if (b % 2 === 0) {
                bars.push(
                    `<rect x="${x.toFixed(1)}" y="6" width="${w.toFixed(1)}" height="56" fill="#11161B"/>`,
                );
            }
            x += w;
        }
    }
    // Stop pattern
    const stopPattern = [2, 3, 3, 1, 1, 1, 2];
    for (let i = 0; i < stopPattern.length; i++) {
        const w = stopPattern[i]! * 1.4;
        if (i % 2 === 0) {
            bars.push(`<rect x="${x.toFixed(1)}" y="6" width="${w.toFixed(1)}" height="56" fill="#11161B"/>`);
        }
        x += w;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 82" width="100%" height="82" role="img" aria-label="Code-128 Barcode ${escapeXml(clean)}">
  <rect width="360" height="82" fill="#FFFFFF"/>
  ${bars.join('\n  ')}
  <text x="180" y="76" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700" fill="#11161B">${escapeXml(clean)}</text>
</svg>`;
}

export function generateA6ShippingLabel(input: A6ShippingLabelInput): A6ShippingLabelResult {
    const orderId = String(input.orderId || 'GILE-0001').trim();
    const normalizedCarrier = normalizeCarrierId(input.carrier);
    const carrier: BalticCarrierId =
        normalizedCarrier === 'all' ? 'omniva' : normalizedCarrier;

    const terminalMatch =
        BALTIC_PARCEL_TERMINALS.find(
            (t) =>
                input.terminalCode &&
                t.code.toLowerCase() === input.terminalCode.trim().toLowerCase(),
        ) ||
        BALTIC_PARCEL_TERMINALS.find((t) => t.carrier === carrier) ||
        BALTIC_PARCEL_TERMINALS[0]!;

    const carrierPrefix =
        terminalMatch.carrier === 'omniva'
            ? 'LTOMN'
            : terminalMatch.carrier === 'dpd'
              ? 'LTDPD'
              : terminalMatch.carrier === 'lp_express'
                ? 'LTLPE'
                : 'LTVNP';
    const hashSuffix = crypto
        .createHash('sha256')
        .update(`${orderId}:${terminalMatch.code}`, 'utf8')
        .digest('hex')
        .slice(0, 8)
        .toUpperCase();
    const trackingNumber = `${carrierPrefix}${hashSuffix}LT`;

    const sender = 'UAB „Gilės inžinerija“, Eigulių g. 21, LT-51418 Kaunas';
    const recipientName = String(input.recipientName || 'Pirkėjas / Montuotojas').trim();
    const recipientPhone = String(input.recipientPhone || '+370 693 97098').trim();
    const weightKg = Math.max(0.2, Math.round(Number(input.weightKg || 2.4) * 10) / 10);

    const barcodeSvg = renderCode128BarsSvg(trackingNumber);

    const html = `<!DOCTYPE html>
<html lang="lt">
<head>
  <meta charset="utf-8" />
  <title>A6 Siuntos lipdukas ${escapeXml(orderId)} – ${escapeXml(terminalMatch.carrierLabel)}</title>
  <style>
    @page { size: 105mm 148mm; margin: 0; }
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: #F5F3EE; color: #11161B; }
    .a6-sheet {
      width: 105mm;
      height: 148mm;
      box-sizing: border-box;
      padding: 5mm;
      background: #FFFFFF;
      border: 2px solid #11161B;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .row { border-bottom: 1.5px solid #11161B; padding-bottom: 2.5mm; margin-bottom: 2.5mm; }
    .carrier-banner { display: flex; justify-content: space-between; align-items: center; }
    .carrier-name { font-size: 16pt; font-weight: 800; letter-spacing: 0.02em; }
    .terminal-code { font-size: 13pt; font-weight: 800; background: #11161B; color: #FFFFFF; padding: 1mm 2.5mm; }
    .label-caption { font-size: 7pt; text-transform: uppercase; color: #4B5563; font-weight: 700; }
    .field-val { font-size: 9.5pt; font-weight: 700; margin-top: 0.5mm; }
    .barcode-box { text-align: center; padding-top: 1.5mm; }
  </style>
</head>
<body>
  <div class="a6-sheet" data-testid="a6-shipping-label" data-dimensions="105x148mm">
    <div>
      <div class="row carrier-banner">
        <span class="carrier-name">${escapeXml(terminalMatch.carrierLabel)}</span>
        <span class="terminal-code">${escapeXml(terminalMatch.code)}</span>
      </div>
      <div class="row">
        <div class="label-caption">Siuntėjas (Sender)</div>
        <div class="field-val">${escapeXml(sender)}</div>
        <div style="font-size: 8pt;">Tel.: +370 693 97098 · Kodas: 302620907</div>
      </div>
      <div class="row">
        <div class="label-caption">Gavėjas (Recipient)</div>
        <div class="field-val">${escapeXml(recipientName)}</div>
        <div style="font-size: 8.5pt;">Tel.: ${escapeXml(recipientPhone)}</div>
      </div>
      <div class="row">
        <div class="label-caption">Paskirties paštomatas / terminalas</div>
        <div class="field-val">${escapeXml(terminalMatch.city)} · ${escapeXml(terminalMatch.name)}</div>
        <div style="font-size: 8.5pt;">${escapeXml(terminalMatch.address)} (${escapeXml(terminalMatch.postalCode)})</div>
      </div>
      <div class="row" style="display:flex; justify-content:space-between;">
        <div>
          <div class="label-caption">Užsakymo Nr.</div>
          <div class="field-val">${escapeXml(orderId)}</div>
        </div>
        <div>
          <div class="label-caption">Svoris (Weight)</div>
          <div class="field-val">${weightKg.toFixed(1)} kg</div>
        </div>
        <div>
          <div class="label-caption">Formatas</div>
          <div class="field-val">A6 (105×148 mm)</div>
        </div>
      </div>
    </div>
    <div class="barcode-box">
      ${barcodeSvg}
    </div>
  </div>
</body>
</html>`;

    return {
        orderId,
        carrier: terminalMatch.carrier,
        carrierLabel: terminalMatch.carrierLabel,
        terminalCode: terminalMatch.code,
        terminalName: terminalMatch.name,
        terminalAddress: terminalMatch.address,
        terminalCity: terminalMatch.city,
        terminalPostalCode: terminalMatch.postalCode,
        trackingNumber,
        sender,
        recipientName,
        recipientPhone,
        weightKg,
        dimensionsMm: '105x148',
        svg: barcodeSvg,
        html,
    };
}
