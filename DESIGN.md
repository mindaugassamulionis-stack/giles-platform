# Gilės Inžinerija & EGIP.lt — Design System Contract (`DESIGN.md` · V1 „Šiluma ir tikslumas“)

- **Project Root:** `/home/mindu/Desktop/giles`
- **Canonical Implementation Target:** `/home/mindu/Desktop/giles/giles-platform`
- **Unpacked Reference Artboards:** `/home/mindu/Desktop/giles/design-artboards/` (`redizainas/` 10 artboards + `logo/` 5 logo boards)
- **Studio Asset Pack:** `/home/mindu/Desktop/giles/studio-assets/` (`logos/` + `products/`)
- **Legal Entity:** UAB „Gilės inžinerija“ · Įmonės kodas `302620907` · Žirmūnų g. 68, Vilnius · `+370 693 97098` · `info@gilesinzinerija.lt` · Veikia nuo 2011 m.

---

## 0. Design Brief (`design-quality-loop` Step 0)

- **Who buys, what job, what objection:**
  - **Homeowner (B2C):** Wants to stop loading firewood every 4 hours by converting an existing solid-fuel boiler to automatic pellets or installing a complete 15–35 kW boiler / R290 heat pump room; fears buying incompatible parts or getting stuck without winter service.
  - **Industrial & Commercial Buyer (B2B Industrial):** Needs a 150 kW – 2 MW containerized or modular boiler house (bought or rented) for a factory, warehouse, or construction site; objects to opaque pricing and slow engineering response times.
  - **HVAC Installer & Contractor (B2B Partner):** Orders boilers, burners, manifolds, pumps, and expansion vessels by SKU code for multiple active job sites (`Objektai`); objects to retail-only pricing, slow checkout, and missing VAT-excluded (`be PVM`) views.
- **Brand Truths (3 verifiable facts only Gilės Inžinerija can claim):**
  1. **Operating since 2011 in Vilnius (Žirmūnų g. 68)** as both an engineering contractor and equipment supplier — we design, manufacture, install, and service what we sell.
  2. **Proprietary boiler conversion & mobile boiler house expertise:** Complete solid-fuel-to-pellet conversion kits (`Pelltech`, `Megatherm`, `MPB NANI / PRO`, `Viadrus` transformation kits) and containerized mobile boiler rooms (`15–90 kW` hot air, `150–500 kW` and up to `2 MW` hydronic, available for purchase or rental).
  3. **Real warehouse & OEM technical depth:** Direct B2B/B2C distribution of `Centrometal`, `Buderus`, `Viessmann`, `Danfoss`, `IMI Hydronic (TA / Heimeier / Pneumatex)`, `HERZ`, `Wilo`, `Grundfos`, `Comisa`, `Dražice`, `Gorenje / TIKI`, and `Haier Super Aqua R290`.
- **Tone in 3 words:** `Šiltas, tikslus, inžinerinis` (Warm, exact, engineering-grade).
- **3 words it must NOT be:** `Blizgus, šabloniškas, korporatyvinis` (Flashy, templated, generic corporate).
- **First screen focus & primary action:**
  - **Headline:** `Šiluma, kuri veikia pati.` (≤ 5 words, immediate outcome).
  - **Dual self-routing entry cards:**
    1. `PARDUOTUVĖ →` **Man reikia įrangos** (*Katilai, degikliai, automatika, vėdinimas ir instaliacija*) -> routes directly to the technical catalog.
    2. `SPRENDIMAS →` **Man reikia sprendimo** (*Keturi klausimai – komplektas ir orientacinė kaina*) -> routes directly to the 4-step Boiler Conversion & Sizing Wizard.
  - **Interactive Visual Anchor:** 5-hotspot clickable boiler room schematic (`01 Granulių bunkeris ir tiektuvas`, `02 Granulių degiklis`, `03 Automatika ir valdymas`, `04 Katilas`, `05 Šildymo kontūras`) that explains the physical system and links each node to its catalog category.

---

## 1. Reference System & Benchmark (`design-quality-loop` Step 1 & `commerce-catalog-design` §1)

