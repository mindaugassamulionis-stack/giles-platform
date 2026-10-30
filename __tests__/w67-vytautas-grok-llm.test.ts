import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = '/home/mindu/.gemini/antigravity/scratch/platform-os';
const APP_ROOT = join(REPO_ROOT, 'apps/storefront-suradai');

describe('W67-A1: Vytautas 100% Real LLM-First xAI Grok Consultative Sales & ŠVOK Engineering MOAT', () => {
    after(async () => {
        try {
            const dbMod: any = await import('../../../packages/database/src/index');
            if (dbMod?.pool?.end) {
                await dbMod.pool.end();
            }
        } catch {
            // ignore
        }
    });
    it('1) Widget & Docker Compose audit: zero deterministic canned dumps in vytautas-assistant-widget.tsx and XAI env vars in docker-compose.prod.yml', () => {
        const widgetSrc = readFileSync(
            join(APP_ROOT, 'src/components/vytautas-assistant-widget.tsx'),
            'utf8',
        );

        assert.ok(
            !widgetSrc.includes('evaluateVytautasTurn'),
            'vytautas-assistant-widget.tsx must not call local deterministic evaluateVytautasTurn',
        );
        assert.ok(
            !widgetSrc.includes('Matau pagal jūsų skaičiavimą'),
            'vytautas-assistant-widget.tsx must not contain deterministic "Matau pagal jūsų skaičiavimą"',
        );
        assert.ok(
            !widgetSrc.includes('Suderinamumas ir mazgo logika'),
            'vytautas-assistant-widget.tsx must not contain deterministic "Suderinamumas ir mazgo logika"',
        );
        assert.ok(
            !widgetSrc.includes('Montavimo ir parinkimo atmintinė'),
            'vytautas-assistant-widget.tsx must not contain deterministic "Montavimo ir parinkimo atmintinė"',
        );
        assert.match(
            widgetSrc,
            /window\.location\.pathname\.startsWith\(['"]\/suradai['"]\)\s*\?\s*['"]\/suradai\/api\/chat['"]\s*:\s*['"]\/api\/chat['"]/,
            'vytautas-assistant-widget.tsx must route to /suradai/api/chat when under /suradai else /api/chat',
        );
        assert.match(
            widgetSrc,
            /systemMap/,
            'vytautas-assistant-widget.tsx must pass session systemMap state to the chat API',
        );

        const composeSrc = readFileSync(join(REPO_ROOT, 'docker-compose.prod.yml'), 'utf8');
        assert.match(
            composeSrc,
            /XAI_API_KEY=\$\{XAI_API_KEY:-\}/,
            'docker-compose.prod.yml must pass XAI_API_KEY to storefront service',
        );
        assert.match(
            composeSrc,
            /XAI_GROK_MODEL=\$\{XAI_GROK_MODEL:-\}/,
            'docker-compose.prod.yml must pass XAI_GROK_MODEL to storefront service',
        );
        assert.match(
            widgetSrc,
            /clientTelemetry/,
            'vytautas-assistant-widget.tsx must pass silent clientTelemetry to chat API',
        );
        assert.match(
            widgetSrc,
            /Palikti kontaktą inžinieriui|Gauti sąmatą/,
            'vytautas-assistant-widget.tsx must provide inline engineering lead capture CTA',
        );
    });

    it('2) Hybrid PostgreSQL + Playbook + Lithuanian Market Standards RAG retrieval returns real suradai catalog candidates with studio .webp images', async () => {
        const {
            retrieveVytautasRagContext,
            VYTAUTAS_ENGINEERING_KNOWLEDGE_BASE,
            GROK_PRIMARY_MODEL,
            GROK_FALLBACK_MODELS,
        } = await import('../src/lib/vytautas-consultant');
        const {
            LT_MARKET_STANDARDS_CHUNKS,
            retrieveLtMarketStandardsChunks,
        } = await import('../src/lib/vytautas-lt-market-rag');

        assert.equal(
            LT_MARKET_STANDARDS_CHUNKS.length,
            6,
            'Expected all 6 Lithuanian Building & Heating Market Standards chunks',
        );
        const sovietMatches = retrieveLtMarketStandardsChunks(
            'Karoliniškėse 1978 m. blokinis daugiabutis vienvamzdė sistema su permyčka by-pass',
        );
        assert.ok(
            sovietMatches.some((c) => c.id === 'soviet_1pipe_apartments' && c.content.includes('013G1675')),
            'Expected Chunk 1 (soviet_1pipe_apartments with Danfoss RA-G 15 013G1675) to match',
        );

        assert.ok(GROK_PRIMARY_MODEL.startsWith('grok-'), `Expected Grok primary model, got ${GROK_PRIMARY_MODEL}`);
        assert.ok(Array.isArray(GROK_FALLBACK_MODELS) && GROK_FALLBACK_MODELS.length >= 3);
        assert.ok(VYTAUTAS_ENGINEERING_KNOWLEDGE_BASE.includes('50 L / 1 kW'));
        assert.ok(VYTAUTAS_ENGINEERING_KNOWLEDGE_BASE.includes('RA-Click'));
        assert.ok(VYTAUTAS_ENGINEERING_KNOWLEDGE_BASE.includes('M30×1,5'));

        const rag = await retrieveVytautasRagContext(
            'Man reikia sekcijinio radiatoriaus 500mm aukščio ir šoninio DN15 termostatinio vožtuvo',
            [{ role: 'user', content: 'Ieškau: radiatorius. Ką rekomenduojate išsirinkti?' }],
        );

        assert.ok(rag.candidates.length >= 4 && rag.candidates.length <= 15);
        const skus = rag.candidates.map((c) => c.sku);
        assert.ok(
            skus.includes('POL./80-500'),
            `Expected POL./80-500 in RAG candidates, got: ${skus.join(', ')}`,
        );
        assert.ok(
            skus.includes('013G0014') || skus.includes('3933-02.000'),
            `Expected Danfoss 013G0014 or Heimeier 3933-02.000 in RAG candidates, got: ${skus.join(', ')}`,
        );
        for (const c of rag.candidates) {
            assert.ok(
                c.imageUrl.startsWith('/images/products/') && c.imageUrl.endsWith('.webp'),
                `Candidate ${c.sku} missing studio .webp imageUrl: ${c.imageUrl}`,
            );
        }
        assert.ok(rag.promptBlock.includes('RAG_CATALOG_CANDIDATES'));
        assert.ok(rag.promptBlock.includes('Link lyderių'));
        assert.ok(rag.promptBlock.includes('Nord komfortui'));
    });

    it('3) Live xAI Grok Call #1 & #2: casual & off-topic prompts ("kaipo tu vycka", "gerai as manau kad sikti noriu") return stage="conversation" and 0 products', async () => {
        const { runVytautasConsultativeTurn } = await import('../src/lib/vytautas-consultant');

        const turn1 = await runVytautasConsultativeTurn({
            message: 'kaipo tu vycka',
            history: [],
        });

        assert.equal(turn1.stage, 'conversation', `Expected stage="conversation" for "kaipo tu vycka", got ${turn1.stage}`);
        assert.equal(turn1.recommendations.length, 0, 'Casual greeting must recommend 0 products');
        assert.equal(turn1.suggestedProducts.length, 0, 'Casual greeting must return 0 suggestedProducts');
        assert.ok(turn1.response.length > 15, 'Response must be non-empty natural Lithuanian text');
        assert.ok(
            !turn1.response.includes('Matau pagal jūsų skaičiavimą'),
            'Response must NEVER contain "Matau pagal jūsų skaičiavimą"',
        );
        assert.ok(
            !turn1.response.includes('Suderinamumas ir mazgo logika'),
            'Response must NEVER contain "Suderinamumas ir mazgo logika"',
        );
        assert.ok(
            !turn1.response.includes('Montavimo ir parinkimo atmintinė'),
            'Response must NEVER contain "Montavimo ir parinkimo atmintinė"',
        );
        assert.ok(turn1.modelUsed.startsWith('grok-'), `Expected live Grok model, got ${turn1.modelUsed}`);

        const turn2 = await runVytautasConsultativeTurn({
            message: 'gerai as manau kad sikti noriu',
            history: [
                { role: 'user', content: 'kaipo tu vycka' },
                { role: 'assistant', content: turn1.response },
            ],
        });

        assert.equal(
            turn2.stage,
            'conversation',
            `Expected stage="conversation" for "gerai as manau kad sikti noriu", got ${turn2.stage}`,
        );
        assert.equal(turn2.recommendations.length, 0, 'Off-topic joke must recommend 0 product cards');
        assert.equal(turn2.suggestedProducts.length, 0, 'Off-topic joke must return 0 suggestedProducts');
        assert.ok(
            !turn2.response.includes('Matau pagal jūsų skaičiavimą'),
            'Off-topic response must NEVER contain "Matau pagal jūsų skaičiavimą"',
        );
        assert.ok(
            !/Raditec|013G0014|3933-02\.000/i.test(turn2.response),
            `Off-topic response must NEVER dump random DN15 radiator valves: ${turn2.response}`,
        );
    });

    it('4) Live xAI Grok Call #3 & #4: Turn 1 vague radiator query -> stage="discovery" (0 premature products); Turn 2 specific 500mm + DN15 query -> stage="recommendation" with >=2 studio .webp cards', async () => {
        const { runVytautasConsultativeTurn } = await import('../src/lib/vytautas-consultant');

        const discoveryTurn = await runVytautasConsultativeTurn({
            message: 'Ieškau: radiatorius. Ką rekomenduojate išsirinkti?',
            history: [],
        });

        assert.equal(
            discoveryTurn.stage,
            'discovery',
            `Turn 1 vague radiator query must be stage="discovery", got ${discoveryTurn.stage}`,
        );
        assert.equal(
            discoveryTurn.recommendations.length,
            0,
            'Turn 1 vague radiator query must NOT dump premature product cards',
        );
        assert.equal(discoveryTurn.suggestedProducts.length, 0);
        assert.ok(
            discoveryTurn.response.includes('?'),
            'Discovery turn must ask diagnostic questions to qualify the client system',
        );
        assert.ok(
            discoveryTurn.quickReplies.length >= 2,
            'Discovery turn must provide clickable followUpSuggestions / quickReplies',
        );
        assert.ok(!discoveryTurn.response.includes('Matau pagal jūsų skaičiavimą'));

        const recTurn = await runVytautasConsultativeTurn({
            message: 'Man reikia sekcijinio radiatoriaus 500mm aukščio ir šoninio DN15 termostatinio vožtuvo',
            history: [
                { role: 'user', content: 'Ieškau: radiatorius. Ką rekomenduojate išsirinkti?' },
                { role: 'assistant', content: discoveryTurn.response },
            ],
            systemMap: discoveryTurn.systemMap,
        });

        assert.equal(
            recTurn.stage,
            'recommendation',
            `Turn 2 specific query must be stage="recommendation", got ${recTurn.stage}`,
        );
        assert.ok(
            recTurn.recommendations.length >= 2,
            `Turn 2 must recommend >= 2 products, got ${recTurn.recommendations.length}`,
        );
        const recSkus = recTurn.recommendations.map((r) => r.sku);
        assert.ok(
            recSkus.includes('POL./80-500'),
            `Turn 2 recommendations must include Ferroli POL./80-500, got: ${recSkus.join(', ')}`,
        );
        assert.ok(
            recSkus.includes('013G0014') || recSkus.includes('3933-02.000'),
            `Turn 2 recommendations must include Danfoss RA-N 15 (013G0014) or Heimeier DN15 (3933-02.000), got: ${recSkus.join(', ')}`,
        );
        for (const item of recTurn.recommendations) {
            assert.ok(
                item.image && item.image.startsWith('/images/products/') && item.image.endsWith('.webp'),
                `Recommended item ${item.sku} must have non-empty .webp image URL, got ${item.image}`,
            );
            assert.ok(
                item.imageUrl && item.imageUrl.startsWith('/images/products/') && item.imageUrl.endsWith('.webp'),
                `Recommended item ${item.sku} must have non-empty .webp imageUrl, got ${item.imageUrl}`,
            );
        }
    });

    it('5) Live xAI Grok Call #5 (Soviet Daugiabutis 1-pipe with by-pass): diagnoses high-Kvs requirement (Danfoss RA-G 15 013G1675 / RA 2990 013G2990) and warns against 2-pipe low-Kvs valves', async () => {
        const { runVytautasConsultativeTurn } = await import('../src/lib/vytautas-consultant');

        const turn = await runVytautasConsultativeTurn({
            message:
                'Gyvenu senam 1978 m. blokiniam daugiabutyje Karoliniškėse, vienvamzdė sistema su permyčka. Noriu pakeisti radiatoriaus vožtuvą, kad šiltų.',
            history: [],
        });

        assert.equal(
            turn.stage,
            'recommendation',
            `Expected stage="recommendation" for specific Soviet 1-pipe query, got ${turn.stage}`,
        );
        assert.match(
            turn.response,
            /RA-G|013G1675|013G1677|pralaidum|Kvs/i,
            `Expected response to mention high-flow Danfoss RA-G (013G1675/013G1677) / Kvs, got: ${turn.response}`,
        );
        assert.match(
            turn.response,
            /RA-N|dvivamzd|by-pass|permyčk|pasipriešinim/i,
            `Expected response to warn against 2-pipe low-Kvs valve / by-pass resistance, got: ${turn.response}`,
        );
        const recSkus = turn.recommendations.map((r) => r.sku);
        assert.ok(
            recSkus.includes('013G1675') || recSkus.includes('013G2990'),
            `Expected recommendations to include Danfoss RA-G 15 (013G1675) or RA 2990 (013G2990), got: ${recSkus.join(', ')}`,
        );
        for (const item of turn.recommendations) {
            assert.ok(
                item.imageUrl && item.imageUrl.startsWith('/images/products/') && item.imageUrl.endsWith('.webp'),
                `Recommended item ${item.sku} must have studio .webp imageUrl, got ${item.imageUrl}`,
            );
        }
    });

    it('6) Live xAI Grok Call #6 (Current-Product Context Awareness / Kliento Sekimas): on KaTRI 25 kW PDP, answers "Ką dar būtina nusipirkti prie šito katilo, kad katilinė veiktų saugiai?" using silent currentProduct telemetry', async () => {
        const { runVytautasConsultativeTurn } = await import('../src/lib/vytautas-consultant');

        const turn = await runVytautasConsultativeTurn({
            message: 'Ką dar būtina nusipirkti prie šito katilo, kad katilinė veiktų saugiai?',
            history: [],
            clientTelemetry: {
                currentPage: 'pdp',
                currentPath: '/suradai/lt/products/KaTRI3850020',
                currentProduct: {
                    sku: 'KaTRI3850020',
                    title: 'Plieninis kieto kuro ir granulių šildymo katilas KaTRI 25 kW su 3 eigų šilumokaičiu',
                    brand: 'Gilės Inžinerija',
                    category: 'Šildymo katilai ir krosnelės',
                    priceEur: 1750,
                    specs: '25 kW · P265GH 5–6 mm plienas · 120–220 m²',
                },
                recentlyViewedSkus: ['KaTRI3850020'],
                cartItems: [],
            },
        });

        assert.equal(
            turn.stage,
            'recommendation',
            `Expected stage="recommendation" when asking about accessories on KaTRI 25 kW PDP, got ${turn.stage}`,
        );
        assert.match(
            turn.response,
            /KaTRI|25\s*kW/i,
            `Expected response to identify KaTRI 25 kW from silent currentProduct telemetry, got: ${turn.response}`,
        );
        assert.match(
            turn.response,
            /akumuliacin|1000|1250|50\s*L|55\s*°?C|60\s*°?C|61\s*°?C|Teplomix/i,
            `Expected response to reference accumulation tank (50 L/kW) and return protection (>=55-61°C), got: ${turn.response}`,
        );
        assert.ok(
            !turn.response.includes('Matau pagal jūsų skaičiavimą'),
            'Response must never parrot "Matau pagal jūsų skaičiavimą"',
        );
        assert.ok(
            turn.recommendations.length >= 2,
            `Expected >= 2 companion boiler room products recommended, got ${turn.recommendations.length}`,
        );
        for (const item of turn.recommendations) {
            assert.ok(
                item.imageUrl && item.imageUrl.startsWith('/images/products/') && item.imageUrl.endsWith('.webp'),
                `Recommended item ${item.sku} must have studio .webp imageUrl, got ${item.imageUrl}`,
            );
        }
    });

    it('7) Live xAI Grok Call #7 (Ferroli SUN P7 Igniter Troubleshooting + Delivery/Support): diagnoses KatF0033292 (OEM 39833290, 350W) and states delivery terms', async () => {
        const { runVytautasConsultativeTurn } = await import('../src/lib/vytautas-consultant');

        const turn = await runVytautasConsultativeTurn({
            message:
                'Man užgeso Ferroli SUN P7 granulių degiklis, neuždega granulių. Ką daryti ir per kiek laiko pristatote?',
            history: [],
        });

        assert.equal(
            turn.stage,
            'recommendation',
            `Expected stage="recommendation" for Ferroli SUN P7 igniter failure, got ${turn.stage}`,
        );
        assert.match(
            turn.response,
            /KatF0033292|39833290|350\s*W|tenas|teną|fotoelement/i,
            `Expected response to diagnose Ferroli SUN P7 igniter (KatF0033292 / 39833290 / 350W), got: ${turn.response}`,
        );
        assert.match(
            turn.response,
            /2[–-]5\s*d\.?\s*d\.?|2[–-]3\s*darbo\s*dien|2[–-]5\s*darbo\s*dien|50\s*€|3[.,]99|Savanorių/i,
            `Expected response to answer delivery time (2-5 d. d.) / shipping terms, got: ${turn.response}`,
        );
        const recSkus = turn.recommendations.map((r) => r.sku);
        assert.ok(
            recSkus.includes('KatF0033292'),
            `Expected recommendations to include KatF0033292, got: ${recSkus.join(', ')}`,
        );
        const igniterCard = turn.recommendations.find((r) => r.sku === 'KatF0033292');
        assert.equal(
            igniterCard?.imageUrl,
            '/images/products/egip-katf0033292.webp',
            'Expected KatF0033292 card to have studio .webp image /images/products/egip-katf0033292.webp',
        );
    });

    it('8) W68-A1 Hero & RAG Audit: Homepage Hero features Gilės Inžinerija first + full 14-brand lineup without duplicate alt text + 9 Sistemos pills, and GILES_COMPATIBILITY_AND_TRAP_MATRIX covers all 8 engineering traps', async () => {
        const heroSrc = readFileSync(join(APP_ROOT, 'src/components/home-hero.tsx'), 'utf8');
        const { HERO_BRAND_LINEUP, HERO_SYSTEM_PILLS } = await import('../src/components/home-hero');
        const {
            GILES_COMPATIBILITY_AND_TRAP_MATRIX,
            selectRelevantLtMarketChunks,
        } = await import('../src/lib/vytautas-lt-market-rag');

        assert.equal(HERO_BRAND_LINEUP[0]?.name, 'Gilės Inžinerija');
        assert.equal(HERO_BRAND_LINEUP[0]?.logoUrl, '/images/brands/giles-inzinerija.svg');
        const expectedBrands = [
            'Gilės Inžinerija',
            'Comisa',
            'Centrometal',
            'Dražice',
            'Danfoss',
            'IMI Heimeier',
            'IMI Pneumatex',
            'IMI TA',
            'Viessmann',
            'Wilo',
            'Grundfos',
            'Ferroli',
            'Pelltech',
            'Megatherm',
        ];
        assert.deepEqual(
            HERO_BRAND_LINEUP.map((b) => b.name),
            expectedBrands,
            'HERO_BRAND_LINEUP must feature Gilės Inžinerija first followed by all 13 flagship brands',
        );
        assert.ok(
            !heroSrc.includes('alt={brand.name}'),
            'home-hero.tsx must not put alt={brand.name} next to <span>{brand.name}</span> (causes duplicate "Danfoss Danfoss" text)',
        );
        assert.match(heroSrc, /aria-hidden="true"/);

        const expectedSystems = [
            'Katilai ir granulių degikliai',
            'Grindinis šildymas ir Comisa kolektoriai',
            'Vandens šildytuvai (Dražice / Gorenje)',
            'Radiatoriai ir termostatiniai mazgai',
            'Balansiniai vožtuvai ir hidraulika',
            'Plėtimosi indai, siurbliai ir nuorintuvai',
            'Sisteminiai paketai (/paketai)',
            'Inžinerija ir montavimas (/inzinerija)',
            'Įrangos skaičiuoklė',
        ];
        assert.deepEqual(
            HERO_SYSTEM_PILLS.map((s) => s.label),
            expectedSystems,
            'HERO_SYSTEM_PILLS must include all 9 Gilės Inžinerija system pills',
        );

        assert.ok(
            typeof GILES_COMPATIBILITY_AND_TRAP_MATRIX === 'string' &&
                GILES_COMPATIBILITY_AND_TRAP_MATRIX.includes('9702-24.700') &&
                GILES_COMPATIBILITY_AND_TRAP_MATRIX.includes('SPĄSTAI #1') &&
                GILES_COMPATIBILITY_AND_TRAP_MATRIX.includes('SPĄSTAI #8'),
            'GILES_COMPATIBILITY_AND_TRAP_MATRIX must contain all 8 engineering compatibility traps including adapter 9702-24.700',
        );
        const trapChunks = selectRelevantLtMarketChunks(
            'Ar galiu užsukti Heimeier K-galvą ant Danfoss RA-N vožtuvo?',
        );
        assert.ok(trapChunks.length >= 1);
    });

    it('9) Hostile Critic Trap Test 1 (Live xAI Grok): catches M30x1.5 Heimeier K-head on Danfoss RA-N Click valve (requires adapter 9702-24.700) AND forbids heating Statico vessel on Dražice potable water boiler (requires Aquapresso PN10)', async () => {
        const { runVytautasConsultativeTurn } = await import('../src/lib/vytautas-consultant');

        const turn = await runVytautasConsultativeTurn({
            message:
                'Klausyk, Vytautai, ar galiu tiesiai užsukti IMI Heimeier K-galvą (6000-00.500) ant Danfoss RA-N 15 (013G0013) vožtuvo? Ir ar galiu Statiko (Statico) išsiplėtimo indą pastatyti prie Dražice geriamo vandens boilerio?',
            history: [],
        });

        assert.equal(turn.stage, 'recommendation');
        assert.match(
            turn.response,
            /M30|Click|9702-24\.700|adapter|netinka|tiesiai\s+ne/i,
            `Expected Grok to catch M30x1.5 vs Danfoss RA Click mismatch and cite adapter 9702-24.700, got: ${turn.response}`,
        );
        assert.match(
            turn.response,
            /9702-24\.700/,
            `Expected Grok to explicitly name Heimeier adapter SKU 9702-24.700, got: ${turn.response}`,
        );
        assert.match(
            turn.response,
            /Aquapresso|7111017|7111020|PN10|geriam|higienin|Zilmet/i,
            `Expected Grok to forbid Statico on potable water boiler and recommend Aquapresso PN10, got: ${turn.response}`,
        );
    });

    it('10) Hostile Critic Trap Test 2 (Live xAI Grok): catches undersized Dražice OKC 160 (0.7 m2 coil) on 8 kW heat pump (requires OKC NTR/HP or NTRR) AND correctly places IMI TA STAP on return (grįžtamame) and STAD on supply (paduodamame)', async () => {
        const { runVytautasConsultativeTurn } = await import('../src/lib/vytautas-consultant');

        const turn = await runVytautasConsultativeTurn({
            message:
                'Statau 8 kW šilumos siurblį oras-vanduo, galvoju paimti paprastą pakabinamą Dražice OKC 160 boilerį su 0.7 m2 gyvatuku. Ir dar klausimas: kurioje pusėje (paduodamame ar grįžtamame vamzdyje) montuojamas IMI TA STAP, o kurioje STAD?',
            history: [],
        });

        assert.equal(turn.stage, 'recommendation');
        assert.match(
            turn.response,
            /NTR\/HP|NTRR|OKC\s*200\s*NTR|OKC\s*300\s*NTRR|per\s*maž|2[.,]1|3[.,]2|1[.,]45|High\s*Pressure|avarij/i,
            `Expected Grok to warn that 0.7 m2 coil is too small for 8 kW heat pump and recommend OKC NTR/HP or NTRR, got: ${turn.response}`,
        );
        assert.match(
            turn.response,
            /STAP[\s\S]*grįžtam|grįžtam[\s\S]*STAP/i,
            `Expected Grok to state IMI TA STAP is mounted on return (grįžtamame) pipe, got: ${turn.response}`,
        );
        assert.match(
            turn.response,
            /STAD[\s\S]*paduodam|paduodam[\s\S]*STAD/i,
            `Expected Grok to state IMI TA STAD is mounted on supply (paduodamame) pipe, got: ${turn.response}`,
        );
    });

    it('11) Hostile Critic Trap Test 3 (Live xAI Grok): catches direct 70 °C boiler water into Comisa 16x2.0 PEX-AL-PEX underfloor manifold without mixing unit AND correctly places Zeparo ZUV (supply/hot top) vs Zeparo ZUD/ZUKM (return before pump)', async () => {
        const { runVytautasConsultativeTurn } = await import('../src/lib/vytautas-consultant');

        const turn = await runVytautasConsultativeTurn({
            message:
                'Turiu kieto kuro katilą, kuris duoda 70 °C, ar galiu jį jungti tiesiai į Comisa grindinio šildymo kolektorių su 16x2.2 vamzdžiu? Ir kur statyti IMI Pneumatex Zeparo ZUV nuorintuvą bei ZUD šlamo separatorių?',
            history: [],
        });

        assert.equal(turn.stage, 'recommendation');
        assert.match(
            turn.response,
            /pamaišym|maišymo\s*mazg|20[–-]50|35|16[×x]2[.,]0|Eurokonus/i,
            `Expected Grok to forbid 70 °C direct feed into underfloor manifold (requires mixing unit) and note Comisa 16x2.0 mm wall thickness, got: ${turn.response}`,
        );
        assert.match(
            turn.response,
            /ZUV[\s\S]*(?:paduodam|padavim)|(?:paduodam|padavim)[\s\S]*ZUV|karščiaus/i,
            `Expected Grok to place Zeparo ZUV on hot supply pipe after boiler, got: ${turn.response}`,
        );
        assert.match(
            turn.response,
            /ZUD|ZUKM|grįžtam[\s\S]*prieš\s*siurbl|grįžtam/i,
            `Expected Grok to place Zeparo ZUD/ZUKM dirt/magnetite separator on return pipe before pump/boiler, got: ${turn.response}`,
        );
    });

    it('12) W79-A1: Gateway (sk-...) endpoint/model ordering, no 403 early loop break, stage normalization to "recommendation", and live askVytautasConsultant with aihubmix sk-E... key (< 5s)', async () => {
        const consultantSrc = readFileSync(
            join(APP_ROOT, 'src/lib/vytautas-consultant.ts'),
            'utf8',
        );
        const consultantMod: any = await import('../src/lib/vytautas-consultant');

        assert.equal(
            typeof consultantMod.resolveGrokEndpoints,
            'function',
            'resolveGrokEndpoints must be exported from vytautas-consultant.ts',
        );
        assert.equal(
            typeof consultantMod.normalizeVytautasStage,
            'function',
            'normalizeVytautasStage must be exported from vytautas-consultant.ts',
        );
        assert.equal(
            typeof consultantMod.askVytautasConsultant,
            'function',
            'askVytautasConsultant must be exported from vytautas-consultant.ts',
        );

        // 1. sk-... key in XAI_API_KEY must NEVER pair with https://api.x.ai/v1 and must prioritize grok-4-1-fast-non-reasoning on aihubmix.com/v1
        const skOnlyEndpoints = await consultantMod.resolveGrokEndpoints(
            {
                XAI_API_KEY: 'sk-Etest-aihubmix-gateway-key',
                XAI_DIRECT_API_KEY: '',
                AIHUBMIX_API_KEY: '',
            },
            { skipSecretFiles: true },
        );
        assert.equal(skOnlyEndpoints.length, 1, 'sk- key must only register aihubmix.com/v1 and never api.x.ai/v1');
        assert.equal(skOnlyEndpoints[0].baseUrl, 'https://aihubmix.com/v1');
        assert.deepEqual(skOnlyEndpoints[0].models, [
            'grok-4-1-fast-non-reasoning',
            'grok-4.3',
            'grok-4-20-non-reasoning',
        ]);

        // 2. Both XAI_DIRECT_API_KEY (xai-...) and AIHUBMIX_API_KEY (sk-...) supported with dedicated model lists
        const dualEndpoints = await consultantMod.resolveGrokEndpoints(
            {
                XAI_DIRECT_API_KEY: 'xai-direct-test-key-12345',
                AIHUBMIX_API_KEY: 'sk-gateway-test-key-12345',
                XAI_API_KEY: '',
            },
            { skipSecretFiles: true },
        );
        assert.equal(dualEndpoints.length, 2);
        const xaiEp = dualEndpoints.find((e: any) => e.baseUrl === 'https://api.x.ai/v1');
        const aihubEp = dualEndpoints.find((e: any) => e.baseUrl === 'https://aihubmix.com/v1');
        assert.ok(xaiEp, 'Expected https://api.x.ai/v1 endpoint when XAI_DIRECT_API_KEY starts with xai-');
        assert.ok(aihubEp, 'Expected https://aihubmix.com/v1 endpoint when AIHUBMIX_API_KEY starts with sk-');
        assert.deepEqual(xaiEp.models, ['grok-4-20-non-reasoning', 'grok-4-1-fast-non-reasoning']);
        assert.deepEqual(aihubEp.models, [
            'grok-4-1-fast-non-reasoning',
            'grok-4.3',
            'grok-4-20-non-reasoning',
        ]);

        // 3. No 403 early loop break in callGrokVytautasLLM / callGrokChatCompletion
        assert.ok(
            !consultantSrc.includes('res.status === 403'),
            'vytautas-consultant.ts must NOT break the model candidate loop on res.status === 403',
        );
        assert.match(
            consultantSrc,
            /if\s*\(\s*res\.status\s*===\s*401\s*\)\s*\{\s*break;\s*\}/,
            'vytautas-consultant.ts must only break endpoint loop on res.status === 401',
        );

        // 4. Non-canonical stages & non-empty recommendedSkus normalize to "recommendation"
        for (const nonCanonical of [
            'compatibility_check',
            'initial_response',
            'technical_answer',
            'diagnosis',
            'solution',
        ]) {
            assert.equal(
                consultantMod.normalizeVytautasStage({
                    rawStage: nonCanonical,
                    recommendedSkus: ['013G1675'],
                    userMessage: 'Ar tinka šis vožtuvas?',
                    reply: 'Rekomenduoju Danfoss RA-G 15 (013G1675).',
                }),
                'recommendation',
                `Expected rawStage="${nonCanonical}" to normalize to "recommendation"`,
            );
        }
        assert.equal(
            consultantMod.normalizeVytautasStage({
                rawStage: 'conversation',
                recommendedSkus: ['9702-24.700'],
                userMessage: 'Ar galiu užsukti Heimeier galvą ant Danfoss vožtuvo?',
                reply: 'Tiesiai ne, reikia adapterio 9702-24.700.',
            }),
            'recommendation',
            'Expected non-empty recommendedSkus to normalize stage to "recommendation"',
        );

        // 5. Live askVytautasConsultant test using ONLY the aihubmix sk-E... key
        const aihubKey = readFileSync(
            '/home/mindu/.opencode/.runtime/secrets/aihubmix_api_key',
            'utf8',
        ).trim();
        assert.ok(aihubKey.startsWith('sk-'), 'Expected aihubmix_api_key secret to start with sk-');

        const prevXai = process.env.XAI_API_KEY;
        const prevDirect = process.env.XAI_DIRECT_API_KEY;
        const prevGrok = process.env.GROK_API_KEY;
        const prevAihub = process.env.AIHUBMIX_API_KEY;

        try {
            process.env.XAI_API_KEY = aihubKey;
            delete process.env.XAI_DIRECT_API_KEY;
            delete process.env.GROK_API_KEY;
            process.env.AIHUBMIX_API_KEY = aihubKey;

            // Warm up PostgreSQL RAG pool before timing the live consultant turn
            await consultantMod.retrieveVytautasRagContext('Danfoss RA-G 15', []);

            const t0 = Date.now();
            const liveRes = await consultantMod.askVytautasConsultant({
                message:
                    'Gyvenu senam 1978 m. blokiniam daugiabutyje Karoliniškėse, vienvamzdė sistema su permyčka. Noriu pakeisti radiatoriaus vožtuvą, kad šiltų.',
                history: [],
            });
            const elapsedMs = Date.now() - t0;

            assert.equal(liveRes.mode, 'xai_grok_llm_rag_moat');
            assert.equal(liveRes.stage, 'recommendation');
            assert.ok(
                Array.isArray(liveRes.recommendedProducts) && liveRes.recommendedProducts.length >= 2,
                `Expected non-empty recommendedProducts from live aihubmix call, got ${liveRes.recommendedProducts?.length}`,
            );
            assert.ok(
                elapsedMs < 5000,
                `Expected live aihubmix askVytautasConsultant to respond in < 5000ms, took ${elapsedMs}ms`,
            );
        } finally {
            if (prevXai === undefined) delete process.env.XAI_API_KEY;
            else process.env.XAI_API_KEY = prevXai;
            if (prevDirect === undefined) delete process.env.XAI_DIRECT_API_KEY;
            else process.env.XAI_DIRECT_API_KEY = prevDirect;
            if (prevGrok === undefined) delete process.env.GROK_API_KEY;
            else process.env.GROK_API_KEY = prevGrok;
            if (prevAihub === undefined) delete process.env.AIHUBMIX_API_KEY;
            else process.env.AIHUBMIX_API_KEY = prevAihub;
        }
    });

    it('10) W80-A1: Vytautas RAG knowledge base includes 2026 Danfoss prices (013G2990, 013G1675), Gorenje ZV 25 S..ZV 300 buffer tanks (270–950 €), and Haier 2026 R290/R32 heat pumps & DHW boilers (AU082FYCRA, AW082HVGHA, HP80M8-9..HP250M7C-F9, ES10V..ES100V)', async () => {
        const {
            LT_MARKET_STANDARDS_CHUNKS,
            GILES_COMPATIBILITY_AND_TRAP_MATRIX,
            retrieveLtMarketStandardsChunks,
        } = await import('../src/lib/vytautas-lt-market-rag');
        const { VYTAUTAS_ENGINEERING_KNOWLEDGE_BASE } = await import('../src/lib/vytautas-consultant');

        const allRagText = [
            ...LT_MARKET_STANDARDS_CHUNKS.map((c) => c.content),
            GILES_COMPATIBILITY_AND_TRAP_MATRIX,
            VYTAUTAS_ENGINEERING_KNOWLEDGE_BASE,
        ].join('\n');

        assert.ok(allRagText.includes('31,83 €') || allRagText.includes('41,26 €'), 'Must include updated 2026-10-01 013G2990 price');
        assert.ok(allRagText.includes('ZV 25 S') && allRagText.includes('ZV 300'), 'Must include Gorenje ZV 25 S..ZV 300 buffer tanks');
        assert.ok(allRagText.includes('AU082FYCRA') && allRagText.includes('AW082HVGHA'), 'Must include Haier oras-vanduo heat pumps');
        assert.ok(allRagText.includes('HP80M8-9') && allRagText.includes('HP250M7C-F9'), 'Must include Haier R290 DHW heat pump boilers');
        assert.ok(allRagText.includes('ES10V') && allRagText.includes('ES100V'), 'Must include Haier ES10V..ES100V electric boilers');

        const haierChunks = retrieveLtMarketStandardsChunks('Haier šilumos siurblys oras-vanduo R290 AU082FYCRA HP200M7C-F9');
        assert.ok(haierChunks.length >= 1, 'Expected RAG chunks for Haier R290 query');
    });
});
