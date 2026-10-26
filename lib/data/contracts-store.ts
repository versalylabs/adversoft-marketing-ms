/**
 * Adversoft Contract Management Data Store & Service Engine
 * Module: Advertising agreements, digital sign-offs, terms, renewal tracking,
 * 30/60/90-day expiration alerts, and direct linkage to bookings, quotations, and clients.
 */

import { INITIAL_BILLBOARDS, BillboardItem } from './billboards-store';
import { INITIAL_CLIENTS, ClientAccount } from './crm-store';
import { getStoredQuotations, QuotationRecord } from './quotations-store';
import { getBookings, updateBookingStatus, BookingRecord } from './bookings-store';
import { getActiveTenantId, isDemoTenant, getTenantStorageKey } from '../tenant';

export type ContractStatus =
  | 'DRAFT'
  | 'PENDING_SIGNATURE'
  | 'ACTIVE'
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'TERMINATED'
  | 'RENEWED';

export type ContractType =
  | 'MASTER_SERVICES_AGREEMENT'
  | 'SINGLE_FLIGHT_IO'
  | 'LONG_TERM_LICENSE'
  | 'MULTI_MARKET_NETWORK';

export type ExpirationAlertTier =
  | 'CRITICAL_30'
  | 'WARNING_60'
  | 'NOTICE_90'
  | 'HEALTHY'
  | 'EXPIRED';

export interface ContractSignature {
  party: 'ADVERSOFT' | 'CLIENT';
  signatoryName: string;
  signatoryTitle: string;
  signatoryEmail: string;
  signedAt?: string;
  signatureImageText?: string;
  ipAddress?: string;
  status: 'PENDING' | 'SIGNED';
}

export interface ContractScheduleItem {
  id: string;
  billboardId: string;
  billboardCode: string;
  billboardName: string;
  billboardCity: string;
  billboardCorridor: string;
  dimensions: string;
  structureType: string;
  isDigital: boolean;
  startDate: string;
  endDate: string;
  durationDays: number;
  monthlyRental: number;
  totalRental: number;
  productionCost: number;
  installationCost: number;
}

export interface ContractRecord {
  id: string;
  contractNumber: string; // e.g. CNT-2026-001
  title: string;
  type: ContractType;
  status: ContractStatus;

  // Connected Entities
  clientId: string;
  clientAccountNumber: string;
  clientCompanyName: string;
  clientBillingAddress: string;
  clientCity: string;
  clientState: string;
  clientZipCode: string;
  clientTaxId?: string;

  bookingId?: string;
  bookingNumber?: string;
  quotationId?: string;
  quotationNumber?: string;
  campaignName: string;

  // Dates & Term Length
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  durationDays: number;
  durationMonths: number;
  daysRemaining: number;
  expirationAlertTier: ExpirationAlertTier;

  // Financials
  totalContractValue: number;
  monthlyBillingAmount: number;
  depositAmount: number;
  paymentTerms: string;
  billingFrequency: 'MONTHLY' | 'UPFRONT' | 'QUARTERLY';

  // Legal & Operational Clauses
  rightOfFirstRefusal: boolean; // ROFR
  cancellationNoticeDays: number;
  illuminationSlaPercent: number; // e.g. 98.5%
  governingLaw: string;
  specialProvisions?: string;

  // Schedules / Billboards
  items: ContractScheduleItem[];

  // Dual Signatures
  adversoftSignature: ContractSignature;
  clientSignature: ContractSignature;

  // Renewal Linkage
  renewedFromContractId?: string;
  renewedFromContractNumber?: string;
  renewedToContractId?: string;
  renewedToContractNumber?: string;

  createdAt: string;
  updatedAt: string;
}

export function computeDaysRemaining(endDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDateStr);
  end.setHours(0, 0, 0, 0);
  const diffTime = end.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function computeAlertTier(daysRemaining: number, status: ContractStatus): ExpirationAlertTier {
  if (status === 'EXPIRED' || daysRemaining <= 0) return 'EXPIRED';
  if (daysRemaining <= 30) return 'CRITICAL_30';
  if (daysRemaining <= 60) return 'WARNING_60';
  if (daysRemaining <= 90) return 'NOTICE_90';
  return 'HEALTHY';
}

