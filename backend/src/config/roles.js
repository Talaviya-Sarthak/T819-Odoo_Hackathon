'use strict';

const ROLES = {
  SALES_REP: 'SALES_REP',
  MANAGER_ADMIN: 'MANAGER_ADMIN',
  OPS_FINANCE: 'OPS_FINANCE',
  CUSTOMER: 'CUSTOMER',
};

const ROLE_PORTALS = {
  [ROLES.SALES_REP]: '/sales/dashboard',
  [ROLES.MANAGER_ADMIN]: '/management/dashboard',
  [ROLES.OPS_FINANCE]: '/operations/dashboard',
  [ROLES.CUSTOMER]: '/customer/dashboard',
};

const ROLE_NAVIGATION = {
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
  [ROLES.MANAGER_ADMIN]: [
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
  [ROLES.OPS_FINANCE]: [
    { label: 'Dashboard', path: '/operations/dashboard', icon: 'dashboard' },
    { label: 'Orders', path: '/operations/orders', icon: 'orders' },
    { label: 'Fulfillment', path: '/operations/fulfillment', icon: 'fulfillment' },
    { label: 'Warehouses', path: '/operations/warehouses', icon: 'warehouses' },
    { label: 'Invoices', path: '/operations/invoices', icon: 'invoices' },
    { label: 'Payments', path: '/operations/payments', icon: 'payments' },
    { label: 'Subscriptions', path: '/operations/subscriptions', icon: 'subscriptions' },
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
