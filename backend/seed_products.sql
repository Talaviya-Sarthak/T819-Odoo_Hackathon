-- ============================================================================
-- Seed Products & Categories for DealFlow360
-- Compatible with PostgreSQL / Neon Database
-- ============================================================================

-- Ensure uuid extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Insert Categories
INSERT INTO categories (id, name, description, active)
VALUES 
  ('a1111111-1111-1111-1111-111111111111', 'Hardware', 'Enterprise hardware, laptops, monitors, peripherals', true),
  ('a2222222-2222-2222-2222-222222222222', 'Services', 'Professional consulting, installation, and deployment services', true),
  ('a3333333-3333-3333-3333-333333333333', 'Software', 'Software licenses, security, and cloud backup subscriptions', true),
  ('a4444444-4444-4444-4444-444444444444', 'Accessories', 'Office ergonomics, bags, cables, and input devices', true)
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description,
    active = EXCLUDED.active;

-- 2. Insert Products (10 Core Products with Base & Cost Pricing)
INSERT INTO products (id, name, sku, description, unit, base_price, cost_price, tax_rate, category_id, active)
VALUES
  (
    'b1111111-1111-1111-1111-111111111111',
    'Laptop',
    'HW-LAPTOP-001',
    'Dell Latitude 15" Core i7 32GB RAM 512GB SSD Enterprise Laptop',
    'unit',
    1200.00,
    800.00,
    18.00,
    (SELECT id FROM categories WHERE name = 'Hardware' LIMIT 1),
    true
  ),
  (
    'b2222222-2222-2222-2222-222222222222',
    'Monitor',
    'HW-MONITOR-001',
    '27" 4K IPS Ultra-Slim Business Display with USB-C Hub',
    'unit',
    450.00,
    280.00,
    18.00,
    (SELECT id FROM categories WHERE name = 'Hardware' LIMIT 1),
    true
  ),
  (
    'b3333333-3333-3333-3333-333333333333',
    'Docking Station',
    'HW-DOCK-001',
    'Thunderbolt 4 Universal Dual-Display Docking Station',
    'unit',
    180.00,
    110.00,
    18.00,
    (SELECT id FROM categories WHERE name = 'Hardware' LIMIT 1),
    true
  ),
  (
    'b4444444-4444-4444-4444-444444444444',
    'IT Consulting (Hourly)',
    'SRV-CONSULT-001',
    'Senior Solutions Architect Consulting and Integration Services',
    'hour',
    150.00,
    70.00,
    18.00,
    (SELECT id FROM categories WHERE name = 'Services' LIMIT 1),
    true
  ),
  (
    'b5555555-5555-5555-5555-555555555555',
    'Enterprise Deployment',
    'SRV-DEPLOY-001',
    'Turnkey On-Site Deployment, Migration, and Systems Training Package',
    'package',
    2500.00,
    1400.00,
    18.00,
    (SELECT id FROM categories WHERE name = 'Services' LIMIT 1),
    true
  ),
  (
    'b6666666-6666-6666-6666-666666666666',
    'Annual Support Contract',
    'SRV-SUPPORT-001',
    '24/7/365 Dedicated SLA Support with 2-Hour Response Time',
    'year',
    1200.00,
    400.00,
    18.00,
    (SELECT id FROM categories WHERE name = 'Services' LIMIT 1),
    true
  ),
  (
    'b7777777-7777-7777-7777-777777777777',
    'Cloud Security License',
    'SW-SECURITY-001',
    'Endpoint Protection, Zero-Trust Access, and Threat Analytics',
    'user/year',
    350.00,
    150.00,
    18.00,
    (SELECT id FROM categories WHERE name = 'Software' LIMIT 1),
    true
  ),
  (
    'b8888888-8888-8888-8888-888888888888',
    'Cloud Backup Suite',
    'SW-BACKUP-001',
    '1TB Immutable Cloud Backup with Instant Ransomware Recovery',
    'license/year',
    200.00,
    80.00,
    18.00,
    (SELECT id FROM categories WHERE name = 'Software' LIMIT 1),
    true
  ),
  (
    'b9999999-9999-9999-9999-999999999999',
    'Ergonomic Keyboard',
    'ACC-KEYBOARD-001',
    'Split Mechanical Bluetooth Keyboard with Cushioned Palm Rest',
    'unit',
    85.00,
    45.00,
    18.00,
    (SELECT id FROM categories WHERE name = 'Accessories' LIMIT 1),
    true
  ),
  (
    'baaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Wireless Precision Mouse',
    'ACC-MOUSE-001',
    'Multi-Device High Precision Ergonomic Wireless Mouse',
    'unit',
    60.00,
    30.00,
    18.00,
    (SELECT id FROM categories WHERE name = 'Accessories' LIMIT 1),
    true
  )
ON CONFLICT (sku) DO UPDATE 
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    unit = EXCLUDED.unit,
    base_price = EXCLUDED.base_price,
    cost_price = EXCLUDED.cost_price,
    tax_rate = EXCLUDED.tax_rate,
    category_id = EXCLUDED.category_id,
    active = EXCLUDED.active;

-- Verification query
SELECT id, name, sku, base_price, cost_price, active FROM products ORDER BY name;
