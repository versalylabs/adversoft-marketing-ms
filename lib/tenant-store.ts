/**
 * Adversoft Multi-Tenant Data Store Bridge
 * Bridges data layer collections with tenant-aware storage partitioning.
 * - Demo tenant ('org_apex') provides full sample dataset.
 * - Custom user tenants ('org_...') start completely empty from scratch with zero demo data.
 */

import { getActiveTenantId, isDemoTenant, getTenantStorageKey } from './tenant';
import { INITIAL_BILLBOARDS, BillboardItem } from './data/billboards-store';
import { INITIAL_CLIENTS, INITIAL_LEADS, ClientAccount, SalesLead } from './data/crm-store';
import { INITIAL_BOOKINGS, BookingRecord } from './data/bookings-store';
import { INITIAL_CAMPAIGNS, CampaignRecord } from './data/campaigns-store';
import { INITIAL_QUOTATIONS, QuotationRecord } from './data/quotations-store';
import { INITIAL_CONTRACTS, ContractRecord } from './data/contracts-store';
import { INITIAL_INVOICES, INITIAL_PAYMENTS, InvoiceRecord, PaymentRecord } from './data/invoices-store';
import { INITIAL_ARTWORKS, ArtworkRecord } from './data/artwork-store';
import { INITIAL_WORK_ORDERS, InstallationWorkOrder } from './data/installations-store';
import { INITIAL_MAINTENANCE, MaintenanceRecord } from './data/maintenance-store';
import { INITIAL_NOTIFICATIONS, NotificationItem } from './data/notifications-store';
import { INITIAL_AUDIT_LOGS, AuditLogEntry } from './data/audit-search-store';
import { INITIAL_USERS, UserProfile } from './data/users-store';

/* =========================================================================
   1. BILLBOARDS
   ========================================================================= */
export function getTenantBillboards(tenantId?: string): BillboardItem[] {
  if (typeof window === 'undefined') return isDemoTenant(tenantId) ? INITIAL_BILLBOARDS : [];
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey('adversoft_billboards_v1', tid);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (isDemoTenant(tid)) {
        localStorage.setItem(key, JSON.stringify(INITIAL_BILLBOARDS));
        return INITIAL_BILLBOARDS;
      }
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return isDemoTenant(tid) ? INITIAL_BILLBOARDS : [];
  }
}

export function saveTenantBillboards(items: BillboardItem[], tenantId?: string): void {
  if (typeof window === 'undefined') return;
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey('adversoft_billboards_v1', tid);
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('adversoft_billboards_updated', { detail: items }));
}

/* =========================================================================
   2. CLIENTS (CRM)
   ========================================================================= */
export function getTenantClients(tenantId?: string): ClientAccount[] {
  if (typeof window === 'undefined') return isDemoTenant(tenantId) ? INITIAL_CLIENTS : [];
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey('adversoft_crm_clients', tid);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (isDemoTenant(tid)) {
        localStorage.setItem(key, JSON.stringify(INITIAL_CLIENTS));
        return INITIAL_CLIENTS;
      }
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return isDemoTenant(tid) ? INITIAL_CLIENTS : [];
  }
}

export function saveTenantClients(items: ClientAccount[], tenantId?: string): void {
  if (typeof window === 'undefined') return;
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey('adversoft_crm_clients', tid);
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('adversoft_crm_clients_updated', { detail: items }));
}

/* =========================================================================
   3. LEADS (CRM)
   ========================================================================= */
export function getTenantLeads(tenantId?: string): SalesLead[] {
  if (typeof window === 'undefined') return isDemoTenant(tenantId) ? INITIAL_LEADS : [];
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey('adversoft_crm_leads', tid);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (isDemoTenant(tid)) {
        localStorage.setItem(key, JSON.stringify(INITIAL_LEADS));
        return INITIAL_LEADS;
      }
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return isDemoTenant(tid) ? INITIAL_LEADS : [];
  }
}

