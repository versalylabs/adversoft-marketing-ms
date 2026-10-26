/**
 * Adversoft Global Search & Audit Activity Logs Store & Engine
 * Module: Omni-Search indexing, immutable audit trail, diff tracking,
 * compliance reporting, and security telemetry.
 */

import { UserRole } from '@/lib/rbac';
import { INITIAL_BILLBOARDS, BillboardItem } from './billboards-store';
import { INITIAL_CLIENTS, ClientAccount } from './crm-store';
import { getStoredCampaigns, CampaignRecord } from './campaigns-store';
import { getStoredInvoices, InvoiceRecord } from './invoices-store';
import { getStoredContracts, ContractRecord } from './contracts-store';
import { getStoredWorkOrders, InstallationWorkOrder } from './installations-store';
import { getStoredArtworks, ArtworkRecord } from './artwork-store';
import { getActiveTenantId, isDemoTenant, getTenantStorageKey } from '../tenant';

export type AuditSeverity = 'CRITICAL' | 'WARNING' | 'NOTICE' | 'INFO';

export type AuditEntityType =
  | 'BILLBOARD'
  | 'CAMPAIGN'
  | 'CLIENT'
  | 'CONTRACT'
  | 'INVOICE'
  | 'PAYMENT'
  | 'ARTWORK'
  | 'WORK_ORDER'
  | 'USER_ROLE'
  | 'SYSTEM'
  | 'SECURITY';

export interface AuditActor {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  ipAddress: string;
  userAgent?: string;
}

export interface AuditFieldDiff {
  field: string;
  label: string;
  oldValue: any;
  newValue: any;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO 8601
  actor: AuditActor;
  action: string;
  actionLabel: string;
  entityType: AuditEntityType;
  entityId: string;
  entityTitle: string;
  routeLink?: string;
  severity: AuditSeverity;
  description: string;
  diff?: AuditFieldDiff[];
  metadata?: Record<string, any>;
  hash: string; // Cryptographic integrity hash simulation
}

export interface AuditFilterParams {
  searchQuery?: string;
  severity?: AuditSeverity | 'ALL';
  entityType?: AuditEntityType | 'ALL';
  actorId?: string;
  startDate?: string;
  endDate?: string;
}

export interface AuditStats {
  totalEvents: number;
  criticalCount: number;
  warningCount: number;
  noticeCount: number;
  infoCount: number;
  uniqueActorsCount: number;
  last24hCount: number;
}

// Global Omni Search Types
export type SearchCategory =
  | 'ALL'
  | 'BILLBOARDS'
  | 'CAMPAIGNS'
  | 'CLIENTS'
  | 'INVOICES'
  | 'CONTRACTS'
  | 'WORK_ORDERS'
  | 'ARTWORK'
  | 'AUDIT';

export interface SearchResultItem {
  id: string;
  category: SearchCategory;
  categoryLabel: string;
  title: string;
  subtitle: string;
  badgeText?: string;
  badgeColor?: string;
  route: string;
  metadata?: Record<string, any>;
}

