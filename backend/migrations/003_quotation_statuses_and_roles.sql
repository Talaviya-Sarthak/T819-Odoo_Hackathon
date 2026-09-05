-- Migration 003: Add missing QuotationStatus values and update role constraints

BEGIN;

-- Add missing QuotationStatus enum values if they do not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'NEGOTIATION' AND enumtypid = 'public."QuotationStatus"'::regtype) THEN
    ALTER TYPE "QuotationStatus" ADD VALUE 'NEGOTIATION';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'CUSTOMER_CONFIRMED' AND enumtypid = 'public."QuotationStatus"'::regtype) THEN
    ALTER TYPE "QuotationStatus" ADD VALUE 'CUSTOMER_CONFIRMED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ORDER_CONFIRMED' AND enumtypid = 'public."QuotationStatus"'::regtype) THEN
    ALTER TYPE "QuotationStatus" ADD VALUE 'ORDER_CONFIRMED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'FULFILLMENT' AND enumtypid = 'public."QuotationStatus"'::regtype) THEN
    ALTER TYPE "QuotationStatus" ADD VALUE 'FULFILLMENT';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PARTIALLY_FULFILLED' AND enumtypid = 'public."QuotationStatus"'::regtype) THEN
    ALTER TYPE "QuotationStatus" ADD VALUE 'PARTIALLY_FULFILLED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'FULFILLED' AND enumtypid = 'public."QuotationStatus"'::regtype) THEN
    ALTER TYPE "QuotationStatus" ADD VALUE 'FULFILLED';
  END IF;
END $$;

-- Update users_role_check constraint to allow all required roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('ADMIN', 'SALES_REP', 'SALES_MANAGER', 'FINANCE', 'OPERATIONS', 'CUSTOMER', 'MANAGER_ADMIN', 'OPS_FINANCE'));

-- Ensure all roles exist in the roles table
INSERT INTO roles (id, name, display_name, description, is_active, is_self_registerable)
VALUES 
  ('a0000000-0000-0000-0000-000000000010', 'ADMIN', 'Administrator', 'Full system administration access', true, false),
  ('a0000000-0000-0000-0000-000000000011', 'SALES_MANAGER', 'Sales Manager', 'Sales management, approvals and pricing governance', true, false),
  ('a0000000-0000-0000-0000-000000000012', 'FINANCE', 'Finance', 'Financial reviews, second-level approvals and invoices', true, false),
  ('a0000000-0000-0000-0000-000000000013', 'OPERATIONS', 'Operations', 'Inventory and warehouse fulfillment management', true, false)
ON CONFLICT (name) DO UPDATE SET is_active = true;

-- Ensure categories table has active and updated_at columns if not present
ALTER TABLE categories ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Ensure customers table has owner_id and sales_rep_id
ALTER TABLE customers ADD COLUMN IF NOT EXISTS sales_rep_id UUID REFERENCES users(id);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id);

COMMIT;