export function saveTenantLeads(items: SalesLead[], tenantId?: string): void {
  if (typeof window === 'undefined') return;
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey('adversoft_crm_leads', tid);
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('adversoft_crm_leads_updated', { detail: items }));
}

/* =========================================================================
   4. BOOKINGS
   ========================================================================= */
export function getTenantBookings(tenantId?: string): BookingRecord[] {
  if (typeof window === 'undefined') return isDemoTenant(tenantId) ? INITIAL_BOOKINGS : [];
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey('adversoft_bookings_v1', tid);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (isDemoTenant(tid)) {
        localStorage.setItem(key, JSON.stringify(INITIAL_BOOKINGS));
        return INITIAL_BOOKINGS;
      }
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return isDemoTenant(tid) ? INITIAL_BOOKINGS : [];
  }
}

export function saveTenantBookings(items: BookingRecord[], tenantId?: string): void {
  if (typeof window === 'undefined') return;
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey('adversoft_bookings_v1', tid);
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('adversoft_bookings_updated', { detail: items }));
}

/* =========================================================================
   5. CAMPAIGNS
   ========================================================================= */
export function getTenantCampaigns(tenantId?: string): CampaignRecord[] {
  if (typeof window === 'undefined') return isDemoTenant(tenantId) ? INITIAL_CAMPAIGNS : [];
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey('adversoft_campaigns_v1', tid);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (isDemoTenant(tid)) {
        localStorage.setItem(key, JSON.stringify(INITIAL_CAMPAIGNS));
        return INITIAL_CAMPAIGNS;
      }
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return isDemoTenant(tid) ? INITIAL_CAMPAIGNS : [];
  }
}

export function saveTenantCampaigns(items: CampaignRecord[], tenantId?: string): void {
  if (typeof window === 'undefined') return;
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey('adversoft_campaigns_v1', tid);
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('adversoft_campaigns_updated', { detail: items }));
}

/* =========================================================================
   6. QUOTATIONS
   ========================================================================= */
export function getTenantQuotations(tenantId?: string): QuotationRecord[] {
  if (typeof window === 'undefined') return isDemoTenant(tenantId) ? INITIAL_QUOTATIONS : [];
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey('adversoft_quotations', tid);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (isDemoTenant(tid)) {
        localStorage.setItem(key, JSON.stringify(INITIAL_QUOTATIONS));
        return INITIAL_QUOTATIONS;
      }
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return isDemoTenant(tid) ? INITIAL_QUOTATIONS : [];
  }
}

export function saveTenantQuotations(items: QuotationRecord[], tenantId?: string): void {
  if (typeof window === 'undefined') return;
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey('adversoft_quotations', tid);
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('adversoft_quotations_updated', { detail: items }));
}

/* =========================================================================
   7. CONTRACTS
   ========================================================================= */
export function getTenantContracts(tenantId?: string): ContractRecord[] {
  if (typeof window === 'undefined') return isDemoTenant(tenantId) ? INITIAL_CONTRACTS : [];
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey('adversoft_contracts', tid);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (isDemoTenant(tid)) {
        localStorage.setItem(key, JSON.stringify(INITIAL_CONTRACTS));
        return INITIAL_CONTRACTS;
      }
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return isDemoTenant(tid) ? INITIAL_CONTRACTS : [];
  }
}

export function saveTenantContracts(items: ContractRecord[], tenantId?: string): void {
  if (typeof window === 'undefined') return;
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey('adversoft_contracts', tid);
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('adversoft_contracts_updated', { detail: items }));
}

/* =========================================================================
   8. INVOICES & PAYMENTS
   ========================================================================= */
