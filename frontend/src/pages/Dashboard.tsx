import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

export default function Dashboard() {
  const { user, logout } = useAuth();

  async function handleLogout() {
    try {
      await fetch(import.meta.env.VITE_API_URL + '/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // ignore logout error
    }
    logout();
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-5">
      <div className="w-full max-w-[400px] rounded-lg border border-gray-200 bg-white p-10 text-center">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Authenticated</h1>
          <p className="mt-2 text-sm text-gray-500">You are successfully logged in.</p>
        </div>

        <div className="mb-8 rounded-md bg-gray-50 p-4 text-left">
          <div className="flex justify-between border-b border-gray-100 py-2">
            <span className="text-sm text-gray-500">User:</span>
            <span className="text-sm font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 py-2">
            <span className="text-sm text-gray-500">Authentication:</span>
            <span className="text-sm font-medium">JWT ✓</span>
          </div>
          {user?.name && (
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-500">Name:</span>
              <span className="text-sm font-medium">{user.name}</span>
            </div>
          )}
        </div>

        <Button onClick={handleLogout} variant="secondary">Logout</Button>
      </div>
    </div>
  );
}
