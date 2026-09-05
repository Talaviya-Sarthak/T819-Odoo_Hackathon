-- ============================================================================
-- DealFlow360 Database Schema
-- PostgreSQL 15+
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── ENUMS ───────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SALES_REP', 'SALES_MANAGER', 'FINANCE', 'OPERATIONS', 'CUSTOMER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "QuotationStatus" AS ENUM (
    'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'RETURNED', 
    'CONVERTED', 'EXPIRED', 'CANCELLED', 'NEGOTIATION', 
    'CUSTOMER_CONFIRMED', 'ORDER_CONFIRMED', 'FULFILLMENT', 
    'PARTIALLY_FULFILLED', 'FULFILLED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ApprovalRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'RETURNED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "BillingType" AS ENUM ('ONE_TIME', 'RECURRING');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "FulfillmentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'PARTIAL', 'FAILED', 'REFUNDED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ─── USERS & ROLES ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255),
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('ADMIN','SALES_REP','SALES_MANAGER','FINANCE','OPERATIONS','CUSTOMER','MANAGER_ADMIN','OPS_FINANCE')),
  customer_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ─── CATEGORIES & PRODUCTS ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  unit VARCHAR(50) NOT NULL DEFAULT 'unit',
  base_price NUMERIC(12, 2) NOT NULL,
  cost_price NUMERIC(12, 2) NOT NULL,
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100) UNIQUE NOT NULL,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  price_adjustment NUMERIC(12, 2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── CUSTOMERS & TIERS ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customer_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  tier_id UUID REFERENCES customer_tiers(id) ON DELETE SET NULL,
  sales_rep_id UUID REFERENCES users(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_tier ON customers(tier_id);
CREATE INDEX IF NOT EXISTS idx_customers_sales_rep ON customers(sales_rep_id);

-- ─── PRICE LISTS ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS price_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  customer_tier_id UUID REFERENCES customer_tiers(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS price_list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(price_list_id, product_id)
);

-- ─── QUOTATIONS & LINES ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  sales_rep_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  gross_margin NUMERIC(12, 2) NOT NULL DEFAULT 0,
  margin_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
  valid_until TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quotations_customer ON quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_sales_rep ON quotations(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);

CREATE TABLE IF NOT EXISTS quotation_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12, 2) NOT NULL,
  unit_cost NUMERIC(12, 2) NOT NULL,
  discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  line_subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  line_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  margin_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  billing_type "BillingType" NOT NULL DEFAULT 'ONE_TIME',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quotation_lines_quotation ON quotation_lines(quotation_id);

-- ─── DISCOUNT RULES & APPROVAL WORKFLOW ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS discount_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  customer_tier_id UUID REFERENCES customer_tiers(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  max_discount_pct NUMERIC(5, 2) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS approval_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  min_risk_score INTEGER NOT NULL,
  max_risk_score INTEGER NOT NULL,
  required_role "UserRole" NOT NULL,
  step_order INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  status "ApprovalRequestStatus" NOT NULL DEFAULT 'PENDING',
  risk_score INTEGER NOT NULL,
  risk_level "RiskLevel" NOT NULL,
  current_step INTEGER NOT NULL DEFAULT 1,
  total_steps INTEGER NOT NULL,
  required_role "UserRole" NOT NULL,
  reason TEXT,
  approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_approval_requests_quotation ON approval_requests(quotation_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);

CREATE TABLE IF NOT EXISTS approval_histories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  approval_request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  step INTEGER NOT NULL,
  notes TEXT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
