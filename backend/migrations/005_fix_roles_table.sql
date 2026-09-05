-- Migration 005: Fix roles table to exactly 6 canonical roles
-- Canonical roles: ADMIN, SALES_REP, SALES_MANAGER, FINANCE, OPERATIONS, CUSTOMER

BEGIN;

-- 1. Remove obsolete role mappings for MANAGER_ADMIN and OPS_FINANCE
DELETE FROM role_navigation WHERE role_id IN (
  SELECT id FROM roles WHERE name IN ('MANAGER_ADMIN', 'OPS_FINANCE')
);
DELETE FROM role_portals WHERE role_id IN (
  SELECT id FROM roles WHERE name IN ('MANAGER_ADMIN', 'OPS_FINANCE')
);
DELETE FROM role_permissions WHERE role_id IN (
  SELECT id FROM roles WHERE name IN ('MANAGER_ADMIN', 'OPS_FINANCE')
);

-- 2. If any users have MANAGER_ADMIN or OPS_FINANCE, reassign them
UPDATE users SET role = 'ADMIN' WHERE role = 'MANAGER_ADMIN';
UPDATE users SET role = 'OPERATIONS' WHERE role = 'OPS_FINANCE';

-- 3. Delete obsolete roles from roles table
DELETE FROM roles WHERE name IN ('MANAGER_ADMIN', 'OPS_FINANCE');

-- 4. Ensure all 6 canonical roles exist with correct IDs and attributes
INSERT INTO roles (id, name, display_name, description, is_active, is_self_registerable)
VALUES
  ('a0000000-0000-0000-0000-000000000010', 'ADMIN', 'Administrator', 'Full system administration access across all modules', true, false),
  ('a0000000-0000-0000-0000-000000000001', 'SALES_REP', 'Sales Representative', 'Sales team member managing quotations, orders, and customer deals', true, true),
  ('a0000000-0000-0000-0000-000000000011', 'SALES_MANAGER', 'Sales Manager', 'Sales management, tier 1 approvals, and pricing governance', true, false),
  ('a0000000-0000-0000-0000-000000000012', 'FINANCE', 'Finance', 'Financial reviews, tier 2 approvals, invoices, and payment tracking', true, false),
  ('a0000000-0000-0000-0000-000000000013', 'OPERATIONS', 'Operations', 'Inventory, warehouse stock, and fulfillment order management', true, false),
  ('a0000000-0000-0000-0000-000000000004', 'CUSTOMER', 'Customer', 'External customer managing quotations, orders, invoices, and payments', true, true)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_active = true,
  is_self_registerable = EXCLUDED.is_self_registerable,
  updated_at = NOW();

-- 5. Update users_role_check constraint to strictly enforce 6 roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('ADMIN', 'SALES_REP', 'SALES_MANAGER', 'FINANCE', 'OPERATIONS', 'CUSTOMER'));

-- 6. Role Portals
INSERT INTO role_portals (role_id, portal_name, portal_route, is_active)
VALUES
  ((SELECT id FROM roles WHERE name = 'ADMIN'), 'Management Portal', '/management/dashboard', true),
  ((SELECT id FROM roles WHERE name = 'SALES_MANAGER'), 'Management Portal', '/management/dashboard', true),
  ((SELECT id FROM roles WHERE name = 'FINANCE'), 'Operations & Finance Portal', '/operations/dashboard', true),
  ((SELECT id FROM roles WHERE name = 'OPERATIONS'), 'Operations & Finance Portal', '/operations/dashboard', true),
  ((SELECT id FROM roles WHERE name = 'SALES_REP'), 'Sales Portal', '/sales/dashboard', true),
  ((SELECT id FROM roles WHERE name = 'CUSTOMER'), 'Customer Portal', '/customer/dashboard', true)
ON CONFLICT (role_id) DO UPDATE SET
  portal_name = EXCLUDED.portal_name,
  portal_route = EXCLUDED.portal_route,
  is_active = true,
  updated_at = NOW();

-- 7. Role Permissions
-- Clear existing permissions for refreshed roles to avoid duplicates
DELETE FROM role_permissions WHERE role_id IN (
  SELECT id FROM roles WHERE name IN ('ADMIN', 'SALES_MANAGER', 'FINANCE', 'OPERATIONS', 'SALES_REP', 'CUSTOMER')
);

