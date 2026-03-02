import React, { createContext, useContext, useState } from 'react';
import type { Router } from 'expo-router';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const getStoredToken = () =>
  typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

const setStoredToken = (token: string | null) => {
  if (typeof localStorage === 'undefined') return;
  if (!token) localStorage.removeItem(TOKEN_KEY);
  else localStorage.setItem(TOKEN_KEY, token);
};

const clearStoredToken = () => setStoredToken(null);

export const isUnauthorizedStatus = (status: number) => status === 401 || status === 403;

type RouterLike = Pick<Router, 'replace'>;

export function redirectToLogin(router: RouterLike, logout: () => void) {
  logout();
  router.replace('/'); // o '/(auth)/login'
}

export type User = {
  // tu backend nuevo suele devolver userId; si devuelve _id, lo soportamos también
  userId?: string;
  _id?: string;

  name: string;
  email: string;

  role?: 'coach' | 'member';
  teamId?: string | null;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // ✅ cambio clave
  login: (token: string, user: User) => void;

  logout: () => void;
  setUserData: (user: User) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getStoredUser = (): User | null => {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());

  const login = (tokenValue: string, userData: User) => {
    setUser(userData);
    setToken(tokenValue);

    setStoredToken(tokenValue);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    clearStoredToken();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(USER_KEY);
    }
  };
  const setUserData = (userData: User) => {
  setUser(userData);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(userData));
  }
};

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    setUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return ctx;
};