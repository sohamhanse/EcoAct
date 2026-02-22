import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AdminUser } from "../types";
import {
  adminDemoLogin,
  adminMe,
  clearAuthStorage,
  persistAuth,
  readStoredAuth,
  setUnauthorizedHandler,
} from "./api";

type AuthContextValue = {
  user: AdminUser | null;
  loading: boolean;
  login: (payload: { email?: string; name?: string; communityId?: string }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setUnauthorizedHandler(() => {
      clearAuthStorage();
      if (mounted) setUser(null);
    });
    async function init() {
      const cached = readStoredAuth();
      if (!cached) {
        if (mounted) setLoading(false);
        return;
      }
      setUser(cached.user);
      try {
        const fresh = await adminMe();
        if (mounted) setUser(fresh);
        persistAuth(cached.tokens, fresh);
      } catch {
        clearAuthStorage();
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void init();
    return () => {
      mounted = false;
      setUnauthorizedHandler(null);
    };
  }, []);

  async function login(payload: { email?: string; name?: string; communityId?: string }) {
    const result = await adminDemoLogin(payload);
    persistAuth({ accessToken: result.accessToken, refreshToken: result.refreshToken }, result.user);
    setUser(result.user);
  }

  function logout() {
    clearAuthStorage();
    setUser(null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, logout }),
    [user, loading],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
