import { useAuth } from '../../context/AuthContext';

const ROLE_BADGE_COLORS: Record<string, string> = {
  SALES_REP: 'bg-blue-100 text-blue-800',
  MANAGER_ADMIN: 'bg-purple-100 text-purple-800',
  OPS_FINANCE: 'bg-green-100 text-green-800',
  CUSTOMER: 'bg-orange-100 text-orange-800',
};

const ROLE_LABELS: Record<string, string> = {
  SALES_REP: 'Sales Representative',
  MANAGER_ADMIN: 'Manager / Admin',
  OPS_FINANCE: 'Operations & Finance',
  CUSTOMER: 'Customer',
};

interface HeaderProps {
  portalName: string;
}

export default function Header({ portalName }: HeaderProps) {
  const { user, logout } = useAuth();

  async function handleLogout() {
    try {
      await fetch(import.meta.env.VITE_API_URL + '/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // ignore
    }
    logout();
  }

  const role = user?.role;

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-gray-800">{portalName}</h2>
      </div>

      <div className="flex items-center gap-4">
        {role && (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE_COLORS[role] || 'bg-gray-100 text-gray-800'}`}>
            {ROLE_LABELS[role] || role}
          </span>
        )}

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-700">
            {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <span className="text-sm text-gray-600">{user?.name || user?.email}</span>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
