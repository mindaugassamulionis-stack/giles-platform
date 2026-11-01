export type McpScopeTier = 'public_discovery' | 'read_only' | 'operator_safe' | 'full_admin';
export type McpToolScopeCategory = 'public_read' | 'read' | 'write' | 'admin';

export interface McpToolDefinition {
    name: string;
    title: string;
    description: string;
    scopeCategory: McpToolScopeCategory;
    inputSchema: {
        type: 'object';
        properties: Record<string, { type: string; description: string }>;
        required?: string[];
    };
}

export interface McpResourceDefinition {
    uri: string;
    name: string;
    description: string;
    mimeType: string;
}

export interface McpPromptDefinition {
    name: string;
    description: string;
    arguments?: Array<{ name: string; description: string; required?: boolean }>;
}

export const MCP_STORE_TOOLS: McpToolDefinition[] = [
    {
        name: 'giles_store_overview',
        title: 'Parduotuvės ir sandėlio KPI suvestinė',
        description:
            'Grąžina gyvą UAB „Gilės inžinerija“ suvestinę: 13 531 prekės, 28 realios EGIP.lt atsargos Kaune, 28 prekių ženklai, neapmokėtos „Skaita“ sąskaitos, B2B paraiškos, serviso bilietai ir AI pasiūlymai.',
        scopeCategory: 'read',
        inputSchema: { type: 'object', properties: {} },
    },
    {
        name: 'giles_search_products',
        title: 'Prekių paieška kataloge (13 531 SKU)',
        description:
            'Ieško prekių pagal query, sku, brand, category, lowMarginOnly arba lowStockOnly (limit iki 50). Grąžina SKU, EAN, pavadinimą, kainą su/be PVM, savikainą, maržą % ir likutį.',
        scopeCategory: 'read',
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Paieškos frazė arba SKU kodas' },
                sku: { type: 'string', description: 'Tikslus arba dalinis SKU kodas' },
                brand: { type: 'string', description: 'Gamintojo pavadinimas (pvz. Danfoss, HERZ, Gilės)' },
                category: { type: 'string', description: 'Kategorijos pavadinimas' },
                lowMarginOnly: { type: 'boolean', description: 'Tik prekės su marža < 20%' },
                lowStockOnly: { type: 'boolean', description: 'Tik prekės su likučiu 1–3 vnt.' },
                limit: { type: 'number', description: 'Maksimalus grąžinamų eilučių skaičius (1–50)' },
            },
        },
    },
    {
        name: 'giles_get_product',
        title: 'Pilna prekės kortelės ir maržos informacija',
        description: 'Grąžina pilną prekės informaciją, techninius parametrus ir kainų override būseną pagal SKU arba ID.',
        scopeCategory: 'read',
        inputSchema: {
            type: 'object',
            properties: {
                sku: { type: 'string', description: 'Prekės SKU kodas (pvz. MPB-NANI-35)' },
                id: { type: 'string', description: 'Prekės vidinis ID' },
            },
        },
    },
    {
        name: 'giles_list_invoices',
        title: '„Prototechnika Skaita“ sąskaitų sąrašas',
        description: 'Grąžina išrašytas GILE-..., PRO-... ir KRED-... sąskaitas, filtruojamas pagal mokėjimo statusą.',
        scopeCategory: 'read',
        inputSchema: {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    description: 'Filtras: LAUKIA_APMOKEJIMO, APMOKETA_PAVEDIMU, APMOKETA_GRYNAIS, ATSAUKTA_KREDITINE',
                },
            },
        },
    },
    {
        name: 'giles_list_b2b_accounts',
        title: 'B2B montuotojų paskyrų sąrašas',
        description: 'Grąžina B2B partnerių paskyras (PENDING_APPROVAL, APPROVED, REJECTED) su nuolaidų lygiais ir kredito limitais.',
        scopeCategory: 'read',
        inputSchema: {
            type: 'object',
            properties: {
                status: { type: 'string', description: 'Filtras pagal B2B būseną' },
            },
        },
    },
    {
        name: 'giles_list_support_tickets',
        title: 'Tech Support bilietai, S/N pasai ir RMA eilė',
        description: 'Grąžina aktyvius serviso iškvietimus, garantinius S/N pasus ir RMA grąžinimų paraiškas.',
        scopeCategory: 'read',
        inputSchema: { type: 'object', properties: {} },
    },
    {
        name: 'giles_low_stock_audit',
        title: 'Senkančių atsargų (<=3 vnt.) ir PO auditas',
        description: 'Audituoja prekes, kurių Kauno sandėlyje liko <= 3 vnt., sugrupuoja pagal 5 tiekėjus ir apskaičiuoja PO savikainą.',
        scopeCategory: 'read',
        inputSchema: {
            type: 'object',
            properties: {
                supplierName: { type: 'string', description: 'Pasirinktinis tiekėjo filtras' },
            },
        },
    },
    {
        name: 'giles_update_product',
        title: 'Prekės kainos, savikainos ir likučio atnaujinimas (su Finansiniu Saugikliu)',
        description:
            'Atnaujina prekės kainą, savikainą, likutį ar pavadinimą. Jei kaina mažinama >20%, marža <15% arba likutis keičiamas >200 vnt., automatiškai nukreipia į Proposal -> Review -> Apply žmogaus patvirtinimą.',
        scopeCategory: 'write',
        inputSchema: {
            type: 'object',
            properties: {
                sku: { type: 'string', description: 'Prekės SKU kodas' },
                priceGrossEur: { type: 'number', description: 'Nauja mažmeninė kaina su PVM (€)' },
                costPriceEur: { type: 'number', description: 'Savikaina be PVM (€)' },
                stockQuantity: { type: 'number', description: 'Likutis Kauno sandėlyje (vnt.)' },
                name: { type: 'string', description: 'Prekės pavadinimas' },
                published: { type: 'boolean', description: 'Ar prekė publikuojama parduotuvėje' },
            },
            required: ['sku'],
        },
    },
    {
        name: 'giles_create_product',
        title: 'Naujos prekės sukūrimas kataloge',
        description: 'Sukuria naują prekę catalog-overrides.json saugykloje, užtikrinant minimalią 15% maržos ribą.',
        scopeCategory: 'write',
        inputSchema: {
            type: 'object',
            properties: {
                sku: { type: 'string', description: 'Unikalus SKU kodas' },
                name: { type: 'string', description: 'Prekės pavadinimas' },
                brandName: { type: 'string', description: 'Gamintojas' },
                category: { type: 'string', description: 'Kategorija' },
                priceGrossEur: { type: 'number', description: 'Kaina su PVM (€)' },
                costPriceEur: { type: 'number', description: 'Savikaina be PVM (€)' },
                stockQuantity: { type: 'number', description: 'Pradinis likutis (vnt.)' },
            },
            required: ['sku', 'name', 'priceGrossEur'],
        },
    },
    {
        name: 'giles_create_invoice',
        title: 'PRO išankstinės arba GILE PVM sąskaitos išrašymas',
        description: 'Išrašo naują PRO-... arba GILE-... sąskaitą „Prototechnika Skaita“ apskaitoje.',
        scopeCategory: 'write',
        inputSchema: {
            type: 'object',
            properties: {
                docType: { type: 'string', description: 'ISANKSTINE_SASKAITA arba PVM_SASKAITA_FAKTURA' },
                buyerName: { type: 'string', description: 'Pirkėjo įmonės pavadinimas arba vardas' },
                buyerCompanyCode: { type: 'string', description: 'Įmonės kodas' },
                buyerVatCode: { type: 'string', description: 'PVM mokėtojo kodas' },
                sku: { type: 'string', description: 'Prekės SKU kodas' },
                title: { type: 'string', description: 'Prekės pavadinimas' },
                qty: { type: 'number', description: 'Kiekis' },
                unitNetEur: { type: 'number', description: 'Vieneto kaina be PVM (€)' },
            },
            required: ['buyerName', 'sku'],
        },
    },
    {
        name: 'giles_convert_pro_to_gile',
        title: 'PRO išankstinės sąskaitos konvertavimas į GILE PVM sąskaitą',
        description: 'Konvertuoja apmokėtą PRO-... sąskaitą į galutinę GILE-... PVM sąskaitą faktūrą.',
        scopeCategory: 'write',
        inputSchema: {
            type: 'object',
            properties: {
                invoiceId: { type: 'string', description: 'Sąskaitos ID arba PRO numeris (pvz. PRO-2026)' },
            },
            required: ['invoiceId'],
        },
    },
    {
        name: 'giles_reconcile_sepa',
        title: 'SEPA camt.053 / CSV banko išrašo sudengimas',
        description: 'Automatiškai sudengia SEPA banko išrašo mokėjimus su atviromis PRO ir GILE sąskaitomis.',
        scopeCategory: 'write',
        inputSchema: {
            type: 'object',
            properties: {
                statementText: { type: 'string', description: 'SEPA camt.053 XML arba CSV eilutės' },
            },
            required: ['statementText'],
        },
    },
    {
        name: 'giles_manage_support_ticket',
        title: 'Tech Support serviso bilieto kūrimas ir atsarginių dalių rezervacija',
        description: 'Sukuria naują serviso bilietą, atnaujina meistrą/būseną arba rezervuoja atsarginę detalę iš Kauno sandėlio.',
        scopeCategory: 'write',
        inputSchema: {
            type: 'object',
            properties: {
                action: { type: 'string', description: 'create, update_status arba reserve_part' },
                ticketNumber: { type: 'string', description: 'Esamo bilieto numeris (pvz. TKT-0001)' },
                title: { type: 'string', description: 'Gedimo aprašymas (kuriant naują)' },
                clientName: { type: 'string', description: 'Kliento vardas / įmonė' },
                clientPhone: { type: 'string', description: 'Kliento telefonas' },
                sparePartSku: { type: 'string', description: 'Atsarginės dalies SKU (pvz. MPB-IGN-300)' },
                status: { type: 'string', description: 'Nauja serviso būsena' },
            },
        },
    },
    {
        name: 'giles_sync_inventory',
        title: 'Kauno sandėlio likučių paketo sinchronizacija',
        description: 'Atnaujina kelių SKU likučius pagal „Skaita“ SQL arba EGIP.lt sandėlio duomenis.',
        scopeCategory: 'write',
        inputSchema: {
            type: 'object',
            properties: {
                sku: { type: 'string', description: 'SKU kodas' },
                stockQuantity: { type: 'number', description: 'Naujas likutis (vnt.)' },
            },
            required: ['sku', 'stockQuantity'],
        },
    },
    {
        name: 'giles_approve_b2b_partner',
        title: 'B2B montuotojo patvirtinimas ir nuolaidų lygio (-35%..-55%) priskyrimas',
        description:
            'Aukštos rizikos veiksmas: patvirtina/atmeta B2B partnerį. Operator-safe režime visada nukreipiamas į žmogaus patvirtinimo eilę (Proposal -> Review -> Apply).',
        scopeCategory: 'admin',
        inputSchema: {
            type: 'object',
            properties: {
                accountId: { type: 'string', description: 'B2B paskyros ID arba įmonės kodas' },
                decision: { type: 'string', description: 'approve arba reject' },
                discountTier: { type: 'string', description: 'Nuolaidų matricos lygis (-35%, -48%, -52%)' },
                creditLimitEur: { type: 'number', description: 'Kredito limitas (€)' },
            },
            required: ['accountId', 'decision'],
        },
    },
    {
        name: 'giles_bulk_brand_pricing',
        title: 'Masinis gamintojo kainoraščio maržos arba % keitimas',
        description:
            'Aukštos rizikos veiksmas: taiko masinį gamintojo kainų pakeitimą. Operator-safe režime visada nukreipiamas į žmogaus patvirtinimo eilę (Proposal -> Review -> Apply).',
        scopeCategory: 'admin',
        inputSchema: {
            type: 'object',
            properties: {
                brandSlug: { type: 'string', description: 'Gamintojo slug (pvz. danfoss, herz, giles-inzinerija)' },
                mode: { type: 'string', description: 'margin_floor arba percent_adjust' },
                value: { type: 'number', description: 'Maržos grindys % arba pokytis %' },
            },
            required: ['brandSlug', 'mode', 'value'],
        },
    },
    {
        name: 'b2b_crm_analytics_get',
        title: 'Pilna B2B CRM pirkimų, suteiktų nuolaidų, objektų ir pastabų analitika',
        description:
            'Grąžina pilną B2B CRM analitiką: kiek kas nupirko (€), 12 mėn. pirkimų ir maržos dinamiką, kokios nuolaidos suteiktos (Brand / Spec. SKU / Krepšelio %), aktyvius objektus ir vadybininko pastabas.',
        scopeCategory: 'read',
        inputSchema: {
            type: 'object',
            properties: {
                accountId: { type: 'string', description: 'Pasirinktinis kliento ID 360° kortelei' },
                previewSimulation: {
                    type: 'boolean',
                    description: 'Jei true ir DB tuščia, grąžina atminties analitikos peržiūros simuliaciją',
                },
            },
        },
    },
    {
        name: 'b2b_client_360_manage',
        title: 'B2B kliento 360° kortelės, kredito limito, objektų ir pastabų valdymas',
        description:
            'Sukuria arba atnaujina B2B kliento profilį, kredito limitą, mokėjimo atidėjimo terminą (0/14/30/45 d.), prideda/atnaujina kliento objektą (project) arba įrašo vadybininko pastabą (note).',
        scopeCategory: 'write',
        inputSchema: {
            type: 'object',
            properties: {
                action: {
                    type: 'string',
                    description:
                        'create_customer, update_customer, upsert_project, delete_project, add_note arba delete_note',
                },
                accountId: { type: 'string', description: 'B2B kliento paskyros ID' },
                companyName: { type: 'string', description: 'Įmonės pavadinimas' },
                companyCode: { type: 'string', description: 'Įmonės kodas' },
                vatCode: { type: 'string', description: 'PVM mokėtojo kodas' },
                contactPerson: { type: 'string', description: 'Kontaktinis asmuo' },
                email: { type: 'string', description: 'El. paštas' },
                phone: { type: 'string', description: 'Telefono numeris' },
                tierLabel: {
                    type: 'string',
                    description: 'Montuotojas, ŠVOK Rangovas, Regioninis Dileris arba VIP',
                },
                defaultDiscountPercent: { type: 'number', description: 'Bazinė nuolaida %' },
                creditLimitEur: { type: 'number', description: 'Kredito limitas €' },
                paymentTermsDays: { type: 'number', description: 'Atidėjimas dienomis: 0, 14, 30, 45' },
                project: {
                    type: 'object',
                    description: 'Objekto duomenys: { id, title, location, status, budgetEur, orderedEur, discountAppliedPct }',
                },
                note: {
                    type: 'object',
                    description: 'Vadybininko pastaba: { author, tag, text }',
                },
            },
        },
    },
    {
        name: 'b2b_individual_pricing_set',
        title: 'Kliento 3 lygių individualios kainodaros (Brand / Spec. SKU / Krepšelio) nustatymas',
        description:
            'Nustato B2B kliento gamintojų/kategorijų nuolaidų matricą, specifinių SKU kainas (su <10% maržos saugikliu) ir papildomą viso krepšelio nuolaidą.',
        scopeCategory: 'write',
        inputSchema: {
            type: 'object',
            properties: {
                accountId: { type: 'string', description: 'B2B kliento paskyros ID' },
                brandDiscounts: { type: 'object', description: 'Gamintojų nuolaidų % žemėlapis (pvz. { Danfoss: 48 })' },
                categoryDiscounts: { type: 'object', description: 'Kategorijų nuolaidų % žemėlapis' },
                skuOverrides: {
                    type: 'array',
                    description: 'Specifinių SKU kainos: [{ sku, customPriceEur, costNetEur, minQty, note }]',
                },
                extraCartDiscountPct: { type: 'number', description: 'Papildoma viso krepšelio nuolaida %' },
                extraCartFixedEur: { type: 'number', description: 'Fiksuota krepšelio nuolaida €' },
            },
            required: ['accountId'],
        },
    },
    {
        name: 'b2b_quote_create',
        title: 'Individualaus komercinio pasiūlymo (KP-XXXX) sukūrimas klientui',
        description:
            'Sukuria personalizuotą komercinį pasiūlymą su individualiomis SKU kainomis ir papildoma viso krepšelio nuolaida.',
        scopeCategory: 'write',
        inputSchema: {
            type: 'object',
            properties: {
                accountId: { type: 'string', description: 'B2B kliento ID arba ALL' },
                clientName: { type: 'string', description: 'Kliento / įmonės pavadinimas' },
                title: { type: 'string', description: 'Komercinio pasiūlymo antraštė' },
                extraWholeCartDiscountPct: { type: 'number', description: 'Papildoma krepšelio nuolaida %' },
                validUntil: { type: 'string', description: 'Galiojimo terminas' },
                items: {
                    type: 'array',
                    description: 'Prekių eilutės: [{ sku, title, qty, retailNetEur, customNetEur }]',
                },
            },
            required: ['title'],
        },
    },
    {
        name: 'b2b_campaign_broadcast',
        title: 'Tikslinio B2B marketingo pranešimo arba kainų kritimo akcijos siuntimas',
        description:
            'Sukuria ir aktyvuoja tikslinę B2B marketingo kampaniją visai bazei, pasirinktam segmentui arba konkrečiam klientui.',
        scopeCategory: 'write',
        inputSchema: {
            type: 'object',
            properties: {
                title: { type: 'string', description: 'Pranešimo antraštė' },
                message: { type: 'string', description: 'Pranešimo turinys' },
                categoryTag: {
                    type: 'string',
                    description: 'Sezoninė akcija, Kainų kritimas, Nauja siunta sandėlyje arba Asmeninis krepšelio pasiūlymas',
                },
                targetType: { type: 'string', description: 'ALL_B2B, SEGMENT arba SINGLE_CLIENT' },
                targetSegment: { type: 'string', description: 'Segmentas, jei targetType=SEGMENT' },
                targetAccountId: { type: 'string', description: 'Kliento ID, jei targetType=SINGLE_CLIENT' },
                promoDiscountPct: { type: 'number', description: 'Akcijos nuolaida %' },
                ctaSku: { type: 'string', description: 'Akcijos SKU kodas' },
            },
            required: ['title', 'message'],
        },
    },
    {
        name: 'vytautas_engineering_consult',
        title: 'Inžinieriaus Vytauto daugiakryptė ŠVOK konsultacija ir 13 531 SKU hibridinė paieška',
        description:
            'Vykdo pilną Vytauto inžinerinę diagnostiką ir mazgo parinkimą per MCP protokolą pagal pokalbio istoriją (messages) ir kalbą (locale).',
        scopeCategory: 'read',
        inputSchema: {
            type: 'object',
            properties: {
                messages: {
                    type: 'array',
                    description: 'Pokalbio žinučių masyvas: [{ role: "user"|"assistant", content: "..." }]',
                },
                message: { type: 'string', description: 'Viena vartotojo užklausa (alternatyva messages)' },
                locale: { type: 'string', description: 'Kalba: lt, en, pl arba ru' },
            },
        },
    },
    {
        name: 'customer_b2b_catalog_and_my_prices',
        title: 'B2B kliento individualių 3 lygių kainų ir Eigulių g. 21 sandėlio likučių paieška',
        description:
            'Kliento B2B AI asistentui: ieško prekių 13 531 SKU kataloge ir apskaičiuoja konkrečios įmonės individualią kainą (gamintojo nuolaida + spec. SKU override + krepšelio apimties nuolaida) bei realų Kauno sandėlio likutį.',
        scopeCategory: 'read',
        inputSchema: {
            type: 'object',
            properties: {
                accountId: { type: 'string', description: 'B2B partnerio paskyros ID arba įmonės kodas' },
                query: { type: 'string', description: 'SKU kodas, EAN arba prekės pavadinimas' },
                brand: { type: 'string', description: 'Pasirinktinis gamintojas (pvz. Danfoss, HERZ, Megatherm)' },
                qty: { type: 'number', description: 'Planuojamas kiekis (kiekio slenksčiams įvertinti)' },
                limit: { type: 'number', description: 'Maksimalus grąžinamų pozicijų skaičius (1–30)' },
            },
            required: ['accountId'],
        },
    },
    {
        name: 'customer_b2b_order_or_project_draft',
        title: 'B2B kliento objekto sąmatos arba didmeninio užsakymo sukūrimas (su biudžeto limitu)',
        description:
            'Kliento B2B AI asistentui: suformuoja objekto sąmatą (project_quote) arba B2B užsakymą / išankstinę sąskaitą kliento paskyroje, pritaikant visas individualias nuolaidas ir tikrinant maxAutoOrderEur saugiklį.',
        scopeCategory: 'write',
        inputSchema: {
            type: 'object',
            properties: {
                accountId: { type: 'string', description: 'B2B partnerio paskyros ID' },
                mode: {
                    type: 'string',
                    description: 'project_quote (objekto sąmata) arba b2b_order (B2B užsakymas / PRO sąskaita)',
                },
                projectTitle: { type: 'string', description: 'Statybos objekto arba užsakymo pavadinimas' },
                location: { type: 'string', description: 'Objekto adresas arba miestas' },
                maxAutoOrderEur: {
                    type: 'number',
                    description: 'Kliento nustatytas automatinio užsakymo limitas € be PVM (viršijus prašoma 1 paspaudimo patvirtinimo)',
                },
                items: {
                    type: 'array',
                    description: 'Prekių sąrašas: [{ sku: "013G2990", qty: 10 }]',
                },
            },
            required: ['accountId', 'items'],
        },
    },
    {
        name: 'customer_personal_cart_assemble',
        title: 'Asmeninio namų statytojo AI asistento katilinės / radiatorių krepšelio paruošimas',
        description:
            'Fiziniam pirkėjui (personal_shopper): pagal SKU kodus ir kiekius patikrina suderinamumą, apskaičiuoja kainą su kiekybine nuolaida ir grąžina tiesioginę saugaus krepšelio nuorodą (/lt/krepselis?import_skus=...) apmokėjimui naršyklėje.',
        scopeCategory: 'read',
        inputSchema: {
            type: 'object',
            properties: {
                locale: { type: 'string', description: 'Kalba: lt, en, pl arba ru' },
                projectNote: { type: 'string', description: 'Namo katilinės ar patalpų aprašymas' },
                items: {
                    type: 'array',
                    description: 'Prekių sąrašas: [{ sku: "MPB-NANI-35", qty: 1 }, { sku: "013G2990", qty: 6 }]',
                },
            },
            required: ['items'],
        },
    },
    {
        name: 'b2b_credit_and_reminders_manage',
        title: 'B2B kredito limitų, mokėjimo atidėjimų (Atidėjimas), sąskaitų apmokėjimo ir automatinių priminimų valdymas',
        description:
            'Leidžia Dariui arba įgaliotam AI agentui per MCP valdyti B2B klientų kredito limitus, mokėjimo atidėjimo terminus (0/7/14/30/45/60 d.), pažymėti sąskaitas apmokėtomis (atlaisvinant kredito limitą) bei siųsti automatinius ar rankinius priminimus artėjant prie limito (≥80%).',
        scopeCategory: 'write',
        inputSchema: {
            type: 'object',
            properties: {
                op: {
                    type: 'string',
                    description: 'Veiksmas: status, update_terms, mark_invoice_paid, send_reminder arba auto_sweep',
                },
                accountId: { type: 'string', description: 'B2B kliento paskyros ID' },
                creditLimitEur: { type: 'number', description: 'Suteiktas kredito limitas (€)' },
                paymentTermDays: {
                    type: 'number',
                    description: 'Mokėjimo atidėjimas dienomis (0, 7, 14, 30, 45, 60)',
                },
                autoReminderThresholdPct: {
                    type: 'number',
                    description: 'Automatinio priminimo slenkstis % (pvz. 80)',
                },
                autoRemindersEnabled: {
                    type: 'boolean',
                    description: 'Ar įjungti automatiniai priminimai pasiekus slenkstį',
                },
                creditHoldOnExceed: {
                    type: 'boolean',
                    description: 'Ar stabdyti naujus atidėtus užsakymus viršijus limitą',
                },
                invoiceId: { type: 'string', description: 'Sąskaitos ID arba numeris apmokėjimo pažymėjimui' },
                invoice: {
                    type: 'object',
                    description: 'Sąskaitos duomenys: { invoiceNumber, issuedAt, dueDate, amountEur, paidAmountEur, status, projectTitle }',
                },
                reminderType: {
                    type: 'string',
                    description: 'approaching_limit, due_soon, overdue_invoice arba limit_exceeded',
                },
                message: { type: 'string', description: 'Pasirinktinis priminimo tekstas' },
            },
            required: ['op'],
        },
    },
    {
        name: 'public_catalog_expert_search',
        title: 'Atvira 13 531 SKU inžinerinio katalogo, CAD schemų ir Kauno sandėlio paieška išorės AI agentams (Tier 0)',
        description:
            'Atviras viešas ekspertinis įrankis (public_read, be API rakto): ieško visose 13 531 UAB „Gilės inžinerija“ prekėse, grąžina technines specifikacijas, CAD brėžinio šeimą, likutį Eigulių g. 21 Kauno sandėlyje, mažmeninę kainą bei tiesioginę prekės ir 1 paspaudimo krepšelio nuorodą su autoritetinga citata.',
        scopeCategory: 'public_read',
        inputSchema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Paieškos frazė, gamintojo kodas arba SKU (pvz. 082F1152, MPB-NANI-35, Danfoss RA-N, Haier R290)',
                },
                brand: { type: 'string', description: 'Gamintojo filtras (pvz. Danfoss, Megatherm, Haier, Gorenje)' },
                category: { type: 'string', description: 'Kategorijos filtras' },
                locale: { type: 'string', description: 'Kalba nuorodoms: lt, en, pl arba ru (numatytoji lt)' },
                limit: { type: 'number', description: 'Grąžinamų pozicijų skaičius (1–25, numatytoji 10)' },
            },
        },
    },
    {
        name: 'public_hydronic_calculator_run',
        title: 'Atviros EN 12831 / EN 12828 / EN 303-5 / APVA inžinerinės skaičiuoklės išorės AI agentams (Tier 0)',
        description:
            'Atviras viešas skaičiuoklių įrankis (public_read, be API rakto): vykdo pastato šilumos nuostolių (heat_loss), akumuliacinės talpos (buffer_tank), plėtimosi indo (expansion_vessel), siurblio ir balansinio vožtuvo (pump_qh), radiatorių sekcijų (radiator_sections) arba APVA paramos (apva_subsidy) skaičiavimus ir grąžina tikslias formules, rekomenduojamus Gilės SKU bei paruošto krepšelio nuorodą.',
        scopeCategory: 'public_read',
        inputSchema: {
            type: 'object',
            properties: {
                calculatorType: {
                    type: 'string',
                    description:
                        'Skaičiuoklės tipas: heat_loss | buffer_tank | expansion_vessel | pump_qh | radiator_sections | apva_subsidy',
                },
                areaM2: { type: 'number', description: 'Šildomas pastato plotas m² (pvz. 150)' },
                powerKw: { type: 'number', description: 'Šiluminė galia kW (pvz. 18)' },
                energyClass: { type: 'string', description: 'Pastato energinė klasė: A++ | A+ | A | B | C | D_E' },
                climateZone: { type: 'string', description: 'Lietuvos klimato zona: pajuris | vidurio | rytu' },
                staticHeightM: { type: 'number', description: 'Statinis sistemos aukštis metrais (pvz. 7)' },
                radiatorCount: { type: 'number', description: 'Radiatorių skaičius (pvz. 8)' },
                locale: { type: 'string', description: 'Kalba: lt, en, pl arba ru' },
            },
            required: ['calculatorType'],
        },
    },
    {
        name: 'public_boiler_compatibility_lookup',
        title: 'Atvira katilų ir šilumos siurblių suderinamumo bei modernizavimo patikra išorės AI agentams (Tier 0)',
        description:
            'Atviras viešas suderinamumo įrankis (public_read, be API rakto): pagal nurodytą katilo ar šilumos siurblio modelį (pvz. Viadrus U22, Kalvis 2-16, Atmos DC25S, Stropuva S20, Haier R290, Megatherm MPB) grąžina tikslų suderinamą granulių degiklį, CNC durelių perėjimo plokštę, akumuliacinę talpą, saugos grupę ir atsargines dalis su tiesioginėmis nuorodomis.',
        scopeCategory: 'public_read',
        inputSchema: {
            type: 'object',
            properties: {
                boilerModel: {
                    type: 'string',
                    description:
                        'Katilo arba šilumos siurblio modelis (pvz. Viadrus U22, Kalvis 2-16, Atmos DC25S, Stropuva S20, Haier R290, Megatherm MPB)',
                },
                houseAreaM2: { type: 'number', description: 'Pasirinktinis namo plotas m² galios parinkimui' },
                locale: { type: 'string', description: 'Kalba: lt, en, pl arba ru' },
            },
            required: ['boilerModel'],
        },
    },
    {
        name: 'admin_ai_agents_manage',
        title: 'Vidinių ir BYO AI agentų bei pokalbių žurnalo valdymas (ON/OFF · Promptai · Test Run)',
        description:
            'Leidžia Dariaus išoriniam Claude AI agentui valdyti visus 6 vidinius ir prijungtus BYO parduotuvės AI agentus: peržiūrėti agentus ir pokalbių žurnalą (list_agents_and_logs), įjungti/išjungti agentus (toggle_agent: autonomous | proposal_only | disabled), atnaujinti promptą ir maržos saugiklį (update_agent_config), registruoti naują BYO agentą (register_byo_agent), paleisti agentą iš karto (run_agent_now) bei atsakyti į neatsakytus klausimus (resolve_log_entry).',
        scopeCategory: 'admin',
        inputSchema: {
            type: 'object',
            properties: {
                op: {
                    type: 'string',
                    description:
                        'Operacija: list_agents_and_logs | toggle_agent | update_agent_config | register_byo_agent | run_agent_now | resolve_log_entry',
                },
                agentId: {
                    type: 'string',
                    description:
                        'Agento ID (pvz. vytautas-consultant, pricing-margin-guard, inventory-po-copilot, b2b-credit-reminder-agent, skaita-reconciliation-agent, seo-geo-citation-agent)',
                },
                executionMode: {
                    type: 'string',
                    description: 'Darbo režimas: autonomous | proposal_only | disabled',
                },
                systemPrompt: {
                    type: 'string',
                    description: 'Sistemos promptas ir inžinerinės taisyklės',
                },
                guardrailMinMarginPct: {
                    type: 'number',
                    description: 'Minimalios maržos saugiklio grindys % (>=15%)',
                },
                provider: {
                    type: 'string',
                    description: 'AI tiekėjas (Anthropic Claude, xAI Grok, OpenAI GPT, OpenRouter)',
                },
                modelId: {
                    type: 'string',
                    description: 'Modelio ID (pvz. claude-sonnet-4-20250514, grok-4.20)',
                },
                apiEndpointUrl: {
                    type: 'string',
                    description: 'API endpoint URL',
                },
                apiKey: {
                    type: 'string',
                    description: 'API raktas (bus užmaskuotas)',
                },
                temperature: {
                    type: 'number',
                    description: 'Temperatūra (0.0 – 1.0)',
                },
                logId: {
                    type: 'string',
                    description: 'Žurnalo įrašo ID (pvz. LOG-1002) resolve_log_entry operacijai',
                },
                engineerReply: {
                    type: 'string',
                    description: 'Inžinieriaus atsakymas arba sprendimo pastaba',
                },
            },
            required: ['op'],
        },
    },
    {
        name: 'admin_suppliers_pricelist_manage',
        title: 'Tiekėjų kainynų, didmeninių nuolaidų ir maržų valdymas bei CSV/JSON importas',
        description:
            'Leidžia Dariaus Claude agentui valdyti tiekėjus (Danfoss, HERZ, Gorenje/TIKI, Gilės/Megatherm, Haier ir naujus tiekėjus): list_suppliers, upsert_supplier (didmeninė nuolaida %, tikslinė marža %, terminas, būsena) ir import_pricelist_rows (automatinis savikainos bei mažmeninės kainos skaičiavimas su >=15% maržos saugikliu tiesiai į vitriną).',
        scopeCategory: 'admin',
        inputSchema: {
            type: 'object',
            properties: {
                op: {
                    type: 'string',
                    description: 'Operacija: list_suppliers | upsert_supplier | import_pricelist_rows',
                },
                id: {
                    type: 'string',
                    description: 'Tiekėjo ID (pvz. danfoss, herz, gorenje-tiki, giles-megatherm, haier)',
                },
                supplierId: {
                    type: 'string',
                    description: 'Tiekėjo ID importuojant kainoraštį',
                },
                name: {
                    type: 'string',
                    description: 'Tiekėjo pavadinimas',
                },
                dealerDiscountPct: {
                    type: 'number',
                    description: 'Tiekėjo didmeninė nuolaida % (0–85)',
                },
                targetMarginPct: {
                    type: 'number',
                    description: 'Tikslinė parduotuvės marža % (>=15%)',
                },
                leadTimeDays: {
                    type: 'string',
                    description: 'Pristatymo terminas (pvz. 1–2 d. d. Kauno sandėlis)',
                },
                enabled: {
                    type: 'boolean',
                    description: 'Ar tiekėjo kainynas aktyvus',
                },
                rawText: {
                    type: 'string',
                    description: 'CSV / TSV / JSON kainoraščio eilutės (SKU;Pavadinimas;BazinėKaina;Likutis;Kategorija)',
                },
            },
            required: ['op'],
        },
    },
    {
        name: 'products_full_crud_manage',
        title: 'Pilnas el. parduotuvės prekių CRUD (aprašymai, komplektacija, suderinamumas, specifikacijos ir masinė kainodara)',
        description:
            'Leidžia Dariaus Claude agentui pilnai kurti ir redaguoti bet kurią prekę (upsert_product_full: title, description, brand, category, subcategory, price, costEur, promoPriceEur, stock, published, weightKg, deliveryClass, apvaEligible, compatibleBoilers, kitContents, compatibilityNote, specs, image), vykdyti masinį gamintojo/kategorijos kainų keitimą su >=15% maržos grindimis (bulk_brand_or_category_price_adjust) ir valdyti matomumą vitrinoje (toggle_product_visibility).',
        scopeCategory: 'write',
        inputSchema: {
            type: 'object',
            properties: {
                op: {
                    type: 'string',
                    description:
                        'Operacija: upsert_product_full | bulk_brand_or_category_price_adjust | toggle_product_visibility',
                },
                sku: {
                    type: 'string',
                    description: 'Prekės SKU kodas (pvz. 013G2990, MPB-NANI-35)',
                },
                title: {
                    type: 'string',
                    description: 'Prekės pavadinimas',
                },
                description: {
                    type: 'string',
                    description: 'Pilnas prekės techninis aprašymas',
                },
                brand: {
                    type: 'string',
                    description: 'Gamintojas (pvz. Danfoss, HERZ, Gilės Inžinerija)',
                },
                category: {
                    type: 'string',
                    description: 'Kategorija',
                },
                subcategory: {
                    type: 'string',
                    description: 'Subkategorija',
                },
                price: {
                    type: 'number',
                    description: 'Mažmeninė kaina su PVM (EUR)',
                },
                costEur: {
                    type: 'number',
                    description: 'Savikaina be PVM (EUR)',
                },
                promoPriceEur: {
                    type: 'number',
                    description: 'Akcijinė kaina su PVM (EUR)',
                },
                stock: {
                    type: 'number',
                    description: 'Likutis Kauno sandėlyje (vnt.)',
                },
                published: {
                    type: 'boolean',
                    description: 'Ar prekė matoma vitrinoje (true/false)',
                },
                deliveryClass: {
                    type: 'string',
                    description: 'Siuntimo klasė: locker_30kg | pallet_freight',
                },
                compatibilityNote: {
                    type: 'string',
                    description: 'Suderinamumo pastaba (sriegis / katilai / pavaros)',
                },
                deltaPct: {
                    type: 'number',
                    description: 'Masinio kainų keitimo procentas (+/- %) su >=15% maržos saugikliu',
                },
            },
            required: ['op'],
        },
    },
];