- **`REFERENCE_SYSTEM`:** `mastercard` (`~/.opencode/design-library/systems/mastercard` — warm cream paper canvas, deep charcoal/graphite structural anchors, warm ember-orange accent discipline, crisp geometric sans hierarchy) combined with Scandinavian/DACH industrial & trade catalog benchmarks (`Viessmann`, `Danfoss`, `Grundfos`, `Hornbach`, `Screwfix`, and Lithuanian `fill.lt` faceted filter taxonomy).
- **`REFERENCE_TAKES`:**
  1. **Warm Paper & Stone Surfaces (`#F5F3EE` / `#EEEBE4` / `#FFFFFF`):** Replaces sterile hospital-white and generic dark-mode SaaS templates with Scandinavian engineering warmth. Product photos sit inside `1:1` `#EEEBE4` / `#FAF9F6` wells with `1px solid #E2DDD3` structural borders.
  2. **High-Contrast Graphite Engineering Zones (`#11161B` / `#1B232C`):** Used intentionally for the hero schematic section, industrial container boiler house showcase, persistent calculator summary sidebar, PDP boiler compatibility widget, and B2B installer sidebar.
  3. **Single Thermal Accent (`#C2410C` on light / `#FF8A3D` on dark):** Represents controlled combustion and heat (`Šiluma`). Never diluted with secondary decorative colors; used strictly on primary CTAs, active indicators, schematic hotspots, and the acorn cap mark.
  4. **Baymard + `fill.lt` Trade Catalog Ergonomics:** Instant `Su PVM` / `Be PVM` (`/ 1.21`) segmented toggle in the catalog toolbar, monospace SKU codes (`JetBrains Mono`), 2–3 technical spec chips per card (`8–35 kW`, `Granulės`, `Moduliuojantis`), 3-state stock dots, and category-specific filter facets (`Gamintojas`, `Galia kW`, `Kuras`, `DN / Sriegis`, `Tik turimos sandėlyje`).

---

## 2. Three-Surface Ecosystem Architecture

The platform unifies three specialized commercial surfaces under one design system and shared data plane:

### Surface 1: `Gilės Inžinerija` — Corporate & Industrial Engineering Portal
- **Target Routes / Artboards:**
  - `Artboard 1` (`1aafa9f2...__Gil_s_In_inerija_pradinis_puslapis.html`) — Unified Home, Interactive 5-Hotspot Boiler Schematic, Solutions Overview (`Kieto kuro katilo perdarymas į granulinį` 4-step flow), Measured Case Studies (`PROJEKTAI` with `Galia` / `Kuras` / `Rezultatas`), Knowledge Center (`ŽINIŲ CENTRAS`), and Engineer Consultation Strip (`+370 693 97098`).
  - `Artboard 2` (`dbc59ebd...__Sprendimo_vedlys_katilo_perdarymas.html`) — **Interactive 4-Step Solution Wizard (`Sprendimo vedlys: katilo perdarymas`)**:
    - Step 1 (`Pastatas`) -> Step 2 (`Plotas` with live `@ ~100 W/m²` kW estimation) -> Step 3 (`Dabartinis katilas`) -> Step 4 (`Prioritetas`) -> Step 5 (`Rezultatas`: itemized bundle table, `#FBEADF` alternative notice, `Įdėti komplektą į krepšelį` CTA, and inline `Užsakyti apžiūrą objekte` form with boiler photo upload).
  - `Artboard 3` (`7d37486d...__Pramonei_konteinerin_s_katilin_s.html`) — **Industrial Containerized Boiler Rooms (`Pramonei: konteinerinės katilinės`)**:
    - Dark `#11161B` hero (*„Katilinė, kuri atvažiuoja pas jus.“*) with 3-hotspot container schematic (`01 Mobilus kuro bunkeris`, `02 Automatinis padavimas`, `03 Degimo kamera`).
    - Interactive **Buy vs. Rent (`Pirkti` / `Nuomotis`)** segmented toggle switching between permanent industrial use-cases and temporary/emergency rental use-cases (`15–90 kW` hot air, `150–500 kW` and up to `2 MW` hydronic).
    - 4-fuel capability grid (`Medienos granulės`, `Medienos atliekos`, `Durpės`, `Dujos`), technical model matrix (`MODELIAI`) with monospace dimensions and PDF datasheet links, 6-step delivery timeline (`01 Užklausa` -> `06 Servisas`), and B2B RFQ form (`#uzklausa`).

