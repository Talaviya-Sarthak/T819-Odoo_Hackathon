import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role, ProtectedRouteProps } from '../types';

interface RoleRouteProps extends ProtectedRouteProps {
  allowedRoles: Role[];
}

export default function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const isAdmin = user.role === 'ADMIN';
  const isCustomerRoute = allowedRoles.includes('CUSTOMER');

  // Customer role can ONLY access customer routes
  if (user.role === 'CUSTOMER') {
    if (!isCustomerRoute) {
      return <Navigate to="/customer/dashboard" replace />;
    }
    return <>{children}</>;
  }

  // Internal users should not access customer portal unless admin
  if (isCustomerRoute && (user.role as string) !== 'CUSTOMER' && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  const hasAccess = allowedRoles.includes(user.role) || isAdmin;

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
