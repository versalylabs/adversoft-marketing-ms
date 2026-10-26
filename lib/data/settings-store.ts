/**
 * Adversoft Settings, Multi-Tenancy & System Backup Store
 * Module: Organization White-labeling, Regional Multi-Tenancy Hubs,
 * Full Database Snapshots, Automated Backups, and Diagnostic Telemetry.
 */

import { INITIAL_BILLBOARDS } from './billboards-store';
import { INITIAL_CLIENTS } from './crm-store';
import { getStoredCampaigns } from './campaigns-store';
import { getStoredInvoices, getStoredPayments } from './invoices-store';
import { getStoredContracts } from './contracts-store';
import { getStoredWorkOrders } from './installations-store';
import { getStoredArtworks } from './artwork-store';
import { getStoredMaintenanceRecords } from './maintenance-store';
import { getStoredNotifications } from './notifications-store';
import { getStoredAuditLogs } from './audit-search-store';
import { getActiveTenantId, getActiveTenant, isDemoTenant, getTenantStorageKey, getRegisteredTenants } from '../tenant';

export interface RegionalOffice {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  address: string;
  timezone: string;
  corridorsCovered: string[];
  localTaxRatePercent: number;
  officeDirector: string;
  phone: string;
  email: string;
  isActive: boolean;
  inventoryCount: number;
}