-- ADMIN: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'ADMIN'), id FROM permissions;

-- SALES_MANAGER
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'SALES_MANAGER'), id FROM permissions
WHERE name IN (
  'quotation.view', 'quotation.edit', 'quotation.submit', 'approval.view', 'approval.approve', 'approval.reject',
  'customer.view', 'product.manage', 'pricing.manage', 'discount.manage', 'order.manage', 'report.view',
  'dealhealth.view', 'ai.dealadvisor.use', 'user.manage'
);

-- FINANCE
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'FINANCE'), id FROM permissions
WHERE name IN (
  'quotation.view', 'approval.view', 'approval.approve', 'approval.reject', 'invoice.manage', 'payment.view',
  'subscription.manage', 'order.manage', 'report.view', 'pricing.manage'
);

-- OPERATIONS
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'OPERATIONS'), id FROM permissions
WHERE name IN (
  'warehouse.manage', 'fulfillment.manage', 'product.manage', 'order.manage', 'invoice.manage', 'report.view'
);

-- SALES_REP
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'SALES_REP'), id FROM permissions
WHERE name IN (
  'quotation.create', 'quotation.view', 'quotation.edit', 'quotation.submit', 'customer.view',
  'order.manage', 'dealhealth.view', 'ai.dealadvisor.use', 'customer.negotiation.use'
);

-- CUSTOMER
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'CUSTOMER'), id FROM permissions
WHERE name IN (
  'quotation.view', 'quotation.create', 'order.manage', 'invoice.manage', 'payment.view', 'customer.negotiation.use'
);

-- 8. Role Navigation
-- Clear existing navigation for refreshed roles
DELETE FROM role_navigation WHERE role_id IN (
  SELECT id FROM roles WHERE name IN ('ADMIN', 'SALES_MANAGER', 'FINANCE', 'OPERATIONS', 'SALES_REP', 'CUSTOMER')
);

-- ADMIN navigation
INSERT INTO role_navigation (role_id, navigation_item_id)
SELECT (SELECT id FROM roles WHERE name = 'ADMIN'), id FROM navigation_items
WHERE name IN (
  'mgmt-dashboard', 'approvals', 'deal-health', 'analytics', 'reports', 'products',
  'pricing', 'discount-rules', 'approval-rules', 'warehouses', 'mgmt-subscriptions', 'users'
);

-- SALES_MANAGER navigation
INSERT INTO role_navigation (role_id, navigation_item_id)
SELECT (SELECT id FROM roles WHERE name = 'SALES_MANAGER'), id FROM navigation_items
WHERE name IN (
  'mgmt-dashboard', 'approvals', 'deal-health', 'analytics', 'reports', 'products',
  'pricing', 'discount-rules', 'approval-rules', 'warehouses', 'mgmt-subscriptions'
);

-- FINANCE navigation
INSERT INTO role_navigation (role_id, navigation_item_id)
SELECT (SELECT id FROM roles WHERE name = 'FINANCE'), id FROM navigation_items
WHERE name IN (
  'ops-dashboard', 'ops-orders', 'invoices', 'payments', 'ops-subscriptions', 'analytics', 'reports'
);

-- OPERATIONS navigation
INSERT INTO role_navigation (role_id, navigation_item_id)
SELECT (SELECT id FROM roles WHERE name = 'OPERATIONS'), id FROM navigation_items
WHERE name IN (
  'ops-dashboard', 'ops-orders', 'fulfillment', 'ops-warehouses', 'invoices'
);

-- SALES_REP navigation
INSERT INTO role_navigation (role_id, navigation_item_id)
SELECT (SELECT id FROM roles WHERE name = 'SALES_REP'), id FROM navigation_items
WHERE name IN (
  'dashboard', 'customers', 'quotations', 'quote-builder', 'sales-orders',
  'ai-deal-advisor', 'discount-requests', 'approval-status'
);

-- CUSTOMER navigation
INSERT INTO role_navigation (role_id, navigation_item_id)
SELECT (SELECT id FROM roles WHERE name = 'CUSTOMER'), id FROM navigation_items
WHERE name IN (
  'cust-dashboard', 'my-quotations', 'negotiation', 'cust-orders', 'cust-invoices', 'cust-payments', 'cust-subscriptions'
);

COMMIT;
