// Client-side API path helper: all fetch() calls to this app's route
// handlers MUST go through apiUrl() so they respect the build-time
// NEXT_PUBLIC_BASE_PATH prefix (caddy path routing: /aurora, /suradai, …).
// Same convention as aura's src/lib/api.ts. Without it, fetch('/api/...')
// resolves against the origin root and 404s when the storefront is served
// under a path prefix (W13-V1-F2 / V1R-E2 live 404 evidence).

export function apiUrl(path: string): string {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    return `${basePath}${path}`;
}

// W26-P1 (B1 P2): plain <img src> does NOT get next/image's automatic
// basePath prefix — public/ assets (e.g. /images/products/{sku}.webp) 404
// when the storefront is served under a path prefix (/suradai). PDP main +
// related-item <img> must route through this.
// W26-P3 (C2 §R1 P2): next/image needs it TOO — its defaultLoader prefixes
// basePath only on the /_next/image endpoint, NOT inside the `url` param,
// so an un-prefixed local src 400s in the optimizer. Every <Image> with a
// root-relative product src must wrap it in assetUrl(). Semantics: only
// root-relative srcs are prefixed; remote/data URIs pass through unchanged.
export function assetUrl(path: string): string {
    if (!path) return '';
    const normalized = path.replace(/^\/suradai(?=\/images\/)/, '');
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    if (!basePath || !normalized.startsWith('/')) return normalized;
    if (normalized === basePath || normalized.startsWith(`${basePath}/`)) return normalized;
    return `${basePath}${normalized}`;
}