export interface OrganizationSettings {
  legalName: string;
  brandName: string;
  brandAccentColor: string;
  taxId: string;
  dunsNumber: string;
  defaultCurrency: string;
  fiscalYearStart: string;
  billingAddress: {
    street: string;
    suite?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  operatingBank: {
    bankName: string;
    routingNumber: string;
    accountNumberLast4: string;
    swiftCode: string;
  };
  documentFooterNotes: string;
  enforce2FA: boolean;
  sessionTimeoutMinutes: number;
}

export interface BackupSnapshot {
  id: string;
  timestamp: string; // ISO 8601
  filename: string;
  sizeBytes: number;
  recordCount: number;
  type: 'MANUAL' | 'SCHEDULED_DAILY' | 'PRE_MIGRATION';
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
  hash: string;
  createdByName: string;
  entityCounts: Record<string, number>;
}

export interface BackupScheduleConfig {
  frequency: 'HOURLY' | 'DAILY' | 'WEEKLY';
  retentionDays: number;
  cloudSyncEnabled: boolean;
  s3BucketTarget: string;
  encryptionEnabled: boolean;
  lastRunTimestamp?: string;
  nextRunTimestamp?: string;
}

export interface ServiceHealthMetric {
  service: string;
  status: 'HEALTHY' | 'DEGRADED';
  pingMs: number;
  uptimePercent: number;
  lastChecked: string;
}

export interface DiagnosticTelemetry {
  uptimeDays: number;
  memoryHeapUsedMb: number;
  memoryHeapTotalMb: number;
  databaseClusterNodes: number;
  apiLatencyP95Ms: number;
  storageUsedGb: number;
  storageQuotaGb: number;
  activeSockets: number;
  services: ServiceHealthMetric[];
}

export const INITIAL_ORG_SETTINGS: OrganizationSettings = {
  legalName: 'Apex Outdoor Media Group LLC',
  brandName: 'Adversoft / Apex Outdoor',
  brandAccentColor: '#4F46E5', // Indigo-600
  taxId: 'US-EIN-98421034',
  dunsNumber: '08-291-4412',
  defaultCurrency: 'USD ($)',
  fiscalYearStart: 'January 1',
  billingAddress: {
    street: '1540 Broadway Avenue',
    suite: 'Suite 2800',
    city: 'New York',
    state: 'NY',
    zip: '10036',
    country: 'United States',
  },
  operatingBank: {
    bankName: 'JPMorgan Chase Commercial Banking',
    routingNumber: '021000021',
    accountNumberLast4: '8841',
    swiftCode: 'CHASUS33',
  },
  documentFooterNotes:
    'Apex Outdoor Media Group LLC • Licensed Metropolitan Outdoor Advertising Concessionaire. Standard payment terms Net 30 from invoice issuance date.',
  enforce2FA: true,
  sessionTimeoutMinutes: 60,
};

export const INITIAL_REGIONAL_OFFICES: RegionalOffice[] = [
  {
    id: 'reg_nyc',
    name: 'Northeast Metro Division (Global HQ)',
    code: 'NY-HQ',
    city: 'New York',
    state: 'NY',
    address: '1540 Broadway, Suite 2800, New York, NY 10036',
    timezone: 'America/New_York (EST)',
    corridorsCovered: ['Times Square Bowtie Plaza', 'I-95 Gold Coast Arterial'],
    localTaxRatePercent: 8.875,
    officeDirector: 'Rachel Adams (Managing Director)',
    phone: '+1 (212) 555-0199',
    email: 'nyc-ops@adversoft.com',
    isActive: true,
    inventoryCount: 2,
  },
  {
    id: 'reg_la',
    name: 'West Coast Entertainment & Tech Hub',
    code: 'LA-WST',
    city: 'Los Angeles',
    state: 'CA',
    address: '8900 Sunset Blvd, West Hollywood, CA 90069',
    timezone: 'America/Los_Angeles (PST)',
    corridorsCovered: ['Sunset Strip Entertainment Mile', 'Silicon Valley Tech Express (US-101)'],
    localTaxRatePercent: 9.5,
    officeDirector: 'Julian Vance (Regional VP)',
    phone: '+1 (310) 555-0142',
    email: 'la-ops@adversoft.com',
    isActive: true,
    inventoryCount: 2,
  },
  {
    id: 'reg_mia',
    name: 'Southeast Gateway Division',
    code: 'MIA-SE',
    city: 'Miami',
    state: 'FL',
    address: '1111 Brickell Avenue, Miami, FL 33131',
    timezone: 'America/New_York (EST)',
    corridorsCovered: ['South Beach Gateway Causeway', 'Airport Expressway Corridor'],
    localTaxRatePercent: 7.0,
    officeDirector: 'Sofia Delgado (Regional Director)',
    phone: '+1 (305) 555-0188',
    email: 'miami-ops@adversoft.com',
    isActive: true,
    inventoryCount: 2,
  },
  {
    id: 'reg_dal',
    name: 'Central Freight & Highway Hub',
    code: 'DAL-CTX',
    city: 'Dallas',
    state: 'TX',
    address: '2200 Stemmons Freeway, Dallas, TX 75207',
    timezone: 'America/Chicago (CST)',
    corridorsCovered: ['Stemmons Freeway / Market Center'],
    localTaxRatePercent: 8.25,
    officeDirector: 'Wyatt Keller (Operations Lead)',
    phone: '+1 (214) 555-0177',
    email: 'dallas-ops@adversoft.com',
    isActive: true,
    inventoryCount: 1,
  },
  {
    id: 'reg_chi',
    name: 'Midwest Commercial Concourse',
    code: 'CHI-MW',
    city: 'Chicago',
    state: 'IL',
    address: '600 N Michigan Avenue, Chicago, IL 60611',
    timezone: 'America/Chicago (CST)',
    corridorsCovered: ['Magnificent Mile Retail Corridor'],
    localTaxRatePercent: 10.25,
    officeDirector: 'Eleanor Ward (Regional Director)',
    phone: '+1 (312) 555-0163',
    email: 'chicago-ops@adversoft.com',
    isActive: true,
    inventoryCount: 1,
  },
];

export const INITIAL_SNAPSHOTS: BackupSnapshot[] = [
  {
    id: 'snp_20261014_01',
    timestamp: '2026-10-14T03:00:00.000Z',
    filename: 'adversoft_full_snapshot_20261014_0300.json',
    sizeBytes: 1420850,
    recordCount: 284,
    type: 'SCHEDULED_DAILY',
    status: 'COMPLETED',
    hash: 'sha256:d84f1109aef8231a57ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd20',
    createdByName: 'Automated Snapshot Scheduler',
    entityCounts: {
      billboards: 8,
      clients: 5,
      campaigns: 4,
      invoices: 6,
      contracts: 4,
      workOrders: 6,
      maintenance: 5,
      artwork: 5,
      auditLogs: 18,
    },
  },
  {
    id: 'snp_20261013_01',
    timestamp: '2026-10-13T03:00:00.000Z',
    filename: 'adversoft_full_snapshot_20261013_0300.json',
    sizeBytes: 1395200,
    recordCount: 276,
    type: 'SCHEDULED_DAILY',
    status: 'COMPLETED',
    hash: 'sha256:c73e0018aef8231a57ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284acbb19',
    createdByName: 'Automated Snapshot Scheduler',
    entityCounts: {
      billboards: 8,
      clients: 5,
      campaigns: 4,
      invoices: 5,
      contracts: 4,
      workOrders: 5,
      maintenance: 5,
      artwork: 5,
      auditLogs: 14,
    },
  },
  {
    id: 'snp_20261012_pre_mig',
    timestamp: '2026-10-12T14:30:00.000Z',
    filename: 'adversoft_pre_migration_20261012.json',
    sizeBytes: 1350400,
    recordCount: 268,
    type: 'PRE_MIGRATION',
    status: 'COMPLETED',
    hash: 'sha256:b62d9907aef8231a57ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284abaa08',
    createdByName: 'Alex Vance (Super Admin)',
    entityCounts: {
      billboards: 8,
      clients: 5,
      campaigns: 4,
      invoices: 5,
      contracts: 4,
      workOrders: 5,
      maintenance: 5,
      artwork: 4,
      auditLogs: 10,
    },
  },
];

export const INITIAL_BACKUP_CONFIG: BackupScheduleConfig = {
  frequency: 'DAILY',
  retentionDays: 60,
  cloudSyncEnabled: true,
  s3BucketTarget: 's3://adversoft-enterprise-vault/backups/daily/',
  encryptionEnabled: true,
  lastRunTimestamp: '2026-10-14 03:00 UTC',
  nextRunTimestamp: '2026-10-15 03:00 UTC',
};

export const INITIAL_DIAGNOSTICS: DiagnosticTelemetry = {
  uptimeDays: 142.6,
  memoryHeapUsedMb: 68.4,
  memoryHeapTotalMb: 128.0,
  databaseClusterNodes: 6,
  apiLatencyP95Ms: 14,
  storageUsedGb: 4.8,
  storageQuotaGb: 50.0,
  activeSockets: 42,
  services: [
    {
      service: 'PostgreSQL HA Cluster',
      status: 'HEALTHY',
      pingMs: 2.1,
      uptimePercent: 99.99,
      lastChecked: 'Just now',
    },
    {
      service: 'Object Storage Vault (S3)',
      status: 'HEALTHY',
      pingMs: 12.4,
      uptimePercent: 99.98,
      lastChecked: 'Just now',
    },
    {
      service: 'Telemetry Daemon & Breaker Monitor',
      status: 'HEALTHY',
      pingMs: 4.8,
      uptimePercent: 100.0,
      lastChecked: 'Just now',
    },
    {
      service: 'Webhook Automation Gateway',
      status: 'HEALTHY',
      pingMs: 8.2,
      uptimePercent: 99.95,
      lastChecked: 'Just now',
    },
    {
      service: 'Redis Realtime State & Pub/Sub',
      status: 'HEALTHY',
      pingMs: 1.2,
      uptimePercent: 99.99,
      lastChecked: 'Just now',
    },
  ],
};

const ORG_SETTINGS_KEY = 'adversoft_org_settings_v1';
const REGIONAL_OFFICES_KEY = 'adversoft_regional_offices_v1';
const SNAPSHOTS_KEY = 'adversoft_snapshots_v1';
const BACKUP_CONFIG_KEY = 'adversoft_backup_config_v1';

export function getStoredOrgSettings(tenantId?: string): OrganizationSettings {
  const tid = tenantId || getActiveTenantId();
  if (typeof window === 'undefined') {
    if (isDemoTenant(tid)) return INITIAL_ORG_SETTINGS;
    const activeTenant = getRegisteredTenants().find((t) => t.id === tid) || getActiveTenant();
    return {
      ...INITIAL_ORG_SETTINGS,
      legalName: activeTenant.name,
      brandName: activeTenant.name,
      defaultCurrency: activeTenant.currency,
    };
  }
  const key = getTenantStorageKey(ORG_SETTINGS_KEY, tid);
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    if (isDemoTenant(tid)) {
      localStorage.setItem(key, JSON.stringify(INITIAL_ORG_SETTINGS));
      return INITIAL_ORG_SETTINGS;
    }
    const activeTenant = getRegisteredTenants().find((t) => t.id === tid) || getActiveTenant();
    const customDefaults: OrganizationSettings = {
      ...INITIAL_ORG_SETTINGS,
      legalName: activeTenant.name,
      brandName: activeTenant.name,
      defaultCurrency: activeTenant.currency,
    };
    localStorage.setItem(key, JSON.stringify(customDefaults));
    return customDefaults;
  } catch {
    return INITIAL_ORG_SETTINGS;
  }
}

