# WP-W123-A2 — Storefront conversion: quick order pad, facet SEO landings, trust strip

Mission: `design-differentiation-20260926` · Work package: `WP-W123-A2` · Date: 2026-11-01
Sources: `W123-r3-competitor-teardown.md` + `W123-r3-top10-patterns.json` (ranks 2, 3, 9 of the TOP-10 copy-list).

## Pattern → source mapping

| Implemented feature | Teardown pattern (rank) | Source evidence | What we did NOT copy |
|---|---|---|---|
| „Greitasis užsakymas" quick order pad on `/[locale]/parduotuve` | #2 Copy&Paste / bulk quick-order pad | Grainger OMS user guide: „Quick Order Entry Pad … Copy lists … from a purchasing system, spreadsheet, e-mail … Paste them into the Copy & Paste tool" (grainger.com/videos/oms/pdf/userguide.pdf) | Grainger PunchOut/EDI/approval workflows — enterprise overkill for a 2-person team |
| Facet-URL SEO landing pages `/[locale]/parduotuve/<category>/<brand>` | #3 Facet-value clean URLs as SEO landing pages | McMaster-Carr: 488 facet URLs on one page, `/products/screws/tip-type~ball/` (mcmaster.com/products/screws/) | McMaster's per-value SVG icons and `~value` URL syntax — we use plain `/category/brand/` slugs from the existing taxonomy, capped at 56 pages |
| Trust strip under home hero | #9 Trust strip with concrete numbers | Senukai.lt home: „26 prekių atsiėmimo punktai · 45 min. … · >500 000 prekių"; McMaster: „98% ship same or next day" | Senukai promo-mugė noise and consumer-credit shouting on a B2B-relevant home |

## What shipped

### 1. Quick Order Pad (`src/lib/quick-order-pad.ts`, `src/components/quick-order-pad.tsx`, `src/app/api/quick-order/route.ts`)
- Collapsible panel above the catalog grid: header CTA „Greitasis užsakymas", `data-testid="quick-order-pad"`.
- Pure parser: tabs, commas, multi-space `SKU<TAB>qty` / `SKU qty`; bare SKU → qty 1; qty must be integer > 0; dedupe by SKU (sums quantities); cap 200 lines with truncation notice; CRLF tolerated.
- Resolution via existing `catalog-search-index` O(1) SKU lookup (`lookupCatalogProductO1`), read-only. Statuses: `rasta` / `nerasta` / `kaina pagal užklausą` (price-on-request rows stay out of the cart per the W121 honest-commerce contract) / `blogas kiekis`.
- „Įdėti viską į krepšelį" adds found rows to the existing zustand cart store (`useCartStore.addItem`), then opens the cart drawer. API caps input at 20 000 chars.

### 2. Facet-URL SEO landing pages (`src/lib/facet-landing.ts`, `src/app/[locale]/parduotuve/[id]/[brand]/page.tsx`)
- Top 7 categories × top 8 brands, hard cap 56 pages, every combo guaranteed > 0 products against the live 13 531-SKU index (37 combos currently — only non-empty ones emitted).
- Server-rendered: reuses `ProductGridClient`, unique H1 (`<brand> <category> – parduotuvė | Gilės Inžinerija`), 2-sentence intro with live counts (total / in-stock Kaunas / supplier 2–4 d. d.), canonical + 4-locale hreflang + x-default.
- Route note: nested under existing `/parduotuve/[id]` as `[id]/[brand]` — Next.js requires identical slug names at the same segment depth; `[id]` carries the category slug, URL is the canonical `/parduotuve/<category-slug>/<brand-slug>`.
- „Populiariausi gamintojai" chips (with product counts) on category pages (`src/app/[locale]/products/page.tsx`, which `/parduotuve` re-exports) and „Kiti gamintojai" chips on each landing page.
- `src/app/sitemap.ts`: +148 URLs (37 combos × 4 locales), each with full 4-locale alternates + x-default.
- No edits to `giles-catalog-snapshot.ts` / `catalog-search-index.ts` internals — new helper reads the index only.

