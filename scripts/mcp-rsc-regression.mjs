// WP-W126-F3 RSC client-boundary regression gate for POST /api/mcp.
//
// apva_subsidy 500ed on every real build since 851f8a9: mcp-store-tools-exec
// imported calculateApvaSubsidyEstimate from the 'use client'
// apva-subsidy-widget, so the server held an RSC client-reference proxy
// instead of the function. tsx/vitest probes import the module directly and
// bypass that boundary (stayed green while HTTP was 500) — only a compiled
// `next start` server proves the route.
//
// Usage: node scripts/mcp-rsc-regression.mjs [--build]
//   env: MCP_PROBE_PORT (default 4217), NEXT_DIST_DIR (default .next-w126f3)
//   --build forces a fresh standalone build into NEXT_DIST_DIR.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const PORT = Number(process.env.MCP_PROBE_PORT || 4217);
const DIST = process.env.NEXT_DIST_DIR || '.next-w126f3';
const BUILD_LOG = path.join(ROOT, `${DIST}.build.log`);

// giles env be pasenusio DATABASE_URL – probe serveris neturi liesti DB.
function probeEnv() {
    const env = {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        LANG: process.env.LANG || 'C.UTF-8',
        NODE_ENV: 'production',
        NEXT_DIST_DIR: DIST,
        NEXT_TELEMETRY_DISABLED: '1',
    };
    const envFile = path.join(ROOT, '.env');
    if (existsSync(envFile)) {
        for (const line of readFileSync(envFile, 'utf-8').split('\n')) {
            const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
            if (!m) continue;
            if (m[1].startsWith('DATABASE_URL')) continue;
            env[m[1]] = m[2].replace(/^["']|["']$/g, '');
        }
    }
    // .env.example: šis diegimas – vienintelė parduotuvė giles-inzinierija;
    // instrumentation hook be STORE_SLUG/STORE_ID atsisako startuoti.
    if (!env.STORE_SLUG && !env.STORE_ID) env.STORE_SLUG = 'giles-inzinierija';
    return env;
}

function build() {
    console.log(`building into ${DIST} (log: ${DIST}.build.log) ...`);
    const r = spawnSync('npm', ['run', 'build'], {
        cwd: ROOT,
        env: { ...process.env, NEXT_DIST_DIR: DIST, NEXT_TELEMETRY_DISABLED: '1' },
        stdio: ['ignore', 'pipe', 'pipe'],
        maxBuffer: 32 * 1024 * 1024,
    });
    const out = `${r.stdout || ''}\n${r.stderr || ''}`;
    writeFileSync(BUILD_LOG, out);
    if (r.status !== 0) {
        console.error(`FAIL build exited ${r.status}; last lines:\n${out.split('\n').slice(-30).join('\n')}`);
        process.exit(1);
    }
}

function findKey(obj, key) {
    if (obj === null || typeof obj !== 'object') return undefined;
    if (key in obj) return obj[key];
    for (const v of Object.values(obj)) {
        const hit = findKey(v, key);
        if (hit !== undefined) return hit;
    }
    return undefined;
}

async function waitForServer(baseUrl, child, ms = 90000) {
    const deadline = Date.now() + ms;
    while (Date.now() < deadline) {
        if (child.exitCode !== null) throw new Error(`server exited early (code ${child.exitCode})`);
        try {
            const res = await fetch(`${baseUrl}/api/mcp`, { method: 'GET' });
            if (res.status === 200) return;
        } catch {}
        await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(`server not ready on ${baseUrl} within ${ms}ms`);
}

async function callTool(baseUrl, tool, args) {
    const res = await fetch(`${baseUrl}/api/mcp`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/call',
            params: { name: tool, arguments: args },
        }),
    });
    const text = await res.text();
    let body = null;
    try {
        body = JSON.parse(text);
    } catch {}
    return { status: res.status, body, text };
}

const main = async () => {
    const wantBuild = process.argv.includes('--build');
    if (wantBuild || !existsSync(path.join(ROOT, DIST, 'BUILD_ID'))) build();

    const env = probeEnv();
    const baseUrl = `http://127.0.0.1:${PORT}`;
    // detached: savo procesų grupė – kill(-pid) nužudo ir next-server vaiką.
    const child = spawn('npx', ['next', 'start', '-p', String(PORT), '-H', '127.0.0.1'], {
        cwd: ROOT,
        env,
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    let serverLog = '';
    child.stdout.on('data', (d) => (serverLog += d));
    child.stderr.on('data', (d) => (serverLog += d));

    let failures = 0;
    try {
        await waitForServer(baseUrl, child);
        console.log(`PASS server up on ${baseUrl}`);

        const apva = await callTool(baseUrl, 'public_hydronic_calculator_run', {
            calculatorType: 'apva_subsidy',
            powerKw: 8,
        });
        const grant = findKey(apva.body, 'estimatedGrantEur');
        if (apva.status === 200 && grant === 2365.52) {
            console.log(`PASS apva_subsidy: HTTP ${apva.status}, estimatedGrantEur=${grant}`);
        } else {
            failures++;
            console.error(
                `FAIL apva_subsidy: HTTP ${apva.status}, estimatedGrantEur=${grant}, body head: ${apva.text.slice(0, 300)}`,
            );
        }

        const heat = await callTool(baseUrl, 'public_hydronic_calculator_run', {
            calculatorType: 'heat_loss',
            areaM2: 120,
        });
        if (heat.status === 200) {
            console.log(`PASS heat_loss: HTTP ${heat.status}`);
        } else {
            failures++;
            console.error(`FAIL heat_loss: HTTP ${heat.status}, body head: ${heat.text.slice(0, 300)}`);
        }

        // /lt/skaiciuokle (SkaiciuokleNamui) suapvalina iki sveiko – centus
        // „2 365,52“ rodo APVA valdiklis hub puslapyje /lt/tools/silumos-skaiciuokle.
        const namui = await fetch(`${baseUrl}/lt/skaiciuokle`, { redirect: 'manual' });
        await namui.text();
        const page = await fetch(`${baseUrl}/lt/tools/silumos-skaiciuokle`, { redirect: 'manual' });
        const html = await page.text();
        // toLocaleString('lt-LT') tūkstančių skirtukas – NBSP (U+00A0), ne tarpas.
        const grantMarker = '2\u00a0365,52';
        if (namui.status === 200 && page.status === 200 && html.includes(grantMarker)) {
            console.log(
                `PASS pages: /lt/skaiciuokle ${namui.status}, APVA widget renders 2 365,52 € (${page.status})`,
            );
        } else {
            failures++;
            console.error(
                `FAIL pages: namui=${namui.status} widgetPage=${page.status} hasGrant=${html.includes(grantMarker)}`,
            );
        }
    } catch (e) {
        failures++;
        console.error(`FAIL probe: ${e.message}\nserver log tail:\n${serverLog.split('\n').slice(-15).join('\n')}`);
    } finally {
        if (child.pid) {
            try {
                process.kill(-child.pid, 'SIGTERM');
            } catch {}
            await new Promise((r) => setTimeout(r, 1500));
            try {
                process.kill(-child.pid, 'SIGKILL');
            } catch {}
        }
    }

    if (failures > 0) {
        console.error(`mcp-rsc-regression: ${failures} failure(s)`);
        process.exit(1);
    }
    console.log('mcp-rsc-regression: all probes green');
    process.exit(0);
};

main();
