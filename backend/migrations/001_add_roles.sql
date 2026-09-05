-- Migration 001: Add RBAC columns to users table
-- Run: psql $DATABASE_URL -f migrations/001_add_roles.sql

BEGIN;

-- Add role column
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER';

-- Add constraint (safe to re-run)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check') THEN
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('SALES_REP','MANAGER_ADMIN','OPS_FINANCE','CUSTOMER'));
  END IF;
END $$;

-- Add customer_id for customer portal users
ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_id VARCHAR(50);

-- Add status column
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_status_check') THEN
    ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('active','inactive'));
  END IF;
END $$;

-- Index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

COMMIT;
