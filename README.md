# UAB „Gilės inžinerija“ — Šilumos inžinerijos, katilinių gamybos, B2B ir AI/MCP platforma

[![Live HTTPS Preview](https://img.shields.io/badge/LIVE_HTTPS_PREVIEW-Atidaryti_Platformą_(200_OK)-16a34a?style=for-the-badge)](https://tones-msg-tropical-childhood.trycloudflare.com/lt)
[![Admin OS Central](https://img.shields.io/badge/ADMIN_VALDYMO_CENTRAS-/lt/admin-d97706?style=for-the-badge)](https://tones-msg-tropical-childhood.trycloudflare.com/lt/admin)
[![B2B Didmena](https://img.shields.io/badge/B2B_PORTALAS-/lt/b2b-0284c7?style=for-the-badge)](https://tones-msg-tropical-childhood.trycloudflare.com/lt/b2b)
[![MCP Server v2.1](https://img.shields.io/badge/MCP_SERVER-2025--06--18_(12_Tools)-7c3aed?style=for-the-badge)](https://tones-msg-tropical-childhood.trycloudflare.com/api/mcp)

Pilna **UAB „Gilės inžinerija“** (`gilesinzinerija.com` / `egip.lt` / `gilesas.lt`) skaitmeninė ekosistema: pramoninių ir buitinių katilinių gamyba (10 kW – 5 MW), el. parduotuvė (236+ realūs SKU), B2B montuotojų portalas, AI vyr. inžinierius **Vytautas 2.0**, **Model Context Protocol (MCP)** serveris ir **Admin OS** valdymo centras.

---

## Tiesioginė Live Peržiūra (HTTPS Preview — veikia dabar)

Spauskite bet kurią nuorodą tiesioginiam testavimui naršyklėje (be jokio diegimo, neliečiant dabartinio `79.98.29.20` serverio):

| Modulis | Tiesioginė HTTPS nuoroda | Aprašymas |
|---|---|---|
| **Pagrindinis puslapis** | [**Atidaryti `/lt`**](https://tones-msg-tropical-childhood.trycloudflare.com/lt) | Pramoninės ir buitinės šilumos inžinerijos vitrina, Vytautas 2.0 AI, skaičiuoklės |
| **Admin OS (Dariaus paskyra)** | [**Atidaryti `/lt/admin`**](https://tones-msg-tropical-childhood.trycloudflare.com/lt/admin) | Pilnas Admin valdymo centras: kainodara, produktų CRUD, B2B CRM, PVM sąskaitos, MCP |
| **Katilinių gamyba** | [**Atidaryti `/lt/gamyba`**](https://tones-msg-tropical-childhood.trycloudflare.com/lt/gamyba) | Gamybos pajėgumai, konteinerinės katilinės (100 kW – 5 MW), ASME/PED sertifikavimas |
| **El. parduotuvė (236+ SKU)** | [**Atidaryti `/lt/parduotuve`**](https://tones-msg-tropical-childhood.trycloudflare.com/lt/parduotuve) | Katilai, degikliai, akumuliacinės talpos, siurbliai, vožtuvai, dūmtraukiai |
| **B2B Montuotojų portalas** | [**Atidaryti `/lt/b2b`**](https://tones-msg-tropical-childhood.trycloudflare.com/lt/b2b) | Didmeninės kainos (-5% / -12% / -18%), greitas BOM CSV užsakymas, XML/CSV eksportas |
| **MCP / AI Agentų hubas (Admin)** | [**Atidaryti `/lt/admin`**](https://tones-msg-tropical-childhood.trycloudflare.com/lt/admin) | 12 MCP įrankių dokumentacija, Claude/Cursor/ChatGPT konfigūracija |
| **MCP JSON-RPC 2.0 API** | [**Atidaryti `/api/mcp`**](https://tones-msg-tropical-childhood.trycloudflare.com/api/mcp) | Tiesioginis HTTP Streamable MCP endpointas (`2025-06-18`) |

### Prisijungimas prie Admin OS (`/lt/admin`)
- **El. paštas:** `darius@gilesinzinerija.com` (arba `darius@gilesinzinerija.lt`)
- **Autentifikacija:** Suteiktas pradinis slaptažodis (saugomas tik SHA-256 santraukos pavidalu `src/lib/admin-auth-store.ts`; prisijungus viršutinėje juostoje galima iš karto pasikeisti į asmeninį slaptažodį per **„Keisti slaptažodį“**)

---

## Pagrindiniai platformos moduliai

1. **Admin OS (`/lt/admin`)**:
   - **Sesijų autentifikacija (`PBKDF2-SHA256` + `HMAC-SHA256` HTTP-only slapukas)**: saugus prisijungimas, slaptažodžio keitimas gyvai ir papildomų administratorių valdymas.
   - **Tiekėjų ir B2B kainodaros variklis**: bazinių kainų, PVM, B2B pakopų (`BRONZE -5%`, `SILVER -12%`, `GOLD -18%`) ir atsargų redagavimas.
   - **Prekių katalogo CRUD (`/api/admin/products`)**: prekių kūrimas, redagavimas, techninių parametrų ir nuotraukų valdymas.
   - **PVM sąskaitų faktūrų ir komercinių pasiūlymų generatorius**: PDF/HTML sąskaitų išrašymas su SEPA ir VMI i.SAF eksportu.
   - **14 Plug-and-Play integracijų**: Montonio, Paysera, Stripe, Venipak, DPD, Omniva, LP Express, Skaita ERP, VMI i.MAS, Registrų Centras / VIES, SMTP, SMS Biuras, xAI Grok, GA4/Meta CAPI.
2. **Vytautas 2.0 — AI Vyr. Šilumos Inžinierius (`/api/vytautas`)**:
   - Skaičiuoja šilumos nuostolius pagal STR 2.01.02:2016, parenka katilo galią, akumuliacinę talpą (`V = 15 × P_kW`), Ladomat 21-60 mazgą ir ruošia komercinius pasiūlymus.
3. **Model Context Protocol (MCP) Serveris (`/api/mcp` ir `mcp/giles-mcp-stdio.mjs`)**:
   - 12 inžinerinių ir komercinių įrankių išoriniams AI agentams (Claude Desktop, Cursor, OpenAI, B2B pirkimų sistemoms).

---

## Technologinis stekas ir paleidimas lokaliai / serveryje

### Reikalavimai
- **Node.js** `>= 20.x` (rekomenduojama `v20` arba `v22`)
- **npm** `>= 10.x`

### 1. Diegimas ir paleidimas
```bash
git clone https://github.com/mindaugassamulionis-stack/giles-platform.git
cd giles-platform
cp .env.example .env
npm install
npm run build
npm run start -- -p 3088
```

### 2. Docker / Produkcinis paleidimas (su Caddy HTTPS)
```bash
docker compose -f deploy/docker-compose.giles-prod.yml up -d --build
./deploy/cutover-domains-check.sh http://127.0.0.1:3088
```

### 3. Testavimas
```bash
npm test
```

---

**UAB „Gilės inžinerija“** · Įm. kodas `302620907` · PVM kodas `LT100006109815` · Mauručių g. 29, Mauručiai / Savanorių pr. 191A, Kaunas
