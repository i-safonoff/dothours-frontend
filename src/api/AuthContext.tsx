import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { getToken, setToken as persistToken } from './client';
import { authApi } from './endpoints';
import type { ApiUser } from './types';

interface AuthState {
  user: ApiUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<ApiUser>;
  register: (email: string, password: string, name: string) => Promise<ApiUser>;
  logout: () => void;
  updateUser: (user: ApiUser) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => persistToken(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    persistToken(res.access_token);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const res = await authApi.register(email, password, name);
    persistToken(res.access_token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    persistToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updated: ApiUser) => {
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
