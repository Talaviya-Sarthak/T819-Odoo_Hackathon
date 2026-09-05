import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';

interface AppShellProps {
  portalName?: string;
}

export default function AppShell({ portalName }: AppShellProps) {
  const { portal } = useAuth();
  const title = portalName || portal?.name || 'Portal';

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
