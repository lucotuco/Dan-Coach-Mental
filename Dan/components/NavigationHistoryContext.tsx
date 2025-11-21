import { usePathname, useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface NavigationHistoryContextValue {
  currentPath: string | null;
  previousPath: string | null;
  history: string[];
  canGoBack: boolean;
  goBack: () => void;
}

const NavigationHistoryContext = createContext<NavigationHistoryContextValue | undefined>(undefined);

export function NavigationHistoryProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [history, setHistory] = useState<string[]>(pathname ? [pathname] : []);

  useEffect(() => {
    if (!pathname) return;

    setHistory((prev) => {
      const lastPath = prev[prev.length - 1];
      if (lastPath === pathname) {
        return prev;
      }

      return [...prev, pathname];
    });
  }, [pathname]);

  const goBack = useCallback(() => {
    setHistory((prev) => {
      if (prev.length <= 1) {
        router.back();
        return prev;
      }

      const nextHistory = prev.slice(0, -1);
      const targetPath = nextHistory[nextHistory.length - 1];

      if (targetPath) {
        router.replace(targetPath);
      }

      return nextHistory;
    });
  }, [router]);

  const value = useMemo(() => {
    const currentPath = history[history.length - 1] ?? null;
    const previousPath = history.length > 1 ? history[history.length - 2] : null;

    return {
      currentPath,
      previousPath,
      history,
      canGoBack: history.length > 1,
      goBack,
    };
  }, [goBack, history]);

  return (
    <NavigationHistoryContext.Provider value={value}>
      {children}
    </NavigationHistoryContext.Provider>
  );
}

export function useNavigationHistory() {
  const context = useContext(NavigationHistoryContext);

  if (!context) {
    throw new Error('useNavigationHistory must be used within a NavigationHistoryProvider');
  }

  return context;
}