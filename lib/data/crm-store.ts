/**
 * Adversoft CRM Data Store & Services
 * Module: CRM / Client Management
 */

import { getActiveTenantId, isDemoTenant, getTenantStorageKey } from '../tenant';

export interface ClientContact {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  isBilling: boolean;
  portalAccess: boolean;
}

export interface ClientNote {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  category: 'Call' | 'Meeting' | 'Proposal' | 'General';
}

export interface ClientDoc {
  id: string;
  title: string;
  category: 'MSA' | 'Credit App' | 'Brand Guidelines' | 'Brief';
  fileSize: string;
  uploadedAt: string;
}

export interface ClientAccount {
  id: string;
  accountNumber: string; // e.g. CLI-1001
  companyName: string;
  dbaName?: string;
  industry: string;
  status: 'ACTIVE' | 'PROSPECT' | 'LEAD' | 'INACTIVE';
  billingAddress: string;
  city: string;
  state: string;
  zipCode: string;
  website: string;
  taxId: string;
  creditLimit: number;
  totalSpend: number;
  activeCampaignsCount: number;
  activeBookingsCount: number;
  contacts: ClientContact[];
  notes: ClientNote[];
  documents: ClientDoc[];
  createdAt: string;
}

export type LeadSource = 'WEBSITE' | 'MARKETPLACE' | 'INBOUND_CALL' | 'REFERRAL' | 'OUTBOUND_SALES';
export type LeadStage = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL_SENT' | 'NEGOTIATING' | 'WON' | 'LOST';

export interface SalesLead {
  id: string;
  leadNumber: string; // e.g. LEAD-2026-042
  title: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  source: LeadSource;
  stage: LeadStage;
  estimatedValue: number;
  targetFlightStart: string;
  targetFlightEnd: string;
  preferredLocations: string;
  assignedRep: string;
  notes: string;
  createdAt: string;
}

