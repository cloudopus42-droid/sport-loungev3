import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

// Admin emails hardcoded (same as server)
const ADMIN_EMAILS = ['aveumetdies@gmail.com', 'admin@sportlounge.ru'];

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

// Try API first, fall back to Supabase direct
async function apiCall(method: 'GET' | 'POST' | 'PUT', path: string, body?: any, token?: string): Promise<any> {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) throw new Error('No API URL');
  
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  
  try {
    const res = await fetch(`${apiUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    clearTimeout(timeout);
    throw err;
  }
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
  const isAdmin = user?.role === 'admin' || ADMIN_EMAILS.includes(user?.email?.toLowerCase() || '');

  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (!savedToken) {
        // Check Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const email = session.user.email?.toLowerCase() || '';
          const role = ADMIN_EMAILS.includes(email) ? 'admin' : 'user';
          const supaUser: User = normalizeUser({
            id: session.user.id,
            email,
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Пользователь',
            role,
            avatar: session.user.user_metadata?.avatar_url || null,
          });
          localStorage.setItem('token', session.access_token);
          localStorage.setItem('user', JSON.stringify(supaUser));
          setToken(session.access_token);
          setUser(supaUser);
        } else {
          setUser(null);
          setToken(null);
        }
        setLoading(false);
        return;
      }

      // Try to validate token via API
      try {
        const data = await apiCall('GET', '/api/auth/me', undefined, savedToken);
        const normalized = normalizeUser(data.user);
        // Ensure admin status
        if (ADMIN_EMAILS.includes(normalized.email?.toLowerCase())) {
          normalized.role = 'admin';
        }
        setUser(normalized);
        setToken(savedToken);
        localStorage.setItem('user', JSON.stringify(normalized));
      } catch {
        // API unreachable — trust localStorage data if present
        const savedUser = getInitialUser();
        if (savedUser) {
          // Ensure admin status from email
          if (ADMIN_EMAILS.includes(savedUser.email?.toLowerCase() || '')) {
            savedUser.role = 'admin';
          }
          setUser(savedUser);
          setToken(savedToken);
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Listen to Supabase auth state changes (handles Google OAuth callback)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const email = session.user.email?.toLowerCase() || '';
        const role = ADMIN_EMAILS.includes(email) ? 'admin' : 'user';
        
        // Try to register/login via API backend
        try {
          const data = await apiCall('POST', '/api/auth/google', { accessToken: session.access_token });
          const normalized = normalizeUser(data.user);
          if (ADMIN_EMAILS.includes(normalized.email?.toLowerCase())) {
            normalized.role = 'admin';
          }
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(normalized));
          setToken(data.token);
          setUser(normalized);
        } catch {
          // API unreachable — use Supabase session directly
          const supaUser: User = normalizeUser({
            id: session.user.id,
            email,
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Пользователь',
            role,
            avatar: session.user.user_metadata?.avatar_url || null,
          });
          localStorage.setItem('token', session.access_token);
          localStorage.setItem('user', JSON.stringify(supaUser));
          setToken(session.access_token);
          setUser(supaUser);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // Try API first
    try {
      const data = await apiCall('POST', '/api/auth/login', { email, password });
      const normalized = normalizeUser(data.user);
      if (ADMIN_EMAILS.includes(normalized.email?.toLowerCase())) {
        normalized.role = 'admin';
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(normalized));
      setToken(data.token);
      setUser(normalized);
      return;
    } catch {
      // API unavailable — try Supabase direct auth
    }

    // Fallback: Supabase email/password auth
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // Try sign up if sign in fails
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: { name: email.split('@')[0] } }
      });
      if (signUpError) throw new Error(signUpError.message);
      if (!signUpData.session) throw new Error('Проверьте email для подтверждения регистрации');
      
      const role = ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'user';
      const supaUser: User = normalizeUser({
        id: signUpData.user!.id,
        email: email.toLowerCase(),
        name: email.split('@')[0],
        role,
      });
      localStorage.setItem('token', signUpData.session.access_token);
      localStorage.setItem('user', JSON.stringify(supaUser));
      setToken(signUpData.session.access_token);
      setUser(supaUser);
      return;
    }

    if (!authData.session) throw new Error('Не удалось создать сессию');
    
    const role = ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'user';
    const supaUser: User = normalizeUser({
      id: authData.user.id,
      email: email.toLowerCase(),
      name: authData.user.user_metadata?.name || email.split('@')[0],
      role,
      avatar: authData.user.user_metadata?.avatar_url || null,
    });
    localStorage.setItem('token', authData.session.access_token);
    localStorage.setItem('user', JSON.stringify(supaUser));
    setToken(authData.session.access_token);
    setUser(supaUser);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    // Try API first
    try {
      const data = await apiCall('POST', '/api/auth/register', { email, password, name });
      const normalized = normalizeUser(data.user);
      if (ADMIN_EMAILS.includes(normalized.email?.toLowerCase())) {
        normalized.role = 'admin';
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(normalized));
      setToken(data.token);
      setUser(normalized);
      return;
    } catch {
      // API unavailable — use Supabase
    }

    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, full_name: name } },
    });
    if (error) throw new Error(error.message);
    if (!authData.session) throw new Error('Проверьте email для подтверждения регистрации');

    const role = ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'user';
    const supaUser: User = normalizeUser({
      id: authData.user!.id,
      email: email.toLowerCase(),
      name,
      role,
    });
    localStorage.setItem('token', authData.session.access_token);
    localStorage.setItem('user', JSON.stringify(supaUser));
    setToken(authData.session.access_token);
    setUser(supaUser);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}login/callback`,
      },
    });
    if (error) throw error;
  }, []);

  const handleGoogleCallback = useCallback(async (accessToken: string) => {
    // Try API
    try {
      const data = await apiCall('POST', '/api/auth/google', { accessToken });
      const normalized = normalizeUser(data.user);
      if (ADMIN_EMAILS.includes(normalized.email?.toLowerCase())) {
        normalized.role = 'admin';
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(normalized));
      setToken(data.token);
      setUser(normalized);
      return;
    } catch {
      // API unavailable
    }

    // Fallback: get user from Supabase directly
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(accessToken);
    if (error || !supabaseUser) throw new Error('Не удалось получить данные Google аккаунта');

    const email = supabaseUser.email?.toLowerCase() || '';
    const role = ADMIN_EMAILS.includes(email) ? 'admin' : 'user';
    const supaUser: User = normalizeUser({
      id: supabaseUser.id,
      email,
      name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || 'Пользователь Google',
      role,
      avatar: supabaseUser.user_metadata?.avatar_url || null,
    });
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(supaUser));
    setToken(accessToken);
    setUser(supaUser);
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
