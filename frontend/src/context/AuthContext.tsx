import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { profileApi } from '../api/client';
import type { AuthResponse } from '../api/types';

interface AuthState {
  token: string | null;
  userId: number | null;
  email: string | null;
  displayName: string | null;
  role: string | null;
  status: string | null;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  isApproved: boolean;
  isAdmin: boolean;
  setAuth: (data: AuthResponse) => void;
  logout: () => void;
  updateDisplayName: (name: string) => void;
  updateStatus: (status: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'auth';

function loadAuth(): AuthState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { token: null, userId: null, email: null, displayName: null, role: null, status: null };
  }
  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    return { token: null, userId: null, email: null, displayName: null, role: null, status: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuthState] = useState<AuthState>(loadAuth);

  useEffect(() => {
    if (auth.token) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
      localStorage.setItem('token', auth.token);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('token');
    }
  }, [auth]);

  useEffect(() => {
    if (!localStorage.getItem('token')) return;

    profileApi.get()
      .then((profile) => {
        setAuthState((prev) => {
          if (!prev.token) return prev;
          return {
            ...prev,
            displayName: profile.displayName,
            role: profile.role,
            status: profile.status,
          };
        });
      })
      .catch(() => undefined);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    ...auth,
    isAuthenticated: !!auth.token,
    isApproved: auth.status === 'Approved',
    isAdmin: auth.role === 'Admin',
    setAuth: (data: AuthResponse) => {
      setAuthState({
        token: data.token,
        userId: data.userId,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        status: data.status,
      });
    },
    logout: () => setAuthState({
      token: null, userId: null, email: null, displayName: null, role: null, status: null,
    }),
    updateDisplayName: (name: string) => setAuthState((prev) => ({ ...prev, displayName: name })),
    updateStatus: (status: string) => setAuthState((prev) => ({ ...prev, status })),
  }), [auth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
