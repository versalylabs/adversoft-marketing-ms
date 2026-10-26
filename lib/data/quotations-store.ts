/**
 * Adversoft Quotation System Data Store & Workflow Engine
 * Module: Professional Quotations with billboard rental, printing, installation,
 * artwork design, discounts, taxes, terms, expiry dates, client review, approval workflow,
 * and seamless booking confirmation.
 */

import { INITIAL_BILLBOARDS, BillboardItem } from './billboards-store';
import { INITIAL_CLIENTS, ClientAccount } from './crm-store';
import { createBooking, updateBookingStatus, getBookings, BookingRecord } from './bookings-store';
import { saveStoredLeads, getStoredLeads } from './crm-store';
import { getActiveTenantId, isDemoTenant, getTenantStorageKey } from '../tenant';

export type QuotationStatus =
  | 'DRAFT'
  | 'SENT'
  | 'CLIENT_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED';

export interface QuotationLineItem {
  id: string;
  billboardId: string;
  billboardCode: string;
  billboardName: string;
  billboardCity: string;
  billboardCorridor: string;
  dimensions: string;
  structureType: string;
  isDigital: boolean;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  durationDays: number;
  durationWeeks: number;
  baseMonthlyRate: number;
  rentalAmount: number;
  productionCost: number;
  installationCost: number;
  artworkCost: number;
  itemSubtotal: number;
}

export interface QuotationRecord {
  id: string;
  quotationNumber: string; // e.g. QUO-2026-001
  version: number;
  bookingId?: string;
  bookingNumber?: string;
  leadId?: string;
  leadNumber?: string;

  // Client Details
  clientId: string;
  clientAccountNumber: string;
  clientCompanyName: string;
  clientContactName: string;
  clientEmail: string;
  clientPhone: string;
  billingAddress: string;
  city: string;
  state: string;
  zipCode: string;
  taxId?: string;

  // Campaign Overview
  campaignName: string;
  brandName?: string;

  // Line Items
  items: QuotationLineItem[];

  // Financial Breakdown
  rentalSubtotal: number;
  productionSubtotal: number;
  installationSubtotal: number;
  artworkSubtotal: number;
  grossAmount: number;

  discountType: 'PERCENTAGE' | 'FIXED' | 'NONE';
  discountValue: number;
  discountAmount: number;
  discountReason?: string;

  netAmount: number;
  taxRate: number; // e.g. 0.0825 (8.25%)
  taxAmount: number;
  totalAmount: number;

  // Commercial Terms
  paymentTerms: string;
  validityDays: number;
  issuedDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  termsAndConditions: string[];

