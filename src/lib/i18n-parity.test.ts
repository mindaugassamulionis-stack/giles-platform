import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// i18n contract (mission platform-os-i18n-en-lt): messages/{lt,en}/{ns}.json
// must expose identical key sets per namespace so t() never leaks raw keys.
function keyPaths(obj: unknown, prefix = ''): string[] {
    if (obj === null || typeof obj !== 'object') return [prefix];
    return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
        keyPaths(v, prefix ? `${prefix}.${k}` : k),
    );
}

const messagesDir = join(__dirname, '../../messages');

describe('i18n parity (lt <-> en)', () => {
    const locales = readdirSync(messagesDir).filter((d) => !d.startsWith('.'));
    it('has all 4 supported locales (en, lt, pl, ru)', () => {
        expect(locales.sort()).toEqual(['en', 'lt', 'pl', 'ru']);
    });
    const namespaces = readdirSync(join(messagesDir, 'lt')).filter((f) => f.endsWith('.json'));
    for (const ns of namespaces) {
        it(`namespace ${ns} has identical key sets`, () => {
            const lt = JSON.parse(readFileSync(join(messagesDir, 'lt', ns), 'utf8'));
            const en = JSON.parse(readFileSync(join(messagesDir, 'en', ns), 'utf8'));
            expect(keyPaths(en).sort()).toEqual(keyPaths(lt).sort());
        });
    }
});
