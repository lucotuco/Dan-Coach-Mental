import React, { createContext, useContext, useState } from 'react';
import type { Router } from 'expo-router';

export const getStoredToken = () =>
  typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;

const clearStoredToken = () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('token');
  }
};

export const isUnauthorizedStatus = (status: number) => status === 401 || status === 403;

type RouterLike = Pick<Router, 'replace'>;

export function redirectToLogin(router: RouterLike, logout: () => void) {
  logout();
  router.replace('/bienvenida'); // o '/(auth)/login'
}

type User = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 🔹 Helper para leer el user guardado en localStorage
const getStoredUser = (): User | null => {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // 🔹 Hidratamos el estado inicial desde localStorage (si hay algo)
  const [user, setUser] = useState<User | null>(() => getStoredUser());

  const login = (userData: User) => {
    setUser(userData);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(userData));
    }
  };

  const logout = () => {
    setUser(null);
    clearStoredToken();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('user');
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return ctx;
};
