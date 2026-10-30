// W22-D1 T1 remainder: SKU paste tolerance for code-first search.
//
// Installers paste codes in real-world shapes — `88.20.411` (dotted),
// `7 736 900 742` (spaced EAN), `013G6075` (plain) — and sometimes several
// codes at once. Normalization strips separator noise so an exact/prefix
// match against a normalized SKU column can pin results; free-text queries
// pass through untouched for the ILIKE fallback.

const SEPARATOR_RE = /[\s.\-‑–—_/\\]+/g;

/** Uppercase, separator-stripped form of a single code. Empty → ''. */
export function normalizeSkuCode(raw: string): string {
    if (!raw) return '';
    return raw.replace(SEPARATOR_RE, '').toUpperCase();
}

export interface ParsedSkuQuery {
    /** Normalized codes parsed out of the query (deduped, order preserved). */
    codes: string[];
    /** Raw (trimmed) tokens as pasted — for display "Tikslus kodas" chips. */
    rawTokens: string[];
    /** True when more than one code was pasted. */
    isMultiCode: boolean;
    /** The original trimmed query (free-text fallback). */
    rawQuery: string;
}

// A "code-ish" token: after normalization still 4+ chars, at least one digit,
// no spaces left (by construction) — rejects ordinary words like "vožtuvas".
function looksLikeCode(normalized: string): boolean {
    return normalized.length >= 4 && /\d/.test(normalized) && /^[0-9A-Z]+$/.test(normalized);
}

// W22-D1 SECFIX F3 (security review §2 F3): parsed codes feed a SQL IN-list;
// cap the set so a huge paste cannot build an oversized IN query. Values are
// param-bound (drizzle), so this is a size bound, not an injection fix.
export const MAX_SKU_CODES = 20;

/**
 * Split a pasted query on comma/semicolon/newline (and, as fallback when the
 * whole input is whitespace-separated code-ish tokens, on whitespace runs).
 * Ordinary free text (words without digits) is NOT treated as codes.
 */
export function parseSkuQuery(raw: string): ParsedSkuQuery {
    const rawQuery = (raw ?? '').trim();
    if (!rawQuery) return { codes: [], rawTokens: [], isMultiCode: false, rawQuery };

    // Explicit list separators first…
    let tokens = rawQuery.split(/[,\n;]+/).map((t) => t.trim()).filter(Boolean);
    // …otherwise split whitespace only when EVERY chunk looks like a code
    // (handles "88.20.411 013G6075" pasted without commas, but keeps
    // "kampinis vožtuvas danfoss" as free text).
    if (tokens.length === 1 && /\s/.test(tokens[0])) {
        const wsTokens = tokens[0].split(/\s+/);
        if (wsTokens.length > 1 && wsTokens.every((t) => looksLikeCode(normalizeSkuCode(t)))) {
            tokens = wsTokens;
        }
    }

    const codes: string[] = [];
    const rawTokens: string[] = [];
    for (const token of tokens) {
        if (codes.length >= MAX_SKU_CODES) break; // F3: bound the IN-list.
        const normalized = normalizeSkuCode(token);
        if (!normalized || !looksLikeCode(normalized) || codes.includes(normalized)) continue;
        codes.push(normalized);
        rawTokens.push(token);
    }

    return { codes, rawTokens, isMultiCode: codes.length > 1, rawQuery };
}

const STOP_TOKENS = new Set(['ir', 'su', 'be', 'iki', 'nuo', 'ar', 'arba']);

function stripLtDiacritics(input: string): string {
    return input
        .replace(/[ąĄ]/g, 'a')
        .replace(/[čČ]/g, 'c')
        .replace(/[ęėĘĖ]/g, 'e')
        .replace(/[įĮ]/g, 'i')
        .replace(/[šŠ]/g, 's')
        .replace(/[ųūŲŪ]/g, 'u')
        .replace(/[žŽ]/g, 'z');
}

