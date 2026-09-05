import type { Role, NavItem } from '../types';

export const ROLES: Record<Role, Role> = {
  SALES_REP: 'SALES_REP',
  MANAGER_ADMIN: 'MANAGER_ADMIN',
  OPS_FINANCE: 'OPS_FINANCE',
  CUSTOMER: 'CUSTOMER',
};

export const ROLE_PORTALS: Record<Role, string> = {
  SALES_REP: '/sales/dashboard',
  MANAGER_ADMIN: '/management/dashboard',
  OPS_FINANCE: '/operations/dashboard',
  CUSTOMER: '/customer/dashboard',
};

export const ROLE_LABELS: Record<Role, string> = {
  SALES_REP: 'Sales Representative',
  MANAGER_ADMIN: 'Manager / Admin',
  OPS_FINANCE: 'Operations & Finance',
  CUSTOMER: 'Customer',
};

export const ROLE_BADGE_COLORS: Record<Role, string> = {
  SALES_REP: 'bg-blue-100 text-blue-800',
  MANAGER_ADMIN: 'bg-purple-100 text-purple-800',
  OPS_FINANCE: 'bg-green-100 text-green-800',
  CUSTOMER: 'bg-orange-100 text-orange-800',
};

export const ROLE_NAVIGATION: Record<Role, NavItem[]> = {
  SALES_REP: [
    { label: 'Dashboard', path: '/sales/dashboard', icon: 'dashboard' },
    { label: 'Customers', path: '/sales/customers', icon: 'customers' },
    { label: 'Quotations', path: '/sales/quotations', icon: 'quotations' },
    { label: 'Quote Builder', path: '/sales/quote-builder', icon: 'quote-builder' },
    { label: 'Orders', path: '/sales/orders', icon: 'orders' },
    { label: 'AI Deal Advisor', path: '/sales/ai-advisor', icon: 'ai' },
    { label: 'Discount Requests', path: '/sales/discount-requests', icon: 'discount' },
    { label: 'Approval Status', path: '/sales/approval-status', icon: 'approval' },
  ],
  MANAGER_ADMIN: [
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
  OPS_FINANCE: [
    { label: 'Dashboard', path: '/operations/dashboard', icon: 'dashboard' },
    { label: 'Orders', path: '/operations/orders', icon: 'orders' },
    { label: 'Fulfillment', path: '/operations/fulfillment', icon: 'fulfillment' },
    { label: 'Warehouses', path: '/operations/warehouses', icon: 'warehouses' },
    { label: 'Invoices', path: '/operations/invoices', icon: 'invoices' },
    { label: 'Payments', path: '/operations/payments', icon: 'payments' },
    { label: 'Subscriptions', path: '/operations/subscriptions', icon: 'subscriptions' },
  ],
  CUSTOMER: [
    { label: 'Dashboard', path: '/customer/dashboard', icon: 'dashboard' },
    { label: 'My Quotations', path: '/customer/quotations', icon: 'quotations' },
    { label: 'Negotiation', path: '/customer/negotiation', icon: 'negotiation' },
    { label: 'Orders', path: '/customer/orders', icon: 'orders' },
    { label: 'Invoices', path: '/customer/invoices', icon: 'invoices' },
    { label: 'Payments', path: '/customer/payments', icon: 'payments' },
    { label: 'Subscriptions', path: '/customer/subscriptions', icon: 'subscriptions' },
  ],
};

export function getPortalPath(role: Role): string {
  return ROLE_PORTALS[role] || '/login';
}

export function getNavForRole(role: Role): NavItem[] {
  return ROLE_NAVIGATION[role] || [];
}
