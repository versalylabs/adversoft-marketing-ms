"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { UserRole, Permission, hasPermission as checkRolePermission, canAccessRoute } from '@/lib/rbac';
import { INITIAL_USERS, UserProfile } from '@/lib/data/users-store';
import {
  Tenant,
  DEMO_TENANT,
  getRegisteredTenants,
  getActiveTenant,
  registerTenantAccount,
  switchActiveTenant,
} from '@/lib/tenant';

export type { UserRole, Permission };
export type { Tenant };

export interface User extends UserProfile {}

export const DEMO_USERS = {
  super: INITIAL_USERS[0],
  admin: INITIAL_USERS[1],
  sales: INITIAL_USERS[2],
  salesRep: INITIAL_USERS[3],
  campaign: INITIAL_USERS[4],
  ops: INITIAL_USERS[5],
  finance: INITIAL_USERS[6],
  tech: INITIAL_USERS[7],
  client: INITIAL_USERS[8],
};

interface AuthContextProps {
  user: User | null;
  tenant: Tenant;
  tenants: Tenant[];
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole) => void;
  switchTenant: (tenantId: string) => void;
  registerWorkspace: (params: {
    fullName: string;
    organizationName: string;
    email: string;
    currency?: string;
    plan?: 'Enterprise' | 'Starter' | 'Pro';
  }) => { tenant: Tenant; user: UserProfile };
  updateProfile: (data: Partial<User>) => void;
  hasPermission: (permission: Permission) => boolean;
  canAccess: (pathname: string) => boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

const AUTH_STORAGE_KEY = 'adversoft_auth_user_v2';

export function AuthProvider({ children }: { children: ReactNode }) {
  // Default to Super Admin (Alex Vance) for instant SSR rendering
  const [user, setUser] = useState<User | null>(INITIAL_USERS[0]);
  const [tenant, setTenant] = useState<Tenant>(DEMO_TENANT);
  const [tenants, setTenants] = useState<Tenant[]>([DEMO_TENANT]);
  const [isLoading, setIsLoading] = useState(false);

  // Sync state from client storage on mount
  const refreshTenantState = useCallback(() => {
    try {
      const all = getRegisteredTenants();
      const current = getActiveTenant();
      setTenants(all);
      setTenant(current);
    } catch {
      setTenant(DEMO_TENANT);
      setTenants([DEMO_TENANT]);
    }
  }, []);

  // Restore session from localStorage on client-side mount
  useEffect(() => {
    try {
      refreshTenantState();
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      } else {
        setUser(INITIAL_USERS[0]);
      }
    } catch {
      setUser(INITIAL_USERS[0]);
    }

    const handleTenantChanged = (e: any) => {
      refreshTenantState();
      if (e.detail) {
        setTenant(e.detail);
      }
    };

    const handleUserUpdated = (e: any) => {
      if (e.detail) {
        setUser(e.detail);
      }
    };

    window.addEventListener('adversoft_tenant_changed', handleTenantChanged);
    window.addEventListener('adversoft_auth_user_updated', handleUserUpdated);

    return () => {
      window.removeEventListener('adversoft_tenant_changed', handleTenantChanged);
      window.removeEventListener('adversoft_auth_user_updated', handleUserUpdated);
    };
  }, [refreshTenantState]);

  const login = (userData: User) => {
    setUser(userData);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      if (userData.organizationId) {
        localStorage.setItem('adversoft_active_tenant_id', userData.organizationId);
      }
      document.cookie = `adversoft_role=${encodeURIComponent(userData.role)}; path=/; max-age=86400; SameSite=Lax`;
      refreshTenantState();
    } catch {
      // Ignore storage errors
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      document.cookie = `adversoft_role=; path=/; max-age=0; SameSite=Lax`;
    } catch {
      // Ignore storage errors
    }
  };

  const switchTenant = (tenantId: string) => {
    const switched = switchActiveTenant(tenantId);
    if (switched) {
      setTenant(switched);
      refreshTenantState();
    }
  };

  const registerWorkspace = (params: {
    fullName: string;
    organizationName: string;
    email: string;
    currency?: string;
    plan?: 'Enterprise' | 'Starter' | 'Pro';
  }) => {
    const result = registerTenantAccount(params);
    setUser(result.user);
    setTenant(result.tenant);
    refreshTenantState();
    return result;
  };

  const switchUser = (userId: string) => {
    const target = INITIAL_USERS.find((u) => u.id === userId);
    if (target) {
      login(target);
    }
  };

  const switchRole = (role: UserRole) => {
    const target = INITIAL_USERS.find((u) => u.role === role);
    if (target) {
      login(target);
    }
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    login(updated);
  };

  const hasPerm = (permission: Permission): boolean => {
    if (!user) return false;
    return checkRolePermission(user.role, permission);
  };

  const canAcc = (pathname: string): boolean => {
    if (!user) return false;
    return canAccessRoute(user.role, pathname);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        tenants,
        isLoading,
        login,
        logout,
        switchUser,
        switchRole,
        switchTenant,
        registerWorkspace,
        updateProfile,
        hasPermission: hasPerm,
        canAccess: canAcc,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}