export function tokenizeHvacSearchQuery(rawQuery: string): string[] {
    const cleaned = (rawQuery ?? '')
        .trim()
        .replace(/[„“"'()[\],;]+/g, ' ');
    if (!cleaned) return [];

    const rawParts = cleaned
        .split(/[\s/+]+/)
        .map((t) => t.trim())
        .filter(Boolean);

    const tokens: string[] = [];
    for (const part of rawParts) {
        const lower = part.toLowerCase();
        if (STOP_TOKENS.has(lower)) continue;

        // Keep compound codes like 9330-06.800, 52-151-020, 013G2970, RA-N intact
        if (/^\d{2,4}-\d{2,3}/.test(part) || /^ra-[a-z0-9]+$/i.test(part)) {
            tokens.push(part);
            continue;
        }

        // Split hyphenated word pairs like "Statico-SD" into ["Statico", "SD"]
        if (part.includes('-') && /[a-zA-ZąčęėįšųūžĄČĘĖĮŠŲŪŽ]/.test(part)) {
            const subParts = part.split('-').map((s) => s.trim()).filter(Boolean);
            for (const sub of subParts) {
                if (!STOP_TOKENS.has(sub.toLowerCase())) {
                    tokens.push(sub);
                }
            }
            continue;
        }

        tokens.push(part);
    }

    return Array.from(new Set(tokens)).slice(0, 8);
}

export function expandHvacSearchTokenSynonyms(token: string): string[] {
    const raw = token.trim();
    if (!raw) return [];
    const lower = raw.toLowerCase();
    const ascii = stripLtDiacritics(lower);
    const variantsSet = new Set<string>([raw, lower]);
    if (ascii !== lower) variantsSet.add(ascii);

    // 1. Thermoelectric actuators ("termopavara" -> pavara / EMO T / AJAM / ABN)
    if (ascii.startsWith('termopavar') || ascii.startsWith('pavar') || ascii.startsWith('elektrotermin')) {
        variantsSet.add('termopavara');
        variantsSet.add('pavara');
        variantsSet.add('ajam');
        variantsSet.add('emo');
        variantsSet.add('abn');
    }

    // 2. Manifolds ("kolektorius" / "kolektoriai")
    if (ascii.startsWith('kolektor') || ascii.startsWith('sakotuv')) {
        variantsSet.add('kolektor');
        variantsSet.add('dynacon');
    }

    // 3. Mounting brackets / consoles ("konsolė" / "konsole")
    if (ascii.startsWith('konsol') || ascii.startsWith('laikikl')) {
        variantsSet.add('konsol');
        variantsSet.add('laikikl');
        variantsSet.add('pakabinamas');
        variantsSet.add('dsv');
    }

    // 4. Valves ("vožtuvas" / "voztuvas" / "vožtuvai" / "ventilis")
    if (ascii.startsWith('voztuv') || ascii.startsWith('ventil')) {
        variantsSet.add('vožtuv');
        variantsSet.add('ventili');
        variantsSet.add('eclipse');
        variantsSet.add('stad');
        variantsSet.add('ra-n');
    }

    // 5. Expansion vessels ("plėtimosi" / "išsiplėtimo" / "indas" / "statico")
    if (ascii.startsWith('issipletim') || ascii.startsWith('pletimos')) {
        variantsSet.add('išsiplėtimo');
        variantsSet.add('plėtimosi');
        variantsSet.add('statico');
        variantsSet.add('aquapresso');
    }
    if (lower === 'statico') {
        variantsSet.add('statico');
        variantsSet.add('išsiplėtimo');
        variantsSet.add('pneumatex');
    }
    if (lower === 'eclipse') {
        variantsSet.add('eclipse');
        variantsSet.add('dynacon');
        variantsSet.add('automatiniais balansiniais');
        variantsSet.add('3933');
        variantsSet.add('9330');
    }

    // 6. Loop count / port numbers ("4", "6", "8", "10", "12")
    if (/^(?:[2-9]|1[0-2])$/.test(lower)) {
        const num = Number(lower);
        const pad2 = String(num).padStart(2, '0');
        variantsSet.add(`${num} žied`);
        variantsSet.add(`${num} kont`);
        variantsSet.add(`-${pad2}.`);
    }

    // 7. Voltage / electrical tokens ("230V", "24V")
    if (/^(230|24)\s*v$/i.test(lower)) {
        const vNum = lower.replace(/v$/i, '').trim();
        variantsSet.add(`${vNum}V`);
        variantsSet.add(`${vNum} V`);
    }

    // 8. Brand / series tokens ("TA", "IMI", "SD", "EMO")
    if (lower === 'sd') {
        variantsSet.add('Statico-SD');
        variantsSet.add('Statico SD');
    }
    if (lower === 'emo') {
        variantsSet.add('EMO T');
        variantsSet.add('EMO');
        variantsSet.add('1837');
        variantsSet.add('1833');
    }
    if (lower === 'ta') {
        variantsSet.add('IMI TA');
        variantsSet.add('STAD');
        variantsSet.add('52-151');
    }
    if (lower === 'imi') {
        variantsSet.add('IMI');
        variantsSet.add('Heimeier');
        variantsSet.add('Pneumatex');
        variantsSet.add('STAD');
    }

    return Array.from(variantsSet).filter((s) => s.length >= 1);
}

export function matchesProductRecordForSearchToken(
    record: {
        titleLt?: string | null;
        titleEn?: string | null;
        descriptionLt?: string | null;
        sku?: string | null;
        brandName?: string | null;
    },
    token: string,
): boolean {
    const synonyms = expandHvacSearchTokenSynonyms(token);
    const haystackRaw = [
        record.titleLt || '',
        record.titleEn || '',
        record.descriptionLt || '',
        record.sku || '',
        record.brandName || '',
    ].join(' ');
    const haystackLower = haystackRaw.toLowerCase();
    const haystackAscii = stripLtDiacritics(haystackLower);

    return synonyms.some((syn) => {
        const synLower = syn.toLowerCase();
        const synAscii = stripLtDiacritics(synLower);
        if (synLower.length === 1 && /^[a-z]$/i.test(synLower)) {
            const wordRe = new RegExp(`(^|[^a-z0-9])${synLower}([^a-z0-9]|$)`, 'i');
            return wordRe.test(haystackLower);
        }
        return haystackLower.includes(synLower) || haystackAscii.includes(synAscii);
    });
}

export function scoreProductRecordForSearchQuery(
    record: {
        titleLt?: string | null;
        titleEn?: string | null;
        descriptionLt?: string | null;
        sku?: string | null;
        brandName?: string | null;
    },
    rawQuery: string,
): { matchedTokens: number; totalTokens: number; allTokensMatched: boolean } {
    const tokens = tokenizeHvacSearchQuery(rawQuery);
    if (tokens.length === 0) {
        return { matchedTokens: 0, totalTokens: 0, allTokensMatched: false };
    }
    let matchedTokens = 0;
    for (const token of tokens) {
        if (matchesProductRecordForSearchToken(record, token)) {
            matchedTokens++;
        }
    }
    return {
        matchedTokens,
        totalTokens: tokens.length,
        allTokensMatched: matchedTokens === tokens.length,
    };
}