// Seeded Initial Audit Log Trail
export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud_18',
    timestamp: '2026-10-14T15:30:10.000Z',
    actor: {
      id: 'usr_super',
      name: 'Alex Vance',
      email: 'alex@adversoft.com',
      role: 'Super Admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      ipAddress: '198.51.100.24',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0',
    },
    action: 'RATE_OVERRIDDEN',
    actionLabel: 'Monthly Base Rate Overridden',
    entityType: 'BILLBOARD',
    entityId: 'BB-101',
    entityTitle: 'Times Square Spectacle LED (BB-101)',
    routeLink: '/billboards',
    severity: 'WARNING',
    description: 'Modified base monthly rental rate for Q4 peak holiday demand surge from $26,000 to $28,000.',
    diff: [
      { field: 'monthlyRate', label: 'Monthly Rental Rate', oldValue: '$26,000/mo', newValue: '$28,000/mo' },
      { field: 'surgeMultiplier', label: 'Holiday Surge Rate', oldValue: '1.0x', newValue: '1.08x' },
    ],
    metadata: { reason: 'Executive holiday rate revision approved by Commercial Sales committee' },
    hash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
  },
  {
    id: 'aud_17',
    timestamp: '2026-10-14T14:15:22.000Z',
    actor: {
      id: 'usr_admin',
      name: 'Rachel Adams',
      email: 'rachel@adversoft.com',
      role: 'Admin',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      ipAddress: '198.51.100.32',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    action: 'ROLE_ELEVATED',
    actionLabel: 'User Security Role Elevated',
    entityType: 'USER_ROLE',
    entityId: 'usr_sarah',
    entityTitle: 'Sarah Chen (Staff Account)',
    routeLink: '/team',
    severity: 'CRITICAL',
    description: 'Elevated Sarah Chen from Sales Agent to Sales Manager with quote approval authority.',
    diff: [
      { field: 'role', label: 'RBAC Permission Tier', oldValue: 'Sales Agent (Lvl 5)', newValue: 'Sales Manager (Lvl 7)' },
      { field: 'approvalLimit', label: 'Discount Approval Limit', oldValue: '$0', newValue: '$25,000' },
    ],
    metadata: { approver: 'Rachel Adams', ticketId: 'SEC-9921' },
    hash: 'sha256:5b8e967a5ff2ba31b92dc18148a1d65dfc2d4b1fa3d677284addd200126c1170',
  },
  {
    id: 'aud_16',
    timestamp: '2026-10-14T11:42:00.000Z',
    actor: {
      id: 'usr_finance',
      name: 'Elena Rostova',
      email: 'elena@adversoft.com',
      role: 'Finance',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      ipAddress: '198.51.100.88',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0',
    },
    action: 'PAYMENT_RECORDED',
    actionLabel: 'Client Wire Payment Recorded',
    entityType: 'PAYMENT',
    entityId: 'PAY-2026-001',
    entityTitle: 'Sterling Brands Ltd — ACH Wire $49,064.00',
    routeLink: '/invoices',
    severity: 'INFO',
    description: 'Recorded incoming JPMorgan Chase wire payment of $49,064.00 settling invoice INV-2026-001 in full.',
    diff: [
      { field: 'balanceDue', label: 'Invoice Outstanding Balance', oldValue: '$49,064.00', newValue: '$0.00' },
      { field: 'status', label: 'Invoice Status', oldValue: 'ISSUED', newValue: 'PAID' },
    ],
    metadata: { wireReference: 'ACH-NY-8829104', bankBatch: 'BATCH-20261014-01' },
    hash: 'sha256:6e3a987d5ff1ba21b92dc18148a1d65dfc2d4b1fa3d677284addd200126e3391',
  },
  {
    id: 'aud_15',
    timestamp: '2026-10-14T09:20:45.000Z',
    actor: {
      id: 'usr_ops',
      name: 'Carlos Mendez',
      email: 'carlos@adversoft.com',
      role: 'Operations Manager',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      ipAddress: '198.51.100.104',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)',
    },
    action: 'POP_VERIFIED',
    actionLabel: 'Proof-of-Posting Photo Verified',
    entityType: 'WORK_ORDER',
    entityId: 'WO-2026-001',
    entityTitle: 'Rigging Work Order WO-2026-001 (BB-101)',
    routeLink: '/installations',
    severity: 'NOTICE',
    description: 'Verified mobile GPS geotagged daytime and illuminated nighttime high-res installation verification proofs.',
    diff: [
      { field: 'status', label: 'Work Order Status', oldValue: 'IN_PROGRESS', newValue: 'COMPLETED' },
      { field: 'verifiedProofCount', label: 'Certified POP Uploads', oldValue: '0', newValue: '4' },
    ],
    metadata: { gpsLat: 40.758, gpsLng: -73.9855, lightingCheck: 'PASSED_100%' },
    hash: 'sha256:4a1c772e5ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126a8823',
  },
  {
    id: 'aud_14',
    timestamp: '2026-10-13T17:05:12.000Z',
    actor: {
      id: 'usr_client',
      name: 'Victoria Sterling',
      email: 'victoria@sterlingbrands.com',
      role: 'Client',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      ipAddress: '203.0.113.19',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
    },
    action: 'PROOF_APPROVED',
    actionLabel: 'Client Digital Creative Approval',
    entityType: 'ARTWORK',
    entityId: 'ART-2026-001',
    entityTitle: 'Sterling Haute Horlogerie 4K Holiday Loop (v2)',
    routeLink: '/artwork',
    severity: 'NOTICE',
    description: 'Client authorized master print & LED broadcast proof v2 with legally binding digital sign-off.',
    diff: [
      { field: 'status', label: 'Creative Proof Status', oldValue: 'IN_REVIEW', newValue: 'CLIENT_APPROVED' },
      { field: 'approvedVersion', label: 'Approved Asset Version', oldValue: 'v1 (Rejected)', newValue: 'v2 (Approved)' },
    ],
    metadata: { signatureHash: 'SIG-VERIFIED-98124', consentIp: '203.0.113.19' },
    hash: 'sha256:1d8f553c5ff1ba21b92dc18148a1d65dfc2d4b1fa3d677284addd200126b4419',
  },
  {
    id: 'aud_13',
    timestamp: '2026-10-13T14:40:00.000Z',
    actor: {
      id: 'usr_sales_mgr',
      name: 'Marcus Brody',
      email: 'marcus@adversoft.com',
      role: 'Sales Manager',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      ipAddress: '198.51.100.15',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    action: 'CONTRACT_EXECUTED',
    actionLabel: 'Master Advertising Agreement Executed',
    entityType: 'CONTRACT',
    entityId: 'CON-2026-001',
    entityTitle: 'Master Display Agreement — Sterling Brands Ltd',
    routeLink: '/contracts',
    severity: 'NOTICE',
    description: 'Executed 3-month holiday flight master services agreement valued at $84,000.00 with client counter-signature.',
    diff: [
      { field: 'status', label: 'Contract Lifecycle', oldValue: 'PENDING_SIGNATURE', newValue: 'ACTIVE' },
      { field: 'executionDate', label: 'Execution Date', oldValue: 'null', newValue: '2026-10-13' },
    ],
    metadata: { clientSignatory: 'Victoria Sterling (VP Marketing)', totalValue: '$84,000' },
    hash: 'sha256:8829bba15ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126c9901',
  },
  {
    id: 'aud_12',
    timestamp: '2026-10-13T10:18:30.000Z',
    actor: {
      id: 'usr_finance',
      name: 'Elena Rostova',
      email: 'elena@adversoft.com',
      role: 'Finance',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      ipAddress: '198.51.100.88',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    action: 'INVOICE_GENERATED',
    actionLabel: 'Billing Invoice Issued',
    entityType: 'INVOICE',
    entityId: 'INV-2026-001',
    entityTitle: 'Invoice INV-2026-001 — Sterling Brands Ltd ($49,064.00)',
    routeLink: '/invoices',
    severity: 'INFO',
    description: 'Automated billing dispatch issued invoice INV-2026-001 for October 2026 flight display and vinyl production.',
    diff: [
      { field: 'status', label: 'Invoice Status', oldValue: 'DRAFT', newValue: 'ISSUED' },
      { field: 'dueDate', label: 'Payment Terms Due Date', oldValue: 'null', newValue: '2026-11-13' },
    ],
    metadata: { subtotal: '$45,000', salesTax: '$4,064', total: '$49,064' },
    hash: 'sha256:3920cde85ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d4452',
  },
  {
    id: 'aud_11',
    timestamp: '2026-10-12T16:55:00.000Z',
    actor: {
      id: 'usr_ops',
      name: 'Carlos Mendez',
      email: 'carlos@adversoft.com',
      role: 'Operations Manager',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      ipAddress: '198.51.100.104',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    action: 'CATWALK_INSPECTION_PASSED',
    actionLabel: 'Structural Catwalk & Anchor Inspection',
    entityType: 'WORK_ORDER',
    entityId: 'WO-2026-004',
    entityTitle: 'Annual Structural Anchor Safety Audit (BB-103)',
    routeLink: '/maintenance',
    severity: 'INFO',
    description: 'Certified 100% safety pass on wind-load anchors, catwalk safety harness cables, and illumination grounding.',
    diff: [
      { field: 'structuralScore', label: 'Safety Rating', oldValue: 'PENDING', newValue: '98/100 (CERTIFIED)' },
      { field: 'nextInspectionDate', label: 'Next Mandatory Audit', oldValue: '2026-10-12', newValue: '2027-10-12' },
    ],
    metadata: { engineerCert: 'PE-ENG-99410', cityPermit: 'NYC-DOB-2026-092' },
    hash: 'sha256:7739afc15ff1ba21b92dc18148a1d65dfc2d4b1fa3d677284addd200126a1198',
  },
  {
    id: 'aud_10',
    timestamp: '2026-10-12T12:10:44.000Z',
    actor: {
      id: 'usr_super',
      name: 'Alex Vance',
      email: 'alex@adversoft.com',
      role: 'Super Admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      ipAddress: '198.51.100.24',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    action: 'MARKETPLACE_LISTING_PUBLISHED',
    actionLabel: 'Marketplace Inventory Listing Published',
    entityType: 'BILLBOARD',
    entityId: 'BB-102',
    entityTitle: 'Sunset Strip Spectacle Wallscape (BB-102)',
    routeLink: '/marketplace',
    severity: 'INFO',
    description: 'Enabled public marketplace listing with instant booking capability and dynamic spot pricing.',
    diff: [
      { field: 'isMarketplaceListed', label: 'Public Marketplace Status', oldValue: 'false', newValue: 'true' },
      { field: 'instantBookingEnabled', label: 'Instant Booking Toggle', oldValue: 'false', newValue: 'true' },
    ],
    metadata: { slug: 'sunset-strip-spectacle-wallscape' },
    hash: 'sha256:9918cba45ff1ba21b92dc18148a1d65dfc2d4b1fa3d677284addd200126e8832',
  },
  {
    id: 'aud_09',
    timestamp: '2026-10-11T15:35:10.000Z',
    actor: {
      id: 'usr_admin',
      name: 'Rachel Adams',
      email: 'rachel@adversoft.com',
      role: 'Admin',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      ipAddress: '198.51.100.32',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    action: 'IP_WHITELIST_MODIFIED',
    actionLabel: 'Corporate IP Access Range Updated',
    entityType: 'SECURITY',
    entityId: 'SEC-POL-01',
    entityTitle: 'Corporate Subnet CIDR Allowlist',
    routeLink: '/settings',
    severity: 'WARNING',
    description: 'Added remote office VPN subnet 198.51.100.0/24 to authorized administrative console login whitelist.',
    diff: [
      { field: 'whitelistedSubnets', label: 'Authorized Subnets', oldValue: '["10.0.0.0/8"]', newValue: '["10.0.0.0/8", "198.51.100.0/24"]' },
    ],
    metadata: { reason: 'Added authorized engineering division subnet range' },
    hash: 'sha256:2248dfe15ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126b9921',
  },
  {
    id: 'aud_08',
    timestamp: '2026-10-11T08:45:00.000Z',
    actor: {
      id: 'usr_system',
      name: 'Adversoft SLA Watchdog Daemon',
      email: 'system-daemon@adversoft.com',
      role: 'Super Admin',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      ipAddress: '127.0.0.1',
      userAgent: 'Adversoft-Telemetry-Agent/2.4',
    },
    action: 'CIRCUIT_BREAKER_TRIPPED',
    actionLabel: 'Emergency Telemetry Alert Logged',
    entityType: 'SYSTEM',
    entityId: 'SYS-TEL-409',
    entityTitle: 'North LED Substation Illumination Relay',
    routeLink: '/maintenance',
    severity: 'CRITICAL',
    description: 'High voltage transient tripped secondary floodlight breaker at BB-104. Automated technician dispatch triggered.',
    diff: [
      { field: 'breakerStatus', label: 'Circuit Breaker', oldValue: 'NORMAL_CLOSED', newValue: 'TRIPPED_OPEN' },
      { field: 'workOrderTriggered', label: 'Auto Work Order', oldValue: 'null', newValue: 'WO-2026-009 (URGENT)' },
    ],
    metadata: { mttrTarget: '< 4 hours', emergencyCrew: 'Rapid Response Team 2' },
    hash: 'sha256:1198acc25ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126f4439',
  },
  {
    id: 'aud_07',
    timestamp: '2026-10-10T16:20:00.000Z',
    actor: {
      id: 'usr_sales_mgr',
      name: 'Marcus Brody',
      email: 'marcus@adversoft.com',
      role: 'Sales Manager',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      ipAddress: '198.51.100.15',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    action: 'CLIENT_ACCOUNT_CREATED',
    actionLabel: 'Enterprise Client Account Registered',
    entityType: 'CLIENT',
    entityId: 'CLI-1002',
    entityTitle: 'Acme Corporation (CLI-1002)',
    routeLink: '/crm',
    severity: 'INFO',
    description: 'Onboarded Acme Corporation under Enterprise Tier with $150,000 credit limit and Net 30 billing terms.',
    diff: [
      { field: 'accountStatus', label: 'Account Status', oldValue: 'NEW_LEAD', newValue: 'ENTERPRISE_CLIENT' },
      { field: 'creditLimit', label: 'Credit Facility', oldValue: '$0', newValue: '$150,000' },
    ],
    metadata: { industry: 'Consumer Electronics & Hardware', leadSource: 'Direct RFP' },
    hash: 'sha256:6631dda95ff1ba21b92dc18148a1d65dfc2d4b1fa3d677284addd200126c8872',
  },
  {
    id: 'aud_06',
    timestamp: '2026-10-10T11:00:00.000Z',
    actor: {
      id: 'usr_admin',
      name: 'Rachel Adams',
      email: 'rachel@adversoft.com',
      role: 'Admin',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      ipAddress: '198.51.100.32',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    action: 'AUTOMATION_RULE_UPDATED',
    actionLabel: 'Webhook Trigger Automation Updated',
    entityType: 'SYSTEM',
    entityId: 'AUT-002',
    entityTitle: 'Slack Rigging Dispatch Webhook Trigger',
    routeLink: '/notifications',
    severity: 'NOTICE',
    description: 'Updated field technician instant dispatch rule to send high-priority push notifications for Level-1 faults.',
    diff: [
      { field: 'webhookEnabled', label: 'Slack Webhook', oldValue: 'false', newValue: 'true' },
      { field: 'targetChannel', label: 'Notification Channel', oldValue: '#general', newValue: '#ops-urgent-rigging' },
    ],
    metadata: { ruleId: 'rule_rigging_alert' },
    hash: 'sha256:5520eef45ff1ba21b92dc18148a1d65dfc2d4b1fa3d677284addd200126d0014',
  },
  {
    id: 'aud_05',
    timestamp: '2026-10-09T14:12:00.000Z',
    actor: {
      id: 'usr_super',
      name: 'Alex Vance',
      email: 'alex@adversoft.com',
      role: 'Super Admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      ipAddress: '198.51.100.24',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    action: 'PORTAL_INVITATION_SENT',
    actionLabel: 'Client Portal Access Provisioned',
    entityType: 'CLIENT',
    entityId: 'CLI-1003',
    entityTitle: 'Horizon Telecom — Portal Account',
    routeLink: '/portal',
    severity: 'INFO',
    description: 'Provisioned self-service client portal access for David Lin with creative proof approval rights.',
    diff: [
      { field: 'portalAccessEnabled', label: 'Portal Access', oldValue: 'false', newValue: 'true' },
      { field: 'twoFactorRequired', label: '2FA Mandate', oldValue: 'false', newValue: 'true' },
    ],
    metadata: { email: 'david.lin@horizontelecom.com' },
    hash: 'sha256:4419ccb85ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126a7751',
  },
  {
    id: 'aud_04',
    timestamp: '2026-10-08T16:45:00.000Z',
    actor: {
      id: 'usr_ops',
      name: 'Carlos Mendez',
      email: 'carlos@adversoft.com',
      role: 'Operations Manager',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      ipAddress: '198.51.100.104',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    action: 'CREW_ASSIGNMENT_CHANGED',
    actionLabel: 'Field Rigging Crew Re-routed',
    entityType: 'WORK_ORDER',
    entityId: 'WO-2026-002',
    entityTitle: 'Stemmons Freeway Heavy Vinyl Mount',
    routeLink: '/installations',
    severity: 'NOTICE',
    description: 'Reassigned primary rigging crew from Bravo Team to Alpha Rigging Specialists due to high-altitude permit requirement.',
    diff: [
      { field: 'assignedCrew', label: 'Assigned Rigging Crew', oldValue: 'Bravo Team (4 Techs)', newValue: 'Alpha Specialists (Certified Boom)' },
    ],
    metadata: { boomTruckPermit: 'TX-HIGHWAY-8812' },
    hash: 'sha256:3328bbf15ff1ba21b92dc18148a1d65dfc2d4b1fa3d677284addd200126b3341',
  },
  {
    id: 'aud_03',
    timestamp: '2026-10-07T10:30:00.000Z',
    actor: {
      id: 'usr_finance',
      name: 'Elena Rostova',
      email: 'elena@adversoft.com',
      role: 'Finance',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      ipAddress: '198.51.100.88',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    action: 'TAX_RATE_MODIFIED',
    actionLabel: 'Municipal Advertising Surtax Recalculated',
    entityType: 'SYSTEM',
    entityId: 'SYS-TAX-NY',
    entityTitle: 'New York Municipal Outdoor Media Tax',
    routeLink: '/settings',
    severity: 'WARNING',
    description: 'Adjusted metropolitan display excise tax schedule to reflect updated New York State Q4 outdoor media surcharge of 8.875%.',
    diff: [
      { field: 'taxRate', label: 'Excise Tax Rate', oldValue: '8.25%', newValue: '8.875%' },
    ],
    metadata: { effectiveDate: '2026-10-01', legislativeRef: 'NYS-TAX-BULLETIN-26' },
    hash: 'sha256:2217aad95ff1ba21b92dc18148a1d65dfc2d4b1fa3d677284addd200126c2219',
  },
  {
    id: 'aud_02',
    timestamp: '2026-10-06T13:15:00.000Z',
    actor: {
      id: 'usr_admin',
      name: 'Rachel Adams',
      email: 'rachel@adversoft.com',
      role: 'Admin',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      ipAddress: '198.51.100.32',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    action: 'ORGANIZATION_SETTINGS_SAVED',
    actionLabel: 'Company Master Profile Updated',
    entityType: 'SYSTEM',
    entityId: 'ORG-APEX',
    entityTitle: 'Apex Outdoor Media Group Profile',
    routeLink: '/settings',
    severity: 'INFO',
    description: 'Updated official commercial billing address, wire transfer bank instructions, and corporate phone numbers.',
    diff: [
      { field: 'wireBank', label: 'Primary Operating Bank', oldValue: 'Wells Fargo Commercial', newValue: 'JPMorgan Chase NA' },
    ],
    metadata: { updatedBy: 'Rachel Adams' },
    hash: 'sha256:1106bbd85ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d1108',
  },
  {
    id: 'aud_01',
    timestamp: '2026-10-05T09:00:00.000Z',
    actor: {
      id: 'usr_super',
      name: 'Alex Vance',
      email: 'alex@adversoft.com',
      role: 'Super Admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      ipAddress: '198.51.100.24',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    action: 'SYSTEM_GENESIS_INITIALIZED',
    actionLabel: 'Enterprise ERP Workspace Initialized',
    entityType: 'SYSTEM',
    entityId: 'SYS-INIT',
    entityTitle: 'Adversoft Master Database Initialization',
    routeLink: '/architecture',
    severity: 'INFO',
    description: 'Master system bootstrap completed: 18 billboard inventory nodes, role security schemas, and high-availability stores loaded.',
    diff: [
      { field: 'dbState', label: 'Database Cluster', oldValue: 'INITIALIZING', newValue: 'PRODUCTION_READY' },
    ],
    metadata: { version: 'v2.4.0-enterprise', migrationNumber: '0021_audit_search_engine' },
    hash: 'sha256:0005aae75ff1ba21b92dc18148a1d65dfc2d4b1fa3d677284addd200126e0099',
  },
];

const AUDIT_STORAGE_KEY = 'adversoft_audit_logs_v1';

/**
 * Retrieve all audit log entries with localStorage persistence
 */
export function getStoredAuditLogs(tenantId?: string): AuditLogEntry[] {
  if (typeof window === 'undefined') return isDemoTenant(tenantId) ? INITIAL_AUDIT_LOGS : [];
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey(AUDIT_STORAGE_KEY, tid);
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
  } catch (err) {
    console.error('Failed to read audit logs from localStorage:', err);
    return isDemoTenant(tid) ? INITIAL_AUDIT_LOGS : [];
  }
}

/**
 * Persist audit log entries
 */
export function saveStoredAuditLogs(logs: AuditLogEntry[], tenantId?: string): void {
  if (typeof window === 'undefined') return;
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey(AUDIT_STORAGE_KEY, tid);
  try {
    localStorage.setItem(key, JSON.stringify(logs));
    window.dispatchEvent(new CustomEvent('adversoft_audit_logged', { detail: { count: logs.length } }));
  } catch (err) {
    console.error('Failed to save audit logs:', err);
  }
}

/**
 * Append a new immutable audit record to the system trail
 */
export function logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'hash'>): AuditLogEntry {
  const current = getStoredAuditLogs();
  const id = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const timestamp = new Date().toISOString();
  
  // Deterministic simulation hash
  const pseudoPayload = `${id}|${timestamp}|${entry.actor.email}|${entry.action}|${entry.entityId}`;
  let hashVal = 0;
  for (let i = 0; i < pseudoPayload.length; i++) {
    hashVal = ((hashVal << 5) - hashVal) + pseudoPayload.charCodeAt(i);
    hashVal |= 0;
  }
  const hash = `sha256:${Math.abs(hashVal).toString(16).padStart(16, '0')}${Math.abs(hashVal * 31).toString(16).padStart(16, '0')}${Math.abs(hashVal * 17).toString(16).padStart(32, 'a')}`.substring(0, 71);

  const newLog: AuditLogEntry = {
    ...entry,
    id,
    timestamp,
    hash,
  };

  const updated = [newLog, ...current];
  saveStoredAuditLogs(updated);
  return newLog;
}

/**
 * Calculate aggregate audit activity statistics
 */
export function getAuditStats(): AuditStats {
  const logs = getStoredAuditLogs();
  const totalEvents = logs.length;
  const criticalCount = logs.filter((l) => l.severity === 'CRITICAL').length;
  const warningCount = logs.filter((l) => l.severity === 'WARNING').length;
  const noticeCount = logs.filter((l) => l.severity === 'NOTICE').length;
  const infoCount = logs.filter((l) => l.severity === 'INFO').length;

  const uniqueActors = new Set(logs.map((l) => l.actor.email));
  
  const now = new Date().getTime();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const last24hCount = logs.filter((l) => {
    const time = new Date(l.timestamp).getTime();
    return time >= oneDayAgo;
  }).length;

  return {
    totalEvents,
    criticalCount,
    warningCount,
    noticeCount,
    infoCount,
    uniqueActorsCount: uniqueActors.size,
    last24hCount,
  };
}

/**
 * Export compliance audit trail as JSON
 */
export function exportAuditLogsJson(logs: AuditLogEntry[]): string {
  const payload = {
    generatedAt: new Date().toISOString(),
    organization: 'Apex Outdoor Media Group',
    system: 'Adversoft Marketing Management System v2.4',
    complianceStandard: 'SOC-2 / ISO-27001 Access Audit Trail',
    totalEntries: logs.length,
    events: logs,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Export compliance audit trail as CSV
 */
export function exportAuditLogsCsv(logs: AuditLogEntry[]): string {
  const headers = [
    'Log ID',
    'Timestamp (UTC)',
    'Severity',
    'Actor Name',
    'Actor Email',
    'Actor Role',
    'IP Address',
    'Action Code',
    'Action Label',
    'Entity Type',
    'Entity ID',
    'Entity Title',
    'Description',
    'Integrity Hash',
  ];

  const rows = logs.map((l) => [
    `"${l.id}"`,
    `"${l.timestamp}"`,
    `"${l.severity}"`,
    `"${l.actor.name}"`,
    `"${l.actor.email}"`,
    `"${l.actor.role}"`,
    `"${l.actor.ipAddress}"`,
    `"${l.action}"`,
    `"${l.actionLabel.replace(/"/g, '""')}"`,
    `"${l.entityType}"`,
    `"${l.entityId}"`,
    `"${l.entityTitle.replace(/"/g, '""')}"`,
    `"${l.description.replace(/"/g, '""')}"`,
    `"${l.hash}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Global Omni-Search Indexer
 * Searches across Billboards, Campaigns, Clients, Invoices, Contracts, Work Orders, Artwork, and Audit Logs
 */
export function performOmniSearch(query: string, categoryFilter: SearchCategory = 'ALL'): SearchResultItem[] {
  const cleanQ = (query || '').trim().toLowerCase();
  const results: SearchResultItem[] = [];

  // If query is empty, return top featured suggestions
  if (!cleanQ) {
    return [
      {
        id: 'sug_bb1',
        category: 'BILLBOARDS',
        categoryLabel: 'Billboard Inventory',
        title: 'BB-101 — Times Square Spectacle LED',
        subtitle: 'Broadway & 47th St, New York (Times Square Bowtie)',
        badgeText: 'Digital LED',
        badgeColor: 'bg-indigo-50 text-indigo-700',
        route: '/billboards',
      },
      {
        id: 'sug_cmp1',
        category: 'CAMPAIGNS',
        categoryLabel: 'Campaigns',
        title: 'CMP-2026-001 — Sterling Luxe Holiday 2026',
        subtitle: 'Sterling Brands Ltd • Active Flight (Nov - Dec 2026)',
        badgeText: 'Active Flight',
        badgeColor: 'bg-emerald-50 text-emerald-700',
        route: '/campaigns',
      },
      {
        id: 'sug_cli1',
        category: 'CLIENTS',
        categoryLabel: 'CRM Clients',
        title: 'CLI-1001 — Sterling Brands Ltd',
        subtitle: 'Luxury Fashion & Apparel • Enterprise Tier',
        badgeText: 'Enterprise',
        badgeColor: 'bg-purple-50 text-purple-700',
        route: '/crm',
      },
      {
        id: 'sug_inv1',
        category: 'INVOICES',
        categoryLabel: 'Billing Invoices',
        title: 'INV-2026-001 — $49,064.00 (PAID)',
        subtitle: 'Sterling Brands Ltd • Paid via ACH Wire',
        badgeText: 'PAID',
        badgeColor: 'bg-emerald-50 text-emerald-700',
        route: '/invoices',
      },
      {
        id: 'sug_con1',
        category: 'CONTRACTS',
        categoryLabel: 'Contracts',
        title: 'CON-2026-001 — Master Display Agreement',
        subtitle: 'Sterling Brands Ltd • $84,000.00 • Active',
        badgeText: 'ACTIVE',
        badgeColor: 'bg-indigo-50 text-indigo-700',
        route: '/contracts',
      },
    ];
  }

  // 1. Billboards Search
  if (categoryFilter === 'ALL' || categoryFilter === 'BILLBOARDS') {
    const billboards = INITIAL_BILLBOARDS;
    billboards.forEach((b) => {
      const match =
        b.code.toLowerCase().includes(cleanQ) ||
        b.name.toLowerCase().includes(cleanQ) ||
        b.location.city.toLowerCase().includes(cleanQ) ||
        b.location.corridorName.toLowerCase().includes(cleanQ) ||
        b.location.address.toLowerCase().includes(cleanQ) ||
        b.type.toLowerCase().includes(cleanQ);

      if (match) {
        results.push({
          id: `bb_${b.id}`,
          category: 'BILLBOARDS',
          categoryLabel: 'Billboard Inventory',
          title: `${b.code} — ${b.name}`,
          subtitle: `${b.location.address}, ${b.location.city} • ${b.location.corridorName} ($${b.monthlyRate.toLocaleString()}/mo)`,
          badgeText: b.isDigital ? 'Digital LED' : b.type.replace(/_/g, ' '),
          badgeColor: 'bg-indigo-50 text-indigo-700',
          route: '/billboards',
          metadata: { rate: b.monthlyRate, status: b.status },
        });
      }
    });
  }

  // 2. Campaigns Search
  if (categoryFilter === 'ALL' || categoryFilter === 'CAMPAIGNS') {
    const campaigns = getStoredCampaigns();
    campaigns.forEach((c) => {
      const match =
        c.campaignNumber.toLowerCase().includes(cleanQ) ||
        c.name.toLowerCase().includes(cleanQ) ||
        c.clientCompanyName.toLowerCase().includes(cleanQ) ||
        c.status.toLowerCase().includes(cleanQ);

      if (match) {
        results.push({
          id: `cmp_${c.id}`,
          category: 'CAMPAIGNS',
          categoryLabel: 'Campaigns',
          title: `${c.campaignNumber} — ${c.name}`,
          subtitle: `${c.clientCompanyName} • Flight: ${c.flightStartDate} to ${c.flightEndDate} ($${c.totalBudget.toLocaleString()})`,
          badgeText: c.status.replace(/_/g, ' '),
          badgeColor: c.status === 'LIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700',
          route: '/campaigns',
          metadata: { budget: c.totalBudget, status: c.status },
        });
      }
    });
  }

  // 3. Clients Search
  if (categoryFilter === 'ALL' || categoryFilter === 'CLIENTS') {
    const clients = INITIAL_CLIENTS;
    clients.forEach((cli) => {
      const primaryContact = cli.contacts.find((c) => c.isPrimary) || cli.contacts[0];
      const match =
        cli.accountNumber.toLowerCase().includes(cleanQ) ||
        cli.companyName.toLowerCase().includes(cleanQ) ||
        cli.industry.toLowerCase().includes(cleanQ) ||
        (primaryContact && (
          primaryContact.name.toLowerCase().includes(cleanQ) ||
          primaryContact.email.toLowerCase().includes(cleanQ)
        ));

      if (match) {
        results.push({
          id: `cli_${cli.id}`,
          category: 'CLIENTS',
          categoryLabel: 'CRM Clients',
          title: `${cli.accountNumber} — ${cli.companyName}`,
          subtitle: `${cli.industry} • Contact: ${primaryContact?.name || 'Primary'} (${primaryContact?.email || 'N/A'})`,
          badgeText: cli.status,
          badgeColor: 'bg-purple-50 text-purple-700',
          route: '/crm',
          metadata: { spend: cli.totalSpend, status: cli.status },
        });
      }
    });
  }

  // 4. Invoices Search
  if (categoryFilter === 'ALL' || categoryFilter === 'INVOICES') {
    const invoices = getStoredInvoices();
    invoices.forEach((inv) => {
      const match =
        inv.invoiceNumber.toLowerCase().includes(cleanQ) ||
        inv.clientCompanyName.toLowerCase().includes(cleanQ) ||
        inv.status.toLowerCase().includes(cleanQ) ||
        (inv.campaignName && inv.campaignName.toLowerCase().includes(cleanQ));

      if (match) {
        results.push({
          id: `inv_${inv.id}`,
          category: 'INVOICES',
          categoryLabel: 'Billing Invoices',
          title: `${inv.invoiceNumber} — $${inv.totalAmount.toLocaleString()} (${inv.status})`,
          subtitle: `${inv.clientCompanyName} • Due: ${inv.dueDate} (Balance: $${inv.balanceDue.toLocaleString()})`,
          badgeText: inv.status,
          badgeColor: inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
          route: '/invoices',
          metadata: { amount: inv.totalAmount, balance: inv.balanceDue },
        });
      }
    });
  }

  // 5. Contracts Search
  if (categoryFilter === 'ALL' || categoryFilter === 'CONTRACTS') {
    const contracts = getStoredContracts();
    contracts.forEach((con) => {
      const match =
        con.contractNumber.toLowerCase().includes(cleanQ) ||
        con.title.toLowerCase().includes(cleanQ) ||
        con.clientCompanyName.toLowerCase().includes(cleanQ) ||
        con.status.toLowerCase().includes(cleanQ);

      if (match) {
        results.push({
          id: `con_${con.id}`,
          category: 'CONTRACTS',
          categoryLabel: 'Contracts',
          title: `${con.contractNumber} — ${con.title}`,
          subtitle: `${con.clientCompanyName} • Value: $${con.totalContractValue.toLocaleString()} (${con.durationMonths} months)`,
          badgeText: con.status,
          badgeColor: con.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700',
          route: '/contracts',
          metadata: { totalValue: con.totalContractValue, status: con.status },
        });
      }
    });
  }

  // 6. Work Orders Search
  if (categoryFilter === 'ALL' || categoryFilter === 'WORK_ORDERS') {
    const workOrders = getStoredWorkOrders();
    workOrders.forEach((wo) => {
      const leadTech = wo.leadTechnician || wo.crewName || 'Assigned Crew';
      const match =
        wo.workOrderNumber.toLowerCase().includes(cleanQ) ||
        wo.billboardName.toLowerCase().includes(cleanQ) ||
        wo.billboardCode.toLowerCase().includes(cleanQ) ||
        leadTech.toLowerCase().includes(cleanQ) ||
        wo.status.toLowerCase().includes(cleanQ);

      if (match) {
        results.push({
          id: `wo_${wo.id}`,
          category: 'WORK_ORDERS',
          categoryLabel: 'Installations & Work Orders',
          title: `${wo.workOrderNumber} — ${wo.billboardCode} (${wo.type.replace(/_/g, ' ')})`,
          subtitle: `${wo.billboardName} • Lead: ${leadTech} • Target: ${wo.scheduledDate}`,
          badgeText: wo.status.replace(/_/g, ' '),
          badgeColor: 'bg-amber-50 text-amber-700',
          route: '/installations',
          metadata: { type: wo.type, status: wo.status },
        });
      }
    });
  }

  // 7. Artwork Approvals Search
  if (categoryFilter === 'ALL' || categoryFilter === 'ARTWORK') {
    const artworks = getStoredArtworks();
    artworks.forEach((art) => {
      const match =
        art.artworkNumber.toLowerCase().includes(cleanQ) ||
        art.title.toLowerCase().includes(cleanQ) ||
        art.clientCompanyName.toLowerCase().includes(cleanQ) ||
        art.billboardCode.toLowerCase().includes(cleanQ);

      if (match) {
        results.push({
          id: `art_${art.id}`,
          category: 'ARTWORK',
          categoryLabel: 'Artwork & Approvals',
          title: `${art.artworkNumber} — ${art.title}`,
          subtitle: `${art.clientCompanyName} • ${art.billboardCode} • Version ${art.currentVersion}`,
          badgeText: art.status.replace(/_/g, ' '),
          badgeColor: art.status === 'CLIENT_APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700',
          route: '/artwork',
          metadata: { version: art.currentVersion, status: art.status },
        });
      }
    });
  }

  // 8. Audit Logs Search
  if (categoryFilter === 'ALL' || categoryFilter === 'AUDIT') {
    const logs = getStoredAuditLogs();
    logs.forEach((log) => {
      const match =
        log.id.toLowerCase().includes(cleanQ) ||
        log.action.toLowerCase().includes(cleanQ) ||
        log.actionLabel.toLowerCase().includes(cleanQ) ||
        log.actor.name.toLowerCase().includes(cleanQ) ||
        log.entityTitle.toLowerCase().includes(cleanQ) ||
        log.description.toLowerCase().includes(cleanQ);

      if (match) {
        results.push({
          id: `aud_${log.id}`,
          category: 'AUDIT',
          categoryLabel: 'Audit Logs',
          title: `${log.actionLabel} — ${log.entityTitle}`,
          subtitle: `By ${log.actor.name} (${log.actor.role}) on ${new Date(log.timestamp).toLocaleDateString()} • ${log.description.substring(0, 70)}...`,
          badgeText: log.severity,
          badgeColor:
            log.severity === 'CRITICAL'
              ? 'bg-rose-50 text-rose-700'
              : log.severity === 'WARNING'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-gray-100 text-gray-700',
          route: '/audit',
          metadata: { severity: log.severity, hash: log.hash },
        });
      }
    });
  }

  return results.slice(0, 30);
}
