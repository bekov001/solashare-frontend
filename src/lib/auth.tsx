"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { AuthUser, UserRole } from "@/types";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  /** Dev-only: switch role without a real backend call */
  devSwitchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "solashare_token";
const USER_KEY  = "solashare_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [token, setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser  = localStorage.getItem(USER_KEY);
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((t: string, u: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const devSwitchRole = useCallback((role: UserRole) => {
    const mock: AuthUser = {
      id:           "dev-user-" + role,
      display_name: role === "admin" ? "Admin User" : role === "issuer" ? "SolaShare Issuer" : "Demo Investor",
      role,
    };
    const mockToken = "dev_token_" + role;
    login(mockToken, mock);
  }, [login]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, devSwitchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
