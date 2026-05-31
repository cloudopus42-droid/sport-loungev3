import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { User, AuthResponse } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  loginWithGoogle: () => Promise<void>;
  handleGoogleCallback: (accessToken: string) => Promise<void>;
  setUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isAdmin: false,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  loginWithGoogle: async () => {},
  handleGoogleCallback: async () => {},
  setUser: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

// Normalize user to always have _id
function normalizeUser(u: any): User {
  return { ...u, _id: u._id || u.id };
}

// Restore user from localStorage synchronously to avoid flash
function getInitialUser(): User | null {
  try {
    const saved = localStorage.getItem('user');
    if (saved) {
      const parsed = JSON.parse(saved);
      return normalizeUser(parsed);
    }
  } catch {}
  return null;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => getInitialUser());
  const [loading, setLoading] = useState(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = getInitialUser();
    return !savedToken || !savedUser;
  });

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (!savedToken) {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get<{ user: User }>('/api/auth/me');
        const normalized = normalizeUser(data.user);
        setUser(normalized);
        setToken(savedToken);
        localStorage.setItem('user', JSON.stringify(normalized));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/api/auth/login', { email, password });
    const normalized = normalizeUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(normalized));
    setToken(data.token);
    setUser(normalized);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const { data } = await api.post<AuthResponse>('/api/auth/register', { email, password, name });
    const normalized = normalizeUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(normalized));
    setToken(data.token);
    setUser(normalized);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login/callback`,
      },
    });
    if (error) throw error;
  }, []);

  const handleGoogleCallback = useCallback(async (accessToken: string) => {
    const { data } = await api.post<AuthResponse>('/api/auth/google', { accessToken });
    const normalized = normalizeUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(normalized));
    setToken(data.token);
    setUser(normalized);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    supabase.auth.signOut().catch(() => {});
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        loading,
        login,
        register,
        logout,
        loginWithGoogle,
        handleGoogleCallback,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
