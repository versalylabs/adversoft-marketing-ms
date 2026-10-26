/**
 * Adversoft Multi-Tenancy Engine
 * Manages organization isolation, workspace partitioning, tenant registry,
 * and clean-slate workspace generation for new accounts with zero demo data.
 */

import { UserProfile, INITIAL_USERS } from './data/users-store';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  currency: string;
  currencySymbol: string;
  ownerEmail: string;
  ownerName: string;
  createdAt: string;
  isDemo: boolean;
  plan: 'Enterprise' | 'Starter' | 'Pro';
  logoUrl?: string;
  description?: string;
}

export const DEMO_TENANT: Tenant = {
  id: 'org_apex',
  name: 'Apex Outdoor Media Group',
  slug: 'apex-outdoor',
  currency: 'USD',
  currencySymbol: '$',
  ownerEmail: 'alex@adversoft.com',
  ownerName: 'Alex Vance',
  createdAt: '2025-01-01',
  isDemo: true,
  plan: 'Enterprise',
  description: 'Preloaded demonstration organization with sample metropolitan inventory.',
};

export const TENANTS_STORAGE_KEY = 'adversoft_tenants_registry_v1';
export const ACTIVE_TENANT_KEY = 'adversoft_active_tenant_id';

/**
 * Retrieve all registered tenants.
 * Always guarantees the preloaded DEMO_TENANT is available.
 */
export function getRegisteredTenants(): Tenant[] {
  if (typeof window === 'undefined') return [DEMO_TENANT];
  try {
    const raw = localStorage.getItem(TENANTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify([DEMO_TENANT]));
      return [DEMO_TENANT];
    }
    const parsed: Tenant[] = JSON.parse(raw);
    if (!parsed.some((t) => t.id === DEMO_TENANT.id)) {
      parsed.unshift(DEMO_TENANT);
      localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return [DEMO_TENANT];
  }
}

/**
 * Get active tenant ID
 */
export function getActiveTenantId(): string {
  if (typeof window === 'undefined') return DEMO_TENANT.id;
  try {
    const rawUser = localStorage.getItem('adversoft_auth_user_v2');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed.organizationId) return parsed.organizationId;
    }
    const stored = localStorage.getItem(ACTIVE_TENANT_KEY);
    return stored || DEMO_TENANT.id;
  } catch {
    return DEMO_TENANT.id;
  }
}

/**
 * Get full active tenant object
 */
export function getActiveTenant(): Tenant {
  const activeId = getActiveTenantId();
  const all = getRegisteredTenants();
  return all.find((t) => t.id === activeId) || DEMO_TENANT;
}

/**
 * Check if the active or specified tenant is the Demo tenant
 */
export function isDemoTenant(tenantId?: string): boolean {
  const tid = tenantId || getActiveTenantId();
  return tid === DEMO_TENANT.id;
}

/**
 * Resolves localStorage key for an entity based on the tenant.
 * - Demo tenant ('org_apex') uses standard legacy keys so preloaded data remains intact.
 * - Custom user tenants use isolated keys prefixed with the tenant ID.
 */
export function getTenantStorageKey(baseKey: string, tenantId?: string): string {
  const tid = tenantId || getActiveTenantId();
  if (tid === DEMO_TENANT.id) {
    return baseKey;
  }
  return `${baseKey}_tenant_${tid}`;
}

/**
 * Register a brand new organization / tenant with zero demo data.
 * Creates an isolated workspace and an initial Super Admin owner account.
 */
