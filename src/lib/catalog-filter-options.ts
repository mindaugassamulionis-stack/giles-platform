export interface CatalogSubtypeOption {
    key: string;
    label: string;
    categoryHint?: string;
    sqlRegex: string;
}

export interface CatalogSpecOption {
    key: string;
    label: string;
    sqlRegex: string;
}

export const CATALOG_SUBTYPE_OPTIONS: CatalogSubtypeOption[] = [
    {
        key: 'kolektoriai',
        label: 'Kolektoriai (šakotuvai)',
        categoryHint: 'Grindinis šildymas ir kolektoriai',
        sqlRegex: '(kolektor|dynacon|šakotuv|sakotuv|^933)',
    },
    {
        key: 'pavaros',
        label: 'Terminės pavaros ir valdikliai',
        categoryHint: 'Grindinis šildymas ir kolektoriai',
        sqlRegex: '(pavar|valdikl|termostat|emo|twa|icon|devireg|^183|^088|^140)',
    },
    {
        key: 'spinteles',
        label: 'Spintelės ir laikikliai',
        categoryHint: 'Grindinis šildymas ir kolektoriai',
        sqlRegex: '(spintel|laikikl|kronštein|kronstein|dėž|dez|montavimo)',
    },
    {
        key: 'jungtys',
        label: 'Eurokonusai ir jungtys',
        categoryHint: 'Grindinis šildymas ir kolektoriai',
        sqlRegex: '(eurokonus|antgal|jungt|srieg|perėjim|perejim|akl|^060)',
    },
    {
        key: 'galvutes',
        label: 'Termostatinės galvutės',
        categoryHint: 'Termostatinės galvutės ir vožtuvai',
        sqlRegex: '(galvut|jutikl|redia|ra 2000|k-galvut|^013g2|^6000)',
    },
    {
        key: 'voztuvai',
        label: 'Termostatiniai vožtuvai',
        categoryHint: 'Termostatinės galvutės ir vožtuvai',
        sqlRegex: '(eclipse|ra-n|ra-dv|v-exact|calypso|termostatinis vožtuv|termostatinis voztuv|^393|^013g0)',
    },
    {
        key: 'h-blokai',
        label: 'Apatinio pajungimo H-blokai',
        categoryHint: 'Termostatinės galvutės ir vožtuvai',
        sqlRegex: '(multilux|vekolux|rlv-k|rlv-s|regulux|raditec|h-blok|50 mm|binokl|^038)',
    },
    {
        key: 'pletimosi-indai',
        label: 'Plėtimosi indai',
        categoryHint: 'Plėtimosi indai ir slėgio palaikymas',
        sqlRegex: '(statico|aquapresso|plėtimosi ind|pletimosi ind|^710|^711)',
    },
    {
        key: 'slegio-stoteles',
        label: 'Slėgio stotelės',
        categoryHint: 'Plėtimosi indai ir slėgio palaikymas',
        sqlRegex: '(compresso|transfero|pleno|vento|stotel|^810|^812)',
    },
    {
        key: 'tvirtinimas-servisas',
        label: 'Tvirtinimo ir serviso mazgai (SMU / DLV)',
        categoryHint: 'Plėtimosi indai ir slėgio palaikymas',
        sqlRegex: '(smu|dlv|dsv|laikikl|manometr|apsaugin|čiaup|ciaup)',
    },
    {
        key: 'balansiniai',
        label: 'Balansiniai vožtuvai',
        categoryHint: 'Balansiniai ir reguliavimo vožtuvai',
        sqlRegex: '(stad|staf|tbv|ta-modulator|ta-compact|asv|ab-qm|leno|msv|balans|^52-)',
    },
    {
        key: 'separatoriai',
        label: 'Nuorintuvai ir purvo separatoriai',
        categoryHint: 'Oro atskyrikliai ir nuorintuvai',
        sqlRegex: '(zeparo|nuorintuv|atskyrikl|separator|helistill|^789)',
    },
    {
        key: 'katilai-boileriai',
        label: 'Katilai ir vandens šildytuvai',
        categoryHint: 'Katilai ir vandens šildytuvai',
        sqlRegex: '(katil|boiler|šildytuv|sildytuv|ferroli|divatech|bluehelix)',
    },
    {
        key: 'radiatoriai',
        label: 'Radiatoriai ir konvektoriai',
        categoryHint: 'Radiatoriai ir konvektoriai',
        sqlRegex: '(radiator|konvektor|plokštin|plokstin)',
    },
];

export const CATALOG_SPEC_OPTIONS: CatalogSpecOption[] = [
    { key: 'DN15', label: 'DN15 (1/2")', sqlRegex: '(dn\\s*15|1/2"|g\\s*1/2|r\\s*1/2|52-151-014|3933-02|013g0013)' },
    { key: 'DN20', label: 'DN20 (3/4")', sqlRegex: '(dn\\s*20|3/4"|g\\s*3/4|r\\s*3/4|52-151-020|3933-03)' },
    { key: 'DN25', label: 'DN25 (1")', sqlRegex: '(dn\\s*25|\\b1"|g\\s*1\\b|52-151-025)' },
    { key: 'DN32', label: 'DN32', sqlRegex: '(dn\\s*32|1\\s*1/4"|52-151-032)' },
    { key: 'DN40', label: 'DN40', sqlRegex: '(dn\\s*40|1\\s*1/2"|52-151-040)' },
    { key: 'DN50', label: 'DN50', sqlRegex: '(dn\\s*50|\\b2"|52-151-050)' },
    { key: 'M30x1.5', label: 'M30×1,5', sqlRegex: '(m30|30\\s*x\\s*1[,.]5|heimeier|eclipse|emo|dynacon|6000-|3712-|3933-|1833-)' },
    { key: 'RA-Click', label: 'RA Click', sqlRegex: '(ra\\s*click|ra-n|ra-dv|ra\\s*2000|redia|23\\s*mm|013g)' },
    { key: 'G3/4', label: 'G3/4', sqlRegex: '(3/4|eurokonus|0601-|multilux|vekolux|0382-)' },
    { key: '230V', label: '230V', sqlRegex: '(230\\s*v|230v|1833-00\\.500|088u)' },
    { key: '24V', label: '24V', sqlRegex: '(24\\s*v|24v|1837-|088u0240)' },
    { key: '25L', label: '25 L', sqlRegex: '(\\b25\\s*l|\\b25\\.3\\b|\\b25\\.6\\b|sd\\s*25|ad\\s*25|7101003)' },
    { key: '35L', label: '35 L', sqlRegex: '(\\b35\\s*l|\\b35\\.3\\b|\\b35\\.6\\b|sd\\s*35|ad\\s*35|7101004)' },
    { key: '50L', label: '50 L', sqlRegex: '(\\b50\\s*l|\\b50\\.3\\b|\\b50\\.6\\b|sd\\s*50|su\\s*50|7101005)' },
];
