/**
 * Intelligent Data Prefetching Engine
 * 
 * Provides predictive prefetching for frequently accessed and logically related
 * routes based on user roles, idle browser states, and navigation intent (hover/focus).
 */

import { queryCache } from './query-cache';
import { apiGet } from './api';
import type { User } from '../types';

/**
 * Route-to-API Mapping:
 * Only prefetch the first page (`page=1&limit=10`) and essential lookup tables
 */
export const ROUTE_API_MAP: Record<string, string[]> = {
  // Sales
  '/sales/dashboard': ['/api/quotations?page=1&limit=10', '/api/customers?page=1&limit=10'],
  '/sales/quotations': ['/api/quotations?page=1&limit=10'],
  '/sales/customers': ['/api/customers?page=1&limit=10'],
  '/sales/orders': ['/api/orders?page=1&limit=10'],
  '/sales/quote-builder': ['/api/customers?all=true', '/api/products?page=1&limit=10'],

  // Operations
  '/operations/dashboard': ['/api/orders?page=1&limit=10', '/api/reports/operations'],
  '/operations/orders': ['/api/orders?page=1&limit=10', '/api/quotations?status=CUSTOMER_CONFIRMED'],
  '/operations/fulfillment': ['/api/fulfillments?page=1&limit=10', '/api/warehouses'],
  '/operations/inventory': ['/api/inventory?page=1&limit=10', '/api/warehouses'],
  '/operations/invoices': ['/api/invoices?page=1&limit=10'],
  '/operations/payments': ['/api/payments?page=1&limit=10'],
  '/operations/subscriptions': ['/api/subscriptions?page=1&limit=10'],
  '/operations/backorders': ['/api/backorders?page=1&limit=10', '/api/warehouses'],
  '/operations/warehouses': ['/api/warehouses'],

  // Management
  '/management/dashboard': ['/api/reports/executive', '/api/approvals?page=1&limit=10'],
  '/management/approvals': ['/api/approvals?page=1&limit=10'],
  '/management/products': ['/api/products?page=1&limit=10', '/api/products/categories'],
  '/management/users': ['/api/management/users?page=1&limit=10'],
  '/management/deal-health': ['/api/reports/deal-health'],
  '/management/analytics': ['/api/reports/sales?period=all'],

  // Customer Portal
  '/customer/dashboard': ['/api/customer/quotations?page=1&limit=10', '/api/customer/orders?page=1&limit=10'],
  '/customer/quotations': ['/api/customer/quotations?page=1&limit=10'],
  '/customer/orders': ['/api/customer/orders?page=1&limit=10'],
  '/customer/invoices': ['/api/customer/invoices?page=1&limit=10'],
  '/customer/payments': ['/api/customer/payments?page=1&limit=10'],
};

/**
 * Related Routes Graph:
 * Identifies high-probability next routes when a user is on a given page
 */
export const RELATED_ROUTES_MAP: Record<string, string[]> = {
  // From Sales Dashboard -> frequently check deals, customers, orders
  '/sales/dashboard': ['/sales/quotations', '/sales/customers', '/sales/orders'],
  // From Quotations -> likely to check customer accounts or converted orders
  '/sales/quotations': ['/sales/customers', '/sales/orders'],
  // From Customers -> likely to view or build quotes for them
  '/sales/customers': ['/sales/quotations', '/sales/orders'],
  // From Orders -> likely to check fulfillment pipeline
  '/sales/orders': ['/operations/fulfillment', '/sales/quotations'],

  // From Operations Dashboard -> check orders, fulfillment, inventory
  '/operations/dashboard': ['/operations/orders', '/operations/fulfillment', '/operations/inventory', '/operations/invoices'],
  // From Orders -> check fulfillment or invoices
  '/operations/orders': ['/operations/fulfillment', '/operations/invoices'],
  // From Fulfillment -> check inventory levels or backorders
  '/operations/fulfillment': ['/operations/inventory', '/operations/backorders'],
  // From Inventory -> check fulfillment or backorders
  '/operations/inventory': ['/operations/fulfillment', '/operations/backorders'],
  // From Invoices -> check recorded payments
  '/operations/invoices': ['/operations/payments', '/operations/subscriptions'],
  // From Backorders -> check inventory restock
  '/operations/backorders': ['/operations/inventory', '/operations/fulfillment'],

  // From Management Dashboard -> approvals and product catalog
  '/management/dashboard': ['/management/approvals', '/management/products', '/sales/quotations'],
  '/management/approvals': ['/sales/quotations', '/management/dashboard'],

  // Customer Portal
  '/customer/dashboard': ['/customer/quotations', '/customer/orders', '/customer/invoices'],
  '/customer/quotations': ['/customer/orders', '/customer/invoices'],
  '/customer/orders': ['/customer/invoices', '/customer/payments'],
};

