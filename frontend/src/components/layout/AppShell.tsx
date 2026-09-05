import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../config/roles';
import type { Role } from '../../types';

interface AppShellProps {
  portalName?: string;
}

export default function AppShell({ portalName }: AppShellProps) {
  const { user } = useAuth();
  const role = user?.role as Role;
  const title = portalName || ROLE_LABELS[role] || 'Portal';

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header portalName={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
