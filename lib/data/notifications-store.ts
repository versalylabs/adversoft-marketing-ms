/**
 * Adversoft Notifications & Automation Data Store & Engine
 * Module: In-app notification center, real-time alert badges, automated triggers,
 * and transactional email delivery ledger.
 */

import { UserRole } from '@/lib/rbac';
import { getActiveTenantId, isDemoTenant, getTenantStorageKey } from '../tenant';

export type NotificationCategory =
  | 'BOOKING'
  | 'ARTWORK'
  | 'INSTALLATION'
  | 'MAINTENANCE'
  | 'INVOICE'
  | 'CONTRACT'
  | 'SYSTEM';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  recipientRole?: UserRole | 'ALL';
  recipientEmail?: string;
  metadata?: Record<string, any>;
  createdAt: string; // ISO or human string
  timeAgo?: string;
}

export type AutomationTriggerEvent =
  | 'ON_BOOKING_CREATED'
  | 'ON_ARTWORK_UPLOADED'
  | 'ON_ARTWORK_APPROVED'
  | 'ON_INSTALLATION_VERIFIED'
  | 'ON_MAINTENANCE_INCIDENT'
  | 'ON_INVOICE_OVERDUE'
  | 'ON_PAYMENT_SETTLED'
  | 'ON_CONTRACT_EXPIRING';

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  eventTrigger: AutomationTriggerEvent;
  channel: 'IN_APP' | 'EMAIL' | 'BOTH';
  targetRole: UserRole | 'CLIENT' | 'ALL';
  isEnabled: boolean;
  executionCount: number;
  lastTriggeredAt?: string;
}

export type EmailTemplateType =
  | 'BOOKING_CONFIRMATION'
  | 'ARTWORK_APPROVAL_REQUEST'
  | 'ARTWORK_APPROVED_NOTICE'
  | 'INSTALLATION_DISPATCH'
  | 'POP_VERIFIED_ALERT'
  | 'INVOICE_PAST_DUE'
  | 'PAYMENT_RECEIPT'
  | 'CONTRACT_EXPIRATION_ALERT';

export interface TransactionalEmailLog {
  id: string;
  emailNumber: string; // e.g. EML-2026-081
  to: string;
  recipientName: string;
  from: string;
  subject: string;
  template: EmailTemplateType;
  bodySnippet: string;
  bodyHtml: string;
  sentAt: string;
  status: 'DELIVERED' | 'OPENED' | 'QUEUED';
  referenceId?: string; // e.g. INV-2026-004 or BKG-2026-001
}