export const INITIAL_CONTRACTS: ContractRecord[] = [
  {
    id: 'cnt_1',
    contractNumber: 'CNT-2026-001',
    title: 'Master Outdoor Advertising Agreement — Times Square Spectacle',
    type: 'MASTER_SERVICES_AGREEMENT',
    status: 'ACTIVE',
    clientId: 'cli_1',
    clientAccountNumber: 'CLI-1001',
    clientCompanyName: 'Sterling Brands Ltd',
    clientBillingAddress: '450 Lexington Avenue, Suite 2400',
    clientCity: 'New York',
    clientState: 'NY',
    clientZipCode: '10017',
    clientTaxId: 'US-EIN-12-8924011',
    bookingId: 'bkg_1',
    bookingNumber: 'BKG-2026-001',
    quotationId: 'quo_1',
    quotationNumber: 'QUO-2026-001',
    campaignName: 'Sterling Luxe Holiday 2026',
    startDate: '2026-10-01',
    endDate: '2026-11-15',
    durationDays: 46,
    durationMonths: 1.5,
    daysRemaining: computeDaysRemaining('2026-11-15'),
    expirationAlertTier: computeAlertTier(computeDaysRemaining('2026-11-15'), 'ACTIVE'),
    totalContractValue: 45064,
    monthlyBillingAmount: 28000,
    depositAmount: 22532,
    paymentTerms: '50% upon execution, 50% Net 30 upon flight activation',
    billingFrequency: 'MONTHLY',
    rightOfFirstRefusal: true,
    cancellationNoticeDays: 21,
    illuminationSlaPercent: 99.0,
    governingLaw: 'State of New York',
    specialProvisions: 'Priority dayparting on Times Square Spectacle LED with 4K UHD file delivery verification.',
    items: [
      {
        id: 'citem_1',
        billboardId: 'bb_1',
        billboardCode: 'BB-101',
        billboardName: 'Times Square Spectacle LED',
        billboardCity: 'New York',
        billboardCorridor: 'Times Square Bowtie Plaza',
        dimensions: "48' x 14'",
        structureType: 'DIGITAL_LED',
        isDigital: true,
        startDate: '2026-10-01',
        endDate: '2026-11-15',
        durationDays: 46,
        monthlyRental: 28000,
        totalRental: 42933,
        productionCost: 0,
        installationCost: 350,
      },
    ],
    adversoftSignature: {
      party: 'ADVERSOFT',
      signatoryName: 'Marcus Brody',
      signatoryTitle: 'Senior Vice President of Outdoor Media',
      signatoryEmail: 'mbrody@adversoft.com',
      signedAt: '2026-09-24 16:30',
      signatureImageText: 'Marcus Brody',
      ipAddress: '198.51.100.44',
      status: 'SIGNED',
    },
    clientSignature: {
      party: 'CLIENT',
      signatoryName: 'David Sterling',
      signatoryTitle: 'Chief Executive Officer',
      signatoryEmail: 'david@sterlingbrands.com',
      signedAt: '2026-09-24 15:10',
      signatureImageText: 'David Sterling',
      ipAddress: '12.180.44.102',
      status: 'SIGNED',
    },
    createdAt: '2026-09-24',
    updatedAt: '2026-09-24',
  },
  {
    id: 'cnt_2',
    contractNumber: 'CNT-2026-002',
    title: 'Dual Metro High-Impact Network Agreement — West Coast Corridor',
    type: 'MULTI_MARKET_NETWORK',
    status: 'EXPIRING_SOON',
    clientId: 'cli_2',
    clientAccountNumber: 'CLI-1002',
    clientCompanyName: 'Apex Global Technologies',
    clientBillingAddress: '101 California Street, 38th Floor',
    clientCity: 'San Francisco',
    clientState: 'CA',
    clientZipCode: '94111',
    clientTaxId: 'US-EIN-94-3184920',
    bookingId: 'bkg_2',
    bookingNumber: 'BKG-2026-002',
    quotationId: 'quo_2',
    quotationNumber: 'QUO-2026-014',
    campaignName: 'AI Cloud Platform Q4 Launch',
    startDate: '2026-08-01',
    endDate: '2026-10-31',
    durationDays: 92,
    durationMonths: 3.0,
    daysRemaining: computeDaysRemaining('2026-10-31'),
    expirationAlertTier: computeAlertTier(computeDaysRemaining('2026-10-31'), 'EXPIRING_SOON'),
    totalContractValue: 127933,
    monthlyBillingAmount: 38500,
    depositAmount: 63966,
    paymentTerms: '50% upon contract execution, 50% Net 30 upon verified proof-of-posting',
    billingFrequency: 'MONTHLY',
    rightOfFirstRefusal: true,
    cancellationNoticeDays: 30,
    illuminationSlaPercent: 98.5,
    governingLaw: 'State of California',
    specialProvisions: 'Includes Right of First Refusal for Q1 2027 extension on Sunset Strip Wallscape.',
    items: [
      {
        id: 'citem_2',
        billboardId: 'bb_2',
        billboardCode: 'BB-102',
        billboardName: 'Sunset Strip Iconic Wallscape',
        billboardCity: 'West Hollywood',
        billboardCorridor: 'Sunset Strip / Horn Avenue',
        dimensions: "65' x 35'",
        structureType: 'WALLSCAPE',
        isDigital: false,
        startDate: '2026-08-01',
        endDate: '2026-10-31',
        durationDays: 92,
        monthlyRental: 24000,
        totalRental: 73600,
        productionCost: 3800,
        installationCost: 2200,
      },
      {
        id: 'citem_3',
        billboardId: 'bb_6',
        billboardCode: 'BB-106',
        billboardName: 'Bay Bridge Westbound Header',
        billboardCity: 'San Francisco',
        billboardCorridor: 'I-80 Bay Bridge Approach',
        dimensions: "48' x 14'",
        structureType: 'STATIC_BULLETIN',
        isDigital: false,
        startDate: '2026-08-01',
        endDate: '2026-10-31',
        durationDays: 92,
        monthlyRental: 14500,
        totalRental: 44466,
        productionCost: 1800,
        installationCost: 1200,
      },
    ],
    adversoftSignature: {
      party: 'ADVERSOFT',
      signatoryName: 'Marcus Brody',
      signatoryTitle: 'Senior Vice President of Outdoor Media',
      signatoryEmail: 'mbrody@adversoft.com',
      signedAt: '2026-07-28 11:20',
      signatureImageText: 'Marcus Brody',
      ipAddress: '198.51.100.44',
      status: 'SIGNED',
    },
    clientSignature: {
      party: 'CLIENT',
      signatoryName: 'Elena Rostova',
      signatoryTitle: 'Chief Marketing Officer',
      signatoryEmail: 'elena@apextech.io',
      signedAt: '2026-07-28 10:45',
      signatureImageText: 'Elena Rostova',
      ipAddress: '64.120.91.18',
      status: 'SIGNED',
    },
    createdAt: '2026-07-25',
    updatedAt: '2026-09-20',
  },
  {
    id: 'cnt_3',
    contractNumber: 'CNT-2026-003',
    title: 'Single-Flight Advertising Agreement — Denver Tech Center LED',
    type: 'SINGLE_FLIGHT_IO',
    status: 'PENDING_SIGNATURE',
    clientId: 'cli_3',
    clientAccountNumber: 'CLI-1003',
    clientCompanyName: 'Pure Beverage Co',
    clientBillingAddress: '1801 California Street, Suite 900',
    clientCity: 'Denver',
    clientState: 'CO',
    clientZipCode: '80202',
    clientTaxId: 'US-EIN-84-1928491',
    bookingId: 'bkg_3',
    bookingNumber: 'BKG-2026-003',
    quotationId: 'quo_3',
    quotationNumber: 'QUO-2026-018',
    campaignName: 'Glacier Water Winter Flight',
    startDate: '2026-11-01',
    endDate: '2026-11-30',
    durationDays: 30,
    durationMonths: 1.0,
    daysRemaining: computeDaysRemaining('2026-11-30'),
    expirationAlertTier: computeAlertTier(computeDaysRemaining('2026-11-30'), 'PENDING_SIGNATURE'),
    totalContractValue: 12702,
    monthlyBillingAmount: 11000,
    depositAmount: 6351,
    paymentTerms: '100% due on invoice date (Net 30 terms approved)',
    billingFrequency: 'UPFRONT',
    rightOfFirstRefusal: false,
    cancellationNoticeDays: 14,
    illuminationSlaPercent: 99.5,
    governingLaw: 'State of Colorado',
    specialProvisions: 'Digital creative spot duration: 10 seconds per 60-second loop.',
    items: [
      {
        id: 'citem_4',
        billboardId: 'bb_7',
        billboardCode: 'BB-107',
        billboardName: 'Denver Tech Center Digital Pillar',
        billboardCity: 'Denver',
        billboardCorridor: 'I-25 / Belleview Avenue',
        dimensions: "40' x 12'",
        structureType: 'DIGITAL_LED',
        isDigital: true,
        startDate: '2026-11-01',
        endDate: '2026-11-30',
        durationDays: 30,
        monthlyRental: 11000,
        totalRental: 11000,
        productionCost: 0,
        installationCost: 250,
      },
    ],
    adversoftSignature: {
      party: 'ADVERSOFT',
      signatoryName: 'Marcus Brody',
      signatoryTitle: 'Senior Vice President of Outdoor Media',
      signatoryEmail: 'mbrody@adversoft.com',
      signedAt: '2026-09-26 14:00',
      signatureImageText: 'Marcus Brody',
      ipAddress: '198.51.100.44',
      status: 'SIGNED',
    },
    clientSignature: {
      party: 'CLIENT',
      signatoryName: 'Amanda Thorne',
      signatoryTitle: 'Brand Director',
      signatoryEmail: 'athorne@purebeverage.com',
      status: 'PENDING',
    },
    createdAt: '2026-09-26',
    updatedAt: '2026-09-26',
  },
  {
    id: 'cnt_4',
    contractNumber: 'CNT-2026-004',
    title: 'Long-Term Billboard License Agreement — Stemmons Freeway Spectacular',
    type: 'LONG_TERM_LICENSE',
    status: 'ACTIVE',
    clientId: 'cli_3',
    clientAccountNumber: 'CLI-1003',
    clientCompanyName: 'Pure Beverage Co',
    clientBillingAddress: '1801 California Street, Suite 900',
    clientCity: 'Denver',
    clientState: 'CO',
    clientZipCode: '80202',
    clientTaxId: 'US-EIN-84-1928491',
    bookingId: 'bkg_5',
    bookingNumber: 'BKG-2026-005',
    campaignName: 'Summer Beverage Extension',
    startDate: '2026-07-01',
    endDate: '2026-12-31',
    durationDays: 184,
    durationMonths: 6.0,
    daysRemaining: computeDaysRemaining('2026-12-31'),
    expirationAlertTier: computeAlertTier(computeDaysRemaining('2026-12-31'), 'ACTIVE'),
    totalContractValue: 98400,
    monthlyBillingAmount: 15500,
    depositAmount: 15500,
    paymentTerms: 'Monthly in advance Net 15 days',
    billingFrequency: 'MONTHLY',
    rightOfFirstRefusal: true,
    cancellationNoticeDays: 45,
    illuminationSlaPercent: 99.0,
    governingLaw: 'State of Texas',
    specialProvisions: 'Semi-annual vinyl skin swap included at no additional charge in month 4.',
    items: [
      {
        id: 'citem_5',
        billboardId: 'bb_8',
        billboardCode: 'BB-108',
        billboardName: 'Downtown Dallas I-35 Stemmons Spectacular',
        billboardCity: 'Dallas',
        billboardCorridor: 'Stemmons Freeway / Market Center',
        dimensions: "60' x 20'",
        structureType: 'SPECTACULAR',
        isDigital: false,
        startDate: '2026-07-01',
        endDate: '2026-12-31',
        durationDays: 184,
        monthlyRental: 15500,
        totalRental: 93000,
        productionCost: 2200,
        installationCost: 1400,
      },
    ],
    adversoftSignature: {
      party: 'ADVERSOFT',
      signatoryName: 'Marcus Brody',
      signatoryTitle: 'Senior Vice President of Outdoor Media',
      signatoryEmail: 'mbrody@adversoft.com',
      signedAt: '2026-06-25 15:45',
      signatureImageText: 'Marcus Brody',
      ipAddress: '198.51.100.44',
      status: 'SIGNED',
    },
    clientSignature: {
      party: 'CLIENT',
      signatoryName: 'Amanda Thorne',
      signatoryTitle: 'Brand Director',
      signatoryEmail: 'athorne@purebeverage.com',
      signedAt: '2026-06-25 14:10',
      signatureImageText: 'Amanda Thorne',
      ipAddress: '72.14.201.88',
      status: 'SIGNED',
    },
    createdAt: '2026-06-20',
    updatedAt: '2026-06-25',
  },
  {
    id: 'cnt_5',
    contractNumber: 'CNT-2025-088',
    title: 'Transit Shelter Citywide Network Agreement — Chicago Downtown Loop',
    type: 'MULTI_MARKET_NETWORK',
    status: 'EXPIRED',
    clientId: 'cli_2',
    clientAccountNumber: 'CLI-1002',
    clientCompanyName: 'City Tourism Bureau',
    clientBillingAddress: '100 Municipal Plaza',
    clientCity: 'New York',
    clientState: 'NY',
    clientZipCode: '10007',
    campaignName: 'Summer Arts Festival Promo',
    startDate: '2026-05-01',
    endDate: '2026-08-31',
    durationDays: 123,
    durationMonths: 4.0,
    daysRemaining: -28,
    expirationAlertTier: 'EXPIRED',
    totalContractValue: 34800,
    monthlyBillingAmount: 8700,
    depositAmount: 8700,
    paymentTerms: 'Net 30 days',
    billingFrequency: 'MONTHLY',
    rightOfFirstRefusal: false,
    cancellationNoticeDays: 30,
    illuminationSlaPercent: 98.0,
    governingLaw: 'State of Illinois',
    specialProvisions: 'Flight concluded. Site decommissioned and released to available inventory.',
    items: [
      {
        id: 'citem_6',
        billboardId: 'bb_8',
        billboardCode: 'BB-108',
        billboardName: 'Downtown Loop Transit Shelter Network',
        billboardCity: 'Chicago',
        billboardCorridor: 'Michigan Avenue & Wacker Dr',
        dimensions: "6' x 4'",
        structureType: 'TRANSIT_SHELTER',
        isDigital: false,
        startDate: '2026-05-01',
        endDate: '2026-08-31',
        durationDays: 123,
        monthlyRental: 8700,
        totalRental: 34800,
        productionCost: 1200,
        installationCost: 800,
      },
    ],
    adversoftSignature: {
      party: 'ADVERSOFT',
      signatoryName: 'Marcus Brody',
      signatoryTitle: 'Senior Vice President of Outdoor Media',
      signatoryEmail: 'mbrody@adversoft.com',
      signedAt: '2026-04-20 10:00',
      signatureImageText: 'Marcus Brody',
      ipAddress: '198.51.100.44',
      status: 'SIGNED',
    },
    clientSignature: {
      party: 'CLIENT',
      signatoryName: 'Laura Sanchez',
      signatoryTitle: 'Municipal Director',
      signatoryEmail: 'lsanchez@citytourism.gov',
      signedAt: '2026-04-20 09:30',
      signatureImageText: 'Laura Sanchez',
      ipAddress: '204.10.12.9',
      status: 'SIGNED',
    },
    createdAt: '2026-04-18',
    updatedAt: '2026-08-31',
  },
];