export const MCP_STORE_RESOURCES: McpResourceDefinition[] = [
    {
        uri: 'giles://store/overview',
        name: 'UAB „Gilės inžinerija“ gyva parduotuvės ir Kauno sandėlio būsena',
        description: '13 531 SKU, 28 realios atsargos (EGIP.lt), 28 gamintojai, „Skaita“ sąskaitos ir B2B suvestinė.',
        mimeType: 'application/json',
    },
    {
        uri: 'giles://catalog/suppliers',
        name: '5 oficialių tiekėjų kainynų ir maržų taisyklės',
        description: 'Danfoss, HERZ, Gorenje/TIKI, Haier ŠVOK ir Gilės/Megatherm B2B/B2C kainodaros matrica.',
        mimeType: 'application/json',
    },
    {
        uri: 'giles://erp/skaita-status',
        name: '„Prototechnika Skaita“ SQL ir VMI i.SAF 1.2 apskaitos būsena',
        description: 'Išrašytos PVM ir išankstinės sąskaitos, SEPA sudengimas ir likučių aktai.',
        mimeType: 'application/json',
    },
    {
        uri: 'giles://b2b/discount-matrix',
        name: 'B2B montuotojų nuolaidų ir kredito limitų matrica (-35%..-55%)',
        description: 'Montuotojų partnerysčių lygiai, mokėjimo atidėjimo terminai ir Registrų centro patikra.',
        mimeType: 'application/json',
    },
    {
        uri: 'giles://security/mcp-policy',
        name: '5 sluoksnių MCP saugumo politika ir finansiniai saugikliai',
        description: 'Aktyvios kainų kritimo (20%), maržos grindų (15%) ir Proposal-Review-Apply taisyklės.',
        mimeType: 'application/json',
    },
    {
        uri: 'giles://b2b/crm-analytics',
        name: 'B2B CRM pirkimų, suteiktų nuolaidų, klientų objektų ir pastabų suvestinė',
        description: 'Pilna B2B analitika: kiek kas nupirko, 12 mėn. dinamika, suteiktos nuolaidos, projektai ir pastabos.',
        mimeType: 'application/json',
    },
    {
        uri: 'giles://b2b/pricing-rules',
        name: '3 lygių individualios B2B kainodaros taisyklės ir apimties laipteliai',
        description: 'Visų B2B klientų gamintojų matricos, specifinių SKU kainos ir viso krepšelio nuolaidų laipteliai.',
        mimeType: 'application/json',
    },
    {
        uri: 'giles://b2b/campaigns',
        name: 'B2B marketingo kampanijos ir individualūs komerciniai pasiūlymai (KP-XXXX)',
        description: 'Aktyvūs B2B marketinginiai pranešimai ir paruošti komerciniai pasiūlymai.',
        mimeType: 'application/json',
    },
    {
        uri: 'giles://admin/ai-agents-and-logs',
        name: 'Vidinių ir BYO AI agentų būsena, instrukcijos ir pokalbių / veiksmų žurnalas',
        description:
            'Gyva visų 6 vidinių ir prijungtų BYO AI agentų konfigūracija (ON/OFF režimai, promptai, >=15% maržos saugikliai) bei Vytauto ir agentų veiksmų žurnalas.',
        mimeType: 'application/json',
    },
    {
        uri: 'giles://admin/suppliers-and-pricelists',
        name: 'Tiekėjų kainynų, didmeninių nuolaidų ir maržų sinchronizacijos suvestinė',
        description:
            'Danfoss, HERZ, Gorenje/TIKI, Gilės/Megatherm, Haier ir papildomų tiekėjų nuolaidų %, tikslinių maržų % ir SKU statistika.',
        mimeType: 'application/json',
    },
];

export const MCP_STORE_PROMPTS: McpPromptDefinition[] = [
    {
        name: 'audit_low_margin_and_stock',
        description: 'Patikrinti žemos maržos (<20%) ir senkančio likučio (<=3 vnt.) prekes Kauno sandėlyje',
        arguments: [{ name: 'brand', description: 'Pasirinktinis gamintojas (pvz. Danfoss)', required: false }],
    },
    {
        name: 'prepare_b2b_partner_review',
        description: 'Įvertinti laukiančias B2B montuotojų paraiškas ir paruošti nuolaidų lygio rekomendaciją',
    },
    {
        name: 'reconcile_skaita_unpaid_invoices',
        description: 'Peržiūrėti neapmokėtas PRO/GILE sąskaitas ir paruošti SEPA banko išrašo sudengimą',
    },
    {
        name: 'triage_boiler_support_tickets',
        description: 'Peržiūrėti katilų ir MPB degiklių serviso iškvietimus bei rezervuoti atsargines detales',
    },
];