### Surface 2: `EGIP.lt` — LLM-First HVAC & Boiler E-Shop
- **Target Routes / Artboards:**
  - `Artboard 4` (`eaee8846...__Parduotuv_katilai_ir_katilin_s_ranga.html`) — **Category & Technical Catalog (`Parduotuvė`)**:
    - 8 core categories + 5-column Mega-Menu (`Šildymas`, `Vėdinimas ir vėsinimas`, `Automatika`, `Santechnika`, `Pramonei`).
    - Subcategory pill bar (`999px` radius) with item counts.
    - `260px` left filter sidebar (`#FFFFFF`, `1px solid #E2DDD3`, `16px` radius) combining artboard facets (`Gamintojas`, `Galia kW` chips, `Kuras`, `Tik turimos sandėlyje`) with `fill.lt` technical parameters (`DN`, `Sriegis`, `Kvs`, `Tūris L`).
    - Toolbar with item counter, segmented **VAT Toggle (`Su PVM` / `Be PVM`)**, sort selector, and sticky dark compare bar (`Palyginimui pasirinkta: N`).
  - `Artboard 5` (`396a0e1b...__Prek_Megatherm_granuli_degiklio_komplektas.html`) — **Product Detail Page (`Prekės kortelė`)**:
    - Left `1:1` `#EEEBE4` studio gallery (`20px` radius) + 4-thumbnail view switcher (`Komplektas`, `Degiklis`, `Kuro tiekimo sraigtas`, `Montavimo plokštė`).
    - Right buy-box: Manufacturer + monospace SKU, H1 title, 3-cell spec strip, `40px` `Schibsted Grotesk` 800 price (`su PVM` + `be PVM` + monthly leasing note), **3-Option Purchase Mode Selector** (`1. Tik įranga +0 €`, `2. Su montavimu ir paleidimu`, `3. Pirmiausia apžiūra`), quantity stepper + adaptive `#C2410C` `56px` CTA, and **Dark Boiler Compatibility Checker Widget (`#11161B`)** (*„Ar tiks mano katilui?“*).
    - 4 below-the-fold tabs (`Aprašymas` with `Kas komplekte` checklist, `Techniniai duomenys`, `Dokumentai` PDF cards, `Montavimas` 4-step timeline) + `Dažnai perkama kartu` cross-sell row.
  - `Artboard 6` (`93b24abe...__Krep_elis_ir_apmok_jimas.html`) — **Single-Page Checkout (`Krepšelis ir apmokėjimas`)**:
    - Step 1 (`Pirkėjas`): `Privatus asmuo` / `Įmonė` toggle with Registrų centras company code auto-fill (`Rasti`).
    - Step 2 (`Pristatymas`): Pickup at Žirmūnų g. 68 (`Nemokamai`), Courier, Freight with tail-lift unloading (`Krovinio pristatymas su iškrovimu`), and automatic oversized item guard disabling parcel lockers (`Paštomatas — Netinka: krepšelyje yra didelių gabaritų prekė` in `#8A2F07`), plus `#FBEADF` installation add-on banner.
    - Step 3 (`Apmokėjimas`): Bank link, Card/Apple Pay/Google Pay, Proforma invoice, Leasing, plus conditional B2B 5th option `Atidėtas mokėjimas (B2B klientams pagal sutartį)`.
  - `Artboard 7` (`9e22cbed...__Mobili_parduotuv.html`) — **Dedicated Mobile Storefront (`390×844`)**:
    - Sticky compact header with `44×44px` click-to-call button (`tel:+37069397098`), full-width `50px` search input, 2-column split hero tiles (`PARDUOTUVĖ` `#11161B` | `VEDLYS` `#C2410C`), horizontal compact product cards (`96×96px` `#EEEBE4` thumb + `+` cart button), and fixed 5-tab bottom navigation bar (`Pradžia`, `Katalogas`, `Vedlys`, `Krepšelis`, `Paskyra`).

### Surface 3: `Montuotojų B2B & Kainynų Valdymo Centras`
- **Target Routes / Artboards:**
  - `Artboard 8` (`fcdd55b5...__Montuotoj_B2B_portalas.html`) — **Installer B2B Portal (`Montuotojų B2B portalas`)**:
    - `240px` `#11161B` dark left sidebar with partner badge (`[Įmonė], UAB · Partneris`), 8-item navigation (`Apžvalga`, `Greitas užsakymas`, `Užsakymai`, `Sąskaitos`, `Objektai`, `Kainoraščiai`, `Dokumentai`, `Komanda`), and dedicated account manager contact card (`Jūsų vadybininkas`).
    - 4 KPI cards (`Kredito limitas` with utilization bar, `Neapmokėtos sąskaitos`, `Vykdomi užsakymai`, and dark `#11161B` `Jūsų nuolaida -X%` card).
    - **Quick Order (`Greitas užsakymas`) Table:** Monospace SKU entry, instant product/stock resolution, partner net price, `+ Pridėti eilutę`, `Įkelti CSV / Excel`, and `Pakartoti paskutinį`.
    - **Construction Sites (`Objektai`) & Order Ledger:** Groups orders and PDF VAT invoices by project site (`Objektas 1`, `Objektas 2`, `+ Naujas objektas`).
  - `Artboard 9` (`99d4120f...__Integracij_architekt_ra.html`) — **Integrations & Price List Control Plane (`Integracijų architektūra`)**:
    - Connects ERP (`Rivilė / Centas / B1.lt`), Supplier Price Lists (`Price List Giles 2025.xlsx` with 35% B2B discount structure, `Danfoss Climate Solutions kainynas`, `GORENJE / TIKI`, `Haier TOP 2026-2`), PIM, and Registrų centras / VIES into the headless commerce & B2B pricing engine.

