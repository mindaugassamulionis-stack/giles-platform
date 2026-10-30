import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
    extractConversationState,
    runVytautasMultiTurnEngine,
    searchCatalogHybrid,
} from './vytautas-engine';
import {
    runVytautasConsultativeTurn,
    evaluateVytautasTurn,
    extractSystemParameters,
} from './vytautas-consultant';
import * as vytautasRoute from '../app/api/vytautas/route';

describe('WP-W96-A2: Vytautas Multi-Turn Engineering State, Zero Tikslinama Placeholders & Full Catalog Hybrid Search', () => {
    const repoRoot = path.resolve(__dirname, '../..');

    it('1) removes all occurrences of "Tikslinama (" from the entire src/ codebase', () => {
        const filesToCheck = [
            'src/lib/vytautas-engine.ts',
            'src/lib/vytautas-consultant.ts',
            'src/components/vytautas-assistant-widget.tsx',
            'src/components/vytautas-chat.tsx',
            'src/app/api/vytautas/route.ts',
            'src/app/api/chat/route.ts',
        ];
        for (const rel of filesToCheck) {
            const abs = path.join(repoRoot, rel);
            expect(fs.existsSync(abs), `Expected file ${rel} to exist`).toBe(true);
            const content = fs.readFileSync(abs, 'utf8');
            expect(content).not.toContain('Tikslinama (');
        }
    });

    it('2) extractConversationState accurately accumulates multi-turn domain, connectionSide, connectionHand, focusFilter, areaM2, powerKw, heightMm, and brandFilter', () => {
        const turn1Messages = [
            {
                role: 'user' as const,
                content:
                    'Ieškau: reikia man radiatoriu kazkokiu. Ką rekomenduojate išsirinkti ir kokie priedai būtini pilnam sumontavimui?',
            },
        ];
        const state1 = extractConversationState(turn1Messages);
        expect(state1.domain).toBe('radiators');
        expect(state1.connectionSide).toBeNull();
        expect(state1.focusFilter).toBe('complete_kit');

        const turn2Messages = [
            ...turn1Messages,
            {
                role: 'assistant' as const,
                content:
                    'Girdžiu. Kad radiatorių mazgas dirbtų tyliai ir netektų grąžinti netinkančio sriegio, patikslinkite: 1) Ar ieškote paties radiatoriaus (350 mm, 500 mm, 600 mm), ar vožtuvo ir galvutės? 2) Koks patalpos plotas (m²)? 3) Koks pajungimas: šoninis DN15 ar apatinis VK 50 mm?',
            },
            {
                role: 'user' as const,
                content: 'soninio radiatoriaus reikia paungimas is sono desines puses',
            },
        ];
        const state2 = extractConversationState(turn2Messages);
        expect(state2.domain).toBe('radiators');
        expect(state2.connectionSide).toBe('lateral');
        expect(state2.connectionHand).toBe('right');
        expect(state2.focusFilter).toBe('complete_kit');

        const turn3Messages = [
            ...turn2Messages,
            {
                role: 'assistant' as const,
                content: 'Šoniniam dešinės pusės pajungimui tinka universalūs radiatoriai...',
            },
            {
                role: 'user' as const,
                content: 'o tai kur patys radiatoriai ?',
            },
        ];
        const state3 = extractConversationState(turn3Messages);
        expect(state3.domain).toBe('radiators');
        expect(state3.connectionSide).toBe('lateral');
        expect(state3.connectionHand).toBe('right');
        expect(state3.focusFilter).toBe('main_units_only');
    });

    it('3) reproduces and fixes the exact 3-turn radiator transcript caught live by the owner', async () => {
        // Turn 1: User asks general radiator question
        const turn1 = await runVytautasConsultativeTurn({
            message:
                'Ieškau: reikia man radiatoriu kazkokiu. Ką rekomenduojate išsirinkti ir kokie priedai būtini pilnam sumontavimui?',
            history: [],
        });
        expect(turn1.response).not.toContain('Tikslinama (');
        expect(turn1.systemMap.powerOrAreaLabel).not.toContain('Tikslinama (');
        expect(turn1.systemMap.connectionOrTypeLabel).not.toContain('Tikslinama (');

        // Turn 2: User specifies lateral right-hand side connection ("soninio radiatoriaus reikia paungimas is sono desines puses")
        const historyTurn2 = [
            {
                role: 'user' as const,
                content:
                    'Ieškau: reikia man radiatoriu kazkokiu. Ką rekomenduojate išsirinkti ir kokie priedai būtini pilnam sumontavimui?',
            },
            {
                role: 'assistant' as const,
                content: turn1.response,
            },
        ];
        const turn2 = await runVytautasConsultativeTurn({
            message: 'soninio radiatoriaus reikia paungimas is sono desines puses',
            history: historyTurn2,
        });

        expect(turn2.stage).toBe('recommendation');
        expect(turn2.response).not.toContain('Tikslinama (');
        expect(turn2.response).not.toBe(turn1.response);
        // Must explain universal left/right radiators and right-hand thread G 1" x 1/2" D
        expect(turn2.response).toMatch(/universal|dešin|G\s*1/i);
        // Must include multiple radiator options and ONLY lateral DN15 valves, NEVER Vekolux or VK 50 mm bottom valve!
        const turn2SkusAndNames = turn2.recommendations
            .map((p) => `${p.sku} ${p.name} ${p.applicationRole || ''}`)
            .join(' | ');
        expect(turn2SkusAndNames).not.toMatch(/Vekolux|0382-02\.000|053[0-7]-50|VK\s*50|apatinio pajungimo/i);
        const turn2RadiatorCount = turn2.recommendations.filter((p) =>
            /radiatorius|POL\.|Tipas\s*22/i.test(`${p.sku} ${p.name}`),
        ).length;
        expect(turn2RadiatorCount).toBeGreaterThanOrEqual(2);

        // Turn 3: User asks "o tai kur patys radiatoriai ?"
        const historyTurn3 = [
            ...historyTurn2,
            {
                role: 'user' as const,
                content: 'soninio radiatoriaus reikia paungimas is sono desines puses',
            },
            {
                role: 'assistant' as const,
                content: turn2.response,
            },
        ];
        const turn3 = await runVytautasConsultativeTurn({
            message: 'o tai kur patys radiatoriai ?',
            history: historyTurn3,
        });

        expect(turn3.stage).toBe('recommendation');
        expect(turn3.response).not.toContain('Tikslinama (');
        // Must NOT repeat Turn 2 response!
        expect(turn3.response).not.toBe(turn2.response);
        // Must directly acknowledge and explain sizing per m2 (~100 W/m2)
        expect(turn3.response).toMatch(/priedų perteklių|štai būtent patys radiatoriai|100\s*W\/m²/i);
        // Must return ONLY radiators (zero valves/heads)
        expect(turn3.recommendations.length).toBeGreaterThanOrEqual(3);
        for (const item of turn3.recommendations) {
            const combined = `${item.sku} ${item.name} ${item.category || ''} ${item.applicationRole || ''}`;
            expect(combined).toMatch(/radiatorius|POL\.|Tipas\s*22/i);
            expect(combined).not.toMatch(/vožtuvas|galvutė|Vekolux|RA-N|Eclipse|013G0014|3933-02\.000|013G2970/i);
        }
    });

    it('4) evaluateVytautasTurn synchronous helper also enforces multi-turn state, zero Tikslinama, and focusFilter="main_units_only"', () => {
        const syncTurn2 = evaluateVytautasTurn({
            message: 'soninio radiatoriaus reikia paungimas is sono desines puses',
            history: [
                {
                    role: 'user',
                    content: 'Ieškau: reikia man radiatoriu kazkokiu. Ką rekomenduojate išsirinkti?',
                },
                {
                    role: 'assistant',
                    content: 'Patikslinkite pajungimą ir aukštį.',
                },
            ],
        });
        expect(syncTurn2.response).not.toContain('Tikslinama (');
        expect(syncTurn2.suggestedProducts.some((p) => /Vekolux|0382-02\.000/i.test(`${p.sku} ${p.name}`))).toBe(false);

        const syncTurn3 = evaluateVytautasTurn({
            message: 'o tai kur patys radiatoriai ?',
            history: [
                {
                    role: 'user',
                    content: 'Ieškau: reikia man radiatoriu kazkokiu.',
                },
                {
                    role: 'assistant',
                    content: 'Patikslinkite pajungimą.',
                },
                {
                    role: 'user',
                    content: 'soninio radiatoriaus reikia paungimas is sono desines puses',
                },
                {
                    role: 'assistant',
                    content: syncTurn2.response,
                },
            ],
        });
        expect(syncTurn3.response).not.toBe(syncTurn2.response);
        expect(syncTurn3.response).not.toContain('Tikslinama (');
        expect(syncTurn3.suggestedProducts.length).toBeGreaterThanOrEqual(3);
        for (const prod of syncTurn3.suggestedProducts) {
            expect(`${prod.sku} ${prod.name}`).toMatch(/radiatorius|POL\.|Tipas\s*22/i);
            expect(`${prod.sku} ${prod.name}`).not.toMatch(/Vekolux|RA-N|Eclipse|galvutė/i);
        }

        const params = extractSystemParameters('reikia radiatoriaus');
        expect(params.powerOrAreaLabel).not.toContain('Tikslinama (');
        expect(params.connectionOrTypeLabel).not.toContain('Tikslinama (');
    });

    it('5) POST /api/vytautas handles multi-turn messages array and single message payloads accurately', async () => {
        const reqTurn2 = new Request('http://localhost/api/vytautas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'user',
                        content:
                            'Ieškau: reikia man radiatoriu kazkokiu. Ką rekomenduojate išsirinkti ir kokie priedai būtini pilnam sumontavimui?',
                    },
                    {
                        role: 'assistant',
                        content:
                            'Girdžiu. Patikslinkite: 1) Ar ieškote paties radiatoriaus, ar vožtuvo? 2) Koks plotas? 3) Koks pajungimas?',
                    },
                    {
                        role: 'user',
                        content: 'soninio radiatoriaus reikia paungimas is sono desines puses',
                    },
                ],
            }),
        });
        const res2 = await vytautasRoute.POST(reqTurn2 as any);
        const data2 = await res2.json();
        expect(res2.status).toBe(200);
        expect(data2.response).not.toContain('Tikslinama (');
        expect(
            data2.recommendations.some((p: any) => /Vekolux|0382-02\.000/i.test(`${p.sku} ${p.name}`)),
        ).toBe(false);

        const reqTurn3 = new Request('http://localhost/api/vytautas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'user',
                        content:
                            'Ieškau: reikia man radiatoriu kazkokiu. Ką rekomenduojate išsirinkti ir kokie priedai būtini pilnam sumontavimui?',
                    },
                    {
                        role: 'assistant',
                        content:
                            'Girdžiu. Patikslinkite: 1) Ar ieškote paties radiatoriaus, ar vožtuvo? 2) Koks plotas? 3) Koks pajungimas?',
                    },
                    {
                        role: 'user',
                        content: 'soninio radiatoriaus reikia paungimas is sono desines puses',
                    },
                    {
                        role: 'assistant',
                        content: data2.response,
                    },
                    {
                        role: 'user',
                        content: 'o tai kur patys radiatoriai ?',
                    },
                ],
            }),
        });
        const res3 = await vytautasRoute.POST(reqTurn3 as any);
        const data3 = await res3.json();
        expect(res3.status).toBe(200);
        expect(data3.response).not.toBe(data2.response);
        expect(data3.recommendations.length).toBeGreaterThanOrEqual(3);
        for (const p of data3.recommendations) {
            expect(`${p.sku} ${p.name}`).toMatch(/radiatorius|POL\.|Tipas\s*22/i);
            expect(`${p.sku} ${p.name}`).not.toMatch(/Vekolux|RA-N|Eclipse|galvutė/i);
        }
    });

    it('6) supports multi-turn conversations and hybrid search for boilers, pellet burners (Megatherm MPB), heat pumps (Haier), tanks (Gorenje ZV), underfloor collectors, and SKU lookup', () => {
        // Boilers + main_units_only ("kur katilai")
        const boilerTurn1 = runVytautasMultiTurnEngine({
            messages: [
                { role: 'user', content: 'Ieškau kieto kuro arba granulinio katilo 180 m2 namui' },
                { role: 'assistant', content: '25 kW katilui rekomenduoju KaTRI arba Centrometal su pamaišymo mazgu.' },
                { role: 'user', content: 'rodyk tik katilus' },
            ],
        });
        expect(boilerTurn1.state.domain).toBe('boilers');
        expect(boilerTurn1.state.focusFilter).toBe('main_units_only');
        expect(boilerTurn1.state.areaM2).toBe(180);
        expect(boilerTurn1.recommendations.length).toBeGreaterThanOrEqual(2);
        expect(boilerTurn1.recommendations.every((p) => /katil|KaTRI|Centrometal|Viessmann|Verner|Ponast|Thermostal/i.test(`${p.sku} ${p.name} ${p.category}`))).toBe(true);

        // Pellet burners (Megatherm MPB)
        const burnerRes = runVytautasMultiTurnEngine({
            messages: [{ role: 'user', content: 'Megatherm degiklis 25 kW su sraigtu' }],
        });
        expect(burnerRes.state.domain).toBe('pellet_burners');
        expect(burnerRes.state.brandFilter?.toLowerCase()).toBe('megatherm');
        expect(burnerRes.recommendations.some((p) => /megatherm|mpb|degkmpl/i.test(`${p.sku} ${p.name}`))).toBe(true);

        // Heat pumps (Haier oras vanduo 8kW)
        const hpRes = runVytautasMultiTurnEngine({
            messages: [{ role: 'user', content: 'Haier oras vanduo 8kW šilumos siurblys' }],
        });
        expect(hpRes.state.domain).toBe('heat_pumps');
        expect(hpRes.state.powerKw).toBe(8);
        expect(hpRes.recommendations.some((p) => /haier/i.test(`${p.sku} ${p.name} ${p.brandName}`))).toBe(true);

        // Tanks / boilers (Gorenje ZV 200 akumuliacinė talpa)
        const tankRes = runVytautasMultiTurnEngine({
            messages: [{ role: 'user', content: 'Gorenje ZV 200 akumuliacinė talpa' }],
        });
        expect(tankRes.state.domain).toBe('tanks_boilers');
        expect(tankRes.recommendations.some((p) => /gorenje|zv|talpa|boiler|dražice|okc/i.test(`${p.sku} ${p.name}`))).toBe(true);

        // Underfloor collector (grindinio šildymo kolektorius 8 kontūrų)
        const ufRes = runVytautasMultiTurnEngine({
            messages: [{ role: 'user', content: 'grindinio šildymo kolektorius 8 kontūrų' }],
        });
        expect(ufRes.state.domain).toBe('underfloor');
        expect(ufRes.recommendations.some((p) => /kolektor|comisa|dynacon|88\.20/i.test(`${p.sku} ${p.name}`))).toBe(true);

        // Exact SKU lookup across 6,337 catalog products
        const skuHits = searchCatalogHybrid('013G2990', { limit: 5 });
        expect(skuHits.length).toBeGreaterThanOrEqual(1);
        expect(skuHits[0]?.sku.toUpperCase()).toContain('013G2990');

        // Spare parts vs main units ranking
        const spareRes = runVytautasMultiTurnEngine({
            messages: [{ role: 'user', content: 'atsarginės dalys degiklio uždegimo tenas' }],
        });
        expect(spareRes.state.domain).toBe('spare_parts');
        expect(spareRes.recommendations.some((p) => /tenas|KatF0033292|KatM39833425/i.test(`${p.sku} ${p.name}`))).toBe(true);
    });

    it('7) supports 4 languages (LT, EN, PL, RU) without robotic placeholders', () => {
        for (const locale of ['lt', 'en', 'pl', 'ru'] as const) {
            const res = runVytautasMultiTurnEngine({
                messages: [
                    { role: 'user', content: 'soninio radiatoriaus reikia paungimas is sono desines puses' },
                ],
                locale,
            });
            expect(res.reply.length).toBeGreaterThan(30);
            expect(res.reply).not.toContain('Tikslinama (');
            expect(res.recommendations.length).toBeGreaterThanOrEqual(3);
        }
    });
});