export const INITIAL_CLIENTS: ClientAccount[] = [
  {
    id: 'cli_1',
    accountNumber: 'CLI-1001',
    companyName: 'Sterling Brands Ltd',
    dbaName: 'Sterling Luxury Goods',
    industry: 'Luxury Fashion & Apparel',
    status: 'ACTIVE',
    billingAddress: '450 Lexington Avenue, Suite 2400',
    city: 'New York',
    state: 'NY',
    zipCode: '10017',
    website: 'https://sterlingbrands.com',
    taxId: 'US-EIN-12-8924011',
    creditLimit: 200000,
    totalSpend: 84200,
    activeCampaignsCount: 1,
    activeBookingsCount: 1,
    createdAt: 'Jan 10, 2026',
    contacts: [
      {
        id: 'con_1',
        name: 'David Sterling',
        title: 'Vice President of Brand Marketing',
        email: 'david@sterlingbrands.com',
        phone: '+1 (212) 555-0142',
        isPrimary: true,
        isBilling: false,
        portalAccess: true,
      },
      {
        id: 'con_2',
        name: 'Clara Oswald',
        title: 'Accounts Payable Director',
        email: 'billing@sterlingbrands.com',
        phone: '+1 (212) 555-0188',
        isPrimary: false,
        isBilling: true,
        portalAccess: true,
      },
    ],
    notes: [
      {
        id: 'n_1',
        author: 'Marcus Brody',
        category: 'Meeting',
        content: 'Reviewed Q4 holiday high-impact billboard slots in Times Square. Client approved 4K video creative spec.',
        createdAt: 'Sep 22, 2026',
      },
      {
        id: 'n_2',
        author: 'Lucas Vance',
        category: 'Call',
        content: 'Discussed potential renewal for Q1 2027 with 5% multi-site discount.',
        createdAt: 'Sep 10, 2026',
      },
    ],
    documents: [
      { id: 'd_1', title: 'Sterling Master Service Agreement 2026.pdf', category: 'MSA', fileSize: '2.4 MB', uploadedAt: 'Jan 15, 2026' },
      { id: 'd_2', title: 'Sterling Luxe Brand Guidelines V4.pdf', category: 'Brand Guidelines', fileSize: '14.8 MB', uploadedAt: 'Feb 02, 2026' },
    ],
  },
  {
    id: 'cli_2',
    accountNumber: 'CLI-1002',
    companyName: 'Acme Corporation',
    dbaName: 'Acme Mobile Technologies',
    industry: 'Consumer Electronics & Hardware',
    status: 'ACTIVE',
    billingAddress: '100 Technology Drive',
    city: 'San Jose',
    state: 'CA',
    zipCode: '95110',
    website: 'https://acmecorp.com',
    taxId: 'US-EIN-94-2309112',
    creditLimit: 300000,
    totalSpend: 194500,
    activeCampaignsCount: 1,
    activeBookingsCount: 1,
    createdAt: 'Feb 04, 2026',
    contacts: [
      {
        id: 'con_3',
        name: 'Sarah Jenkins',
        title: 'Chief Marketing Officer',
        email: 's.jenkins@acmecorp.com',
        phone: '+1 (408) 555-0199',
        isPrimary: true,
        isBilling: false,
        portalAccess: true,
      },
      {
        id: 'con_4',
        name: 'Robert Vance',
        title: 'Procurement Specialist',
        email: 'rvance@acmecorp.com',
        phone: '+1 (408) 555-0155',
        isPrimary: false,
        isBilling: true,
        portalAccess: false,
      },
    ],
    notes: [
      {
        id: 'n_3',
        author: 'Marcus Brody',
        category: 'Proposal',
        content: 'Sent revised quotation for I-95 North corridor launch. Confirmed 4-week vinyl mounting schedule.',
        createdAt: 'Sep 12, 2026',
      },
    ],
    documents: [
      { id: 'd_3', title: 'Acme Corp Corporate MSA.pdf', category: 'MSA', fileSize: '1.9 MB', uploadedAt: 'Feb 10, 2026' },
      { id: 'd_4', title: 'NextGen Phone Artwork Specs.pdf', category: 'Brief', fileSize: '4.2 MB', uploadedAt: 'Aug 28, 2026' },
    ],
  },
  {
    id: 'cli_3',
    accountNumber: 'CLI-1003',
    companyName: 'Horizon Telecom',
    dbaName: 'Horizon 5G Wireless',
    industry: 'Telecommunications & Infrastructure',
    status: 'ACTIVE',
    billingAddress: '1200 Telecom Way',
    city: 'Dallas',
    state: 'TX',
    zipCode: '75201',
    website: 'https://horizontelecom.com',
    taxId: 'US-EIN-75-8120033',
    creditLimit: 350000,
    totalSpend: 112000,
    activeCampaignsCount: 1,
    activeBookingsCount: 1,
    createdAt: 'Mar 15, 2026',
    contacts: [
      {
        id: 'con_5',
        name: 'Michael Chang',
        title: 'VP Media Buying',
        email: 'mchang@horizontelecom.com',
        phone: '+1 (214) 555-0112',
        isPrimary: true,
        isBilling: true,
        portalAccess: true,
      },
    ],
    notes: [
      {
        id: 'n_4',
        author: 'Lucas Vance',
        category: 'Call',
        content: 'Confirmed Sunset Strip Wallscape creative submission. Client requested proof-of-posting certificate upon installation.',
        createdAt: 'Sep 18, 2026',
      },
    ],
    documents: [
      { id: 'd_5', title: 'Horizon Master Agreement 2026.pdf', category: 'MSA', fileSize: '3.1 MB', uploadedAt: 'Mar 20, 2026' },
    ],
  },
  {
    id: 'cli_4',
    accountNumber: 'CLI-1004',
    companyName: 'Pure Beverage Co',
    dbaName: 'PureWater Natural Springs',
    industry: 'Food & Beverage',
    status: 'PROSPECT',
    billingAddress: '550 Spring Valley Road',
    city: 'Denver',
    state: 'CO',
    zipCode: '80202',
    website: 'https://purebeverage.com',
    taxId: 'US-EIN-84-1109923',
    creditLimit: 100000,
    totalSpend: 32000,
    activeCampaignsCount: 0,
    activeBookingsCount: 0,
    createdAt: 'Apr 20, 2026',
    contacts: [
      {
        id: 'con_6',
        name: 'Amanda Thorne',
        title: 'Brand Activation Manager',
        email: 'athorne@purebeverage.com',
        phone: '+1 (303) 555-0164',
        isPrimary: true,
        isBilling: true,
        portalAccess: true,
      },
    ],
    notes: [
      {
        id: 'n_5',
        author: 'Lucas Vance',
        category: 'Proposal',
        content: 'Submitted proposal for 3 highway bulletins along I-25 corridor for Summer Wave push.',
        createdAt: 'Jul 14, 2026',
      },
    ],
    documents: [
      { id: 'd_6', title: 'Credit Application Form.pdf', category: 'Credit App', fileSize: '850 KB', uploadedAt: 'Apr 25, 2026' },
    ],
  },
  {
    id: 'cli_5',
    accountNumber: 'CLI-1005',
    companyName: 'Apex Health Systems',
    dbaName: 'Apex Regional Medical Center',
    industry: 'Healthcare & Regional Clinics',
    status: 'LEAD',
    billingAddress: '88 Medical Center Blvd',
    city: 'Miami',
    state: 'FL',
    zipCode: '33136',
    website: 'https://apexhealth.org',
    taxId: 'US-EIN-59-9941122',
    creditLimit: 50000,
    totalSpend: 0,
    activeCampaignsCount: 0,
    activeBookingsCount: 0,
    createdAt: 'Aug 10, 2026',
    contacts: [
      {
        id: 'con_7',
        name: 'Dr. Evelyn Reed',
        title: 'Director of Community Outreach',
        email: 'ereed@apexhealth.org',
        phone: '+1 (305) 555-0177',
        isPrimary: true,
        isBilling: false,
        portalAccess: false,
      },
    ],
    notes: [
      {
        id: 'n_6',
        author: 'Marcus Brody',
        category: 'Meeting',
        content: 'Met at Healthcare Marketing Expo. Interested in South Beach corridor coverage for new clinic opening in Q1 2027.',
        createdAt: 'Aug 14, 2026',
      },
    ],
    documents: [],
  },
];

