/**
 * Adversoft Role-Based Access Control (RBAC) System
 * Enterprise Authentication & User Access Governance
 */

export type UserRole =
  | 'Super Admin'
  | 'Admin'
  | 'Sales Manager'
  | 'Sales Agent'
  | 'Campaign Manager'
  | 'Operations Manager'
  | 'Finance'
  | 'Technician'
  | 'Client';

export type Permission =
  // Core
  | 'dashboard:view'
  | 'organization:manage'
  | 'users:read'
  | 'users:manage'
  | 'audit:read'
  // CRM & Sales
  | 'crm:read'
  | 'crm:manage'
  | 'leads:manage'
  // Inventory & Pricing
  | 'inventory:read'
  | 'inventory:manage'
  | 'pricing:manage'
  // Commercial
  | 'bookings:read'
  | 'bookings:create'
  | 'bookings:manage'
  | 'quotations:read'
  | 'quotations:create'
  | 'quotations:manage'
  | 'contracts:read'
  | 'contracts:manage'
  // Campaigns & Creative
  | 'campaigns:read'
  | 'campaigns:manage'
  | 'artwork:read'
  | 'artwork:upload'
  | 'artwork:approve'
  // Field Operations
  | 'installations:read'
  | 'installations:manage'
  | 'installations:verify'
  | 'maintenance:read'
  | 'maintenance:manage'
  // Financial
  | 'invoices:read'
  | 'invoices:manage'
  | 'payments:record'
  | 'reports:read'
  // Portal
  | 'portal:access';

