-- Migration 002: RBAC Tables
-- Creates roles, permissions, role_permissions, role_portals, navigation_items, role_navigation tables
-- and seeds initial data.

-- ============================================================
-- ROLES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_self_registerable BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- PERMISSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(150) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ROLE_PERMISSIONS TABLE (junction)
-- ============================================================
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ============================================================
-- ROLE_PORTALS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS role_portals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  portal_name VARCHAR(100) NOT NULL,
  portal_route VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id)
);

-- ============================================================
-- NAVIGATION_ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS navigation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(150) NOT NULL,
  route VARCHAR(255) NOT NULL,
  icon VARCHAR(50),
  parent_id UUID REFERENCES navigation_items(id) ON DELETE SET NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ROLE_NAVIGATION TABLE (junction)
-- ============================================================
CREATE TABLE IF NOT EXISTS role_navigation (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  navigation_item_id UUID NOT NULL REFERENCES navigation_items(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, navigation_item_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);
CREATE INDEX IF NOT EXISTS idx_roles_is_self_registerable ON roles(is_self_registerable);
CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_role_portals_role_id ON role_portals(role_id);
CREATE INDEX IF NOT EXISTS idx_navigation_items_parent_id ON navigation_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_role_navigation_role_id ON role_navigation(role_id);
CREATE INDEX IF NOT EXISTS idx_role_navigation_nav_id ON role_navigation(navigation_item_id);

-- ============================================================
-- SEED: ROLES
-- ============================================================
INSERT INTO roles (id, name, display_name, description, is_active, is_self_registerable)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'SALES_REP', 'Sales Representative', 'Sales team member managing quotations, orders, and customer deals', true, true),
  ('a0000000-0000-0000-0000-000000000002', 'MANAGER_ADMIN', 'Manager / Admin', 'System administrator with full management access', true, false),
  ('a0000000-0000-0000-0000-000000000003', 'OPS_FINANCE', 'Operations & Finance', 'Operations and finance team managing orders, invoices, and payments', true, false),
  ('a0000000-0000-0000-0000-000000000004', 'CUSTOMER', 'Customer', 'External customer managing their quotations, orders, and invoices', true, true)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  is_self_registerable = EXCLUDED.is_self_registerable,
  updated_at = NOW();

-- ============================================================
-- SEED: PERMISSIONS
-- ============================================================
INSERT INTO permissions (id, name, display_name, description, is_active)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'quotation.create', 'Create Quotation', 'Create new quotations', true),
  ('b0000000-0000-0000-0000-000000000002', 'quotation.view', 'View Quotation', 'View quotations', true),
  ('b0000000-0000-0000-0000-000000000003', 'quotation.edit', 'Edit Quotation', 'Edit existing quotations', true),
  ('b0000000-0000-0000-0000-000000000004', 'quotation.submit', 'Submit Quotation', 'Submit quotations for approval', true),
  ('b0000000-0000-0000-0000-000000000005', 'approval.view', 'View Approvals', 'View pending approvals', true),
  ('b0000000-0000-0000-0000-000000000006', 'approval.approve', 'Approve', 'Approve pending items', true),
  ('b0000000-0000-0000-0000-000000000007', 'approval.reject', 'Reject', 'Reject pending items', true),
  ('b0000000-0000-0000-0000-000000000008', 'customer.view', 'View Customers', 'View customer list and details', true),
  ('b0000000-0000-0000-0000-000000000009', 'product.manage', 'Manage Products', 'Create and manage products', true),
  ('b0000000-0000-0000-0000-000000000010', 'pricing.manage', 'Manage Pricing', 'Manage pricing rules', true),
  ('b0000000-0000-0000-0000-000000000011', 'warehouse.manage', 'Manage Warehouses', 'Manage warehouse operations', true),
  ('b0000000-0000-0000-0000-000000000012', 'fulfillment.manage', 'Manage Fulfillment', 'Manage order fulfillment', true),
  ('b0000000-0000-0000-0000-000000000013', 'invoice.manage', 'Manage Invoices', 'Create and manage invoices', true),
  ('b0000000-0000-0000-0000-000000000014', 'payment.view', 'View Payments', 'View payment information', true),
  ('b0000000-0000-0000-0000-000000000015', 'subscription.manage', 'Manage Subscriptions', 'Manage subscription plans', true),
  ('b0000000-0000-0000-0000-000000000016', 'report.view', 'View Reports', 'View analytics and reports', true),
  ('b0000000-0000-0000-0000-000000000017', 'user.manage', 'Manage Users', 'Create and manage user accounts', true),
  ('b0000000-0000-0000-0000-000000000018', 'dealhealth.view', 'View Deal Health', 'View deal health analytics', true),
  ('b0000000-0000-0000-0000-000000000019', 'ai.dealadvisor.use', 'Use AI Deal Advisor', 'Access AI-powered deal advisor', true),
  ('b0000000-0000-0000-0000-000000000020', 'customer.negotiation.use', 'Customer Negotiation', 'Use customer negotiation tools', true),
  ('b0000000-0000-0000-0000-000000000021', 'order.manage', 'Manage Orders', 'Create and manage orders', true),
  ('b0000000-0000-0000-0000-000000000022', 'discount.manage', 'Manage Discounts', 'Manage discount rules and requests', true)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================
