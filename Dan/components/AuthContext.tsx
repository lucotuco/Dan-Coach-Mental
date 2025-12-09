import React, { createContext, useContext, useState } from 'react';

export const getStoredToken = () =>
  typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;

const clearStoredToken = () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('token');
  }
};

export const isUnauthorizedStatus = (status: number) => status === 401 || status === 403;

export const redirectToLogin = (
  router: { replace: (href: string) => void },
  logout?: () => void,
) => {
  clearStoredToken();
  logout?.();
  router.replace('/');
};

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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
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