export function getTenantInvoices(tenantId?: string): InvoiceRecord[] {
  if (typeof window === 'undefined') return isDemoTenant(tenantId) ? INITIAL_INVOICES : [];
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey('adversoft_invoices_v1', tid);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (isDemoTenant(tid)) {
        localStorage.setItem(key, JSON.stringify(INITIAL_INVOICES));
        return INITIAL_INVOICES;
      }
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return isDemoTenant(tid) ? INITIAL_INVOICES : [];
  }
}

export function saveTenantInvoices(items: InvoiceRecord[], tenantId?: string): void {
  if (typeof window === 'undefined') return;
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey('adversoft_invoices_v1', tid);
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('adversoft_invoices_updated', { detail: items }));
}

export function getTenantPayments(tenantId?: string): PaymentRecord[] {
  if (typeof window === 'undefined') return isDemoTenant(tenantId) ? INITIAL_PAYMENTS : [];
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey('adversoft_payments_v1', tid);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (isDemoTenant(tid)) {
        localStorage.setItem(key, JSON.stringify(INITIAL_PAYMENTS));
        return INITIAL_PAYMENTS;
      }
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return isDemoTenant(tid) ? INITIAL_PAYMENTS : [];
  }
}

export function saveTenantPayments(items: PaymentRecord[], tenantId?: string): void {
  if (typeof window === 'undefined') return;
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey('adversoft_payments_v1', tid);
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('adversoft_payments_updated', { detail: items }));
}

/* =========================================================================
   9. ARTWORK PROOFS
   ========================================================================= */
export function getTenantArtworks(tenantId?: string): ArtworkRecord[] {
  if (typeof window === 'undefined') return isDemoTenant(tenantId) ? INITIAL_ARTWORKS : [];
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey('adversoft_artworks_v1', tid);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (isDemoTenant(tid)) {
        localStorage.setItem(key, JSON.stringify(INITIAL_ARTWORKS));
        return INITIAL_ARTWORKS;
      }
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return isDemoTenant(tid) ? INITIAL_ARTWORKS : [];
  }
}

export function saveTenantArtworks(items: ArtworkRecord[], tenantId?: string): void {
  if (typeof window === 'undefined') return;
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey('adversoft_artworks_v1', tid);
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('adversoft_artworks_updated', { detail: items }));
}

/* =========================================================================
   10. INSTALLATIONS (WORK ORDERS)
   ========================================================================= */
export function getTenantWorkOrders(tenantId?: string): InstallationWorkOrder[] {
  if (typeof window === 'undefined') return isDemoTenant(tenantId) ? INITIAL_WORK_ORDERS : [];
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey('adversoft_installations_v1', tid);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (isDemoTenant(tid)) {
        localStorage.setItem(key, JSON.stringify(INITIAL_WORK_ORDERS));
        return INITIAL_WORK_ORDERS;
      }
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return isDemoTenant(tid) ? INITIAL_WORK_ORDERS : [];
  }
}

export function saveTenantWorkOrders(items: InstallationWorkOrder[], tenantId?: string): void {
  if (typeof window === 'undefined') return;
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey('adversoft_installations_v1', tid);
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('adversoft_installations_updated', { detail: items }));
}

/* =========================================================================
   11. MAINTENANCE
   ========================================================================= */
export function getTenantMaintenance(tenantId?: string): MaintenanceRecord[] {
  if (typeof window === 'undefined') return isDemoTenant(tenantId) ? INITIAL_MAINTENANCE : [];
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey('adversoft_maintenance_v1', tid);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (isDemoTenant(tid)) {
        localStorage.setItem(key, JSON.stringify(INITIAL_MAINTENANCE));
        return INITIAL_MAINTENANCE;
      }
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return isDemoTenant(tid) ? INITIAL_MAINTENANCE : [];
  }
}

export function saveTenantMaintenance(items: MaintenanceRecord[], tenantId?: string): void {
  if (typeof window === 'undefined') return;
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey('adversoft_maintenance_v1', tid);
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('adversoft_maintenance_updated', { detail: items }));
}

/* =========================================================================
   12. NOTIFICATIONS
   ========================================================================= */
