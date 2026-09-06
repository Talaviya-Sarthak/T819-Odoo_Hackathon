'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const prisma = require('../src/database/prisma');

const INDEXES = [
  // Products
  'CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id)',
  'CREATE INDEX IF NOT EXISTS idx_products_active ON products(active)',
  'CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)',
  'CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)',

  // Categories
  'CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(active)',

  // Customers
  'CREATE INDEX IF NOT EXISTS idx_customers_tier_id ON customers(tier_id)',
  'CREATE INDEX IF NOT EXISTS idx_customers_sales_rep_id ON customers(sales_rep_id)',
  'CREATE INDEX IF NOT EXISTS idx_customers_owner_id ON customers(owner_id)',
  'CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name)',
  'CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)',

  // Quotations & Lines
  'CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON quotations(customer_id)',
  'CREATE INDEX IF NOT EXISTS idx_quotations_sales_rep_id ON quotations(sales_rep_id)',
  'CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status)',
  'CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON quotations(created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_quotations_number ON quotations(quotation_number)',
  'CREATE INDEX IF NOT EXISTS idx_quotation_lines_quotation_id ON quotation_lines(quotation_id)',
  'CREATE INDEX IF NOT EXISTS idx_quotation_lines_product_id ON quotation_lines(product_id)',

  // Sales Orders & Lines
  'CREATE INDEX IF NOT EXISTS idx_sales_orders_quotation_id ON sales_orders(quotation_id)',
  'CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_id ON sales_orders(customer_id)',
  'CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status)',
  'CREATE INDEX IF NOT EXISTS idx_sales_orders_created_at ON sales_orders(created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_sales_orders_number ON sales_orders(order_number)',
  'CREATE INDEX IF NOT EXISTS idx_sales_order_lines_sales_order_id ON sales_order_lines(sales_order_id)',
  'CREATE INDEX IF NOT EXISTS idx_sales_order_lines_product_id ON sales_order_lines(product_id)',

  // Fulfillment Orders & Lines
  'CREATE INDEX IF NOT EXISTS idx_fulfillment_orders_sales_order_id ON fulfillment_orders(sales_order_id)',
  'CREATE INDEX IF NOT EXISTS idx_fulfillment_orders_quotation_id ON fulfillment_orders(quotation_id)',
  'CREATE INDEX IF NOT EXISTS idx_fulfillment_orders_customer_id ON fulfillment_orders(customer_id)',
  'CREATE INDEX IF NOT EXISTS idx_fulfillment_orders_warehouse_id ON fulfillment_orders(warehouse_id)',
  'CREATE INDEX IF NOT EXISTS idx_fulfillment_orders_status ON fulfillment_orders(status)',
  'CREATE INDEX IF NOT EXISTS idx_fulfillment_orders_created_at ON fulfillment_orders(created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_fulfillment_lines_order_id ON fulfillment_lines(fulfillment_order_id)',
  'CREATE INDEX IF NOT EXISTS idx_fulfillment_lines_product_id ON fulfillment_lines(product_id)',
  'CREATE INDEX IF NOT EXISTS idx_fulfillment_lines_so_line_id ON fulfillment_lines(sales_order_line_id)',

  // Backorders
  'CREATE INDEX IF NOT EXISTS idx_backorders_fulfillment_order_id ON backorders(fulfillment_order_id)',
  'CREATE INDEX IF NOT EXISTS idx_backorders_sales_order_id ON backorders(sales_order_id)',
  'CREATE INDEX IF NOT EXISTS idx_backorders_sales_order_line_id ON backorders(sales_order_line_id)',
  'CREATE INDEX IF NOT EXISTS idx_backorders_product_id ON backorders(product_id)',
  'CREATE INDEX IF NOT EXISTS idx_backorders_status ON backorders(status)',
  'CREATE INDEX IF NOT EXISTS idx_backorders_created_at ON backorders(created_at DESC)',

  // Invoices & Lines
  'CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id)',
  'CREATE INDEX IF NOT EXISTS idx_invoices_sales_order_id ON invoices(sales_order_id)',
  'CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices(subscription_id)',
  'CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)',
  'CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date)',
  'CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice_id ON invoice_lines(invoice_id)',
  'CREATE INDEX IF NOT EXISTS idx_invoice_lines_product_id ON invoice_lines(product_id)',

  // Payments
  'CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id)',
  'CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)',
  'CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC)',

  // Subscriptions & Lines & Schedules
  'CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON subscriptions(customer_id)',
  'CREATE INDEX IF NOT EXISTS idx_subscriptions_sales_order_id ON subscriptions(sales_order_id)',
  'CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id)',
  'CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status)',
  'CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at ON subscriptions(created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_subscription_lines_subscription_id ON subscription_lines(subscription_id)',
  'CREATE INDEX IF NOT EXISTS idx_subscription_lines_product_id ON subscription_lines(product_id)',
  'CREATE INDEX IF NOT EXISTS idx_billing_schedules_subscription_id ON billing_schedules(subscription_id)',
  'CREATE INDEX IF NOT EXISTS idx_billing_schedules_invoice_id ON billing_schedules(invoice_id)',
  'CREATE INDEX IF NOT EXISTS idx_billing_schedules_status ON billing_schedules(status)',
  'CREATE INDEX IF NOT EXISTS idx_billing_schedules_due_date ON billing_schedules(due_date)',

  // Warehouses & Stock
  'CREATE INDEX IF NOT EXISTS idx_warehouse_stocks_warehouse_id ON warehouse_stocks(warehouse_id)',
  'CREATE INDEX IF NOT EXISTS idx_warehouse_stocks_product_id ON warehouse_stocks(product_id)',

  // Approvals
  'CREATE INDEX IF NOT EXISTS idx_approval_requests_quotation_id ON approval_requests(quotation_id)',
  'CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status)',
  'CREATE INDEX IF NOT EXISTS idx_approval_requests_approver_id ON approval_requests(approver_id)',
  'CREATE INDEX IF NOT EXISTS idx_approval_requests_created_at ON approval_requests(created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_approval_histories_req_id ON approval_histories(approval_request_id)',
  'CREATE INDEX IF NOT EXISTS idx_approval_histories_user_id ON approval_histories(user_id)',

  // Audit Logs
  'CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type)',
  'CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC)',

  // Users
  'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
  'CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)',
  'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC)',

  // Negotiations
  'CREATE INDEX IF NOT EXISTS idx_negotiations_quotation_id ON negotiations(quotation_id)',
  'CREATE INDEX IF NOT EXISTS idx_negotiations_customer_id ON negotiations(customer_id)',
  'CREATE INDEX IF NOT EXISTS idx_negotiations_status ON negotiations(status)',
  'CREATE INDEX IF NOT EXISTS idx_negotiation_messages_neg_id ON negotiation_messages(negotiation_id)',
  'CREATE INDEX IF NOT EXISTS idx_change_requests_neg_id ON change_requests(negotiation_id)',
];

async function main() {
  console.log('Starting index migration on Neon PostgreSQL...');
  const start = Date.now();
  let createdCount = 0;
  let errorCount = 0;

  for (const sql of INDEXES) {
    try {
      await prisma.$executeRawUnsafe(sql);
      createdCount++;
      process.stdout.write('.');
    } catch (err) {
      errorCount++;
      console.error(`\nFailed to execute: ${sql}`, err.message);
    }
  }

  const duration = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`\nIndex migration complete! Successfully processed ${createdCount}/${INDEXES.length} indexes in ${duration}s (${errorCount} errors).`);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Fatal error applying indexes:', err);
  process.exit(1);
});