---

## 3. Locked Design Tokens (`Dizaino sistema · V1`)

All CSS custom properties must be declared on `:root` in `globals.css` / `tokens.css`. Raw hex values outside token definitions are forbidden.

### 3.1 Color Tokens

```css
:root {
  /* Core Surfaces (Light Mode Default — "Šiltai balta") */
  --bg: #F5F3EE;                  /* Šiltai balta — global page background, input wells, spec chips */
  --surface: #FFFFFF;             /* Balta — cards, filter sidebar, checkout panels, tables */
  --surface-well: #EEEBE4;        /* Prekės nuotraukos fonas — 1:1 and 4:3 product studio wells */
  --surface-control: #E7E3DB;     /* Segmented controls (Su PVM / Be PVM, Pirkti / Nuomotis) */
  --surface-zebra: #FAF9F6;       /* Table alternating rows & studio canvas radial center */

  /* Core Dark Surfaces ("Grafitas" — Hero, Industrial, B2B Sidebar, Compatibility Widget) */
  --bg-dark: #11161B;             /* Grafitas — primary dark sections, primary text, secondary CTA */
  --surface-dark: #1B232C;        /* Grafitas 2 — elevated cards & inputs inside dark sections */
  --bg-utility: #0B0F13;          /* Ultra-dark top utility bar & footer background */

  /* Typography Colors */
  --fg: #11161B;                  /* Primary heading & UI text (15.8:1 on #F5F3EE) */
  --fg-body: #2A323B;             /* Long-form body copy & descriptions */
  --fg-chip: #3A4652;             /* Technical spec chip text */
  --muted: #5B6470;               /* Antrinis tekstas — labels, SKU meta (5.4:1 AA pass on #F5F3EE) */
  --fg-on-dark: #FFFFFF;          /* Primary headings on #11161B */
  --fg-body-on-dark: #C9D0D8;     /* Secondary body copy on #11161B */
  --muted-on-dark: #A3ADB8;       /* Muted metadata & wordmark subtitle on #11161B */

  /* Borders & Dividers */
  --border: #E2DDD3;              /* Primary card border, section divider, table line (1px solid) */
  --border-strong: #D5CFC3;       /* Form inputs, search bar, unselected pill chips, secondary buttons */
  --border-dashed: #C9C2B4;       /* File upload dropzones (RFQ & boiler inspection) */
  --border-dark: #2C3742;         /* Card & schematic borders inside #11161B dark zones */
  --border-dark-strong: #3A4652;  /* Input borders inside #11161B dark zones */

  /* Brand Thermal Accent ("Šiluma") */
  --accent: #C2410C;              /* Šiluma — primary CTA, light-bg eyebrows, active tab, acorn cap */
  --accent-hover: #A9380A;        /* Hover state for primary CTA */
  --accent-on-dark: #FF8A3D;      /* Šiluma tamsoje — eyebrows, schematic hotspots & acorn cap on #11161B */
  --accent-tint: #FBEADF;         /* Šilumos atspalvis — callout banners (B2B strip, installation add-on) */
  --accent-tint-fg: #6E2A0A;      /* Text on #FBEADF warm callout banners (#5A1F05 / #8A2F07) */

  /* Semantic Stock & Order Status Tokens */
  --status-in-stock: #157A3B;     /* Yra sandėlyje — dot & text */
  --status-in-stock-bg: #E3F1E8;  /* Order confirmed / added-to-cart pill background */
  --status-in-stock-fg: #0F5A2B;  /* Text on --status-in-stock-bg */
  --status-supplier: #8A5300;     /* Pas tiekėją · 3–7 d. d. — dot & text */
  --status-supplier-bg: #FFF1D6;  /* Awaiting payment badge background */
  --status-supplier-fg: #7A4A00;  /* Text on --status-supplier-bg */
  --status-mto: #5B6470;          /* Gaminama pagal užsakymą — dot & text */
  --status-shipped-bg: #E1EAF3;  /* Išsiųsta badge background */
  --status-shipped-fg: #1F4A73;   /* Text on --status-shipped-bg */
}
```

### 3.2 Typography & Hierarchy Scale

