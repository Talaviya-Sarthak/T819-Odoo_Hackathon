import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser, refreshToken } from '../services/auth.api';
import type { User, AuthState } from '../types';

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const data = await getCurrentUser();
        setUser(data.user);
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
        return data.accessToken;
      }
    } catch {
      logout();
    }
    return null;
  }

  function login(accessToken: string, refreshTokenValue: string, userData: User) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshTokenValue);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth, handleRefreshToken }}>
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