export function getTenantNotifications(tenantId?: string): NotificationItem[] {
  if (typeof window === 'undefined') return isDemoTenant(tenantId) ? INITIAL_NOTIFICATIONS : [];
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey('adversoft_notifications_v1', tid);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (isDemoTenant(tid)) {
        localStorage.setItem(key, JSON.stringify(INITIAL_NOTIFICATIONS));
        return INITIAL_NOTIFICATIONS;
      }
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return isDemoTenant(tid) ? INITIAL_NOTIFICATIONS : [];
  }
}

export function saveTenantNotifications(items: NotificationItem[], tenantId?: string): void {
  if (typeof window === 'undefined') return;
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey('adversoft_notifications_v1', tid);
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('adversoft_notifications_updated', { detail: items }));
}

/* =========================================================================
   13. AUDIT LOGS
   ========================================================================= */
export function getTenantAuditLogs(tenantId?: string): AuditLogEntry[] {
  if (typeof window === 'undefined') return isDemoTenant(tenantId) ? INITIAL_AUDIT_LOGS : [];
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey('adversoft_audit_logs_v1', tid);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (isDemoTenant(tid)) {
        localStorage.setItem(key, JSON.stringify(INITIAL_AUDIT_LOGS));
        return INITIAL_AUDIT_LOGS;
      }
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return isDemoTenant(tid) ? INITIAL_AUDIT_LOGS : [];
  }
}

export function saveTenantAuditLogs(items: AuditLogEntry[], tenantId?: string): void {
  if (typeof window === 'undefined') return;
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey('adversoft_audit_logs_v1', tid);
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('adversoft_audit_updated', { detail: items }));
}

/* =========================================================================
   14. USERS (TEAM)
   ========================================================================= */
export function getTenantUsers(tenantId?: string): UserProfile[] {
  if (typeof window === 'undefined') return isDemoTenant(tenantId) ? INITIAL_USERS : [];
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey('adversoft_users_v1', tid);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (isDemoTenant(tid)) {
        localStorage.setItem(key, JSON.stringify(INITIAL_USERS));
        return INITIAL_USERS;
      }
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return isDemoTenant(tid) ? INITIAL_USERS : [];
  }
}

export function saveTenantUsers(items: UserProfile[], tenantId?: string): void {
  if (typeof window === 'undefined') return;
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey('adversoft_users_v1', tid);
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('adversoft_users_updated', { detail: items }));
}

/* =========================================================================
   15. TENANT EXECUTIVE SUMMARY METRICS
   Calculates live tenant metrics for Dashboard cards & analytics
   ========================================================================= */
export function getTenantSummaryMetrics(tenantId?: string) {
  const billboards = getTenantBillboards(tenantId);
  const campaigns = getTenantCampaigns(tenantId);
  const artworks = getTenantArtworks(tenantId);
  const invoices = getTenantInvoices(tenantId);

  const totalBillboards = billboards.length;
  const occupiedCount = billboards.filter((b) => b.status === 'OCCUPIED').length;
  const availableCount = billboards.filter((b) => b.status === 'AVAILABLE').length;
  const reservedCount = billboards.filter((b) => b.status === 'RESERVED').length;
  const maintenanceCount = billboards.filter((b) => b.status === 'MAINTENANCE').length;

  const occupancyRate = totalBillboards > 0 ? Math.round((occupiedCount / totalBillboards) * 100) : 0;
  const activeCampaigns = campaigns.filter((c) => c.status === 'LIVE').length;
  const pendingApprovals = artworks.filter((a) => a.status === 'IN_REVIEW' || a.status === 'PREFLIGHT_CHECK').length;
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);

  return {
    totalBillboards,
    occupiedCount,
    availableCount,
    reservedCount,
    maintenanceCount,
    occupancyRate,
    activeCampaigns,
    pendingApprovals,
    totalRevenue,
  };
}