const NOTIFICATIONS_STORAGE_KEY = 'adversoft_notifications_v1';
const RULES_STORAGE_KEY = 'adversoft_automation_rules_v1';
const EMAILS_STORAGE_KEY = 'adversoft_transactional_emails_v1';

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_1',
    title: 'Urgent: Invoice INV-2026-004 Past Due (19 Days)',
    message: 'Horizon Healthcare Network balance of $45,200 is past due. Automated dunning schedule initiated.',
    category: 'INVOICE',
    priority: 'URGENT',
    isRead: false,
    actionUrl: '/invoices',
    actionLabel: 'Inspect Overdue Invoice',
    recipientRole: 'Finance',
    createdAt: '2026-10-14 09:15',
    timeAgo: '2 hours ago',
  },
  {
    id: 'notif_2',
    title: 'New Inbound Marketplace Booking Request',
    message: 'Apex Consumer Brands requested Holiday Blitz 2026 on Times Square Spectacle LED ($28,350).',
    category: 'BOOKING',
    priority: 'HIGH',
    isRead: false,
    actionUrl: '/bookings',
    actionLabel: 'Review Reservation',
    recipientRole: 'Sales Manager',
    createdAt: '2026-10-14 08:30',
    timeAgo: '3 hours ago',
  },
  {
    id: 'notif_3',
    title: 'Certified Proof-of-Posting Uploaded',
    message: 'Field Crew Alpha uploaded daytime and night illumination photos for Sterling Luxe Holiday (BB-101).',
    category: 'INSTALLATION',
    priority: 'MEDIUM',
    isRead: false,
    actionUrl: '/installations',
    actionLabel: 'View Verified POP',
    recipientRole: 'Operations Manager',
    createdAt: '2026-10-13 18:45',
    timeAgo: 'Yesterday',
  },
  {
    id: 'notif_4',
    title: 'Artwork Sign-off Needed: EcoDrive SUV v2',
    message: 'Vanguard Automotive uploaded 300 DPI preflight proof for Sunset Boulevard Unipole.',
    category: 'ARTWORK',
    priority: 'HIGH',
    isRead: false,
    actionUrl: '/artwork',
    actionLabel: 'Approve Artwork Proof',
    recipientRole: 'Campaign Manager',
    createdAt: '2026-10-13 15:20',
    timeAgo: 'Yesterday',
  },
  {
    id: 'notif_5',
    title: 'Critical Maintenance Dispatched: Breaker Fault',
    message: 'Bulb outage on Times Square Spectacle North Face reported. Technician Marcus Drake assigned with 4hr SLA.',
    category: 'MAINTENANCE',
    priority: 'URGENT',
    isRead: true,
    actionUrl: '/maintenance',
    actionLabel: 'Inspect Incident Ticket',
    recipientRole: 'Operations Manager',
    createdAt: '2026-10-12 11:10',
    timeAgo: '2 days ago',
  },
  {
    id: 'notif_6',
    title: 'Advertising Contract CNT-2026-001 Approaching Expiration',
    message: 'Sterling Brands 46-day flight enters 30-day renewal alert window. Right of first refusal active.',
    category: 'CONTRACT',
    priority: 'MEDIUM',
    isRead: true,
    actionUrl: '/contracts',
    actionLabel: 'View Renewal Terms',
    recipientRole: 'Sales Manager',
    createdAt: '2026-10-11 14:00',
    timeAgo: '3 days ago',
  },
  {
    id: 'notif_7',
    title: 'Online Card Payment Cleared: $88,526',
    message: 'Peak Energy Beverages settled INV-2026-005 in full via self-service client portal Stripe gateway.',
    category: 'INVOICE',
    priority: 'LOW',
    isRead: true,
    actionUrl: '/payments',
    actionLabel: 'View Cleared Receipt',
    recipientRole: 'Finance',
    createdAt: '2026-10-10 16:30',
    timeAgo: '4 days ago',
  },
];

export const INITIAL_RULES: AutomationRule[] = [
  {
    id: 'rule_1',
    name: 'Auto-Send Proof-of-Posting Dossier to Advertiser',
    description: 'When operations signs off on day and night proof photos, automatically email certified POP dossier to client contact.',
    eventTrigger: 'ON_INSTALLATION_VERIFIED',
    channel: 'BOTH',
    targetRole: 'CLIENT',
    isEnabled: true,
    executionCount: 24,
    lastTriggeredAt: '2026-10-13 18:45',
  },
  {
    id: 'rule_2',
    name: 'Auto-Dispatched Overdue Invoice Reminders',
    description: 'When an invoice exceeds Net 30 due date, trigger dunning alert to client accounts payable and notify internal finance controller.',
    eventTrigger: 'ON_INVOICE_OVERDUE',
    channel: 'BOTH',
    targetRole: 'Finance',
    isEnabled: true,
    executionCount: 18,
    lastTriggeredAt: '2026-10-14 09:15',
  },
  {
    id: 'rule_3',
    name: 'Urgent Artwork Preflight Approval Alert',
    description: 'Alert client marketing director and account coordinator when production uploads a print-ready creative proof.',
    eventTrigger: 'ON_ARTWORK_UPLOADED',
    channel: 'BOTH',
    targetRole: 'Campaign Manager',
    isEnabled: true,
    executionCount: 31,
    lastTriggeredAt: '2026-10-13 15:20',
  },
  {
    id: 'rule_4',
    name: 'Print Handoff Dispatch on Client Sign-off',
    description: 'When client executes digital sign-off, automatically dispatch production ticket to designated vinyl print depot.',
    eventTrigger: 'ON_ARTWORK_APPROVED',
    channel: 'IN_APP',
    targetRole: 'Operations Manager',
    isEnabled: true,
    executionCount: 19,
    lastTriggeredAt: '2026-10-12 14:10',
  },
  {
    id: 'rule_5',
    name: 'Contract 60/30-Day Expiration Renewal Notice',
    description: 'Send renewal offer and right of first refusal reservation hold to advertiser 30 days before flight conclusion.',
    eventTrigger: 'ON_CONTRACT_EXPIRING',
    channel: 'EMAIL',
    targetRole: 'CLIENT',
    isEnabled: true,
    executionCount: 12,
    lastTriggeredAt: '2026-10-11 14:00',
  },
  {
    id: 'rule_6',
    name: 'Automated Payment Settlement & Tax Receipt',
    description: 'Immediately generate official payment receipt (REC-2026-xxx) and email PDF confirmation upon ACH or wire clearance.',
    eventTrigger: 'ON_PAYMENT_SETTLED',
    channel: 'BOTH',
    targetRole: 'CLIENT',
    isEnabled: true,
    executionCount: 42,
    lastTriggeredAt: '2026-10-10 16:30',
  },
];

