-- =============================================================================
-- Migration 001: Gilės Inžinerija Enterprise 50M EUR PostgreSQL 16+ Schema
-- ACID Transactional Catalog, B2B Credit & Pricing, Skaita SQL / i.SAF Invoices,
-- Suppliers, AI Agent Operations, Support Tickets, and Admin RBAC.
-- Includes UP migration + idempotent Rollback (DOWN) script in comments.
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. giles_suppliers (Upstream ERP / XML / Skaita SQL suppliers)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS giles_suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    country_code CHAR(2) NOT NULL DEFAULT 'LT',
    sync_source VARCHAR(120) NOT NULL DEFAULT 'Skaita SQL · Kauno sandėlis',
    feed_url TEXT,
    lead_time_days INT NOT NULL DEFAULT 2 CHECK (lead_time_days >= 0),
    default_margin_floor_pct NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_synced_at TIMESTAMPTZ,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_giles_suppliers_active ON giles_suppliers (is_active, code);

-- -----------------------------------------------------------------------------
-- 2. giles_products (6,337+ SKUs with pg_trgm GIN & tsvector full-text search)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS giles_products (
    sku VARCHAR(128) PRIMARY KEY,
    id UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    ean VARCHAR(32),
    title TEXT NOT NULL,
    brand VARCHAR(128) NOT NULL,
    brand_slug VARCHAR(128) NOT NULL,
    category VARCHAR(160) NOT NULL,
    category_slug VARCHAR(160) NOT NULL,
    subcategory VARCHAR(160),
    price_eur NUMERIC(12, 2) NOT NULL CHECK (price_eur >= 0),
    cost_eur NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (cost_eur >= 0),
    promo_price_eur NUMERIC(12, 2) CHECK (promo_price_eur IS NULL OR promo_price_eur >= 0),
    vat_rate NUMERIC(5, 2) NOT NULL DEFAULT 21.00,
    stock_qty INT NOT NULL DEFAULT 0,
    stock_unit VARCHAR(24) NOT NULL DEFAULT 'vnt.',
    stock_source VARCHAR(160) NOT NULL DEFAULT 'Skaita SQL · Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)',
    weight_kg NUMERIC(10, 3) NOT NULL DEFAULT 1.000 CHECK (weight_kg >= 0),
    delivery_class VARCHAR(64) NOT NULL DEFAULT 'locker_30kg',
    apva_eligible BOOLEAN NOT NULL DEFAULT FALSE,
    compatible_boilers TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    specs JSONB NOT NULL DEFAULT '{}'::JSONB,
    kit_contents JSONB NOT NULL DEFAULT '[]'::JSONB,
    image_url TEXT NOT NULL,
    series_image_url TEXT,
    visual_series_id VARCHAR(128),
    supplier_id UUID REFERENCES giles_suppliers(id) ON DELETE SET NULL,
    published BOOLEAN NOT NULL DEFAULT TRUE,
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('simple', coalesce(sku, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(ean, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(brand, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(title, '')), 'B') ||
        setweight(to_tsvector('simple', coalesce(category, '')), 'C')
    ) STORED,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_giles_products_title_trgm ON giles_products USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_giles_products_sku_trgm ON giles_products USING GIN (sku gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_giles_products_search_vector ON giles_products USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_giles_products_specs_gin ON giles_products USING GIN (specs jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_giles_products_boilers_gin ON giles_products USING GIN (compatible_boilers);
CREATE INDEX IF NOT EXISTS idx_giles_products_cat_brand_pub ON giles_products (published, category_slug, brand_slug, price_eur);
CREATE INDEX IF NOT EXISTS idx_giles_products_ean ON giles_products (ean) WHERE ean IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 3. B2B Accounts, Tier Pricing Rules, Credit Ledger, Projects & Notes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS giles_b2b_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_code VARCHAR(32) NOT NULL UNIQUE,
    vat_code VARCHAR(32),
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(160) NOT NULL,
    contact_email VARCHAR(255) NOT NULL UNIQUE,
    contact_phone VARCHAR(64) NOT NULL,
    tier VARCHAR(32) NOT NULL DEFAULT 'INSTALLER_SILVER' CHECK (tier IN ('INSTALLER_SILVER', 'INSTALLER_GOLD', 'INDUSTRIAL_PARTNER', 'WHOLESALE_VIP')),
    credit_limit_eur NUMERIC(12, 2) NOT NULL DEFAULT 5000.00 CHECK (credit_limit_eur >= 0),
    credit_used_eur NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (credit_used_eur >= 0),
    payment_term_days INT NOT NULL DEFAULT 14 CHECK (payment_term_days >= 0),
    assigned_engineer VARCHAR(128) NOT NULL DEFAULT 'Darius (Inžinerinis skyrius)',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED')),
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_giles_b2b_accounts_status_tier ON giles_b2b_accounts (status, tier);

CREATE TABLE IF NOT EXISTS giles_b2b_pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    b2b_account_id UUID REFERENCES giles_b2b_accounts(id) ON DELETE CASCADE,
    brand_slug VARCHAR(128) NOT NULL,
    category_slug VARCHAR(160),
    rule_mode VARCHAR(32) NOT NULL DEFAULT 'discount_pct' CHECK (rule_mode IN ('discount_pct', 'margin_floor', 'fixed_net_eur')),
    rule_value NUMERIC(8, 2) NOT NULL,
    min_order_qty INT NOT NULL DEFAULT 1 CHECK (min_order_qty >= 1),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (b2b_account_id, brand_slug, category_slug)
);

CREATE INDEX IF NOT EXISTS idx_giles_b2b_pricing_brand ON giles_b2b_pricing_rules (brand_slug, is_active);

CREATE TABLE IF NOT EXISTS giles_b2b_credit_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    b2b_account_id UUID NOT NULL REFERENCES giles_b2b_accounts(id) ON DELETE RESTRICT,
    entry_type VARCHAR(32) NOT NULL CHECK (entry_type IN ('INVOICE_DEBIT', 'PAYMENT_CREDIT', 'CREDIT_NOTE', 'LIMIT_ADJUSTMENT')),
    amount_eur NUMERIC(12, 2) NOT NULL,
    balance_after_eur NUMERIC(12, 2) NOT NULL,
    reference_doc_no VARCHAR(64) NOT NULL,
    due_date DATE,
    notes TEXT,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_giles_b2b_credit_ledger_account ON giles_b2b_credit_ledger (b2b_account_id, created_at DESC);

CREATE TABLE IF NOT EXISTS giles_b2b_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    b2b_account_id UUID NOT NULL REFERENCES giles_b2b_accounts(id) ON DELETE CASCADE,
    project_code VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    site_address TEXT,
    boiler_system_capacity_kw NUMERIC(10, 2),
    bom_items JSONB NOT NULL DEFAULT '[]'::JSONB,
    quoted_total_net_eur NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    quoted_total_gross_eur NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    stage VARCHAR(32) NOT NULL DEFAULT 'DRAFT' CHECK (stage IN ('DRAFT', 'QUOTED', 'APPROVED', 'DELIVERED', 'ARCHIVED')),
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_giles_b2b_projects_account_stage ON giles_b2b_projects (b2b_account_id, stage);

CREATE TABLE IF NOT EXISTS giles_b2b_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    b2b_account_id UUID NOT NULL REFERENCES giles_b2b_accounts(id) ON DELETE CASCADE,
    project_id UUID REFERENCES giles_b2b_projects(id) ON DELETE SET NULL,
    author_name VARCHAR(128) NOT NULL,
    note_type VARCHAR(32) NOT NULL DEFAULT 'ENGINEERING' CHECK (note_type IN ('ENGINEERING', 'CREDIT', 'LOGISTICS', 'GENERAL')),
    body TEXT NOT NULL,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_giles_b2b_notes_account ON giles_b2b_notes (b2b_account_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 4. giles_skaita_invoices (PRO-... / GILE-..., SEPA, i.SAF, APVA metadata)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS giles_skaita_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(64) NOT NULL UNIQUE CHECK (invoice_number ~ '^(PRO|GILE)-[0-9]{4}-[0-9]+$'),
    series_type VARCHAR(16) NOT NULL CHECK (series_type IN ('PROFORMA', 'VAT_INVOICE', 'CREDIT_NOTE')),
    b2b_account_id UUID REFERENCES giles_b2b_accounts(id) ON DELETE SET NULL,
    buyer_name VARCHAR(255) NOT NULL,
    buyer_company_code VARCHAR(32),
    buyer_vat_code VARCHAR(32),
    buyer_email VARCHAR(255) NOT NULL,
    buyer_address TEXT NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'EUR',
    subtotal_net_eur NUMERIC(12, 2) NOT NULL CHECK (subtotal_net_eur >= 0),
    vat_amount_eur NUMERIC(12, 2) NOT NULL CHECK (vat_amount_eur >= 0),
    total_gross_eur NUMERIC(12, 2) NOT NULL CHECK (total_gross_eur >= 0),
    sepa_end_to_end_id VARCHAR(128) NOT NULL UNIQUE,
    payment_status VARCHAR(32) NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'REFUNDED')),
    line_items JSONB NOT NULL DEFAULT '[]'::JSONB,
    apva_metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    isaf_exported_at TIMESTAMPTZ,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_at TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_giles_skaita_invoices_status ON giles_skaita_invoices (payment_status, issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_giles_skaita_invoices_isaf ON giles_skaita_invoices (isaf_exported_at) WHERE series_type = 'VAT_INVOICE';

-- -----------------------------------------------------------------------------
-- 5. AI Agents, Execution Logs, Support Tickets & Admin Users
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS giles_admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(160) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'CATALOG_ENGINEER' CHECK (role IN ('SUPER_ADMIN', 'CATALOG_ENGINEER', 'B2B_MANAGER', 'ACCOUNTANT', 'SUPPORT_ENGINEER')),
    password_hash TEXT NOT NULL,
    mfa_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS giles_ai_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_slug VARCHAR(64) NOT NULL UNIQUE,
    display_name VARCHAR(128) NOT NULL,
    department VARCHAR(64) NOT NULL,
    model_id VARCHAR(128) NOT NULL DEFAULT 'deepseek-reasoner',
    autonomy_mode VARCHAR(32) NOT NULL DEFAULT 'GOVERNED_AUTO' CHECK (autonomy_mode IN ('OBSERVE_ONLY', 'PROPOSAL_GATE', 'GOVERNED_AUTO')),
    config JSONB NOT NULL DEFAULT '{}'::JSONB,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_run_at TIMESTAMPTZ,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS giles_ai_agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES giles_ai_agents(id) ON DELETE CASCADE,
    action_type VARCHAR(64) NOT NULL,
    target_sku VARCHAR(128) REFERENCES giles_products(sku) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL CHECK (status IN ('SUCCESS', 'SKIPPED', 'BLOCKED_MARGIN_GUARD', 'ERROR')),
    latency_ms INT NOT NULL DEFAULT 0,
    payload JSONB NOT NULL DEFAULT '{}'::JSONB,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_giles_ai_agent_logs_agent_created ON giles_ai_agent_logs (agent_id, created_at DESC);

CREATE TABLE IF NOT EXISTS giles_support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(32) NOT NULL UNIQUE,
    b2b_account_id UUID REFERENCES giles_b2b_accounts(id) ON DELETE SET NULL,
    related_sku VARCHAR(128) REFERENCES giles_products(sku) ON DELETE SET NULL,
    customer_name VARCHAR(160) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(64),
    category VARCHAR(64) NOT NULL DEFAULT 'BOILER_RETROFIT' CHECK (category IN ('BOILER_RETROFIT', 'HEAT_PUMP_APVA', 'SPARE_PARTS', 'INDUSTRIAL_CONTAINER', 'WARRANTY_SERVICE')),
    priority VARCHAR(16) NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT_HEATING_DOWN')),
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED')),
    assigned_admin_id UUID REFERENCES giles_admin_users(id) ON DELETE SET NULL,
    subject VARCHAR(255) NOT NULL,
    messages JSONB NOT NULL DEFAULT '[]'::JSONB,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_giles_support_tickets_status_priority ON giles_support_tickets (status, priority, created_at DESC);

-- -----------------------------------------------------------------------------
-- 6. Optimistic Concurrency Trigger (bumps version + updated_at on UPDATE)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION giles_bump_version_and_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version := OLD.version + 1;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'giles_suppliers',
        'giles_products',
        'giles_b2b_accounts',
        'giles_b2b_pricing_rules',
        'giles_b2b_projects',
        'giles_skaita_invoices',
        'giles_admin_users',
        'giles_ai_agents',
        'giles_support_tickets'
    ]
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_version ON %I;', tbl, tbl);
        EXECUTE format(
            'CREATE TRIGGER trg_%I_version BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION giles_bump_version_and_timestamp();',
            tbl,
            tbl
        );
    END LOOP;
END $$;

COMMIT;

-- =============================================================================
-- DOWN / ROLLBACK SCRIPT (run inside transaction if rolling back 001):
-- BEGIN;
-- DROP TABLE IF EXISTS giles_support_tickets CASCADE;
-- DROP TABLE IF EXISTS giles_ai_agent_logs CASCADE;
-- DROP TABLE IF EXISTS giles_ai_agents CASCADE;
-- DROP TABLE IF EXISTS giles_admin_users CASCADE;
-- DROP TABLE IF EXISTS giles_skaita_invoices CASCADE;
-- DROP TABLE IF EXISTS giles_b2b_notes CASCADE;
-- DROP TABLE IF EXISTS giles_b2b_projects CASCADE;
-- DROP TABLE IF EXISTS giles_b2b_credit_ledger CASCADE;
-- DROP TABLE IF EXISTS giles_b2b_pricing_rules CASCADE;
-- DROP TABLE IF EXISTS giles_b2b_accounts CASCADE;
-- DROP TABLE IF EXISTS giles_products CASCADE;
-- DROP TABLE IF EXISTS giles_suppliers CASCADE;
-- DROP FUNCTION IF EXISTS giles_bump_version_and_timestamp() CASCADE;
-- COMMIT;
-- =============================================================================