export function saveStoredOrgSettings(settings: OrganizationSettings, tenantId?: string): void {
  if (typeof window === 'undefined') return;
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey(ORG_SETTINGS_KEY, tid);
  localStorage.setItem(key, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent('adversoft_settings_updated'));
}

export function getStoredRegionalOffices(tenantId?: string): RegionalOffice[] {
  if (typeof window === 'undefined') return isDemoTenant(tenantId) ? INITIAL_REGIONAL_OFFICES : [];
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey(REGIONAL_OFFICES_KEY, tid);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (isDemoTenant(tid)) {
        localStorage.setItem(key, JSON.stringify(INITIAL_REGIONAL_OFFICES));
        return INITIAL_REGIONAL_OFFICES;
      }
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return isDemoTenant(tid) ? INITIAL_REGIONAL_OFFICES : [];
  }
}

export function saveStoredRegionalOffices(offices: RegionalOffice[], tenantId?: string): void {
  if (typeof window === 'undefined') return;
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey(REGIONAL_OFFICES_KEY, tid);
  localStorage.setItem(key, JSON.stringify(offices));
  window.dispatchEvent(new CustomEvent('adversoft_settings_updated'));
}

export function getStoredSnapshots(tenantId?: string): BackupSnapshot[] {
  if (typeof window === 'undefined') return isDemoTenant(tenantId) ? INITIAL_SNAPSHOTS : [];
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey(SNAPSHOTS_KEY, tid);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (isDemoTenant(tid)) {
        localStorage.setItem(key, JSON.stringify(INITIAL_SNAPSHOTS));
        return INITIAL_SNAPSHOTS;
      }
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return isDemoTenant(tid) ? INITIAL_SNAPSHOTS : [];
  }
}