export const INITIAL_LEADS: SalesLead[] = [
  {
    id: 'lead_1',
    leadNumber: 'LEAD-2026-081',
    title: 'Downtown Digital Billboard Package',
    companyName: 'Apex Health Systems',
    contactName: 'Dr. Evelyn Reed',
    contactEmail: 'ereed@apexhealth.org',
    contactPhone: '+1 (305) 555-0177',
    source: 'WEBSITE',
    stage: 'QUALIFIED',
    estimatedValue: 48000,
    targetFlightStart: '2026-11-01',
    targetFlightEnd: '2027-01-31',
    preferredLocations: 'South Beach Tourist Corridor / I-95 South',
    assignedRep: 'Marcus Brody',
    notes: 'Clinic expansion announcement. Needs high-frequency impressions.',
    createdAt: 'Sep 15, 2026',
  },
  {
    id: 'lead_2',
    leadNumber: 'LEAD-2026-082',
    title: 'Electric SUV Regional Launch Flight',
    companyName: 'Veloce Automotive Inc',
    contactName: 'Marco Bellini',
    contactEmail: 'mbellini@veloceauto.com',
    contactPhone: '+1 (313) 555-0129',
    source: 'MARKETPLACE',
    stage: 'PROPOSAL_SENT',
    estimatedValue: 125000,
    targetFlightStart: '2026-10-15',
    targetFlightEnd: '2027-01-15',
    preferredLocations: 'Highway 101, Times Square LED, Sunset Strip',
    assignedRep: 'Marcus Brody',
    notes: 'Looking for 3 flagship premium digital and static bulletins. Quote #QUO-2026-014 submitted.',
    createdAt: 'Sep 18, 2026',
  },
  {
    id: 'lead_3',
    leadNumber: 'LEAD-2026-083',
    title: 'Seasonal Winter Festival Campaign',
    companyName: 'City Tourism Bureau',
    contactName: 'Laura Sanchez',
    contactEmail: 'lsanchez@citytourism.gov',
    contactPhone: '+1 (212) 555-0191',
    source: 'INBOUND_CALL',
    stage: 'CONTACTED',
    estimatedValue: 36000,
    targetFlightStart: '2026-11-15',
    targetFlightEnd: '2027-01-05',
    preferredLocations: 'Midtown Commuter Crossings',
    assignedRep: 'Lucas Vance',
    notes: 'City funded holiday event. RFP due by end of month.',
    createdAt: 'Sep 21, 2026',
  },
  {
    id: 'lead_4',
    leadNumber: 'LEAD-2026-084',
    title: 'Streaming App Q4 Blitz',
    companyName: 'StreamWave Entertainment',
    contactName: 'Jason Todd',
    contactEmail: 'jtodd@streamwave.tv',
    contactPhone: '+1 (310) 555-0182',
    source: 'REFERRAL',
    stage: 'NEW',
    estimatedValue: 72000,
    targetFlightStart: '2026-10-01',
    targetFlightEnd: '2026-12-31',
    preferredLocations: 'Sunset Strip Wallscape, Metro Unipoles',
    assignedRep: 'Lucas Vance',
    notes: 'Inbound referral from Sterling Brands. Needs rapid quotation.',
    createdAt: 'Sep 24, 2026',
  },
  {
    id: 'lead_5',
    leadNumber: 'LEAD-2026-085',
    title: 'Summer Beverage Extension',
    companyName: 'Pure Beverage Co',
    contactName: 'Amanda Thorne',
    contactEmail: 'athorne@purebeverage.com',
    contactPhone: '+1 (303) 555-0164',
    source: 'OUTBOUND_SALES',
    stage: 'WON',
    estimatedValue: 32000,
    targetFlightStart: '2026-07-01',
    targetFlightEnd: '2026-09-30',
    preferredLocations: 'I-25 Arterial Bulletins',
    assignedRep: 'Lucas Vance',
    notes: 'Won and converted into active booking and contract #CNT-2026-004.',
    createdAt: 'Jun 28, 2026',
  },
];

