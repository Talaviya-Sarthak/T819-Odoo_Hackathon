-- Migration 004: Sales Orders, Lines, Multi-Warehouse Inventory, Fulfillment, Backorders & Invoicing

-- 1. Alter sales_orders to add missing financial and status fields
ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_cost NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gross_margin NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS margin_percentage NUMERIC(5, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Create sales_order_lines table
CREATE TABLE IF NOT EXISTS sales_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12, 2) NOT NULL,
  unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  line_subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  line_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  quantity_reserved INTEGER NOT NULL DEFAULT 0,
  quantity_fulfilled INTEGER NOT NULL DEFAULT 0,
  quantity_backordered INTEGER NOT NULL DEFAULT 0,
  billing_type VARCHAR(50) NOT NULL DEFAULT 'ONE_TIME',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_order_lines_order ON sales_order_lines(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_lines_product ON sales_order_lines(product_id);

-- 3. Enhance warehouses and warehouse_stocks
ALTER TABLE warehouses
  ADD COLUMN IF NOT EXISTS code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE warehouse_stocks
  ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 4. Enhance fulfillment_orders and fulfillment_lines
ALTER TABLE fulfillment_orders
  ADD COLUMN IF NOT EXISTS sales_order_id UUID REFERENCES sales_orders(id),
  ADD COLUMN IF NOT EXISTS fulfilled_at TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE fulfillment_lines
  ADD COLUMN IF NOT EXISTS sales_order_line_id UUID REFERENCES sales_order_lines(id);

-- 5. Enhance backorders
ALTER TABLE backorders
  ADD COLUMN IF NOT EXISTS sales_order_id UUID REFERENCES sales_orders(id),
  ADD COLUMN IF NOT EXISTS sales_order_line_id UUID REFERENCES sales_order_lines(id),
  ADD COLUMN IF NOT EXISTS fulfilled_quantity INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 6. Enhance subscriptions and subscription_lines
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS sales_order_id UUID REFERENCES sales_orders(id),
  ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD';

ALTER TABLE subscription_lines
  ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS line_total NUMERIC(12, 2) DEFAULT 0;

-- 7. Enhance billing_schedules
ALTER TABLE billing_schedules
  ADD COLUMN IF NOT EXISTS invoice_id UUID,
  ADD COLUMN IF NOT EXISTS period_start TIMESTAMP WITHOUT TIME ZONE,
  ADD COLUMN IF NOT EXISTS period_end TIMESTAMP WITHOUT TIME ZONE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 8. Enhance invoices and create invoice_lines
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS sales_order_id UUID REFERENCES sales_orders(id),
  ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_due NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12, 2) NOT NULL,
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  line_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice ON invoice_lines(invoice_id);

-- 9. Enhance payments
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS reference VARCHAR(100),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP;