export interface RoleDefinition {
  name: UserRole;
  label: string;
  description: string;
  level: number; // 1 (Client) to 10 (Super Admin)
  badgeVariant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';
  permissions: Permission[];
  accessibleRoutes: string[];
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  'Super Admin': {
    name: 'Super Admin',
    label: 'Super Administrator',
    description: 'Full uninhibited access across all workspaces, organizations, billing, and system configuration.',
    level: 10,
    badgeVariant: 'destructive',
    permissions: [
      'dashboard:view', 'organization:manage', 'users:read', 'users:manage', 'audit:read',
      'crm:read', 'crm:manage', 'leads:manage',
      'inventory:read', 'inventory:manage', 'pricing:manage',
      'bookings:read', 'bookings:create', 'bookings:manage',
      'quotations:read', 'quotations:create', 'quotations:manage',
      'contracts:read', 'contracts:manage',
      'campaigns:read', 'campaigns:manage',
      'artwork:read', 'artwork:upload', 'artwork:approve',
      'installations:read', 'installations:manage', 'installations:verify',
      'maintenance:read', 'maintenance:manage',
      'invoices:read', 'invoices:manage', 'payments:record',
      'reports:read', 'portal:access',
    ],
    accessibleRoutes: ['/', '/crm', '/billboards', '/bookings', '/campaigns', '/artwork', '/installations', '/maintenance', '/quotations', '/contracts', '/invoices', '/payments', '/reports', '/audit', '/portal', '/settings', '/architecture', '/team'],
  },
  'Admin': {
    name: 'Admin',
    label: 'Company Administrator',
    description: 'Complete operational management of the organization, staff users, rates, contracts, and inventory.',
    level: 9,
    badgeVariant: 'default',
    permissions: [
      'dashboard:view', 'organization:manage', 'users:read', 'users:manage', 'audit:read',
      'crm:read', 'crm:manage', 'leads:manage',
      'inventory:read', 'inventory:manage', 'pricing:manage',
      'bookings:read', 'bookings:create', 'bookings:manage',
      'quotations:read', 'quotations:create', 'quotations:manage',
      'contracts:read', 'contracts:manage',
      'campaigns:read', 'campaigns:manage',
      'artwork:read', 'artwork:upload', 'artwork:approve',
      'installations:read', 'installations:manage', 'installations:verify',
      'maintenance:read', 'maintenance:manage',
      'invoices:read', 'invoices:manage', 'payments:record',
      'reports:read', 'portal:access',
    ],
    accessibleRoutes: ['/', '/crm', '/billboards', '/map', '/pricing', '/bookings', '/campaigns', '/artwork', '/installations', '/maintenance', '/quotations', '/contracts', '/invoices', '/payments', '/reports', '/audit', '/portal', '/settings', '/architecture', '/team'],
  },
  'Sales Manager': {
    name: 'Sales Manager',
    label: 'Sales Director',
    description: 'Manages sales pipelines, client negotiations, bookings, quote approvals, and commercial contracts.',
    level: 7,
    badgeVariant: 'success',
    permissions: [
      'dashboard:view', 'users:read',
      'crm:read', 'crm:manage', 'leads:manage',
      'inventory:read',
      'bookings:read', 'bookings:create', 'bookings:manage',
      'quotations:read', 'quotations:create', 'quotations:manage',
      'contracts:read', 'contracts:manage',
      'campaigns:read',
      'invoices:read',
      'reports:read',
    ],
    accessibleRoutes: ['/', '/crm', '/billboards', '/map', '/pricing', '/bookings', '/quotations', '/contracts', '/invoices', '/reports', '/team'],
  },
  'Sales Agent': {
    name: 'Sales Agent',
    label: 'Sales Representative',
    description: 'Creates client proposals, registers leads, holds billboard inventory, and generates quotes.',
    level: 5,
    badgeVariant: 'outline',
    permissions: [
      'dashboard:view',
      'crm:read', 'crm:manage', 'leads:manage',
      'inventory:read',
      'bookings:read', 'bookings:create',
      'quotations:read', 'quotations:create',
      'contracts:read',
      'campaigns:read',
    ],
    accessibleRoutes: ['/', '/crm', '/billboards', '/map', '/pricing', '/bookings', '/quotations', '/contracts'],
  },
  'Campaign Manager': {
    name: 'Campaign Manager',
    label: 'Campaign Coordinator',
    description: 'Oversees creative flight schedules, artwork approvals, proofs of performance, and client delivery.',
    level: 6,
    badgeVariant: 'default',
    permissions: [
      'dashboard:view',
      'inventory:read',
      'bookings:read',
      'campaigns:read', 'campaigns:manage',
      'artwork:read', 'artwork:upload', 'artwork:approve',
      'installations:read',
      'reports:read',
    ],
    accessibleRoutes: ['/', '/billboards', '/map', '/pricing', '/bookings', '/campaigns', '/artwork', '/installations', '/reports'],
  },
  'Operations Manager': {
    name: 'Operations Manager',
    label: 'Operations & Field Director',
    description: 'Directs physical mounting crews, verifies proof-of-posting, and coordinates repairs & inspections.',
    level: 7,
    badgeVariant: 'warning',
    permissions: [
      'dashboard:view', 'users:read',
      'inventory:read', 'inventory:manage',
      'campaigns:read',
      'artwork:read',
      'installations:read', 'installations:manage', 'installations:verify',
      'maintenance:read', 'maintenance:manage',
      'reports:read',
    ],
    accessibleRoutes: ['/', '/billboards', '/map', '/pricing', '/campaigns', '/artwork', '/installations', '/maintenance', '/reports', '/team'],
  },
  'Finance': {
    name: 'Finance',
    label: 'Finance & Billing Specialist',
    description: 'Issues billing invoices, processes payments, manages aging receivables, and tracks revenue yields.',
    level: 6,
    badgeVariant: 'success',
    permissions: [
      'dashboard:view',
      'crm:read',
      'bookings:read',
      'quotations:read',
      'contracts:read',
      'invoices:read', 'invoices:manage', 'payments:record',
      'reports:read',
    ],
    accessibleRoutes: ['/', '/crm', '/pricing', '/bookings', '/quotations', '/contracts', '/invoices', '/payments', '/reports'],
  },
  'Technician': {
    name: 'Technician',
    label: 'Field Rigging Crew / Tech',
    description: 'Executes physical billboard banner installations, uploads proof-of-posting photos, and fixes faults.',
    level: 3,
    badgeVariant: 'secondary',
    permissions: [
      'dashboard:view',
      'inventory:read',
      'artwork:read',
      'installations:read', 'installations:verify',
      'maintenance:read', 'maintenance:manage',
    ],
    accessibleRoutes: ['/', '/billboards', '/map', '/artwork', '/installations', '/maintenance'],
  },
  'Client': {
    name: 'Client',
    label: 'Advertiser / Agency Portal',
    description: 'Client self-service account: view active campaigns, review & approve artwork, and view invoices.',
    level: 1,
    badgeVariant: 'outline',
    permissions: [
      'dashboard:view',
      'campaigns:read',
      'artwork:read', 'artwork:approve',
      'invoices:read',
      'portal:access',
    ],
    accessibleRoutes: ['/', '/campaigns', '/artwork', '/invoices', '/portal'],
  },
};

/**
 * Check if a role possesses a specific granular permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const def = ROLE_DEFINITIONS[role];
  if (!def) return false;
  return def.permissions.includes(permission);
}

/**
 * Check if a role has access to a specific application route
 */
export function canAccessRoute(role: UserRole, pathname: string): boolean {
  const def = ROLE_DEFINITIONS[role];
  if (!def) return false;
  if (role === 'Super Admin' || role === 'Admin') return true;

  // Root dashboard and notifications hub are always accessible
  if (pathname === '/' || pathname === '/notifications' || pathname.startsWith('/notifications')) return true;

  return def.accessibleRoutes.some((route) => {
    if (route === pathname) return true;
    if (route !== '/' && pathname.startsWith(route)) return true;
    return false;
  });
}