export const INITIAL_EMAILS: TransactionalEmailLog[] = [
  {
    id: 'eml_1',
    emailNumber: 'EML-2026-081',
    to: 'finance@horizonhealth.org',
    recipientName: 'Horizon Healthcare Accounts Payable',
    from: 'Adversoft Media Remittance <billing@adversoft.com>',
    subject: 'Urgent Notice: Past Due Statement for Invoice INV-2026-004 ($45,200.00 USD)',
    template: 'INVOICE_PAST_DUE',
    bodySnippet: 'Your outdoor advertising invoice INV-2026-004 is 19 days overdue. Please remit payment via FedWire or ACH.',
    bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
      <h2 style="color: #111827; margin-top: 0;">Past Due Payment Statement</h2>
      <p style="color: #4b5563;">Dear Horizon Healthcare Finance Team,</p>
      <p style="color: #4b5563;">This is a courtesy reminder that invoice <strong>INV-2026-004</strong> for the Horizon Health Open Enrollment flight reached its due date on September 25, 2026, and is now 19 days past due.</p>
      <div style="background: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0; color: #991b1b; font-weight: bold;">Outstanding Balance: $45,200.00 USD</p>
        <p style="margin: 4px 0 0; color: #b91c1c; font-size: 13px;">Terms: Net 30 • Direct Bank Wire Remittance Requested</p>
      </div>
      <p style="color: #4b5563;">Please review the attached statement or access the Adversoft Client Portal to authorize immediate payment.</p>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">Adversoft Outdoor Media LLC • 100 Broadway, 24th Floor, New York, NY 10005</p>
    </div>`,
    sentAt: '2026-10-14 09:15',
    status: 'DELIVERED',
    referenceId: 'INV-2026-004',
  },
  {
    id: 'eml_2',
    emailNumber: 'EML-2026-082',
    to: 'david@sterlingbrands.com',
    recipientName: 'David Sterling (CEO, Sterling Brands)',
    from: 'Adversoft Field Operations <ops@adversoft.com>',
    subject: 'Certified Proof-of-Posting Dossier: Times Square Spectacle LED',
    template: 'POP_VERIFIED_ALERT',
    bodySnippet: 'Rigging installation completed and verified. Daytime and night-time 4K illumination photos attached.',
    bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
      <h2 style="color: #111827; margin-top: 0;">Certified Proof-of-Performance Dossier</h2>
      <p style="color: #4b5563;">Dear David,</p>
      <p style="color: #4b5563;">We are pleased to inform you that your advertising flight <strong>Sterling Luxe Holiday 2026</strong> on billboard <strong>BB-101 (Times Square Spectacle LED)</strong> is officially active and broadcasting.</p>
      <div style="background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0; color: #065f46; font-weight: bold;">Illumination Verification: 99.8% Certified SLA</p>
        <p style="margin: 4px 0 0; color: #047857; font-size: 13px;">GPS Verified: 40.7588° N, -73.9851° W • Inspector: Lucas Vance</p>
      </div>
      <p style="color: #4b5563;">Both daylight display and night illumination high-resolution photographs are now available in your Client Portal.</p>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">Adversoft Outdoor Media LLC • Rigging Operations Division</p>
    </div>`,
    sentAt: '2026-10-13 18:45',
    status: 'OPENED',
    referenceId: 'WO-2026-001',
  },
  {
    id: 'eml_3',
    emailNumber: 'EML-2026-083',
    to: 'billing@peakbeverages.com',
    recipientName: 'Peak Energy Beverages Finance',
    from: 'Adversoft Accounts Receivable <billing@adversoft.com>',
    subject: 'Payment Receipt REC-2026-005 — Thank you for your payment ($88,526.00)',
    template: 'PAYMENT_RECEIPT',
    bodySnippet: 'Payment received in full for invoice INV-2026-005 via Stripe Corporate Card checkout.',
    bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
      <h2 style="color: #111827; margin-top: 0;">Official Payment Receipt REC-2026-005</h2>
      <p style="color: #4b5563;">Dear Peak Energy Beverages Team,</p>
      <p style="color: #4b5563;">We have received your electronic payment of <strong>$88,526.00 USD</strong>. Invoice INV-2026-005 is now marked PAID in full.</p>
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0; color: #166534; font-weight: bold;">Amount Paid: $88,526.00 USD</p>
        <p style="margin: 4px 0 0; color: #15803d; font-size: 13px;">Reference: STRIPE_CH_3Nx84Ka9182 • Method: Corporate Credit Card</p>
      </div>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">Thank you for your valued partnership. Adversoft Outdoor Media LLC</p>
    </div>`,
    sentAt: '2026-10-10 16:30',
    status: 'OPENED',
    referenceId: 'INV-2026-005',
  },
];

// In-memory runtime cache
let memoryNotifications: NotificationItem[] | null = null;
let memoryRules: AutomationRule[] | null = null;
let memoryEmails: TransactionalEmailLog[] | null = null;

export function getStoredNotifications(tenantId?: string): NotificationItem[] {
  if (typeof window === 'undefined') return isDemoTenant(tenantId) ? INITIAL_NOTIFICATIONS : [];
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey(NOTIFICATIONS_STORAGE_KEY, tid);
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

export function saveStoredNotifications(items: NotificationItem[], tenantId?: string) {
  memoryNotifications = items;
  if (typeof window !== 'undefined') {
    const tid = tenantId || getActiveTenantId();
    const key = getTenantStorageKey(NOTIFICATIONS_STORAGE_KEY, tid);
    try {
      localStorage.setItem(key, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('adversoft_notifications_updated', { detail: items }));
    } catch (e) {
      console.error('Failed to save notifications:', e);
    }
  }
}

export function markAsRead(id: string): NotificationItem[] {
  const list = getStoredNotifications();
  const updated = list.map((item) => (item.id === id ? { ...item, isRead: true } : item));
  saveStoredNotifications(updated);
  return updated;
}

export function markAllAsRead(): NotificationItem[] {
  const list = getStoredNotifications();
  const updated = list.map((item) => ({ ...item, isRead: true }));
  saveStoredNotifications(updated);
  return updated;
}

export function deleteNotification(id: string): NotificationItem[] {
  const list = getStoredNotifications();
  const updated = list.filter((item) => item.id !== id);
  saveStoredNotifications(updated);
  return updated;
}

export function clearAllNotifications(): NotificationItem[] {
  saveStoredNotifications([]);
  return [];
}

export function getUnreadCount(): number {
  return getStoredNotifications().filter((n) => !n.isRead).length;
}

export function dispatchNotification(input: {
  title: string;
  message: string;
  category: NotificationCategory;
  priority?: NotificationPriority;
  actionUrl?: string;
  actionLabel?: string;
  recipientRole?: UserRole | 'ALL';
  recipientEmail?: string;
}): NotificationItem {
  const list = getStoredNotifications();
  const newItem: NotificationItem = {
    id: `notif_${Date.now()}`,
    title: input.title,
    message: input.message,
    category: input.category,
    priority: input.priority || 'MEDIUM',
    isRead: false,
    actionUrl: input.actionUrl,
    actionLabel: input.actionLabel,
    recipientRole: input.recipientRole || 'ALL',
    recipientEmail: input.recipientEmail,
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    timeAgo: 'Just now',
  };

  const updated = [newItem, ...list];
  saveStoredNotifications(updated);
  return newItem;
}

export function getStoredAutomationRules(): AutomationRule[] {
  if (typeof window === 'undefined') return memoryRules || INITIAL_RULES;
  try {
    const raw = localStorage.getItem(RULES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(INITIAL_RULES));
      return INITIAL_RULES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_RULES;
  }
}

export function saveStoredAutomationRules(rules: AutomationRule[]) {
  memoryRules = rules;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rules));
      window.dispatchEvent(new CustomEvent('adversoft_automation_rules_updated', { detail: rules }));
    } catch (e) {
      console.error('Failed to save automation rules:', e);
    }
  }
}

export function toggleAutomationRule(ruleId: string): AutomationRule[] {
  const rules = getStoredAutomationRules();
  const updated = rules.map((r) =>
    r.id === ruleId ? { ...r, isEnabled: !r.isEnabled } : r
  );
  saveStoredAutomationRules(updated);
  return updated;
}

export function triggerAutomationRuleExecution(ruleId: string): {
  success: boolean;
  rule?: AutomationRule;
  notification?: NotificationItem;
  email?: TransactionalEmailLog;
  error?: string;
} {
  const rules = getStoredAutomationRules();
  const rule = rules.find((r) => r.id === ruleId);
  if (!rule) return { success: false, error: 'Automation rule not found.' };

  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  rule.executionCount += 1;
  rule.lastTriggeredAt = now;
  saveStoredAutomationRules([...rules]);

  // Create notification
  const notif = dispatchNotification({
    title: `Automation Triggered: ${rule.name}`,
    message: rule.description,
    category: 'SYSTEM',
    priority: 'HIGH',
    actionUrl: '/notifications',
    actionLabel: 'Inspect Automation Hub',
  });

  // Create mock transactional email log
  const emails = getStoredTransactionalEmails();
  const newEmail: TransactionalEmailLog = {
    id: `eml_${Date.now()}`,
    emailNumber: `EML-2026-${String(100 + emails.length).padStart(3, '0')}`,
    to: 'alerts@client.com',
    recipientName: 'Advertiser Marketing Team',
    from: 'Adversoft Automated Operations <automation@adversoft.com>',
    subject: `Automated Notification: ${rule.name}`,
    template: 'BOOKING_CONFIRMATION',
    bodySnippet: rule.description,
    bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
      <h3 style="color: #111827;">${rule.name}</h3>
      <p style="color: #4b5563;">${rule.description}</p>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">Triggered via Adversoft Event Automation Engine at ${now}</p>
    </div>`,
    sentAt: now,
    status: 'DELIVERED',
  };

  saveStoredTransactionalEmails([newEmail, ...emails]);

  return {
    success: true,
    rule,
    notification: notif,
    email: newEmail,
  };
}