-- SEED: ROLE_PERMISSIONS
-- SALES_REP permissions
-- ============================================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'a0000000-0000-0000-0000-000000000001', id FROM permissions WHERE name IN (
  'quotation.create', 'quotation.view', 'quotation.edit', 'quotation.submit',
  'approval.view',
  'customer.view',
  'order.manage',
  'ai.dealadvisor.use',
  'discount.manage'
)
ON CONFLICT DO NOTHING;

-- MANAGER_ADMIN permissions (all)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'a0000000-0000-0000-0000-000000000002', id FROM permissions
ON CONFLICT DO NOTHING;

-- OPS_FINANCE permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'a0000000-0000-0000-0000-000000000003', id FROM permissions WHERE name IN (
  'quotation.view',
  'approval.view',
  'order.manage',
  'fulfillment.manage',
  'warehouse.manage',
  'invoice.manage',
  'payment.view',
  'subscription.manage',
  'report.view'
)
ON CONFLICT DO NOTHING;

-- CUSTOMER permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'a0000000-0000-0000-0000-000000000004', id FROM permissions WHERE name IN (
  'quotation.view',
  'quotation.create',
  'order.manage',
  'invoice.manage',
  'payment.view',
  'customer.negotiation.use'
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED: ROLE_PORTALS
-- ============================================================
INSERT INTO role_portals (role_id, portal_name, portal_route, is_active)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Sales Portal', '/sales/dashboard', true),
  ('a0000000-0000-0000-0000-000000000002', 'Management Portal', '/management/dashboard', true),
  ('a0000000-0000-0000-0000-000000000003', 'Operations & Finance Portal', '/operations/dashboard', true),
  ('a0000000-0000-0000-0000-000000000004', 'Customer Portal', '/customer/dashboard', true)
ON CONFLICT (role_id) DO UPDATE SET
  portal_name = EXCLUDED.portal_name,
  portal_route = EXCLUDED.portal_route,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================
-- SEED: NAVIGATION_ITEMS
-- ============================================================
-- We need to capture the IDs of inserted navigation items.
-- Using CTEs for clarity.

WITH nav_items AS (
  INSERT INTO navigation_items (name, display_name, route, icon, sort_order, is_active) VALUES
    -- Sales navigation
    ('dashboard', 'Dashboard', '/sales/dashboard', 'dashboard', 1, true),
    ('customers', 'Customers', '/sales/customers', 'customers', 2, true),
    ('quotations', 'Quotations', '/sales/quotations', 'quotations', 3, true),
    ('quote-builder', 'Quote Builder', '/sales/quote-builder', 'quote-builder', 4, true),
    ('sales-orders', 'Orders', '/sales/orders', 'orders', 5, true),
    ('ai-deal-advisor', 'AI Deal Advisor', '/sales/ai-advisor', 'ai', 6, true),
    ('discount-requests', 'Discount Requests', '/sales/discount-requests', 'discount', 7, true),
    ('approval-status', 'Approval Status', '/sales/approval-status', 'approval', 8, true),
    -- Management navigation
    ('mgmt-dashboard', 'Dashboard', '/management/dashboard', 'dashboard', 1, true),
    ('approvals', 'Approvals', '/management/approvals', 'approvals', 2, true),
    ('deal-health', 'Deal Health', '/management/deal-health', 'deal-health', 3, true),
    ('analytics', 'Analytics', '/management/analytics', 'analytics', 4, true),
    ('reports', 'Reports', '/management/reports', 'reports', 5, true),
    ('products', 'Products', '/management/products', 'products', 6, true),
    ('pricing', 'Pricing', '/management/pricing', 'pricing', 7, true),
    ('discount-rules', 'Discount Rules', '/management/discount-rules', 'discount-rules', 8, true),
    ('approval-rules', 'Approval Rules', '/management/approval-rules', 'approval-rules', 9, true),
    ('warehouses', 'Warehouses', '/management/warehouses', 'warehouses', 10, true),
    ('mgmt-subscriptions', 'Subscriptions', '/management/subscriptions', 'subscriptions', 11, true),
    ('users', 'Users', '/management/users', 'users', 12, true),
    -- Operations navigation
    ('ops-dashboard', 'Dashboard', '/operations/dashboard', 'dashboard', 1, true),
    ('ops-orders', 'Orders', '/operations/orders', 'orders', 2, true),
    ('fulfillment', 'Fulfillment', '/operations/fulfillment', 'fulfillment', 3, true),
    ('ops-warehouses', 'Warehouses', '/operations/warehouses', 'warehouses', 4, true),
    ('invoices', 'Invoices', '/operations/invoices', 'invoices', 5, true),
    ('payments', 'Payments', '/operations/payments', 'payments', 6, true),
    ('ops-subscriptions', 'Subscriptions', '/operations/subscriptions', 'subscriptions', 7, true),
    -- Customer navigation
    ('cust-dashboard', 'Dashboard', '/customer/dashboard', 'dashboard', 1, true),
    ('my-quotations', 'My Quotations', '/customer/quotations', 'quotations', 2, true),
    ('negotiation', 'Negotiation', '/customer/negotiation', 'negotiation', 3, true),
    ('cust-orders', 'Orders', '/customer/orders', 'orders', 4, true),
    ('cust-invoices', 'Invoices', '/customer/invoices', 'invoices', 5, true),
    ('cust-payments', 'Payments', '/customer/payments', 'payments', 6, true),
    ('cust-subscriptions', 'Subscriptions', '/customer/subscriptions', 'subscriptions', 7, true)
  ON CONFLICT DO NOTHING
  RETURNING id, name
)
SELECT * FROM nav_items;

-- ============================================================
-- SEED: ROLE_NAVIGATION (map navigation items to roles)
-- ============================================================

-- Sales Rep navigation
INSERT INTO role_navigation (role_id, navigation_item_id)
SELECT 'a0000000-0000-0000-0000-000000000001', id FROM navigation_items WHERE name IN (
  'dashboard', 'customers', 'quotations', 'quote-builder', 'sales-orders',
  'ai-deal-advisor', 'discount-requests', 'approval-status'
)
ON CONFLICT DO NOTHING;

-- Manager/Admin navigation
INSERT INTO role_navigation (role_id, navigation_item_id)
SELECT 'a0000000-0000-0000-0000-000000000002', id FROM navigation_items WHERE name IN (
  'mgmt-dashboard', 'approvals', 'deal-health', 'analytics', 'reports',
  'products', 'pricing', 'discount-rules', 'approval-rules', 'warehouses',
  'mgmt-subscriptions', 'users'
)
ON CONFLICT DO NOTHING;

-- Ops/Finance navigation
INSERT INTO role_navigation (role_id, navigation_item_id)
SELECT 'a0000000-0000-0000-0000-000000000003', id FROM navigation_items WHERE name IN (
  'ops-dashboard', 'ops-orders', 'fulfillment', 'ops-warehouses',
  'invoices', 'payments', 'ops-subscriptions'
)
ON CONFLICT DO NOTHING;

-- Customer navigation
INSERT INTO role_navigation (role_id, navigation_item_id)
SELECT 'a0000000-0000-0000-0000-000000000004', id FROM navigation_items WHERE name IN (
  'cust-dashboard', 'my-quotations', 'negotiation', 'cust-orders',
  'cust-invoices', 'cust-payments', 'cust-subscriptions'
)
ON CONFLICT DO NOTHING;