const CONTRACTS_STORAGE_KEY = 'adversoft_contracts';

export function getStoredContracts(tenantId?: string): ContractRecord[] {
  if (typeof window === 'undefined') return isDemoTenant(tenantId) ? INITIAL_CONTRACTS : [];
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey(CONTRACTS_STORAGE_KEY, tid);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (isDemoTenant(tid)) {
        localStorage.setItem(key, JSON.stringify(INITIAL_CONTRACTS));
        return INITIAL_CONTRACTS;
      }
      return [];
    }
    const list: ContractRecord[] = JSON.parse(raw);
    // Recalculate dynamic days remaining and alert tiers
    return list.map((c) => {
      const days = computeDaysRemaining(c.endDate);
      const tier = computeAlertTier(days, c.status);
      let st = c.status;
      if (st === 'ACTIVE' && (tier === 'CRITICAL_30' || tier === 'WARNING_60')) {
        st = 'EXPIRING_SOON';
      }
      return {
        ...c,
        daysRemaining: days,
        expirationAlertTier: tier,
        status: st,
      };
    });
  } catch {
    return isDemoTenant(tid) ? INITIAL_CONTRACTS : [];
  }
}

export function saveStoredContracts(contracts: ContractRecord[], tenantId?: string): void {
  if (typeof window === 'undefined') return;
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey(CONTRACTS_STORAGE_KEY, tid);
  try {
    localStorage.setItem(key, JSON.stringify(contracts));
    window.dispatchEvent(new CustomEvent('adversoft_contracts_updated', { detail: contracts }));
  } catch (err) {
    console.error('Failed to save contracts:', err);
  }
}

