// WP3B-SHELL-FIX wire-level html shell gate (F-DEPLOY-1 regression guard).
//
// What it asserts (wire level, against `next start` output):
//   1. Response body BEGINS with <!DOCTYPE html>
//   2. Opening <html lang="lt|en"> tag present
//   3. hreflang alternates still rendered (rel=alternate links)
//   4. W22-D1-FIX1 (VERDICT.md R2.2/R2.6): banned-token gate with
//      inflection-tolerant Lithuanian stems — the old exact-word regex
//      (`rinkiniai`) missed declined forms like `rinkinius`. Stems are chosen
//      to avoid false positives on legitimate copy:
//        rinkin*            kids "sets" taxonomy (all cases)
//        mokslin(?!ink)    "scientific" inflections, but NOT "Mokslininkų g." street
//        atradim*           kids "discoveries" taxonomy
//        laboratorišk*      "laboratory-tested" kids copy (NOT "Laboratorijoje")
//        papild(ai|us|ams)  supplement taxonomy nom/acc/dat plural (genitive
//                           `papildų` collides with legacy legal copy — copy lane)
//        populiariaus* / dažnai perkama  volume/social-proof claims
//      Checked on rendered HTML (key routes) AND messages/*.json source so a
//      banned key fails CI before it ever renders.
//
// Reliable mechanism chosen (documented in WP3B-shell-fix-report.md):
// pages are force-dynamic (no prerendered .html to inspect at build time),
// so the only trustworthy wire proof is a served render. Requires a prior
// `next build`; the script starts the production server itself.
//
// Usage: node scripts/html-shell-check.mjs   (env: PORT, BASE_PATH)
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const PORT = Number(process.env.PORT || 3014);
const BASE_PATH = process.env.BASE_PATH || '';
const LOCALES = (process.env.LOCALES || 'lt,en').split(',');
const HOST = process.env.HOST || '127.0.0.1';

// DESIGN.md v3 §Visual direction BANNED + §Verification expectations.
const BANNED_TOKEN_RE = new RegExp(
    'rinkin|mokslin(?!ink)|atradim|laboratorišk|papild(ai|us|ams)|populiariaus|dažnai perkama',
    'iu',
);
// Extra rendered-HTML routes for the banned-token sweep (static paths only —
// PDP ids are data-dependent; listing/PDP share the copy surfaces).
const TOKEN_SWEEP_ROUTES = ['/lt/products', '/lt/atsargines-dalys', '/lt/tools/silumos-skaiciuokle', '/lt/uzklausa'];

const failures = [];
let child;

async function startServer() {
    child = spawn(
        process.execPath,
        ['./node_modules/next/dist/bin/next', 'start', '-p', String(PORT), '-H', HOST],
        { stdio: ['ignore', 'pipe', 'pipe'], env: process.env },
    );
    child.stdout.on('data', () => {});
    child.stderr.on('data', (d) => process.stderr.write(d));
    child.on('exit', (code) => {
        if (code && code !== 0) failures.push(`server exited early code=${code}`);
    });
    for (let i = 0; i < 60; i++) {
        try {
            const res = await fetch(`http://${HOST}:${PORT}${BASE_PATH}/lt`);
            if (res.status > 0) return; // any HTTP response = server ready
        } catch { /* not ready yet */ }
        await sleep(500);
    }
    failures.push(`server did not become ready on ${PORT}`);
}

async function stopServer() {
    if (!child) return;
    child.kill('SIGTERM');
    await sleep(300);
    child.kill('SIGKILL');
}

async function checkLocale(locale) {
    const url = `http://${HOST}:${PORT}${BASE_PATH}/${locale}`;
    const res = await fetch(url, { redirect: 'manual' });
    if (res.status !== 200) {
        failures.push(`${url}: expected 200, got ${res.status}`);
        return;
    }
    const body = await res.text();
    if (!/^\s*<!DOCTYPE html>/i.test(body)) {
        failures.push(`${url}: body does not start with <!DOCTYPE html> (first 80 chars: ${JSON.stringify(body.slice(0, 80))})`);
    }
    if (!body.includes(`<html lang="${locale}"`)) {
        failures.push(`${url}: missing <html lang="${locale}"> opening tag`);
    }
    if (!/rel="alternate"/i.test(body)) {
        failures.push(`${url}: hreflang alternates missing from rendered head`);
    }
    checkBannedTokens(body, url);
    console.log(`[html-shell] ${url} status=200 doctype=${/^\s*<!DOCTYPE html>/i.test(body)} lang=${body.includes(`<html lang="${locale}"`)} hreflang=${/rel="alternate"/i.test(body)} bytes=${body.length}`);
}

function checkBannedTokens(text, origin) {
    const m = text.match(BANNED_TOKEN_RE);
    if (m) {
        const i = text.search(BANNED_TOKEN_RE);
        failures.push(`${origin}: banned token "${m[0]}" (inflection-tolerant gate, DESIGN.md v3) near: ${JSON.stringify(text.slice(Math.max(0, i - 40), i + 40))}`);
    }
}

// Source-level sweep: messages/*.json for both locales — catches banned copy
// (e.g. `Ruošiame rinkinius…`) before it renders anywhere.
function checkMessages() {
    const dir = join(process.cwd(), 'messages');
    for (const locale of readdirSync(dir)) {
        const localeDir = join(dir, locale);
        let files;
        try { files = readdirSync(localeDir); } catch { continue; }
        for (const f of files) {
            if (!f.endsWith('.json')) continue;
            const p = join(localeDir, f);
            checkBannedTokens(readFileSync(p, 'utf8'), `messages/${locale}/${f}`);
        }
    }
}

try {
    checkMessages();
    await startServer();
    if (failures.length === 0) {
        for (const locale of LOCALES) await checkLocale(locale.trim());
        for (const route of TOKEN_SWEEP_ROUTES) {
            const url = `http://${HOST}:${PORT}${BASE_PATH}${route}`;
            const res = await fetch(url, { redirect: 'manual' });
            if (res.status !== 200) {
                failures.push(`${url}: expected 200, got ${res.status}`);
                continue;
            }
            checkBannedTokens(await res.text(), url);
            console.log(`[html-shell] ${url} status=200 banned-tokens=0`);
        }
    }
} finally {
    await stopServer();
}

if (failures.length) {
    console.error('[html-shell] FAIL');
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
}
console.log('[html-shell] PASS: doctype + lang + hreflang present on all locale routes; banned-token gate (stems incl. rinkin*) clean on rendered routes + messages');
