import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ProtectedRouteProps } from '../types';

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-200 border-t-gray-900" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
