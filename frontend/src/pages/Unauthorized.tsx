import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Unauthorized() {
  const { user, portal } = useAuth();

  const homePath = portal?.route || '/login';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-5">
      <div className="w-full max-w-[400px] rounded-lg border border-gray-200 bg-white p-10 text-center">
        <div className="mb-4 text-6xl">🚫</div>
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="mt-3 text-sm text-gray-500">
          You do not have permission to access this page.
        </p>
        <div className="mt-6">
          <Link
            to={homePath}
            className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