/**
 * Role-based Security Guard:
 * Ensures users NEVER prefetch routes or endpoints they lack permissions for
 */
export function isRouteAllowedForRole(route: string, role?: string): boolean {
  if (!role) return false;
  if (role === 'ADMIN') return true;

  switch (role) {
    case 'SALES_REP':
      return route.startsWith('/sales') || route === '/sales/quotations' || route === '/sales/customers' || route === '/sales/orders';
    case 'SALES_MANAGER':
      return route.startsWith('/sales') || route.startsWith('/management') || route.startsWith('/operations/orders');
    case 'OPERATIONS':
      return route.startsWith('/operations') || route.startsWith('/sales/orders');
    case 'FINANCE':
      return route.startsWith('/operations/invoices') || route.startsWith('/operations/payments') || route.startsWith('/operations/subscriptions') || route.startsWith('/operations/orders');
    case 'CUSTOMER':
      return route.startsWith('/customer');
    default:
      return false;
  }
}

let hoverTimer: any = null;
let idleTimer: any = null;
let activePrefetchControllers: AbortController[] = [];

/**
 * Prefetches all primary API endpoints for a given route
 */
export function prefetchRoute(route: string, user: User | null): void {
  if (!user || !isRouteAllowedForRole(route, user.role)) {
    return;
  }

  const endpoints = ROUTE_API_MAP[route];
  if (!endpoints || endpoints.length === 0) {
    return;
  }

  // Prefetch each endpoint into the query cache with a 60-second freshness window
  endpoints.forEach((endpoint) => {
    queryCache.prefetch(endpoint, (signal) => apiGet(endpoint, { signal }));
  });
}

/**
 * Debounced hover prefetch for navigation links
 * Triggers only after 120ms of continuous hover to avoid accidental mouse-overs
 */
export function queueHoverPrefetch(route: string, user: User | null): void {
  if (hoverTimer) clearTimeout(hoverTimer);
  hoverTimer = setTimeout(() => {
    prefetchRoute(route, user);
  }, 120);
}

/**
 * Cancels pending hover prefetch if cursor leaves before threshold
 */
export function cancelHoverPrefetch(): void {
  if (hoverTimer) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }
}

/**
 * Intelligent Idle Prefetcher:
 * Runs when the browser is idle after the current page finishes loading.
 * Prefetches high-probability next routes according to the RELATED_ROUTES_MAP.
 */
export function scheduleIdlePrefetch(currentPath: string, user: User | null): void {
  // Cancel previous idle schedule
  cancelIdlePrefetch();

  if (!user) return;

  const firstPart = currentPath.split('?')[0] || currentPath;
  const normalizedPath = firstPart.split('#')[0] || firstPart;
  const relatedRoutes = RELATED_ROUTES_MAP[normalizedPath];
  if (!relatedRoutes || relatedRoutes.length === 0) return;

  const runPrefetch = () => {
    // Filter by user role permissions
    const allowedRoutes = relatedRoutes.filter((route: string) => isRouteAllowedForRole(route, user.role));
    if (allowedRoutes.length === 0) return;

    // Sequentially prefetch related routes with low priority
    let index = 0;
    const fetchNext = () => {
      if (index >= allowedRoutes.length) return;
      const route = allowedRoutes[index++];
      if (route) {
        prefetchRoute(route, user);
      }
      // Stagger consecutive related requests by 250ms to keep network pipeline light
      idleTimer = setTimeout(fetchNext, 250);
    };

    fetchNext();
  };

  // Schedule during idle callback or after 1000ms delay
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(runPrefetch, { timeout: 2000 });
  } else {
    idleTimer = setTimeout(runPrefetch, 1000);
  }
}

/**
 * Cancel any ongoing idle prefetch timers
 */
export function cancelIdlePrefetch(): void {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
}
