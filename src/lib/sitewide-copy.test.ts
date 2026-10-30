import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const APP_ROOT = join(__dirname, '../..');
const SRC_DIR = join(APP_ROOT, 'src');
const MESSAGES_DIR = join(APP_ROOT, 'messages');

function collectFiles(dir: string, exts: string[]): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(dir)) {
        if (entry.startsWith('.')) continue;
        const full = join(dir, entry);
        const st = statSync(full);
        if (st.isDirectory()) {
            out.push(...collectFiles(full, exts));
        } else if (exts.some((ext) => entry.endsWith(ext)) && !entry.endsWith('.test.ts') && !entry.endsWith('.test.tsx')) {
            out.push(full);
        }
    }
    return out;
}

const BANNED_STERILE_PHRASES = [
    'Prekė turi kodą',
    'Mes — kelią iki jos',
    'Be sugalvotų skaičių',
    'Techniškai tikslu, be triukšmo',
    'Konsultuojame dėl kodų ir parinkimo: užduokite klausimą el. paštu',
    'Įk. 2023',
    'auralabs.lt',
];

describe('W32-B1: site-wide market-leader copy & PDP RAG compatibility contract', () => {
    it('eliminates all sterile banned legacy phrases and auralabs leaks across src/ and messages/', () => {
        const files = [
            ...collectFiles(SRC_DIR, ['.ts', '.tsx', '.json']),
            ...collectFiles(MESSAGES_DIR, ['.json']),
        ];
        expect(files.length).toBeGreaterThan(20);

        const violations: string[] = [];
        for (const file of files) {
            const content = readFileSync(file, 'utf8');
            for (const banned of BANNED_STERILE_PHRASES) {
                if (content.includes(banned)) {
                    violations.push(`${file} contains "${banned}"`);
                }
            }
        }
        expect(violations).toEqual([]);
    });

    it('overhauls /about (/apie) and messages/{lt,en}/aboutPage.json with market-leader hero, 4 pillars, 8 HVAC system directions, and Vytautas AI + RAG CTAs', () => {
        const aboutLt = JSON.parse(readFileSync(join(MESSAGES_DIR, 'lt/aboutPage.json'), 'utf8'));
        const aboutTsx = readFileSync(join(SRC_DIR, 'app/[locale]/about/page.tsx'), 'utf8');

        expect(aboutLt.storyTitle1).toContain('Gilės Inžinerija');
        expect(aboutLt.storyBody).toContain('aiškiai paprastam žmogui, tiksliai profesionalui');
        expect(aboutTsx).toContain('HVAC_SYSTEM_GROUPS');
        expect(aboutTsx).toContain('Europos inžinerijos lyderiai vienoje vietoje');
        expect(aboutTsx).toContain('Suprantama kiekvienam – be inžinerinio galvos skausmo');
        expect(aboutTsx).toContain('Inžinerinis AI konsultantas Vytautas');
        expect(aboutTsx).toContain('Pilnas objekto sukomplektavimas');
    });

    it('wires footer.tsx and messages/{lt,en}/footer.json with 8 HVAC categories, Vytautas AI + RAG consultant, calculator, and RFQ links', () => {
        const footerTsx = readFileSync(join(SRC_DIR, 'components/footer.tsx'), 'utf8');
        const footerLt = JSON.parse(readFileSync(join(MESSAGES_DIR, 'lt/footer.json'), 'utf8'));

        expect(footerLt.tagline).toContain('Lietuvos šildymo, santechnikos ir inžinerinių sistemų centras');
        expect(footerLt.contactLine).toContain('Vytautas');
        expect(footerTsx).toContain('HVAC_SYSTEM_GROUPS');
    });

    it('adds step-by-step homeowner + B2B installer guidance on /contact (/kontaktai), /uzklausa, and /tools/silumos-skaiciuokle (/skaiciuokle)', () => {
        const contactTsx = readFileSync(join(SRC_DIR, 'app/[locale]/contact/page.tsx'), 'utf8');
        const rfqTsx = readFileSync(join(SRC_DIR, 'app/[locale]/uzklausa/page.tsx'), 'utf8');
        const calcTsx = readFileSync(join(SRC_DIR, 'app/[locale]/tools/silumos-skaiciuokle/page.tsx'), 'utf8');

        expect(contactTsx).not.toContain('auralabs.lt');
        expect(contactTsx).toContain('Vytautas');
        expect(rfqTsx).toContain('Vytautas');
        expect(calcTsx).toContain('Vytautas');
    });

    it('renders the inline Vytautas RAG compatibility & pairing block from findCompatibleCatalogProducts on PDP (products/[id]/page.tsx)', () => {
        const pdpTsx = readFileSync(join(SRC_DIR, 'app/[locale]/products/[id]/page.tsx'), 'utf8');

        expect(pdpTsx).toContain('findCompatibleCatalogProducts');
        expect(pdpTsx).toContain('Vytautas rekomenduoja: su kuo dera ši prekė ir ko reikia pilnam sumontavimui');
        expect(pdpTsx).toContain('bundleExplanation');
        expect(pdpTsx).toContain('pairingReasonLt');
    });

    it('W34-A1 & W83-A1: Homepage uses bespoke Artboard #1 GilesArtboardCatalogGrid + Realizuoti objektai + Kodėl Gilės Inžinerija, and Catalog uses Artboard #4 compatibility bar & filter rail', () => {
        const homeTsx = readFileSync(join(SRC_DIR, 'app/[locale]/page.tsx'), 'utf8');
        const heroTsx = readFileSync(join(SRC_DIR, 'components/home-hero.tsx'), 'utf8');
        const productsTsx = readFileSync(join(SRC_DIR, 'app/[locale]/products/page.tsx'), 'utf8');
        const filterDrawerTsx = readFileSync(join(SRC_DIR, 'components/filter-drawer.tsx'), 'utf8');

        expect(homeTsx).not.toContain('CatalogView');
        expect(homeTsx).not.toContain('PopularProducts');
        expect(homeTsx).not.toContain('SymptomDiagnosticFinder');
        expect(homeTsx).not.toContain('HeatingSystemCalculator');
        expect(homeTsx).toContain('GilesArtboardCatalogGrid');
        expect(homeTsx).toContain('home-realized-projects');
        expect(homeTsx).toContain('home-why-giles-proof');
        expect(homeTsx).toContain('/skaiciuokle');
        expect(homeTsx).toContain('/uzklausa');

        expect(heroTsx).toContain('/products?brand=');
        expect(heroTsx).toContain('/products?category=');

        expect(productsTsx).toContain('listCatalogBrands');
        expect(productsTsx).toContain('Filtruoti pagal gamintoją');
        expect(productsTsx).toContain('giles-boiler-compatibility-bar');
        expect(productsTsx).toContain('giles-architectural-filter-rail');
        expect(productsTsx).toContain('buildQuery');

        expect(filterDrawerTsx).toContain('Gamintojas (Prekės ženklas)');
        expect(filterDrawerTsx).toContain('resolveBrandLogo');
    });

    it('W40-A3: upgrades /privacy, /terms, /returns, /shipping, /cookies (+ /legal/* and LT aliases) with #0B192C Deep Navy + #DC2626 Thermal Red + #0284C7 Hydronic Blue and 30-second buyer trust summaries', () => {
        const policyRoutes = [
            'app/[locale]/privacy/page.tsx',
            'app/[locale]/terms/page.tsx',
            'app/[locale]/returns/page.tsx',
            'app/[locale]/shipping/page.tsx',
            'app/[locale]/cookies/page.tsx',
        ];
        for (const rel of policyRoutes) {
            const tsx = readFileSync(join(SRC_DIR, rel), 'utf8');
            expect(tsx).toContain('#0B192C');
            expect(tsx).toContain('#DC2626');
            expect(tsx).toContain('#0284C7');
            expect(tsx).toContain('Pirkėjo pasitikėjimo santrauka (Svarbiausia per 30 sek.)');
            expect(tsx).not.toContain('bg-gradient');
            expect(tsx).not.toContain('—');
            expect(tsx).not.toContain('auralabs.lt');
            expect(tsx).not.toContain('#23282e');
            expect(tsx).not.toContain('#f4f2ec');
            expect(tsx).not.toContain('#b0762a');
        }

        const returnsTsx = readFileSync(join(SRC_DIR, 'app/[locale]/returns/page.tsx'), 'utf8');
        const shippingTsx = readFileSync(join(SRC_DIR, 'app/[locale]/shipping/page.tsx'), 'utf8');
        const termsTsx = readFileSync(join(SRC_DIR, 'app/[locale]/terms/page.tsx'), 'utf8');
        const privacyTsx = readFileSync(join(SRC_DIR, 'app/[locale]/privacy/page.tsx'), 'utf8');

        expect(returnsTsx).toContain('RA Click');
        expect(returnsTsx).toContain('M30×1.5');
        expect(shippingTsx).toContain('1–3');
        expect(termsTsx).toContain('24');
        expect(termsTsx).toContain('PVM');
        expect(privacyTsx).toContain('BDAR');
    });

    it('W51-A1: upgrades HomeHero with Interactive 5-Zone House Hydronic Cutaway Explorer and ProductCard with 3-Row B2B Engineering Spec-Matrix anatomy', () => {
        const heroTsx = readFileSync(join(SRC_DIR, 'components/home-hero.tsx'), 'utf8');
        const cardTsx = readFileSync(join(SRC_DIR, 'components/product-card.tsx'), 'utf8');
        const popularTsx = readFileSync(join(SRC_DIR, 'components/popular-products.tsx'), 'utf8');

        expect(heroTsx).toContain('HYDRONIC_HOUSE_ZONES');
        expect(heroTsx).toContain('[1] Radiatoriai ir galvutės');
        expect(heroTsx).toContain('[2] Grindinis ir kolektoriai');
        expect(heroTsx).toContain('[3] Katilinė ir plėtimosi indai');
        expect(heroTsx).toContain('[4] Balansavimas (IMI TA)');
        expect(heroTsx).toContain('[5] Nuorinimas ir apsauga');
        expect(heroTsx).toContain('hydronic-cutaway-explorer');
        expect(heroTsx).not.toContain('—');

        expect(cardTsx).toContain('b2b-spec-matrix-card');
        expect(cardTsx).toContain('Paskirtis / Mazgas');
        expect(cardTsx).toContain('Sriegis / Standartas');
        expect(cardTsx).toContain('STOREFRONT_STOCK_COPY');
        expect(cardTsx).toContain('handleCopySku');
        expect(cardTsx).not.toContain('—');

        expect(popularTsx).toContain('b2b-spec-matrix-card');
        expect(popularTsx).toContain('Paskirtis / Mazgas');
        expect(popularTsx).toContain('Sriegis / Standartas');
        expect(popularTsx).toContain('Sandėlyje · 1–3 d. d.');
        expect(popularTsx).not.toContain('—');
    });
});
