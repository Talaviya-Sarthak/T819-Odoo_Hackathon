import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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

export default function Sidebar() {
  const { user, navigation } = useAuth();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-gray-900">
      <div className="flex h-16 items-center border-b border-gray-700 px-5">
        <span className="text-lg font-bold text-white">DealFlow360</span>
      </div>

      {user && (
        <div className="border-b border-gray-700 px-5 py-3">
          <p className="text-xs text-gray-400">Logged in as</p>
          <p className="text-sm font-medium text-white">{user.role?.replace('_', ' ')}</p>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <span className="text-base">{ICON_MAP[item.icon] || '•'}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-gray-700 px-5 py-3">
        <p className="text-xs text-gray-500">DealFlow360 RBAC Demo</p>
      </div>
    </aside>
  );
}
