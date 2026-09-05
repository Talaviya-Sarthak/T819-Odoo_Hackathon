'use strict';

const ROLES = {
  ADMIN: 'ADMIN',
  SALES_REP: 'SALES_REP',
  SALES_MANAGER: 'SALES_MANAGER',
  FINANCE: 'FINANCE',
  OPERATIONS: 'OPERATIONS',
  CUSTOMER: 'CUSTOMER',
  // Backward-compatible aliases
  MANAGER_ADMIN: 'ADMIN',
  OPS_FINANCE: 'OPERATIONS',
};

const ROLE_PORTALS = {
  [ROLES.ADMIN]: '/management/dashboard',
  [ROLES.SALES_MANAGER]: '/management/dashboard',
  [ROLES.FINANCE]: '/operations/dashboard',
  [ROLES.OPERATIONS]: '/operations/dashboard',
  [ROLES.SALES_REP]: '/sales/dashboard',
  [ROLES.CUSTOMER]: '/customer/dashboard',
};

const ROLE_NAVIGATION = {
  [ROLES.ADMIN]: [
    { label: 'Dashboard', path: '/management/dashboard', icon: 'dashboard' },
    { label: 'Approvals', path: '/management/approvals', icon: 'approvals' },
    { label: 'Deal Health', path: '/management/deal-health', icon: 'deal-health' },
    { label: 'Analytics', path: '/management/analytics', icon: 'analytics' },
    { label: 'Reports', path: '/management/reports', icon: 'reports' },
    { label: 'Products', path: '/management/products', icon: 'products' },
    { label: 'Pricing', path: '/management/pricing', icon: 'pricing' },
    { label: 'Discount Rules', path: '/management/discount-rules', icon: 'discount-rules' },
    { label: 'Approval Rules', path: '/management/approval-rules', icon: 'approval-rules' },
    { label: 'Warehouses', path: '/management/warehouses', icon: 'warehouses' },
    { label: 'Subscriptions', path: '/management/subscriptions', icon: 'subscriptions' },
    { label: 'Users', path: '/management/users', icon: 'users' },
  ],
  [ROLES.SALES_MANAGER]: [
    { label: 'Dashboard', path: '/management/dashboard', icon: 'dashboard' },
    { label: 'Approvals', path: '/management/approvals', icon: 'approvals' },
    { label: 'Deal Health', path: '/management/deal-health', icon: 'deal-health' },
    { label: 'Analytics', path: '/management/analytics', icon: 'analytics' },
    { label: 'Reports', path: '/management/reports', icon: 'reports' },
    { label: 'Products', path: '/management/products', icon: 'products' },
    { label: 'Pricing', path: '/management/pricing', icon: 'pricing' },
    { label: 'Discount Rules', path: '/management/discount-rules', icon: 'discount-rules' },
    { label: 'Approval Rules', path: '/management/approval-rules', icon: 'approval-rules' },
    { label: 'Warehouses', path: '/management/warehouses', icon: 'warehouses' },
    { label: 'Subscriptions', path: '/management/subscriptions', icon: 'subscriptions' },
  ],
  [ROLES.FINANCE]: [
    { label: 'Dashboard', path: '/operations/dashboard', icon: 'dashboard' },
    { label: 'Orders', path: '/operations/orders', icon: 'orders' },
    { label: 'Invoices', path: '/operations/invoices', icon: 'invoices' },
    { label: 'Payments', path: '/operations/payments', icon: 'payments' },
    { label: 'Subscriptions', path: '/operations/subscriptions', icon: 'subscriptions' },
    { label: 'Analytics', path: '/management/analytics', icon: 'analytics' },
    { label: 'Reports', path: '/management/reports', icon: 'reports' },
  ],
  [ROLES.OPERATIONS]: [
    { label: 'Dashboard', path: '/operations/dashboard', icon: 'dashboard' },
    { label: 'Orders', path: '/operations/orders', icon: 'orders' },
    { label: 'Fulfillment', path: '/operations/fulfillment', icon: 'fulfillment' },
    { label: 'Inventory', path: '/operations/inventory', icon: 'products' },
    { label: 'Backorders', path: '/operations/backorders', icon: 'fulfillment' },
    { label: 'Warehouses', path: '/operations/warehouses', icon: 'warehouses' },
    { label: 'Invoices', path: '/operations/invoices', icon: 'invoices' },
  ],
  [ROLES.SALES_REP]: [
    { label: 'Dashboard', path: '/sales/dashboard', icon: 'dashboard' },
    { label: 'Customers', path: '/sales/customers', icon: 'customers' },
    { label: 'Quotations', path: '/sales/quotations', icon: 'quotations' },
    { label: 'Quote Builder', path: '/sales/quote-builder', icon: 'quote-builder' },
    { label: 'Orders', path: '/sales/orders', icon: 'orders' },
    { label: 'AI Deal Advisor', path: '/sales/ai-advisor', icon: 'ai' },
    { label: 'Discount Requests', path: '/sales/discount-requests', icon: 'discount' },
    { label: 'Approval Status', path: '/sales/approval-status', icon: 'approval' },
  ],
  [ROLES.CUSTOMER]: [
    { label: 'Dashboard', path: '/customer/dashboard', icon: 'dashboard' },
    { label: 'My Quotations', path: '/customer/quotations', icon: 'quotations' },
    { label: 'Negotiation', path: '/customer/negotiation', icon: 'negotiation' },
    { label: 'Orders', path: '/customer/orders', icon: 'orders' },
    { label: 'Invoices', path: '/customer/invoices', icon: 'invoices' },
    { label: 'Payments', path: '/customer/payments', icon: 'payments' },
    { label: 'Subscriptions', path: '/customer/subscriptions', icon: 'subscriptions' },
  ],
};

module.exports = { ROLES, ROLE_PORTALS, ROLE_NAVIGATION };