  // Status & Workflow
  status: QuotationStatus;
  notes?: string;
  clientFeedback?: string;
  preparedBy: string;
  approvedBy?: string;
  approvedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_TERMS_AND_CONDITIONS = [
  'Space is reserved conditionally upon written quote acceptance or official agency purchase order.',
  '50% deposit required upon confirmation; remaining balance due within Net 30 days of proof-of-posting certification.',
  'Cancellation must be submitted in writing at least 21 days prior to flight start date; otherwise a 25% production fee applies.',
  'Artwork must adhere to Adversoft production specifications and be submitted at least 7 business days prior to flight start.',
  'Rates include standard 24/7 illumination and continuous maintenance telemetry monitoring.',
];

export const INITIAL_QUOTATIONS: QuotationRecord[] = [
  {
    id: 'quo_1',
    quotationNumber: 'QUO-2026-001',
    version: 1,
    bookingId: 'bkg_1',
    bookingNumber: 'BKG-2026-001',
    clientId: 'cli_1',
    clientAccountNumber: 'CLI-1001',
    clientCompanyName: 'Sterling Brands Ltd',
    clientContactName: 'David Sterling',
    clientEmail: 'david@sterlingbrands.com',
    clientPhone: '+1 (212) 555-0142',
    billingAddress: '450 Lexington Avenue, Suite 2400',
    city: 'New York',
    state: 'NY',
    zipCode: '10017',
    taxId: 'US-EIN-12-8924011',
    campaignName: 'Sterling Luxe Holiday 2026',
    brandName: 'Sterling Luxury Goods',
    items: [
      {
        id: 'qitem_1',
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
        durationWeeks: 6.6,
        baseMonthlyRate: 28000,
        rentalAmount: 42933,
        productionCost: 0,
        installationCost: 350,
        artworkCost: 750,
        itemSubtotal: 44033,
      },
    ],
    rentalSubtotal: 42933,
    productionSubtotal: 0,
    installationSubtotal: 350,
    artworkSubtotal: 750,
    grossAmount: 44033,
    discountType: 'PERCENTAGE',
    discountValue: 6,
    discountAmount: 2642,
    discountReason: 'Multi-week holiday prime flight incentive',
    netAmount: 41391,
    taxRate: 0.08875, // NYC Sales Tax
    taxAmount: 3673,
    totalAmount: 45064,
    paymentTerms: '50% upon acceptance, 50% Net 30 upon flight activation',
    validityDays: 14,
    issuedDate: '2026-09-18',
    expiryDate: '2026-10-02',
    termsAndConditions: DEFAULT_TERMS_AND_CONDITIONS,
    status: 'APPROVED',
    notes: 'Premier flagship holiday spot in Times Square. 4K digital screen rotation approved by client executive committee.',
    preparedBy: 'Marcus Brody (Sales Director)',
    approvedBy: 'David Sterling (CEO)',
    approvedAt: '2026-09-24 14:15',
    createdAt: '2026-09-18',
    updatedAt: '2026-09-24',
  },
  {
    id: 'quo_2',
    quotationNumber: 'QUO-2026-014',
    version: 1,
    leadId: 'lead_2',
    leadNumber: 'LEAD-2026-082',
    clientId: 'cli_2',
    clientAccountNumber: 'CLI-1002',
    clientCompanyName: 'Apex Global Technologies',
    clientContactName: 'Elena Rostova',
    clientEmail: 'elena@apextech.io',
    clientPhone: '+1 (415) 555-0198',
    billingAddress: '101 California Street, 38th Floor',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94111',
    taxId: 'US-EIN-94-3184920',
    campaignName: 'AI Cloud Platform Q4 Launch',
    brandName: 'Apex Cloud Nexus',
    items: [
      {
        id: 'qitem_2',
        billboardId: 'bb_2',
        billboardCode: 'BB-102',
        billboardName: 'Sunset Strip Iconic Wallscape',
        billboardCity: 'West Hollywood',
        billboardCorridor: 'Sunset Strip / Horn Avenue',
        dimensions: "65' x 35'",
        structureType: 'WALLSCAPE',
        isDigital: false,
        startDate: '2026-10-15',
        endDate: '2027-01-15',
        durationDays: 92,
        durationWeeks: 13.1,
        baseMonthlyRate: 24000,
        rentalAmount: 73600,
        productionCost: 3800,
        installationCost: 2200,
        artworkCost: 950,
        itemSubtotal: 80550,
      },
      {
        id: 'qitem_3',
        billboardId: 'bb_6',
        billboardCode: 'BB-106',
        billboardName: 'Bay Bridge Westbound Header',
        billboardCity: 'San Francisco',
        billboardCorridor: 'I-80 Bay Bridge Approach',
        dimensions: "48' x 14'",
        structureType: 'STATIC_BULLETIN',
        isDigital: false,
        startDate: '2026-10-15',
        endDate: '2027-01-15',
        durationDays: 92,
        durationWeeks: 13.1,
        baseMonthlyRate: 14500,
        rentalAmount: 44466,
        productionCost: 1800,
        installationCost: 1200,
        artworkCost: 0,
        itemSubtotal: 47466,
      },
    ],
    rentalSubtotal: 118066,
    productionSubtotal: 5600,
    installationSubtotal: 3400,
    artworkSubtotal: 950,
    grossAmount: 128016,
    discountType: 'PERCENTAGE',
    discountValue: 8,
    discountAmount: 10241,
    discountReason: 'Multi-market West Coast package discount (LA + SF)',
    netAmount: 117775,
    taxRate: 0.08625, // CA Tax
    taxAmount: 10158,
    totalAmount: 127933,
    paymentTerms: '50% on contract execution, 50% Net 30 upon verified photo proof-of-posting',
    validityDays: 14,
    issuedDate: '2026-09-22',
    expiryDate: '2026-10-06',
    termsAndConditions: DEFAULT_TERMS_AND_CONDITIONS,
    status: 'CLIENT_REVIEW',
    notes: 'Dual flagship wallscape and bridge header campaign. Proposal delivered to VP Marketing Elena Rostova for board signoff.',
    preparedBy: 'Lucas Vance (Senior Account Manager)',
    createdAt: '2026-09-22',
    updatedAt: '2026-09-25',
  },
  {
    id: 'quo_3',
    quotationNumber: 'QUO-2026-018',
    version: 1,
    bookingId: 'bkg_3',
    bookingNumber: 'BKG-2026-003',
    clientId: 'cli_3',
    clientAccountNumber: 'CLI-1003',
    clientCompanyName: 'Pure Beverage Co',
    clientContactName: 'Amanda Thorne',
    clientEmail: 'athorne@purebeverage.com',
    clientPhone: '+1 (303) 555-0164',
    billingAddress: '1801 California Street, Suite 900',
    city: 'Denver',
    state: 'CO',
    zipCode: '80202',
    taxId: 'US-EIN-84-1928491',
    campaignName: 'Glacier Water Winter Flight',
    brandName: 'Pure Glacier',
    items: [
      {
        id: 'qitem_4',
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
        durationWeeks: 4.3,
        baseMonthlyRate: 11000,
        rentalAmount: 11000,
        productionCost: 0,
        installationCost: 250,
        artworkCost: 500,
        itemSubtotal: 11750,
      },
    ],
    rentalSubtotal: 11000,
    productionSubtotal: 0,
    installationSubtotal: 250,
    artworkSubtotal: 500,
    grossAmount: 11750,
    discountType: 'NONE',
    discountValue: 0,
    discountAmount: 0,
    netAmount: 11750,
    taxRate: 0.081,
    taxAmount: 952,
    totalAmount: 12702,
    paymentTerms: '100% due on invoice date (Net 30 terms approved)',
    validityDays: 14,
    issuedDate: '2026-09-25',
    expiryDate: '2026-10-09',
    termsAndConditions: DEFAULT_TERMS_AND_CONDITIONS,
    status: 'SENT',
    notes: 'Digital LED corridor flight in Denver Tech Center. Includes high-resolution spot scheduling and dynamic dayparting.',
    preparedBy: 'Lucas Vance (Senior Account Manager)',
    createdAt: '2026-09-25',
    updatedAt: '2026-09-25',
  },
  {
    id: 'quo_4',
    quotationNumber: 'QUO-2026-019',
    version: 1,
    clientId: 'cli_1',
    clientAccountNumber: 'CLI-1001',
    clientCompanyName: 'Sterling Brands Ltd',
    clientContactName: 'David Sterling',
    clientEmail: 'david@sterlingbrands.com',
    clientPhone: '+1 (212) 555-0142',
    billingAddress: '450 Lexington Avenue, Suite 2400',
    city: 'New York',
    state: 'NY',
    zipCode: '10017',
    taxId: 'US-EIN-12-8924011',
    campaignName: 'Spring Collection 2027 Preview',
    brandName: 'Sterling Haute Couture',
    items: [
      {
        id: 'qitem_5',
        billboardId: 'bb_4',
        billboardCode: 'BB-104',
        billboardName: 'Biscayne Boulevard Monolith',
        billboardCity: 'Miami',
        billboardCorridor: 'Biscayne Blvd & NE 36th St',
        dimensions: "50' x 15'",
        structureType: 'STATIC_BULLETIN',
        isDigital: false,
        startDate: '2027-02-01',
        endDate: '2027-04-30',
        durationDays: 89,
        durationWeeks: 12.7,
        baseMonthlyRate: 16500,
        rentalAmount: 48950,
        productionCost: 1950,
        installationCost: 1100,
        artworkCost: 0,
        itemSubtotal: 52000,
      },
    ],
    rentalSubtotal: 48950,
    productionSubtotal: 1950,
    installationSubtotal: 1100,
    artworkSubtotal: 0,
    grossAmount: 52000,
    discountType: 'FIXED',
    discountValue: 2000,
    discountAmount: 2000,
    discountReason: 'Loyalty client advance reservation credit',
    netAmount: 50000,
    taxRate: 0.07, // Florida Tax
    taxAmount: 3500,
    totalAmount: 53500,
    paymentTerms: '50% upon reservation, 50% on installation verification',
    validityDays: 21,
    issuedDate: '2026-09-27',
    expiryDate: '2026-10-18',
    termsAndConditions: DEFAULT_TERMS_AND_CONDITIONS,
    status: 'DRAFT',
    notes: 'Draft estimate for Q1 2027 Miami Design District corridor showcase. Pending client creative review.',
    preparedBy: 'Marcus Brody (Sales Director)',
    createdAt: '2026-09-27',
    updatedAt: '2026-09-27',
  },
  {
    id: 'quo_5',
    quotationNumber: 'QUO-2026-009',
    version: 1,
    clientId: 'cli_2',
    clientAccountNumber: 'CLI-1002',
    clientCompanyName: 'City Tourism Bureau',
    clientContactName: 'Laura Sanchez',
    clientEmail: 'lsanchez@citytourism.gov',
    clientPhone: '+1 (212) 555-0191',
    billingAddress: '100 Municipal Plaza',
    city: 'New York',
    state: 'NY',
    zipCode: '10007',
    campaignName: 'Summer Arts Festival Promo',
    items: [
      {
        id: 'qitem_6',
        billboardId: 'bb_8',
        billboardCode: 'BB-108',
        billboardName: 'Downtown Dallas I-35 Stemmons Spectacular',
        billboardCity: 'Dallas',
        billboardCorridor: 'Stemmons Freeway / Market Center',
        dimensions: "60' x 20'",
        structureType: 'SPECTACULAR',
        isDigital: false,
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        durationDays: 30,
        durationWeeks: 4.3,
        baseMonthlyRate: 15500,
        rentalAmount: 15500,
        productionCost: 2200,
        installationCost: 1400,
        artworkCost: 0,
        itemSubtotal: 19100,
      },
    ],
    rentalSubtotal: 15500,
    productionSubtotal: 2200,
    installationSubtotal: 1400,
    artworkSubtotal: 0,
    grossAmount: 19100,
    discountType: 'NONE',
    discountValue: 0,
    discountAmount: 0,
    netAmount: 19100,
    taxRate: 0.0825,
    taxAmount: 1576,
    totalAmount: 20676,
    paymentTerms: 'Net 30 days',
    validityDays: 14,
    issuedDate: '2026-05-10',
    expiryDate: '2026-05-24',
    termsAndConditions: DEFAULT_TERMS_AND_CONDITIONS,
    status: 'EXPIRED',
    notes: 'Municipal RFP deadline elapsed without formal procurement award.',
    preparedBy: 'Lucas Vance (Senior Account Manager)',
    createdAt: '2026-05-10',
    updatedAt: '2026-05-25',
  },
];

const QUOTATIONS_STORAGE_KEY = 'adversoft_quotations';

export function getStoredQuotations(tenantId?: string): QuotationRecord[] {
  if (typeof window === 'undefined') return isDemoTenant(tenantId) ? INITIAL_QUOTATIONS : [];
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey(QUOTATIONS_STORAGE_KEY, tid);
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

export function saveStoredQuotations(quotes: QuotationRecord[], tenantId?: string): void {
  if (typeof window === 'undefined') return;
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey(QUOTATIONS_STORAGE_KEY, tid);
  try {
    localStorage.setItem(key, JSON.stringify(quotes));
    window.dispatchEvent(new CustomEvent('adversoft_quotations_updated', { detail: quotes }));
  } catch (err) {
    console.error('Failed to save quotations:', err);
  }
}

export interface CreateQuotationInput {
  clientId: string;
  campaignName: string;
  brandName?: string;
  bookingId?: string;
  leadId?: string;
  items: {
    billboardId: string;
    startDate: string;
    endDate: string;
    includeProduction?: boolean;
    includeInstallation?: boolean;
    includeArtworkDesign?: boolean;
  }[];
  discountType?: 'PERCENTAGE' | 'FIXED' | 'NONE';
  discountValue?: number;
  discountReason?: string;
  taxRate?: number;
  paymentTerms?: string;
  validityDays?: number;
  notes?: string;
  preparedBy?: string;
  initialStatus?: QuotationStatus;
}

export function createQuotation(input: CreateQuotationInput): {
  success: boolean;
  quotation?: QuotationRecord;
  error?: string;
} {
  const clients = INITIAL_CLIENTS;
  const client = clients.find((c) => c.id === input.clientId || c.accountNumber === input.clientId);
  if (!client) {
    return { success: false, error: 'Client account not found.' };
  }

  if (!input.items || input.items.length === 0) {
    return { success: false, error: 'At least one billboard item is required.' };
  }

  // Build Line Items
  const lineItems: QuotationLineItem[] = [];
  let rentalSubtotal = 0;
  let productionSubtotal = 0;
  let installationSubtotal = 0;
  let artworkSubtotal = 0;

  for (const itemInput of input.items) {
    const billboard = INITIAL_BILLBOARDS.find((b) => b.id === itemInput.billboardId || b.code === itemInput.billboardId);
    if (!billboard) continue;

    const s = new Date(itemInput.startDate);
    const e = new Date(itemInput.endDate);
    const diffDays = Math.max(7, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
    const durationWeeks = Math.ceil(diffDays / 7);

    let rental = 0;
    if (diffDays >= 28) {
      rental = Math.round((billboard.monthlyRate / 30) * diffDays);
    } else {
      rental = Math.round(durationWeeks * billboard.weeklyRate);
    }

    const prod = itemInput.includeProduction ? billboard.productionCost : 0;
    const inst = itemInput.includeInstallation ? billboard.installationCost : 0;
    const art = itemInput.includeArtworkDesign ? 950 : 0;
    const itemSub = rental + prod + inst + art;

    rentalSubtotal += rental;
    productionSubtotal += prod;
    installationSubtotal += inst;
    artworkSubtotal += art;

    lineItems.push({
      id: `qitem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      billboardId: billboard.id,
      billboardCode: billboard.code,
      billboardName: billboard.name,
      billboardCity: billboard.location.city,
      billboardCorridor: billboard.location.corridorName,
      dimensions: `${billboard.widthFeet}' x ${billboard.heightFeet}'`,
      structureType: billboard.type,
      isDigital: billboard.isDigital,
      startDate: itemInput.startDate,
      endDate: itemInput.endDate,
      durationDays: diffDays,
      durationWeeks,
      baseMonthlyRate: billboard.monthlyRate,
      rentalAmount: rental,
      productionCost: prod,
      installationCost: inst,
      artworkCost: art,
      itemSubtotal: itemSub,
    });
  }

  const grossAmount = rentalSubtotal + productionSubtotal + installationSubtotal + artworkSubtotal;

  // Discount calculation
  let discountAmount = 0;
  const discType = input.discountType || 'NONE';
  const discVal = input.discountValue || 0;
  if (discType === 'PERCENTAGE' && discVal > 0) {
    discountAmount = Math.round(grossAmount * (discVal / 100));
  } else if (discType === 'FIXED' && discVal > 0) {
    discountAmount = Math.min(discVal, grossAmount);
  }

  const netAmount = Math.max(0, grossAmount - discountAmount);
  const taxRate = input.taxRate !== undefined ? input.taxRate : 0.0825;
  const taxAmount = Math.round(netAmount * taxRate);
  const totalAmount = netAmount + taxAmount;

  const validity = input.validityDays || 14;
  const today = new Date();
  const exp = new Date(today);
  exp.setDate(today.getDate() + validity);

  const issuedDate = today.toISOString().split('T')[0];
  const expiryDate = exp.toISOString().split('T')[0];

  const currentQuotes = getStoredQuotations();
  const nextNum = 20 + currentQuotes.length;
  const quoteNumber = `QUO-2026-${String(nextNum).padStart(3, '0')}`;

  const primaryContact = client.contacts?.[0] || {
    name: 'Authorized Decision Maker',
    email: 'billing@client.com',
    phone: '+1 (555) 000-0000',
  };

  const newQuote: QuotationRecord = {
    id: `quo_${Date.now()}`,
    quotationNumber: quoteNumber,
    version: 1,
    bookingId: input.bookingId,
    leadId: input.leadId,
    clientId: client.id,
    clientAccountNumber: client.accountNumber,
    clientCompanyName: client.companyName,
    clientContactName: primaryContact.name,
    clientEmail: primaryContact.email,
    clientPhone: primaryContact.phone,
    billingAddress: client.billingAddress || 'Corporate Address',
    city: client.city || 'New York',
    state: client.state || 'NY',
    zipCode: client.zipCode || '10001',
    taxId: client.taxId,
    campaignName: input.campaignName,
    brandName: input.brandName || client.dbaName || client.companyName,
    items: lineItems,
    rentalSubtotal,
    productionSubtotal,
    installationSubtotal,
    artworkSubtotal,
    grossAmount,
    discountType: discType,
    discountValue: discVal,
    discountAmount,
    discountReason: input.discountReason,
    netAmount,
    taxRate,
    taxAmount,
    totalAmount,
    paymentTerms: input.paymentTerms || '50% upon acceptance, 50% Net 30 upon flight activation',
    validityDays: validity,
    issuedDate,
    expiryDate,
    termsAndConditions: DEFAULT_TERMS_AND_CONDITIONS,
    status: input.initialStatus || 'DRAFT',
    notes: input.notes,
    preparedBy: input.preparedBy || 'Sales Executive',
    createdAt: issuedDate,
    updatedAt: issuedDate,
  };

  const updated = [newQuote, ...currentQuotes];
  saveStoredQuotations(updated);

  return { success: true, quotation: newQuote };
}

/**
 * Update Status of a Quotation (Draft -> Sent -> Review -> Approved/Rejected/Expired)
 */
export function updateQuotationStatus(
  id: string,
  newStatus: QuotationStatus,
  options?: { feedback?: string; approvedBy?: string }
): { success: boolean; quotation?: QuotationRecord; error?: string } {
  const quotes = getStoredQuotations();
  const quote = quotes.find((q) => q.id === id || q.quotationNumber === id);
  if (!quote) {
    return { success: false, error: 'Quotation not found.' };
  }

  quote.status = newStatus;
  quote.updatedAt = new Date().toISOString().split('T')[0];

  if (options?.feedback) {
    quote.clientFeedback = options.feedback;
  }

  if (newStatus === 'APPROVED') {
    quote.approvedBy = options?.approvedBy || quote.clientContactName;
    quote.approvedAt = new Date().toLocaleString();
  }

  saveStoredQuotations([...quotes]);
  return { success: true, quotation: quote };
}

/**
 * Approve a Quotation:
 * 1. Sets quotation status to APPROVED
 * 2. Directly confirms any associated booking (sets status to CONFIRMED)
 * 3. Advances any connected CRM lead to 'WON'
 */
export function approveQuotation(
  id: string,
  approvedBy?: string
): {
  success: boolean;
  quotation?: QuotationRecord;
  confirmedBooking?: BookingRecord;
  error?: string;
} {
  const quotes = getStoredQuotations();
  const quote = quotes.find((q) => q.id === id || q.quotationNumber === id);
  if (!quote) {
    return { success: false, error: 'Quotation not found.' };
  }

  quote.status = 'APPROVED';
  quote.approvedBy = approvedBy || quote.clientContactName;
  quote.approvedAt = new Date().toLocaleString();
  quote.updatedAt = new Date().toISOString().split('T')[0];

  // 1. Confirm or create Booking
  let confirmedBooking: BookingRecord | undefined;
  if (quote.bookingId) {
    const bookingRes = updateBookingStatus(
      quote.bookingId,
      'CONFIRMED',
      quote.approvedBy,
      `Approved via Quotation ${quote.quotationNumber}. Signoff: ${quote.approvedBy}.`
    );
    if (bookingRes) {
      confirmedBooking = bookingRes;
    }
  } else if (quote.items.length > 0) {
    // Create new confirmed booking from primary item
    const primaryItem = quote.items[0];
    const newBkg = createBooking({
      clientId: quote.clientId,
      campaignName: quote.campaignName,
      brandName: quote.brandName,
      billboardId: primaryItem.billboardId,
      startDate: primaryItem.startDate,
      endDate: primaryItem.endDate,
      includeProduction: primaryItem.productionCost > 0,
      includeInstallation: primaryItem.installationCost > 0,
      includeArtworkDesign: primaryItem.artworkCost > 0,
      includeProofOfPosting: true,
      authorName: quote.approvedBy,
      notes: `Generated and confirmed directly from accepted Quotation #${quote.quotationNumber}.`,
      initialStatus: 'CONFIRMED',
    });

    if (newBkg.success && newBkg.booking) {
      confirmedBooking = newBkg.booking;
      quote.bookingId = newBkg.booking.id;
      quote.bookingNumber = newBkg.booking.bookingNumber;
    }
  }

  // 2. Advance connected CRM lead if present
  if (quote.leadId || quote.clientCompanyName) {
    const leads = getStoredLeads();
    const targetLead = leads.find(
      (l) => l.id === quote.leadId || l.companyName.toLowerCase() === quote.clientCompanyName.toLowerCase()
    );
    if (targetLead && targetLead.stage !== 'WON') {
      targetLead.stage = 'WON';
      targetLead.notes = `${targetLead.notes}\n[WON via Quotation #${quote.quotationNumber} approval ($${quote.totalAmount.toLocaleString()})]`;
      saveStoredLeads([...leads]);
    }
  }

  saveStoredQuotations([...quotes]);
  return { success: true, quotation: quote, confirmedBooking };
}

/**
 * Create a new revision of an existing quotation (e.g. QUO-2026-001 -> QUO-2026-001-R2)
 */
export function createQuotationRevision(
  id: string,
  author?: string
): { success: boolean; quotation?: QuotationRecord; error?: string } {
  const quotes = getStoredQuotations();
  const source = quotes.find((q) => q.id === id || q.quotationNumber === id);
  if (!source) {
    return { success: false, error: 'Source quotation not found.' };
  }

  const nextVersion = source.version + 1;
  const baseNum = source.quotationNumber.split('-R')[0];
  const revisionNumber = `${baseNum}-R${nextVersion}`;

  const today = new Date().toISOString().split('T')[0];
  const exp = new Date();
  exp.setDate(new Date().getDate() + source.validityDays);

  const revisedQuote: QuotationRecord = {
    ...JSON.parse(JSON.stringify(source)),
    id: `quo_${Date.now()}`,
    quotationNumber: revisionNumber,
    version: nextVersion,
    status: 'DRAFT',
    issuedDate: today,
    expiryDate: exp.toISOString().split('T')[0],
    notes: `Revision ${nextVersion} derived from ${source.quotationNumber}.`,
    preparedBy: author || source.preparedBy,
    approvedBy: undefined,
    approvedAt: undefined,
    clientFeedback: undefined,
    createdAt: today,
    updatedAt: today,
  };

  const updated = [revisedQuote, ...quotes];
  saveStoredQuotations(updated);
  return { success: true, quotation: revisedQuote };
}

/**
 * Aggregate quotation metrics
 */
export function getQuotationMetrics() {
  const quotes = getStoredQuotations();
  const total = quotes.length;
  const approved = quotes.filter((q) => q.status === 'APPROVED');
  const sentOrReview = quotes.filter((q) => q.status === 'SENT' || q.status === 'CLIENT_REVIEW');
  const draft = quotes.filter((q) => q.status === 'DRAFT');
  const expired = quotes.filter((q) => q.status === 'EXPIRED');

  const pipelineValue = sentOrReview.reduce((acc, q) => acc + q.totalAmount, 0);
  const approvedValue = approved.reduce((acc, q) => acc + q.totalAmount, 0);
  const winRate = total > 0 ? Math.round((approved.length / (total - draft.length || 1)) * 100) : 0;

  return {
    total,
    approvedCount: approved.length,
    pendingClientReviewCount: sentOrReview.length,
    draftCount: draft.length,
    expiredCount: expired.length,
    pipelineValue,
    approvedValue,
    winRate: Math.min(100, Math.max(0, winRate)),
  };
}