### 3. Trust strip (`src/lib/trust-strip.ts`, inserted in `src/app/[locale]/page.tsx`)
- One line under the hero, `data-testid="store-trust-strip"`: „13 531 prekių · 28 sandėlyje Kaune · tiekėjo sandėlis 2–4 d. d. · ŠVOK inžinerija nuo 2011 m." — every number live from `catalog-count.ts` (never hardcoded), localized EN/PL/RU, no em dashes.
- „Nuo 2011 m." is the company's own established claim (DESIGN.md brand truth #1); in-stock count is the real warehouse number (28 at build time).

## Design contract

`REFERENCE_SYSTEM`: `mastercard` (per project `DESIGN.md` §1: warm cream `#F5F3EE` surfaces, graphite `#11161B` structural zones, single thermal accent `#C2410C`) + Viessmann/Danfoss/Hornbach/Screwfix trade-catalog ergonomics. New UI uses only existing tokens: Schibsted Grotesk + JetBrains Mono for SKU codes only, square corners, `#157A3B` reserved for the confirm/add-to-cart action. Dials per DESIGN.md: ENERGY 1 / RHYTHM 1-2 / MOTION 1 (hover states only).

## Verification evidence (2026-11-01)

- `npx tsc --noEmit` → exit 0.
- `npx vitest run` → 63 files, 597 tests, all pass (includes `src/lib/w123-a2-storefront-ux.test.ts`, 22 tests: parser happy/edge, facet combos > 0 products + caps + ASCII slugs, sitemap entries + hreflang, trust strip live counts + 4 locales + no em dash).
- `npm run build` → exit 0; routes `/[locale]/parduotuve/[id]/[brand]` (1.14 kB) and `/api/quick-order` present.
- Browser probe (e2e_check, real Chromium, `http://localhost:3001`): 33/33 checks, 0 console errors. Quick order: paste 3 lines (`MPB-NANI-35 2`, `030F6912 5`, `NOSUCH-999 3`) → „2 prekės rastos · 1 eilutės nerasta" → „Įdėti viską į krepšelį (2)" → cart drawer opens, toast „Prekės įdėtos į krepšelį". Facet page: H1 + 24 product cards + 7 brand chips SSR-rendered, canonical `https://gilesinzinerija.lt/lt/parduotuve/vamzdynu-jungtys-ir-armatura/herz` + hreflang lt/en/pl/ru/x-default in head. Trust strip: visible on `/lt`, `/en`, `/pl`, `/ru` with locale-correct text.
- Sitemap: 148 facet `<loc>` entries with per-entry 4-locale `xhtml:link` alternates.
- `ui_slop_meter` (commerce profile) on `/lt`, `/lt/parduotuve`, `/lt/parduotuve/vamzdynu-jungtys-ir-armatura/herz`: all `pass: true`, `problems: []` — 0 gradients / backdrop blur / emoji / em dashes / uppercase tracked labels, ≤ 2 font families, mono share ≤ 3.1 %, ≥ 6 product images above fold, no horizontal overflow, 0 swipe tables, 0 clipped text (desktop + mobile).
- Vision check (glm-4.6v) on shop + facet desktop screenshots: quick-order strip „visually integrated … coherent trade catalog"; facet page H1/intro/cards/„Su PVM" toggle confirmed, single `#C2410C` accent discipline held. One pre-existing nit (contrast of the „Visos 13 531 prekės" badge in the dark category bar, 3.6:1) predates this slice — reported, not touched.

## Files changed (this slice)

New: `src/lib/quick-order-pad.ts`, `src/components/quick-order-pad.tsx`, `src/app/api/quick-order/route.ts`, `src/lib/facet-landing.ts`, `src/app/[locale]/parduotuve/[id]/[brand]/page.tsx`, `src/lib/trust-strip.ts`, `src/lib/w123-a2-storefront-ux.test.ts`.
Modified: `src/app/[locale]/page.tsx` (trust strip), `src/app/[locale]/products/page.tsx` (quick order pad mount + brand chips), `src/app/sitemap.ts` (facet entries).

Untouched per constraints: admin components (parallel coder), `src/lib/giles-catalog-snapshot.ts` / `catalog-search-index.ts` internals, `src/middleware.ts`, auth/MCP files, `.env`.
