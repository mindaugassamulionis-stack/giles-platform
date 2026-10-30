#!/usr/bin/env node
/**
 * UAB „Gilės inžinerija“ — Stdio MCP Bridge for Claude Desktop / Claude Code / OpenCode
 * Speaks newline-delimited JSON-RPC 2.0 over stdin/stdout and forwards to /api/mcp with Bearer Auth.
 */
import readline from 'node:readline';

const PRODUCTION_MCP_ENDPOINT = 'https://gilesinzinerija.lt/api/mcp';
const LOCAL_DEV_PORT = process.env.PORT || '3088';
const LOCAL_MCP_FALLBACK = `http://127.0.0.1:${LOCAL_DEV_PORT}/api/mcp`;

const MCP_ENDPOINT =
    process.env.GILES_MCP_URL ||
    (process.env.NODE_ENV === 'development' ? LOCAL_MCP_FALLBACK : PRODUCTION_MCP_ENDPOINT);
const MCP_API_KEY = process.env.GILES_MCP_API_KEY || '';

async function postMcpRpc(payload, headers) {
    try {
        return await fetch(MCP_ENDPOINT, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });
    } catch (primaryErr) {
        if (!process.env.GILES_MCP_URL && MCP_ENDPOINT !== LOCAL_MCP_FALLBACK) {
            return await fetch(LOCAL_MCP_FALLBACK, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
        }
        throw primaryErr;
    }
}

const rl = readline.createInterface({
    input: process.stdin,
    terminal: false,
});

rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let parsed;
    try {
        parsed = JSON.parse(trimmed);
    } catch {
        process.stdout.write(
            JSON.stringify({
                jsonrpc: '2.0',
                id: null,
                error: { code: -32700, message: 'Parse error: invalid JSON on stdin' },
            }) + '\n',
        );
        return;
    }

    try {
        const headers = {
            'Content-Type': 'application/json',
            ...(MCP_API_KEY
                ? { Authorization: `Bearer ${MCP_API_KEY}` }
                : { 'X-Giles-Admin-Playground': '1', 'X-Giles-Playground-Scope': 'operator_safe' }),
        };

        const res = await postMcpRpc(parsed, headers);
        const data = await res.json();
        if (parsed.id !== undefined || data.error) {
            process.stdout.write(JSON.stringify(data) + '\n');
        }
    } catch (err) {
        process.stdout.write(
            JSON.stringify({
                jsonrpc: '2.0',
                id: parsed?.id ?? null,
                error: {
                    code: -32603,
                    message: `Failed to reach Giles MCP endpoint (${MCP_ENDPOINT}): ${err instanceof Error ? err.message : String(err)}`,
                },
            }) + '\n',
        );
    }
});