export function getStoredTransactionalEmails(): TransactionalEmailLog[] {
  if (typeof window === 'undefined') return memoryEmails || INITIAL_EMAILS;
  try {
    const raw = localStorage.getItem(EMAILS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(EMAILS_STORAGE_KEY, JSON.stringify(INITIAL_EMAILS));
      return INITIAL_EMAILS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_EMAILS;
  }
}

export function saveStoredTransactionalEmails(emails: TransactionalEmailLog[]) {
  memoryEmails = emails;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(EMAILS_STORAGE_KEY, JSON.stringify(emails));
      window.dispatchEvent(new CustomEvent('adversoft_emails_updated', { detail: emails }));
    } catch (e) {
      console.error('Failed to save transactional emails:', e);
    }
  }
}

export function getNotificationMetrics() {
  const notifs = getStoredNotifications();
  const rules = getStoredAutomationRules();
  const emails = getStoredTransactionalEmails();

  const total = notifs.length;
  const unread = notifs.filter((n) => !n.isRead).length;
  const urgentCount = notifs.filter((n) => n.priority === 'URGENT').length;
  const activeRulesCount = rules.filter((r) => r.isEnabled).length;
  const emailsSent = emails.length;
  const emailsOpened = emails.filter((e) => e.status === 'OPENED').length;
  const openRatePercent = emailsSent > 0 ? Math.round((emailsOpened / emailsSent) * 100) : 0;

  return {
    total,
    unread,
    urgentCount,
    activeRulesCount,
    totalRulesCount: rules.length,
    emailsSent,
    emailsOpened,
    openRatePercent,
  };
}