export const CRM_LEADS_STORAGE_KEY = 'adversoft_crm_leads';

export function getStoredLeads(tenantId?: string): SalesLead[] {
  if (typeof window === 'undefined') return isDemoTenant(tenantId) ? INITIAL_LEADS : [];
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey(CRM_LEADS_STORAGE_KEY, tid);
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

export function saveStoredLeads(leads: SalesLead[], tenantId?: string): void {
  if (typeof window === 'undefined') return;
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey(CRM_LEADS_STORAGE_KEY, tid);
  try {
    localStorage.setItem(key, JSON.stringify(leads));
    window.dispatchEvent(new CustomEvent('adversoft_crm_leads_updated', { detail: leads }));
  } catch (err) {
    console.error('Failed to save CRM leads:', err);
  }
}

export function addMarketplaceLead(params: {
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  billboardName: string;
  billboardCode: string;
  startDate: string;
  endDate: string;
  estimatedValue: number;
  notes?: string;
  preferredLocations?: string;
}): SalesLead {
  const currentLeads = getStoredLeads();
  const nextNum = 86 + currentLeads.length;
  const newLead: SalesLead = {
    id: `lead_mkt_${Date.now()}`,
    leadNumber: `LEAD-2026-${String(nextNum).padStart(3, '0')}`,
    title: `Marketplace Request: ${params.billboardCode} - ${params.companyName}`,
    companyName: params.companyName,
    contactName: params.contactName,
    contactEmail: params.contactEmail,
    contactPhone: params.contactPhone,
    source: 'MARKETPLACE',
    stage: 'NEW',
    estimatedValue: params.estimatedValue,
    targetFlightStart: params.startDate,
    targetFlightEnd: params.endDate,
    preferredLocations: params.preferredLocations || `${params.billboardCode} (${params.billboardName})`,
    assignedRep: 'Marcus Brody',
    notes: params.notes || `Inbound booking request from Adversoft Public Marketplace for ${params.billboardName}.`,
    createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  };

  const updated = [newLead, ...currentLeads];
  saveStoredLeads(updated);
  return newLead;
}

