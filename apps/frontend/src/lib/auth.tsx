'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyId: string;
  companyName?: string;
  roles: string[];
  permissions: string[];
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  // Permission helpers
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasRole: (role: string) => boolean;
  isCEO: () => boolean;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const TOKEN_KEY = 'lk_access_token';

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Store token in both state and sessionStorage (survives page refresh within session)
  const storeToken = useCallback((token: string | null) => {
    setAccessToken(token);
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  }, []);

  // Restore session on mount
  useEffect(() => {
    const restore = async () => {
      const storedToken = sessionStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (!res.ok) {
          // Token expired — try refresh via cookie
          const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            credentials: 'include', // sends HttpOnly cookie
          });

          if (refreshRes.ok) {
            const data = await refreshRes.json();
            storeToken(data.accessToken);
            setUser(mapUser(data.user));
          } else {
            storeToken(null);
            setUser(null);
          }
        } else {
          const profile = await res.json();
          setAccessToken(storedToken);
          setUser(mapProfileToUser(storedToken, profile));
        }
      } catch {
        storeToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restore();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // so refresh cookie is set
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Invalid credentials');
    }

    const data = await res.json();
    storeToken(data.accessToken);
    setUser(mapUser(data.user));
  }, [storeToken]);

  const logout = useCallback(async () => {
    try {
      if (accessToken) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: 'include',
        });
      }
    } catch {
      // best effort
    } finally {
      storeToken(null);
      setUser(null);
    }
  }, [accessToken, storeToken]);

  // ─── Permission Helpers ───────────────────────────────────────────────────

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user) return false;
      if (user.roles.includes('Super Admin') || user.roles.includes('CEO / Owner')) return true;
      return user.permissions.includes(permission);
    },
    [user],
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]) => permissions.some((p) => hasPermission(p)),
    [hasPermission],
  );

  const hasAllPermissions = useCallback(
    (permissions: string[]) => permissions.every((p) => hasPermission(p)),
    [hasPermission],
  );

  const hasRole = useCallback(
    (role: string) => {
      if (!user) return false;
      return user.roles.includes(role);
    },
    [user],
  );

  const isCEO = useCallback(
    () => hasRole('CEO / Owner') || hasRole('Super Admin'),
    [hasRole],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
        isCEO,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapUser(apiUser: any): AuthUser {
  return {
    id: apiUser.id,
    firstName: apiUser.firstName,
    lastName: apiUser.lastName,
    email: apiUser.email,
    companyId: apiUser.companyId,
    companyName: apiUser.company?.name,
    roles: apiUser.roles ?? [],
    permissions: apiUser.permissions ?? [],
  };
}

/** Maps the /auth/me response (which includes nested role objects) */
function mapProfileToUser(token: string, profile: any): AuthUser {
  // Profile endpoint returns roles as UserRole[] with nested role object
  const roles = (profile.roles ?? []).map((ur: any) =>
    typeof ur === 'string' ? ur : ur.role?.name ?? ur.name ?? '',
  ).filter(Boolean);

  // Derive permissions from the JWT payload if available, else empty
  let permissions: string[] = [];
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    permissions = payload.permissions ?? [];
  } catch {
    permissions = [];
  }

  return {
    id: profile.id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    companyId: profile.companyId,
    companyName: profile.company?.name,
    roles,
    permissions,
  };
}