export interface CreateContractInput {
  title: string;
  type: ContractType;
  clientId: string;
  bookingId?: string;
  quotationId?: string;
  campaignName: string;
  startDate: string;
  endDate: string;
  totalContractValue: number;
  monthlyBillingAmount: number;
  depositAmount: number;
  paymentTerms?: string;
  billingFrequency?: 'MONTHLY' | 'UPFRONT' | 'QUARTERLY';
  rightOfFirstRefusal?: boolean;
  cancellationNoticeDays?: number;
  illuminationSlaPercent?: number;
  governingLaw?: string;
  specialProvisions?: string;
  items: {
    billboardId: string;
    startDate: string;
    endDate: string;
  }[];
  authorName?: string;
  autoSignAdversoft?: boolean;
}

export function createContract(input: CreateContractInput): {
  success: boolean;
  contract?: ContractRecord;
  error?: string;
} {
  const clients = INITIAL_CLIENTS;
  const client = clients.find((c) => c.id === input.clientId || c.accountNumber === input.clientId);
  if (!client) {
    return { success: false, error: 'Client account not found.' };
  }

  const s = new Date(input.startDate);
  const e = new Date(input.endDate);
  const durationDays = Math.max(7, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
  const durationMonths = Number((durationDays / 30).toFixed(1));
  const daysRemaining = computeDaysRemaining(input.endDate);
  const alertTier = computeAlertTier(daysRemaining, 'PENDING_SIGNATURE');

  const scheduleItems: ContractScheduleItem[] = [];
  for (const itemInput of input.items) {
    const bb = INITIAL_BILLBOARDS.find((b) => b.id === itemInput.billboardId || b.code === itemInput.billboardId);
    if (!bb) continue;

    const is = new Date(itemInput.startDate);
    const ie = new Date(itemInput.endDate);
    const idays = Math.max(7, Math.ceil((ie.getTime() - is.getTime()) / (1000 * 60 * 60 * 24)));
    const totalRent = Math.round((bb.monthlyRate / 30) * idays);

    scheduleItems.push({
      id: `citem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      billboardId: bb.id,
      billboardCode: bb.code,
      billboardName: bb.name,
      billboardCity: bb.location.city,
      billboardCorridor: bb.location.corridorName,
      dimensions: `${bb.widthFeet}' x ${bb.heightFeet}'`,
      structureType: bb.type,
      isDigital: bb.isDigital,
      startDate: itemInput.startDate,
      endDate: itemInput.endDate,
      durationDays: idays,
      monthlyRental: bb.monthlyRate,
      totalRental: totalRent,
      productionCost: bb.productionCost,
      installationCost: bb.installationCost,
    });
  }

  const currentContracts = getStoredContracts();
  const nextNum = 5 + currentContracts.length;
  const contractNumber = `CNT-2026-${String(nextNum).padStart(3, '0')}`;
  const today = new Date().toISOString().split('T')[0];

  const primaryContact = client.contacts?.[0] || {
    name: 'Authorized Decision Maker',
    title: 'Advertising Director',
    email: 'billing@client.com',
    phone: '+1 (555) 000-0000',
  };

  const newContract: ContractRecord = {
    id: `cnt_${Date.now()}`,
    contractNumber,
    title: input.title || `Outdoor Advertising Agreement — ${client.companyName}`,
    type: input.type || 'MASTER_SERVICES_AGREEMENT',
    status: 'PENDING_SIGNATURE',
    clientId: client.id,
    clientAccountNumber: client.accountNumber,
    clientCompanyName: client.companyName,
    clientBillingAddress: client.billingAddress || 'Corporate Headquarters',
    clientCity: client.city || 'New York',
    clientState: client.state || 'NY',
    clientZipCode: client.zipCode || '10001',
    clientTaxId: client.taxId,
    bookingId: input.bookingId,
    quotationId: input.quotationId,
    campaignName: input.campaignName || 'Outdoor Media Campaign',
    startDate: input.startDate,
    endDate: input.endDate,
    durationDays,
    durationMonths,
    daysRemaining,
    expirationAlertTier: alertTier,
    totalContractValue: input.totalContractValue,
    monthlyBillingAmount: input.monthlyBillingAmount,
    depositAmount: input.depositAmount || Math.round(input.totalContractValue * 0.5),
    paymentTerms: input.paymentTerms || '50% upon contract execution, 50% Net 30 upon flight activation',
    billingFrequency: input.billingFrequency || 'MONTHLY',
    rightOfFirstRefusal: input.rightOfFirstRefusal !== undefined ? input.rightOfFirstRefusal : true,
    cancellationNoticeDays: input.cancellationNoticeDays || 30,
    illuminationSlaPercent: input.illuminationSlaPercent || 98.5,
    governingLaw: input.governingLaw || 'State of New York',
    specialProvisions: input.specialProvisions || 'Standard illumination, routine maintenance, and certified proof-of-posting guarantee.',
    items: scheduleItems,
    adversoftSignature: {
      party: 'ADVERSOFT',
      signatoryName: input.authorName || 'Marcus Brody',
      signatoryTitle: 'Senior Vice President of Outdoor Media',
      signatoryEmail: 'mbrody@adversoft.com',
      signedAt: input.autoSignAdversoft ? `${today} 10:00` : undefined,
      signatureImageText: input.autoSignAdversoft ? (input.authorName || 'Marcus Brody') : undefined,
      ipAddress: '198.51.100.44',
      status: input.autoSignAdversoft ? 'SIGNED' : 'PENDING',
    },
    clientSignature: {
      party: 'CLIENT',
      signatoryName: primaryContact.name,
      signatoryTitle: primaryContact.title || 'Authorized Signatory',
      signatoryEmail: primaryContact.email,
      status: 'PENDING',
    },
    createdAt: today,
    updatedAt: today,
  };

  const updated = [newContract, ...currentContracts];
  saveStoredContracts(updated);
  return { success: true, contract: newContract };
}

/**
 * Execute Client Digital Signature
 */
export function signContractByClient(
  contractId: string,
  signerName: string,
  signerTitle: string
): { success: boolean; contract?: ContractRecord; error?: string } {
  const contracts = getStoredContracts();
  const c = contracts.find((item) => item.id === contractId || item.contractNumber === contractId);
  if (!c) return { success: false, error: 'Contract not found.' };

  const now = new Date().toLocaleString();
  c.clientSignature = {
    ...c.clientSignature,
    signatoryName: signerName,
    signatoryTitle: signerTitle,
    signedAt: now,
    signatureImageText: signerName,
    ipAddress: '198.51.100.89',
    status: 'SIGNED',
  };

  // If both parties have signed, set status to ACTIVE
  if (c.adversoftSignature.status === 'SIGNED') {
    c.status = 'ACTIVE';
    // If connected to a booking, confirm it
    if (c.bookingId) {
      updateBookingStatus(c.bookingId, 'ACTIVE', 'System', `Contract ${c.contractNumber} fully executed.`);
    }
  }

  c.updatedAt = new Date().toISOString().split('T')[0];
  saveStoredContracts([...contracts]);
  return { success: true, contract: c };
}

/**
 * Execute Adversoft Countersignature
 */
export function countersignByAdversoft(
  contractId: string,
  officerName: string,
  officerTitle: string
): { success: boolean; contract?: ContractRecord; error?: string } {
  const contracts = getStoredContracts();
  const c = contracts.find((item) => item.id === contractId || item.contractNumber === contractId);
  if (!c) return { success: false, error: 'Contract not found.' };

  const now = new Date().toLocaleString();
  c.adversoftSignature = {
    ...c.adversoftSignature,
    signatoryName: officerName,
    signatoryTitle: officerTitle,
    signedAt: now,
    signatureImageText: officerName,
    ipAddress: '198.51.100.44',
    status: 'SIGNED',
  };

  if (c.clientSignature.status === 'SIGNED') {
    c.status = 'ACTIVE';
    if (c.bookingId) {
      updateBookingStatus(c.bookingId, 'ACTIVE', 'System', `Contract ${c.contractNumber} fully executed.`);
    }
  }

  c.updatedAt = new Date().toISOString().split('T')[0];
  saveStoredContracts([...contracts]);
  return { success: true, contract: c };
}

/**
 * Initiate Contract Renewal Workflow
 * Extends contract dates, locks ROFR, links old contract to new renewal contract
 */
export function renewContract(
  contractId: string,
  newMonthsDuration: number = 3,
  rateEscalationPercent: number = 0
): { success: boolean; newContract?: ContractRecord; error?: string } {
  const contracts = getStoredContracts();
  const prev = contracts.find((item) => item.id === contractId || item.contractNumber === contractId);
  if (!prev) return { success: false, error: 'Contract not found.' };

  // Calculate new start & end date
  const prevEnd = new Date(prev.endDate);
  const newStart = new Date(prevEnd);
  newStart.setDate(prevEnd.getDate() + 1); // starts day after previous end

  const newEnd = new Date(newStart);
  newEnd.setMonth(newStart.getMonth() + newMonthsDuration);

  const startDateStr = newStart.toISOString().split('T')[0];
  const endDateStr = newEnd.toISOString().split('T')[0];

  const durationDays = Math.ceil((newEnd.getTime() - newStart.getTime()) / (1000 * 60 * 60 * 24));
  const rateMultiplier = 1 + rateEscalationPercent / 100;
  const newMonthly = Math.round(prev.monthlyBillingAmount * rateMultiplier);
  const newTotal = Math.round(newMonthly * newMonthsDuration);

  const nextNum = 10 + contracts.length;
  const newContractNumber = `CNT-2027-${String(nextNum).padStart(3, '0')}`;
  const today = new Date().toISOString().split('T')[0];

  const renewalItems: ContractScheduleItem[] = prev.items.map((item) => ({
    ...item,
    id: `citem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    startDate: startDateStr,
    endDate: endDateStr,
    durationDays,
    monthlyRental: Math.round(item.monthlyRental * rateMultiplier),
    totalRental: Math.round(item.monthlyRental * rateMultiplier * newMonthsDuration),
    productionCost: 0, // usually reuse existing skin for renewals
  }));

  const renewedContract: ContractRecord = {
    ...JSON.parse(JSON.stringify(prev)),
    id: `cnt_${Date.now()}`,
    contractNumber: newContractNumber,
    title: `${prev.title} (Renewal Option)`,
    status: 'ACTIVE',
    startDate: startDateStr,
    endDate: endDateStr,
    durationDays,
    durationMonths: newMonthsDuration,
    daysRemaining: computeDaysRemaining(endDateStr),
    expirationAlertTier: computeAlertTier(computeDaysRemaining(endDateStr), 'ACTIVE'),
    monthlyBillingAmount: newMonthly,
    totalContractValue: newTotal,
    depositAmount: 0, // deposit waived for active renewal
    items: renewalItems,
    renewedFromContractId: prev.id,
    renewedFromContractNumber: prev.contractNumber,
    adversoftSignature: {
      ...prev.adversoftSignature,
      signedAt: `${today} 10:00`,
      status: 'SIGNED',
    },
    clientSignature: {
      ...prev.clientSignature,
      signedAt: `${today} 10:05`,
      status: 'SIGNED',
    },
    specialProvisions: `Renewal exercise under Right of First Refusal clause. Escalation rate: ${rateEscalationPercent}%.`,
    createdAt: today,
    updatedAt: today,
  };

  // Update previous contract status
  prev.status = 'RENEWED';
  prev.renewedToContractId = renewedContract.id;
  prev.renewedToContractNumber = renewedContract.contractNumber;
  prev.updatedAt = today;

  const updatedList = [renewedContract, ...contracts];
  saveStoredContracts(updatedList);
  return { success: true, newContract: renewedContract };
}

/**
 * Aggregate Contract Portfolio Metrics & Expiration Alerts
 */
export function getContractMetrics() {
  const contracts = getStoredContracts();
  const total = contracts.length;
  const active = contracts.filter((c) => c.status === 'ACTIVE');
  const pending = contracts.filter((c) => c.status === 'PENDING_SIGNATURE');
  const expiring = contracts.filter((c) => c.status === 'EXPIRING_SOON');
  const expired = contracts.filter((c) => c.status === 'EXPIRED');

  // Expiration Alert Counts
  const critical30 = contracts.filter((c) => c.expirationAlertTier === 'CRITICAL_30').length;
  const warning60 = contracts.filter((c) => c.expirationAlertTier === 'WARNING_60').length;
  const notice90 = contracts.filter((c) => c.expirationAlertTier === 'NOTICE_90').length;

  const totalPortfolioValue = contracts
    .filter((c) => ['ACTIVE', 'EXPIRING_SOON', 'RENEWED'].includes(c.status))
    .reduce((sum, c) => sum + c.totalContractValue, 0);

  const avgTermMonths =
    active.length > 0
      ? Number((active.reduce((acc, c) => acc + c.durationMonths, 0) / active.length).toFixed(1))
      : 3.5;

  return {
    total,
    activeCount: active.length,
    pendingSignatureCount: pending.length,
    expiringSoonCount: expiring.length,
    expiredCount: expired.length,
    critical30Count: critical30,
    warning60Count: warning60,
    notice90Count: notice90,
    totalPortfolioValue,
    avgTermMonths,
  };
}