export function registerTenantAccount(params: {
  fullName: string;
  organizationName: string;
  email: string;
  currency?: string;
  currencySymbol?: string;
  plan?: 'Enterprise' | 'Starter' | 'Pro';
}): { tenant: Tenant; user: UserProfile } {
  const tenantId = `org_${Date.now()}`;
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const currency = params.currency || 'USD';
  let currencySymbol = params.currencySymbol || '$';
  if (currency === 'EUR') currencySymbol = '€';
  if (currency === 'GBP') currencySymbol = '£';
  if (currency === 'CAD' || currency === 'AUD') currencySymbol = '$';

  const newTenant: Tenant = {
    id: tenantId,
    name: params.organizationName.trim(),
    slug: params.organizationName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-'),
    currency,
    currencySymbol,
    ownerEmail: params.email.toLowerCase().trim(),
    ownerName: params.fullName.trim(),
    createdAt: now.toISOString(),
    isDemo: false,
    plan: params.plan || 'Enterprise',
    description: `Private isolated workspace for ${params.organizationName.trim()}.`,
  };

  const newUser: UserProfile = {
    id: `usr_${Date.now()}`,
    name: params.fullName.trim(),
    email: params.email.toLowerCase().trim(),
    role: 'Super Admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (555) 010-0000',
    title: 'Managing Director & Workspace Owner',
    organizationId: newTenant.id,
    organizationName: newTenant.name,
    isActive: true,
    lastLogin: 'Just now',
    joinedDate: formattedDate,
  };

  if (typeof window !== 'undefined') {
    // 1. Add to tenants registry
    const tenants = getRegisteredTenants();
    const updatedTenants = [...tenants, newTenant];
    localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(updatedTenants));

    // 2. Set active tenant
    localStorage.setItem(ACTIVE_TENANT_KEY, newTenant.id);

    // 3. Save user to session
    localStorage.setItem('adversoft_auth_user_v2', JSON.stringify(newUser));
    document.cookie = `adversoft_role=${encodeURIComponent(newUser.role)}; path=/; max-age=86400; SameSite=Lax`;

    // 4. Initialize empty isolated collections for this tenant
    const isolatedStores: Record<string, any[]> = {
      adversoft_billboards_v1: [],
      adversoft_crm_clients: [],
      adversoft_crm_leads: [],
      adversoft_bookings_v1: [],
      adversoft_campaigns_v1: [],
      adversoft_quotations: [],
      adversoft_contracts: [],
      adversoft_invoices_v1: [],
      adversoft_payments_v1: [],
      adversoft_installations_v1: [],
      adversoft_artworks_v1: [],
      adversoft_maintenance_v1: [],
      adversoft_users_v1: [newUser],
      adversoft_notifications_v1: [
        {
          id: `notif_welcome_${Date.now()}`,
          title: 'Welcome to your Workspace',
          message: `Your organization "${newTenant.name}" has been provisioned with zero demo data. Add your first billboard in Inventory to get started.`,
          type: 'INFO',
          category: 'SYSTEM',
          priority: 'HIGH',
          timestamp: 'Just now',
          createdAt: now.toISOString(),
          isRead: false,
          actionUrl: '/billboards',
        },
      ],
      adversoft_audit_logs_v1: [
        {
          id: `aud_init_${Date.now()}`,
          timestamp: now.toISOString(),
          userId: newUser.id,
          userName: newUser.name,
          userRole: newUser.role,
          action: 'CREATE',
          entityType: 'ORGANIZATION',
          entityId: newTenant.id,
          entityLabel: newTenant.name,
          details: `Isolated multi-tenant workspace provisioned with clean slate (0 demo data).`,
          ipAddress: '127.0.0.1 (Local Session)',
          severity: 'INFO',
          status: 'SUCCESS',
        },
      ],
    };

    Object.entries(isolatedStores).forEach(([baseKey, initialData]) => {
      const tenantKey = `${baseKey}_tenant_${newTenant.id}`;
      localStorage.setItem(tenantKey, JSON.stringify(initialData));
    });

    // 5. Dispatch multi-tenant lifecycle events
    window.dispatchEvent(new CustomEvent('adversoft_tenant_changed', { detail: newTenant }));
    window.dispatchEvent(new CustomEvent('adversoft_auth_user_updated', { detail: newUser }));
  }

  return { tenant: newTenant, user: newUser };
}

/**
 * Switch the currently active tenant workspace.
 */
export function switchActiveTenant(tenantId: string): Tenant | null {
  if (typeof window === 'undefined') return null;

  const tenants = getRegisteredTenants();
  const target = tenants.find((t) => t.id === tenantId);
  if (!target) return null;

  localStorage.setItem(ACTIVE_TENANT_KEY, target.id);

  // If switching to demo, restore the demo super admin user
  if (target.id === DEMO_TENANT.id) {
    const demoUser = INITIAL_USERS[0];
    localStorage.setItem('adversoft_auth_user_v2', JSON.stringify(demoUser));
    document.cookie = `adversoft_role=${encodeURIComponent(demoUser.role)}; path=/; max-age=86400; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent('adversoft_auth_user_updated', { detail: demoUser }));
  } else {
    // If switching to custom tenant, find the owner user
    const usersKey = `adversoft_users_v1_tenant_${target.id}`;
    const rawUsers = localStorage.getItem(usersKey);
    if (rawUsers) {
      try {
        const users: UserProfile[] = JSON.parse(rawUsers);
        if (users.length > 0) {
          localStorage.setItem('adversoft_auth_user_v2', JSON.stringify(users[0]));
          document.cookie = `adversoft_role=${encodeURIComponent(users[0].role)}; path=/; max-age=86400; SameSite=Lax`;
          window.dispatchEvent(new CustomEvent('adversoft_auth_user_updated', { detail: users[0] }));
        }
      } catch {
        // Ignore
      }
    }
  }

  // Notify all listening components of tenant switch
  window.dispatchEvent(new CustomEvent('adversoft_tenant_changed', { detail: target }));
  return target;
}