| Role | Token | Font Family | Weights | Size & Fluid Scale | Line-Height | Tracking | Rules |
|---|---|---|---|---|---|---|---|
| **Display Hero (H1)** | `--font-display` | `Schibsted Grotesk` | `800` | `clamp(44px, 5.6vw, 80px)` | `0.98` | `-0.03em` | Max 1 per page; never apply gradient text or italic serif words |
| **Page Title (H1)** | `--font-display` | `Schibsted Grotesk` | `800` | `clamp(32px, 4vw, 52px)` | `1.02–1.04` | `-0.025em` | Category, Calculator, Industrial, Checkout, and B2B headers |
| **Section Heading (H2)** | `--font-display` | `Schibsted Grotesk` | `800` | `clamp(32px, 3.6vw, 48px)` | `1.05` | `-0.02em` | Major page sections |
| **Card / Subheading (H3)** | `--font-display` | `Schibsted Grotesk` | `700` | `20px–22px` | `1.20–1.25` | `-0.01em` | Solution cards, case studies, PDP tabs (`text-wrap: balance` mandatory on all `h1, h2, h3`) |
| **Product Card Title** | `--font-body` | `Inter` | `600` | `15px` | `1.35` | `0` | Never negative tracking on small text; apply `text-wrap: balance` to prevent stub last lines |
| **Price — Buybox / Hero** | `--font-display` | `Schibsted Grotesk` | `800` | `40px` (PDP), `28px–30px` (Wizard/Checkout), `22px` (Card) | `1.0` | `-0.02em` | Always paired with explicit `su PVM` or `be PVM` label |
| **Body Lead** | `--font-body` | `Inter` | `400` | `18px` | `1.60` | `0` | Max line width `62ch–72ch` |
| **Body Standard** | `--font-body` | `Inter` | `400` | `16px` | `1.60` | `0` | Product descriptions, technical notes |
| **UI Controls / Nav / Forms** | `--font-body` | `Inter` | `500, 600` | `14px–15px` | `1.40` | `0` | Buttons, inputs, filter checkboxes, table cells |
| **Technical Codes / SKUs / Eyebrows** | `--font-mono` | `JetBrains Mono` | `400, 500` | `11px–13px` | `1.40` | `0.08em–0.12em` (caps) / `0` (SKUs) | Used strictly for SKU codes (`Kodas: degkmpl140mg20`), dimensions (`[__ × __ × __] m`), step indices (`01`–`06`), and short 1–2 word section labels (`PARDUOTUVĖ`, `SPRENDIMAI`). Monospace share must stay `<= 5%` of visible page text. |

### 3.3 Spacing, Radii, Elevation & Interaction Tokens

- **Container & Grid:**
  - `--container-max: 1280px` (`1200px` on Checkout), horizontal padding `clamp(16px, 4vw, 32px)`.
  - Desktop Catalog Grid: `260px` left filter sidebar + `1fr` content area (`3` product cards per row, `gap: 16px`).
  - Homepage Category Grid: `4` columns on desktop (`repeat(4, minmax(0, 1fr))`), `2` on tablet, `1–2` on mobile.
- **Spacing Scale:** `8px · 12px · 16px · 24px · 40px · 96px` (section vertical padding `clamp(56px, 7vw, 96px)`).
- **Border Radii:**
  - `--radius-sm: 10px` — buttons, form inputs, segmented toggle buttons, small badges.
  - `--radius-md: 14px` to `16px` — product cards, category cards, filter sidebar, checkout panels.
  - `--radius-lg: 18px` to `20px` — large feature cards, PDP studio image gallery, technical tables.
  - `--radius-xl: 24px` — B2B partner banner, studio canvas outer frame.
  - `--radius-pill: 999px` — subcategory filter chips and status pills.
- **Touch & Click Targets:** Minimum `44×44px` on all interactive controls (`46px` inputs, `48px–56px` primary CTAs).
- **Elevation & Focus States:**
  - Default cards sit flat (`box-shadow: none`, `border: 1px solid #E2DDD3`).
  - Hover elevation (`.card:hover`): `box-shadow: 0 14px 36px rgba(17, 22, 27, 0.10); transform: translateY(-2px); transition: box-shadow 0.2s ease, transform 0.2s ease`.
  - Button hover (`.btn:hover`): `filter: brightness(1.08); transition: filter 0.15s ease`.
  - Keyboard Focus (`*:focus-visible`): `outline: 2px solid #C2410C` (`#FF8A3D` inside `.dk` dark sections), `outline-offset: 3px`.

---

## 4. Logo System & Brand Marks (`/home/mindu/Desktop/giles/studio-assets/logos/`)

All 5 logo variants from the owner's brand study (`Gilės Inžinerija – logo.html` / `.pdf`) are extracted and validated in `/home/mindu/Desktop/giles/studio-assets/logos/`:

