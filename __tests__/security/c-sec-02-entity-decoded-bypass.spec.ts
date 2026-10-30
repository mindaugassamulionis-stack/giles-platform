/**
 * CB-SEC-002 (P2 XSS) — entity-decoded protocol bypass regression for suradai.
 *
 * Mirrors the aura test. Suradai's existing per-attribute /^\s*javascript:/i
 * match runs on the RAW (still entity-encoded) value, so `java&#9;script:`
 * is not matched. After the browser decodes the entity AND strips URL
 * whitespace per the WHATWG URL spec, the resulting scheme is `javascript`.
 *
 * Fix contract: sanitizer must
 *   (1) entity-decode attribute value (numeric, hex, named) BEFORE the
 *       protocol match;
 *   (2) match against a URL-spec-stripped scheme (remove U+0009 / U+000A /
 *       U+000C / U+000D between scheme chars), case-insensitive;
 *   (3) block `javascript:`, `vbscript:`, and `data:text/html`.
 *
 * This spec is the TDD red half: must FAIL on current code, PASS on fix.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeHtml } from '../../src/lib/sanitize-html';

interface Payload {
    name: string;
    input: string;
}

const PAYLOADS: Payload[] = [
    {
        name: 'href with HTML-entity tab in javascript:',
        input: '<a href="java&#9;script:alert(1)">x</a>',
    },
    {
        name: 'href with HTML-entity LF in javascript:',
        input: '<a href="java&#10;script:alert(1)">x</a>',
    },
    {
        name: 'href with HTML-entity CR in javascript:',
        input: '<a href="java&#13;script:alert(1)">x</a>',
    },
    {
        name: 'href with hex entity in javascript:',
        input: '<a href="java&#x09;script:alert(1)">x</a>',
    },
    {
        name: 'href with real tab in javascript:',
        input: '<a href="java\tscript:alert(1)">x</a>',
    },
    {
        name: 'href with real newline in javascript:',
        input: '<a href="java\nscript:alert(1)">x</a>',
    },
    {
        name: 'src with entity-decoded javascript: in img',
        input: '<img src="java&#9;script:alert(1)">',
    },
    {
        name: 'href with mixed-case entity-decoded JaVaScRiPt:',
        input: '<a href="&#74;a&#86;a&#83;c&#82;i&#80;t:alert(1)">x</a>',
    },
];

const NAMED_ENTITIES: Record<string, string> = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0',
    tab: '\t', newline: '\n', Tab: '\t', NewLine: '\n',
};

function decodeEntities(s: string): string {
    return s
        .replace(/&#x([0-9a-f]+);/gi, (_, n) => {
            try { return String.fromCodePoint(parseInt(n, 16)); }
            catch { return ''; }
        })
        .replace(/&#(\d+);/g, (_, n) => {
            try { return String.fromCodePoint(parseInt(n, 10)); }
            catch { return ''; }
        })
        .replace(/&([a-zA-Z]+);/g, (m, name) => NAMED_ENTITIES[name] ?? m);
}

function stripUrlWhitespace(s: string): string {
    return s.replace(/[\u0009\u000a\u000c\u000d]/g, '');
}

function findDangerousHrefs(html: string): { attr: string; decoded: string; scheme: string }[] {
    const out: { attr: string; decoded: string; scheme: string }[] = [];
    const re = /\s(href|src)\s*=\s*"([^"]*)"|\s(href|src)\s*=\s*'([^']*)'/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
        const attr = (m[1] || m[3] || '').toLowerCase();
        const value = m[2] ?? m[4] ?? '';
        const decoded = decodeEntities(value);
        const stripped = stripUrlWhitespace(decoded).trimStart();
        const scheme = stripped.split(':', 1)[0]?.toLowerCase() ?? '';
        if (scheme === 'javascript' || scheme === 'vbscript' || scheme === 'data') {
            if (scheme === 'data' && !/^\s*text\/html/i.test(stripped)) continue;
            out.push({ attr, decoded: stripped, scheme });
        }
    }
    return out;
}

for (const tc of PAYLOADS) {
    test(`CB-SEC-002 entity-decoded bypass (suradai): ${tc.name}`, () => {
        const out = sanitizeHtml(tc.input);
        const dangers = findDangerousHrefs(out);
        assert.equal(
            dangers.length,
            0,
            `sanitizer left dangerous URL after entity decoding: ` +
                `input=${JSON.stringify(tc.input)} output=${JSON.stringify(out)} ` +
                `dangers=${JSON.stringify(dangers)}`,
        );
    });
}

test('CB-SEC-002 entity-decoded bypass (suradai): legitimate javascript: text is preserved', () => {
    const out = sanitizeHtml('<p>The javascript: protocol is dangerous.</p>');
    assert.equal(out.includes('javascript:'), true, `over-stripped: ${out}`);
});

test('CB-SEC-002 entity-decoded bypass (suradai): legitimate image src survives', () => {
    const out = sanitizeHtml('<img src="https://cdn.example.com/x.png" alt="x">');
    assert.equal(/src="https:\/\/cdn\.example\.com\/x\.png"/i.test(out), true, `lost src: ${out}`);
});
