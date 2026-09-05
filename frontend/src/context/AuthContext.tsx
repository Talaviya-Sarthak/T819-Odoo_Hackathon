import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser, refreshToken } from '../services/auth.api';
import type { User, AuthState, PortalInfo, NavItem } from '../types';

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [portal, setPortal] = useState<PortalInfo | null>(null);
  const [navigation, setNavigation] = useState<NavItem[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const data = await getCurrentUser();
        setUser(data.user);
        setPortal(data.portal || null);
        setNavigation(data.navigation || []);
        setPermissions(data.permissions || []);
      }
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  async function handleRefreshToken(): Promise<string | null> {
    try {
      const refresh = localStorage.getItem('refreshToken');
      if (refresh) {
        const data = await refreshToken(refresh);
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        if (data.user) setUser(data.user);
        if (data.portal) setPortal(data.portal);
        if (data.navigation) setNavigation(data.navigation);
        if (data.permissions) setPermissions(data.permissions);
        return data.accessToken;
      }
    } catch {
      logout();
    }
    return null;
  }

  function login(accessToken: string, refreshTokenValue: string, userData: User, portalData?: PortalInfo | null, navData?: NavItem[], permData?: string[]) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshTokenValue);
    setUser(userData);
    setPortal(portalData || null);
    setNavigation(navData || []);
    setPermissions(permData || []);
  }

  function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setPortal(null);
    setNavigation([]);
    setPermissions([]);
  }

  return (
    <AuthContext.Provider value={{ user, loading, portal, navigation, permissions, login, logout, checkAuth, handleRefreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