| Asset File | Variant Name | Status & Role | Technical Construction |
|---|---|---|---|
| `logo-a-gile-liepsna.svg`<br>`logo-a-gile-liepsna-dark.svg`<br>`logo-a-icon.svg` | **Variantas A · Gilė-liepsna** | **PRIMARY RECOMMENDED LOGO** (used across all 10 redesign artboards) | Geometric acorn (`cap` `#C2410C` light / `#FF8A3D` dark, `nut` `#11161B` light / `#F5F3EE` dark) with negative-space inner flame cutout (`M32 35.5...`) + stacked `GILĖS` (`Schibsted Grotesk` 800) / `INŽINERIJA` (`Schibsted Grotesk` 600, tracking `0.42em`). Scales cleanly down to `16×16px` favicon and metallic boiler rating plates (`ĮRENGINIO LENTELĖ`). |
| `logo-b-verzle.svg` | **Variantas B · Veržlė** | **Secondary Industrial / B2B Badge** | Acorn mark inside a hexagonal engineering nut (`M32 5L55.4 18.5V45.5L32 59L8.6 45.5V18.5Z` in `#11161B`) + inline `GILĖS INŽINERIJA` wordmark and `ŠILDYMAS · KATILINĖS · NUO 2011` (`JetBrains Mono`). Ideal for industrial container boiler house nameplates and B2B stamps. |
| `logo-c-e-su-gile.svg` | **Variantas C · Ė su gile** | **Workwear & Merch Wordmark** | Lowercase `giles` (`Schibsted Grotesk` 800, `-0.045em`) where the diacritic dot on `ė` is replaced by a tilted `#C2410C` / `#FF8A3D` acorn, with `inžinerija` below. Designed for chest embroidery on installer workwear (`DARBO APRANGA`). |
| `logo-d-zalia-evoliucija.svg` | **Variantas D · Žalia evoliucija** | **Heritage Green Evolution** | Modernized geometric evolution of the 2011 green palette (`#2F5A17` forest cap with `#5E8A2A` texture ribs + `#7AA02C` / `#A9CC52` nut body). Retained as an eco/biomass campaign variant. |
| `logo-current-original.png` | **Dabartinis logotipas (2011)** | **Legacy Baseline Reference** | Original `386×172` (`6,809` bytes) raster PNG with lime swirl and purple serif `GILĖS`. Retired on new digital surfaces due to poor contrast on `#11161B` and loss of legibility below `32px`. |

---

## 5. Studio Product Photography Standard (`/home/mindu/Desktop/giles/studio-assets/products/`)

Per the owner's directive (*„nepamirsk kad nuotraukas apdirbsi jei jos nekokyybiskos pritaikysi bendram dizainui parduotvues“*), raw supplier images from `Price List Giles 2025.xlsx` (`xl/media/*`) and `gilesinzinerija.com` must never be dumped directly onto pages with mismatched white/grey/noisy borders.

### 5.1 Harmonization Specification
1. **Canvas Geometry:** `1000×1000` square `.webp` (`quality=92`), radial studio lighting (`#FAF9F6` center -> `#EEEBE4` edge) with `2px solid #E2DDD3` inset frame (`radius=24px`) and subtle studio horizon line (`y=810`).
2. **Foreground Isolation & Enhancement:**
   - Trim noisy Excel/scanner borders, isolate equipment from white/grey backgrounds via feathered alpha matting, and apply `autocontrast(cutoff=0.5)`, `Contrast(1.07)`, `Color(1.04)`, and `UnsharpMask(radius=1.3, percent=115, threshold=3)`.
   - Render a soft elliptical studio contact shadow (`rgba(17, 22, 27, 0.18)`, Gaussian blur `radius=16px`) beneath the equipment base.
   - Full outdoor project photos (container boiler rooms) are framed inside an `820×600` rounded architectural viewport (`radius=20px`, `border: 2px solid #D5CFC3`) with studio elevation shadow.
3. **Consistent Studio Badges & Spec Bar:**
   - **Top-Left Brand Pill:** `#11161B` dark pill (`GILĖS INŽINERIJA · PRO LINE`) with the `#FF8A3D` / `#F5F3EE` acorn emblem.
   - **Top-Right Category & Power Pill:** `#FFFFFF` pill (`border: 1px solid #E2DDD3`) with `#C2410C` indicator dot and monospace category/kW range (e.g., `GRANULIŲ DEGIKLIS · 10–50 kW`).
   - **Bottom Technical Spec Bar:** `#FFFFFF` card (`y=846..950`, `radius=16px`, `#C2410C` left accent bar) displaying product title in `22px` bold and `MODELIS: <SKU> · <Key Engineering Specs>` in `14px` monospace.

### 5.2 Catalog of 30 Harmonized Studio Visuals (`/home/mindu/Desktop/giles/studio-assets/products/`)

Full metadata is machine-readable in `/home/mindu/Desktop/giles/studio-assets/products/studio-assets-manifest.json`:

