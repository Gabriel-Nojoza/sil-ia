"use client";

import { createContext, useEffect, useMemo, useState } from "react";
import type { AuthContextValue, AuthUser } from "@/types/chat";

const AUTH_STORAGE_KEY = "sil-auth-user";
const AUTH_ADMIN_SESSION_KEY = "sil-auth-admin-session";

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const storedAdminSession = window.sessionStorage.getItem(AUTH_ADMIN_SESSION_KEY);

    if (storedAdminSession) {
      try {
        setUser(JSON.parse(storedAdminSession) as AuthUser);
        setIsHydrated(true);
        return;
      } catch {
        window.sessionStorage.removeItem(AUTH_ADMIN_SESSION_KEY);
      }
    }

    const storedUser = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as AuthUser;

        if (parsedUser.role === "admin") {
          window.localStorage.removeItem(AUTH_STORAGE_KEY);
        } else {
          setUser(parsedUser);
        }
      } catch {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }

    setIsHydrated(true);
  }, []);

  function login(nextUser: AuthUser) {
    setUser(nextUser);

    if (nextUser.role === "admin") {
      window.sessionStorage.setItem(AUTH_ADMIN_SESSION_KEY, JSON.stringify(nextUser));
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
    window.sessionStorage.removeItem(AUTH_ADMIN_SESSION_KEY);
  }

  function logout() {
    setUser(null);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.sessionStorage.removeItem(AUTH_ADMIN_SESSION_KEY);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isHydrated,
      login,
      logout,
    }),
    [isHydrated, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