export function saveStoredSnapshots(snapshots: BackupSnapshot[], tenantId?: string): void {
  if (typeof window === 'undefined') return;
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey(SNAPSHOTS_KEY, tid);
  localStorage.setItem(key, JSON.stringify(snapshots));
  window.dispatchEvent(new CustomEvent('adversoft_snapshots_updated'));
}

export function getStoredBackupConfig(tenantId?: string): BackupScheduleConfig {
  if (typeof window === 'undefined') return INITIAL_BACKUP_CONFIG;
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey(BACKUP_CONFIG_KEY, tid);
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : INITIAL_BACKUP_CONFIG;
  } catch {
    return INITIAL_BACKUP_CONFIG;
  }
}

export function saveStoredBackupConfig(config: BackupScheduleConfig, tenantId?: string): void {
  if (typeof window === 'undefined') return;
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey(BACKUP_CONFIG_KEY, tid);
  localStorage.setItem(key, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent('adversoft_settings_updated'));
}

/**
 * Compile a comprehensive JSON system snapshot bundle aggregating all database stores
 */
export function generateFullSystemSnapshotBundle() {
  const billboards = INITIAL_BILLBOARDS;
  const clients = INITIAL_CLIENTS;
  const campaigns = getStoredCampaigns();
  const invoices = getStoredInvoices();
  const payments = getStoredPayments();
  const contracts = getStoredContracts();
  const workOrders = getStoredWorkOrders();
  const maintenance = getStoredMaintenanceRecords();
  const artworks = getStoredArtworks();
  const notifications = getStoredNotifications();
  const auditLogs = getStoredAuditLogs();
  const orgSettings = getStoredOrgSettings();
  const regionalOffices = getStoredRegionalOffices();

  const totalRecords =
    billboards.length +
    clients.length +
    campaigns.length +
    invoices.length +
    payments.length +
    contracts.length +
    workOrders.length +
    maintenance.length +
    artworks.length +
    notifications.length +
    auditLogs.length;

  const timestamp = new Date().toISOString();
  const snapshotBundle = {
    metadata: {
      system: 'Adversoft Marketing Management System',
      version: '2.4.0-enterprise',
      generatedAt: timestamp,
      generator: 'Adversoft Automated Snapshot Vault Engine',
      totalRecords,
      complianceSeal: 'SOC-2 / ISO-27001 Backup Certified',
    },
    organization: orgSettings,
    regionalOffices,
    stores: {
      billboards,
      clients,
      campaigns,
      invoices,
      payments,
      contracts,
      workOrders,
      maintenance,
      artworks,
      notifications,
      auditLogs,
    },
  };

  return snapshotBundle;
}

/**
 * Create a new manual or automated snapshot record and persist
 */
export function createManualSnapshot(createdByName: string = 'Alex Vance (Super Admin)'): BackupSnapshot {
  const bundle = generateFullSystemSnapshotBundle();
  const jsonStr = JSON.stringify(bundle);
  const sizeBytes = new Blob([jsonStr]).size;
  const now = new Date();
  const dateTag = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeTag = now.toTimeString().slice(0, 5).replace(/:/g, '');
  const id = `snp_${dateTag}_${timeTag}_${Math.random().toString(36).substring(2, 5)}`;
  const filename = `adversoft_full_snapshot_${dateTag}_${timeTag}.json`;

  const newSnapshot: BackupSnapshot = {
    id,
    timestamp: now.toISOString(),
    filename,
    sizeBytes,
    recordCount: bundle.metadata.totalRecords,
    type: 'MANUAL',
    status: 'COMPLETED',
    hash: `sha256:${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
    createdByName,
    entityCounts: {
      billboards: bundle.stores.billboards.length,
      clients: bundle.stores.clients.length,
      campaigns: bundle.stores.campaigns.length,
      invoices: bundle.stores.invoices.length,
      contracts: bundle.stores.contracts.length,
      workOrders: bundle.stores.workOrders.length,
      maintenance: bundle.stores.maintenance.length,
      artwork: bundle.stores.artworks.length,
      auditLogs: bundle.stores.auditLogs.length,
    },
  };

  const current = getStoredSnapshots();
  const updated = [newSnapshot, ...current];
  saveStoredSnapshots(updated);
  return newSnapshot;
}