| # | Studio File (`1000×1000` `.webp`) | SKU / Model Series | Category & Power Badge | Primary Target Surface |
|---|---|---|---|---|
| 01 | `giles-studio-01-mpb-nani-35-50.webp` | `MPB NANI 35 / NANI 50` | `GRANULIŲ DEGIKLIS · 10–50 kW` | Sprendimo vedlys / Parduotuvė |
| 02 | `giles-studio-02-mpb-60-80-burner.webp` | `MPB 60 / MPB 80` | `GRANULIŲ DEGIKLIS · 25–80 kW` | Parduotuvė / Katilo perdarymas |
| 03 | `giles-studio-03-mpb-150-450-pro.webp` | `MPB 150 / 250 / 450 PRO` | `PRAMONINIS DEGIKLIS · 50–450 kW` | Pramonei / B2B portalas |
| 04 | `giles-studio-04-viadrus-conversion-kit.webp` | `VIADRUS-KIT-4-10` | `PERDARYMO KOMPLEKTAS · 15–50 kW` | Sprendimo vedlys: katilo perdarymas |
| 05 | `giles-studio-05-pelltech-pv20a-kit.webp` | `degkmpl140pv20` | `NORD KOMFORTUI · 10–30 kW` | Pradinis puslapis / Prekės kortelė |
| 06 | `giles-studio-06-megatherm-burner-kit.webp` | `degkmpl140mg20` | `LINK LYDERIŲ · 8–35 kW` | Prekės kortelė (Artboard 5) |
| 07 | `giles-studio-07-agro-pellet-burner-50kw.webp` | `degkmpl50kv` | `AGRO / MEDIENOS GRANULĖS · 15–50 kW` | Parduotuvė / Sprendimo vedlys |
| 08 | `giles-studio-08-ecobio-res-25-100.webp` | `ECO BIO RES 25–100` | `BIOMASĖS KATILAS · 25–100 kW` | Parduotuvė / Katalogas |
| 09 | `giles-studio-09-mcl-bio-r-120-900.webp` | `MCL BIO-R 120–900` | `PRAMONINIS KATILAS · 139–1044 kW` | Pramonei / Konteinerinės katilinės |
| 10 | `giles-studio-10-profi-pellet-150-400.webp` | `PROFI PELLET 150–400` | `PRAMONINIS KATILAS · 150–400 kW` | Pramonei / B2B portalas |
| 11 | `giles-studio-11-profi-bio-150-400.webp` | `PROFI BIO 150–400` | `SKIEDRA IR BIOKURAS · 150–400 kW` | Pramonei / Konteinerinės katilinės |
| 12 | `giles-studio-12-plc-mini-compact-25-250.webp` | `PLC MINI / PLC 25–250` | `GRANULINIS KATILAS · 25–250 kW` | Parduotuvė / Sprendimo vedlys |
| 13 | `giles-studio-13-ecotwin-25-100.webp` | `ECOTWIN 25–100` | `MALKOS + GRANULĖS · 25–100 kW` | Parduotuvė / Sprendimo vedlys |
| 14 | `giles-studio-14-profi-duo-150-400.webp` | `PROFI DUO 150–400` | `PRAMONINIS DUO · 150–400 kW` | Pramonei / B2B portalas |
| 15 | `giles-studio-15-ecowood-plus-25-100.webp` | `ECOWOOD PLUS 25–100` | `KIETO KURO KATILAS · 25–100 kW` | Parduotuvė / Katilų katalogas |
| 16 | `giles-studio-16-mcl-profi-wood-120-1000.webp` | `MCL / PROFI WOOD 120–1000` | `PRAMONINIS KIETAS KURAS · 120–1162 kW` | Pramonei / Konteinerinės katilinės |
| 17 | `giles-studio-17-enp-steel-boiler-35-4000.webp` | `ENP / MX 35–4000` | `DUJOS / SKYSTAS KURAS · 35–4000 kW` | Pramonei / Konteinerinės katilinės |
| 18 | `giles-studio-18-enerdense-condensing-125-600.webp` | `ENERDENSE 125–600` | `KONDENSACINIS KATILAS · 125–600 kW` | Pramonei / Pramoninės katilinės |
| 19 | `giles-studio-19-master-r32-heat-pump.webp` | `MASTER 60–260T (R32)` | `ŠILUMOS SIURBLYS R32 · 7–27 kW` | Parduotuvė / Šilumos siurbliai |
| 20 | `giles-studio-20-master-plus-r290-heat-pump.webp` | `MASTER PLUS 60–160T (R290)` | `ŠILUMOS SIURBLYS R290 · 7–17 kW` | Parduotuvė / Šilumos siurbliai |
| 21 | `giles-studio-21-haier-super-aqua-r290.webp` | `AW082HUGHA / AW16NHVGHA` | `HAIER R290 · 6–16 kW · A++` | Pradinis puslapis / Paketas Nr. 7 |
| 22 | `giles-studio-22-container-boiler-500kw.webp` | `GI-KONTEINERIS-500KW` | `KONTEINERINĖ KATILINĖ · 150–500 kW` | Pramonei: konteinerinės katilinės (Hero) |
| 23 | `giles-studio-23-container-hot-air-90kw.webp` | `GI-MOBILI-ORO-90KW` | `MOBILIOJI KATILINĖ · 15–90 kW` | Pramonei: konteinerinės katilinės (Nuoma) |
| 24 | `giles-studio-24-biogas-industrial-boiler-room.webp` | `GI-PRAMONINE-2MW` | `PRAMONINIS PROJEKTAS · IKI 2 MW` | Projektai / Pramonei |
| 25 | `giles-studio-25-katri-25kw-pellet-boiler.webp` | `KaTRI3850020` | `KATILAS KaTRI · 25 kW` | Pradinis puslapis / Paketas Nr. 1 |
| 26 | `giles-studio-26-centrometal-eko-ck-p-25.webp` | `EKO-CK-P-25` | `CENTROMETAL · 14–110 kW` | Parduotuvė / Paketas Nr. 2 |
| 27 | `giles-studio-27-centrometal-cas-1001-buffer.webp` | `CAS-1001` | `AKUMULIACINĖ TALPA · 1000 L` | Parduotuvė / Kieto kuro katilinės paketas |
| 28 | `giles-studio-28-pneumatic-pellet-storage-silo.webp` | `FUEL-TANK-400-1200-NOVA3` | `KURO SAUGOJIMAS · 400–1200 L` | Parduotuvė / Prekės kortelė |
| 29 | `giles-studio-29-solar-ssv-station-kit.webp` | `SSV-150-300-ECOSOL` | `SAULĖS ENERGIJA · SSV 150–300` | Saulės energija / Paketas Nr. 4 |
| 30 | `giles-studio-30-ecomax-920i-automation.webp` | `ECOMAX-920I-TOUCH` | `AUTOMATIKA · ECOMAX 920i` | Automatika ir valdymas |

