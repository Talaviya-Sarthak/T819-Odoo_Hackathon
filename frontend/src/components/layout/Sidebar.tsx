import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { NavItem } from '../../types';

const ICON_MAP: Record<string, string> = {
  dashboard: '📊',
  customers: '👥',
  quotations: '📄',
  'quote-builder': '🔧',
  orders: '📦',
  ai: '🤖',
  discount: '💰',
  approval: '✅',
  approvals: '✅',
  'deal-health': '💚',
  analytics: '📈',
  reports: '📋',
  products: '🏷️',
  pricing: '💲',
  'discount-rules': '📏',
  'approval-rules': '📐',
  warehouses: '🏭',
  subscriptions: '🔄',
  users: '👤',
  fulfillment: '🚚',
  invoices: '🧾',
  payments: '💳',
  negotiation: '🤝',
};

const DEFAULT_ROLE_NAV: Record<string, NavItem[]> = {
  SALES_REP: [
    { name: 'dashboard', label: 'Sales Dashboard', path: '/sales/dashboard', icon: 'dashboard' },
    { name: 'quotations', label: 'Quotation Kanban', path: '/sales/quotations', icon: 'quotations' },
    { name: 'quote-builder', label: 'Create Quotation', path: '/sales/quote-builder', icon: 'quote-builder' },
    { name: 'customers', label: 'Customers', path: '/sales/customers', icon: 'customers' },
    { name: 'orders', label: 'Orders', path: '/sales/orders', icon: 'orders' },
    { name: 'approval-status', label: 'Approval Status', path: '/sales/approval-status', icon: 'approval' },
  ],
  SALES_MANAGER: [
    { name: 'dashboard', label: 'Overview', path: '/management/dashboard', icon: 'dashboard' },
    { name: 'approvals', label: 'Pending Approvals', path: '/management/approvals', icon: 'approvals' },
    { name: 'quotations', label: 'Quotation Kanban', path: '/sales/quotations', icon: 'quotations' },
    { name: 'quote-builder', label: 'Quote Builder', path: '/sales/quote-builder', icon: 'quote-builder' },
    { name: 'deal-health', label: 'Deal Health & Alerts', path: '/management/deal-health', icon: 'deal-health' },
    { name: 'analytics', label: 'Sales Analytics', path: '/management/analytics', icon: 'analytics' },
    { name: 'products', label: 'Products', path: '/management/products', icon: 'products' },
    { name: 'customers', label: 'Customers', path: '/sales/customers', icon: 'customers' },
  ],
  ADMIN: [
    { name: 'dashboard', label: 'Executive Dashboard', path: '/management/dashboard', icon: 'dashboard' },
    { name: 'approvals', label: 'Approvals Queue', path: '/management/approvals', icon: 'approvals' },
    { name: 'quotations', label: 'Quotation Kanban', path: '/sales/quotations', icon: 'quotations' },
    { name: 'quote-builder', label: 'Quote Builder', path: '/sales/quote-builder', icon: 'quote-builder' },
    { name: 'deal-health', label: 'Deal Health & Alerts', path: '/management/deal-health', icon: 'deal-health' },
    { name: 'analytics', label: 'Sales Analytics', path: '/management/analytics', icon: 'analytics' },
    { name: 'products', label: 'Products', path: '/management/products', icon: 'products' },
    { name: 'users', label: 'User Roles', path: '/management/users', icon: 'users' },
  ],
  FINANCE: [
    { name: 'approvals', label: 'Finance Approvals', path: '/management/approvals', icon: 'approvals' },
    { name: 'analytics', label: 'Financial Analytics', path: '/management/analytics', icon: 'analytics' },
    { name: 'quotations', label: 'Quotations Review', path: '/sales/quotations', icon: 'quotations' },
    { name: 'invoices', label: 'Invoices', path: '/operations/invoices', icon: 'invoices' },
    { name: 'payments', label: 'Payments', path: '/operations/payments', icon: 'payments' },
  ],
  OPERATIONS: [
    { name: 'dashboard', label: 'Operations Overview', path: '/operations/dashboard', icon: 'dashboard' },
    { name: 'orders', label: 'Order Processing', path: '/operations/orders', icon: 'orders' },
    { name: 'fulfillment', label: 'Fulfillment & Stock', path: '/operations/fulfillment', icon: 'fulfillment' },
    { name: 'warehouses', label: 'Warehouses', path: '/operations/warehouses', icon: 'warehouses' },
  ],
  CUSTOMER: [
    { name: 'dashboard', label: 'Customer Portal', path: '/customer/dashboard', icon: 'dashboard' },
    { name: 'quotations', label: 'My Quotations', path: '/customer/quotations', icon: 'quotations' },
    { name: 'negotiation', label: 'Negotiations & Chat', path: '/customer/negotiation', icon: 'negotiation' },
    { name: 'orders', label: 'My Orders', path: '/customer/orders', icon: 'orders' },
    { name: 'invoices', label: 'Invoices', path: '/customer/invoices', icon: 'invoices' },
  ],
};

export default function Sidebar() {
  const { user, navigation, logout } = useAuth();

  const role = user?.role || 'CUSTOMER';
  const roleNavItems = DEFAULT_ROLE_NAV[role] || DEFAULT_ROLE_NAV.CUSTOMER;
  
  // Use navigation if provided and matching, otherwise use standard roleNavItems
  const navItems = (navigation && navigation.length > 0) ? navigation : (roleNavItems || []);

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-800 bg-slate-950 shadow-xl">
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-black text-white shadow-md shadow-indigo-500/30">
            D
          </div>
          <span className="text-lg font-bold tracking-tight text-white">DealFlow<span className="text-indigo-400">360</span></span>
        </div>
      </div>

      {user && (
        <div className="border-b border-slate-800/80 bg-slate-900/40 px-5 py-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Role</span>
            <span className="inline-flex items-center rounded-full bg-indigo-950/80 px-2 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-700/50">
              {role.replace('_', ' ')}
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-slate-200 truncate">{user.email}</p>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`
            }
          >
            <span className="text-base">{ICON_MAP[item.icon] || '•'}</span>
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-rose-950/40 hover:border-rose-800 hover:text-rose-300"
        >
          <span>🚪</span> Sign Out
        </button>
      </div>
    </aside>
  );
}