---

## 6. Anti-Slop Ban-List, Liveliness Dials & Verification Gate (`antislop-ui` + `commerce-catalog-design`)

### 6.1 Liveliness Dials
- **COLOR ENERGY:** `2 / 5` (Restrained warm stone `#F5F3EE` + graphite `#11161B` + single thermal accent `#C2410C` / `#FF8A3D`).
- **RHYTHM:** `3 / 5` (Alternates between dark interactive engineering hero/schematics, high-density 4-column category / 3-column product grids, asymmetric 1.05:1 corporate solution split, and structured tabular B2B views).
- **MOTION:** `2 / 5` (Purposeful hover elevation `translateY(-2px)`, interactive schematic hotspot selection, live kW/VAT calculation transitions; `0` endless loops on commercial cards; respects `prefers-reduced-motion`).

### 6.2 Explicit Ban-List (0 Tolerance)
- **FORBIDDEN:** Blue/purple/indigo (`#6366f1`) gradients, radial glow orbs, or mesh backdrops.
- **FORBIDDEN:** Glassmorphism / `backdrop-filter: blur()` on cards, headers, or sidebars.
- **FORBIDDEN:** Decorative emoji (`🔥`, `🚀`, `✅`) anywhere in headings, badges, buttons, or product specs.
- **FORBIDDEN:** Coloured top or left border stripes on product/category cards (`border-left: 4px solid ...`).
- **FORBIDDEN:** Monospace font on navigation links, buttons, or long prose (`JetBrains Mono` is strictly capped at `<= 5%` of visible text for SKUs, dimensions, and short 1–2 word section tags).
- **FORBIDDEN:** Fabricated reviews, star ratings without verified source, or invented customer counters.

### 6.3 Verification Gate Commands
Every implemented route in `/home/mindu/Desktop/giles/giles-platform` must pass:
```bash
~/.browser-use-env/bin/python ~/.opencode/custom-skills/tools/ui_slop_meter.py <url> --profile commerce
```
Required metrics:
- `gradients == 0`, `backdrop_blur == 0`, `emoji == 0`
- Font families `<= 3` (`Schibsted Grotesk`, `Inter`, `JetBrains Mono`), monospace text share `<= 5%`
- Minimum `>= 6` real product visuals above the fold on catalog/listing views
- All touch targets `>= 44×44px` and contrast `>= 4.5:1` (`#5B6470` on `#F5F3EE` = `5.4:1`).
