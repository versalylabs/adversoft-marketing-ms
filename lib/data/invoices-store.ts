/**
 * Adversoft Invoicing & Payments Data Store & Finance Engine
 * Module: Automated billing, itemized charges, tax calculations, payment gateway / bank transfers,
 * aging balances (Current, 30, 60, 90+ days), and printable receipts.
 */

import { INITIAL_CLIENTS, ClientAccount } from './crm-store';
import { getStoredCampaigns, CampaignRecord } from './campaigns-store';
import { getStoredContracts, ContractRecord } from './contracts-store';
import { getActiveTenantId, isDemoTenant, getTenantStorageKey } from '../tenant';

export type InvoiceStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'VOID';

export type AgingCategory =
  | 'CURRENT'
  | 'OVERDUE_1_30'
  | 'OVERDUE_31_60'
  | 'OVERDUE_61_90'
  | 'OVERDUE_90_PLUS';

export type PaymentMethod =
  | 'WIRE_TRANSFER'
  | 'ACH_DIRECT_DEBIT'
  | 'CREDIT_CARD'
  | 'CORPORATE_CHECK';

export type PaymentStatus =
  | 'COMPLETED'
  | 'PENDING_CLEARANCE'
  | 'FAILED'
  | 'REFUNDED';

export interface InvoiceLineItem {
  id: string;
  description: string;
  category: 'MEDIA_RENTAL' | 'PRINT_PRODUCTION' | 'RIGGING_INSTALLATION' | 'LIGHTING_ELECTRICITY' | 'DISCOUNT';
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface BankRemittanceInfo {
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber: string;
  swiftBic: string;
  remittanceEmail: string;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-001
  clientId: string;
  clientCompanyName: string;
  clientAccountNumber: string;
  clientBillingAddress: string;
  clientCity: string;
  clientState: string;
  clientZipCode: string;
  clientTaxId?: string;
  clientEmail: string;

  // Connected Operations
  campaignId?: string;
  campaignNumber?: string;
  campaignName?: string;
  contractId?: string;
  contractNumber?: string;

  // Dates & Aging
  issueDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD
  daysOverdue: number;
  agingCategory: AgingCategory;
  status: InvoiceStatus;

  // Financial Breakdown
  subtotal: number;
  taxRatePercent: number; // e.g. 8.875
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentTerms: string; // e.g. "Net 30"
  currency: string;

  lineItems: InvoiceLineItem[];
  notes?: string;
  bankRemittance: BankRemittanceInfo;
  paymentIds: string[];

  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  paymentNumber: string; // e.g. PAY-2026-001
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  clientCompanyName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber: string; // e.g. "WIRE-8829-NYC" or "STRIPE_CH_3Kj92"
  status: PaymentStatus;
  receivedBy: string;
  receiptNumber: string; // e.g. "REC-2026-001"
  notes?: string;
  createdAt: string;
}

const DEFAULT_BANK_INFO: BankRemittanceInfo = {
  bankName: 'JPMorgan Chase Commercial Bank N.A.',
  accountName: 'Adversoft Outdoor Media LLC — Operating Account',
  accountNumber: '****-****-8849',
  routingNumber: '021000021',
  swiftBic: 'CHASUS33',
  remittanceEmail: 'billing-remit@adversoft.com',
};

export function computeAging(dueDateStr: string, balanceDue: number, status: InvoiceStatus) {
  if (status === 'PAID' || balanceDue <= 0) {
    return { daysOverdue: 0, agingCategory: 'CURRENT' as AgingCategory, calculatedStatus: 'PAID' as InvoiceStatus };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);

  if (today <= due) {
    return {
      daysOverdue: 0,
      agingCategory: 'CURRENT' as AgingCategory,
      calculatedStatus: status === 'PARTIALLY_PAID' ? 'PARTIALLY_PAID' : ('ISSUED' as InvoiceStatus),
    };
  }

  const diffDays = Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

  let agingCategory: AgingCategory = 'OVERDUE_1_30';
  if (diffDays > 90) agingCategory = 'OVERDUE_90_PLUS';
  else if (diffDays > 60) agingCategory = 'OVERDUE_61_90';
  else if (diffDays > 30) agingCategory = 'OVERDUE_31_60';

  return {
    daysOverdue: diffDays,
    agingCategory,
    calculatedStatus: 'OVERDUE' as InvoiceStatus,
  };
}

export const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay_1',
    paymentNumber: 'PAY-2026-001',
    invoiceId: 'inv_1',
    invoiceNumber: 'INV-2026-001',
    clientId: 'cli_1',
    clientCompanyName: 'Sterling Brands Ltd',
    amount: 49064,
    paymentDate: '2026-09-28 14:30',
    paymentMethod: 'WIRE_TRANSFER',
    referenceNumber: 'FEDWIRE-20260928-892184',
    status: 'COMPLETED',
    receivedBy: 'Marcus Brody (Finance)',
    receiptNumber: 'REC-2026-001',
    notes: 'Full payment received for Times Square Spectacle Holiday flight execution.',
    createdAt: '2026-09-28',
  },
  {
    id: 'pay_2',
    paymentNumber: 'PAY-2026-002',
    invoiceId: 'inv_2',
    invoiceNumber: 'INV-2026-002',
    clientId: 'cli_2',
    clientCompanyName: 'Apex Global Technologies',
    amount: 69563,
    paymentDate: '2026-08-02 11:15',
    paymentMethod: 'ACH_DIRECT_DEBIT',
    referenceNumber: 'ACH-TRACE-99120482',
    status: 'COMPLETED',
    receivedBy: 'Marcus Brody (Finance)',
    receiptNumber: 'REC-2026-002',
    notes: '50% initial contract execution deposit received. Remaining balance Net 30.',
    createdAt: '2026-08-02',
  },
  {
    id: 'pay_3',
    paymentNumber: 'PAY-2026-003',
    invoiceId: 'inv_5',
    invoiceNumber: 'INV-2026-005',
    clientId: 'cli_5',
    clientCompanyName: 'Peak Energy Beverages',
    amount: 88526,
    paymentDate: '2026-06-05 16:20',
    paymentMethod: 'CREDIT_CARD',
    referenceNumber: 'STRIPE_CH_3Nx84Ka9182',
    status: 'COMPLETED',
    receivedBy: 'Stripe Gateway Automated Settler',
    receiptNumber: 'REC-2026-005',
    notes: 'Corporate Amex settled via self-service client portal.',
    createdAt: '2026-06-05',
  },
];

export const INITIAL_INVOICES: InvoiceRecord[] = [
  {
    id: 'inv_1',
    invoiceNumber: 'INV-2026-001',
    clientId: 'cli_1',
    clientCompanyName: 'Sterling Brands Ltd',
    clientAccountNumber: 'CLI-1001',
    clientBillingAddress: '450 Lexington Avenue, Suite 2400',
    clientCity: 'New York',
    clientState: 'NY',
    clientZipCode: '10017',
    clientTaxId: 'US-EIN-12-8924011',
    clientEmail: 'billing@sterlingbrands.com',
    campaignId: 'cmp_1',
    campaignNumber: 'CMP-2026-001',
    campaignName: 'Sterling Luxe Holiday 2026',
    contractId: 'cnt_1',
    contractNumber: 'CNT-2026-001',
    issueDate: '2026-09-24',
    dueDate: '2026-10-01',
    daysOverdue: 0,
    agingCategory: 'CURRENT',
    status: 'PAID',
    subtotal: 45064,
    taxRatePercent: 8.875,
    taxAmount: 4000,
    totalAmount: 49064,
    amountPaid: 49064,
    balanceDue: 0,
    paymentTerms: 'Due Upon Execution',
    currency: 'USD',
    lineItems: [
      {
        id: 'li_101',
        description: 'Times Square Spectacle LED (BB-101) — 46-Day Prime Flight Consideration',
        category: 'MEDIA_RENTAL',
        quantity: 1,
        unitPrice: 42933,
        amount: 42933,
      },
      {
        id: 'li_102',
        description: '4K UHD Digital CMS Ingestion, Dayparting Calibration & Proof Telemetry',
        category: 'RIGGING_INSTALLATION',
        quantity: 1,
        unitPrice: 1781,
        amount: 1781,
      },
      {
        id: 'li_103',
        description: 'Commercial Illumination & Emergency Generator Backup Reserve Surcharge',
        category: 'LIGHTING_ELECTRICITY',
        quantity: 1,
        unitPrice: 350,
        amount: 350,
      },
    ],
    notes: 'Thank you for your business. Certified POP delivery dossier included upon flight completion.',
    bankRemittance: DEFAULT_BANK_INFO,
    paymentIds: ['pay_1'],
    createdAt: '2026-09-24',
    updatedAt: '2026-09-28',
  },
  {
    id: 'inv_2',
    invoiceNumber: 'INV-2026-002',
    clientId: 'cli_2',
    clientCompanyName: 'Apex Global Technologies',
    clientAccountNumber: 'CLI-1002',
    clientBillingAddress: '101 California Street, 38th Floor',
    clientCity: 'San Francisco',
    clientState: 'CA',
    clientZipCode: '94111',
    clientTaxId: 'US-EIN-94-3184920',
    clientEmail: 'ap@apextechnologies.io',
    campaignId: 'cmp_2',
    campaignNumber: 'CMP-2026-002',
    campaignName: 'AI Cloud Platform Q4 Launch',
    contractId: 'cnt_2',
    contractNumber: 'CNT-2026-002',
    issueDate: '2026-07-28',
    dueDate: '2026-10-31',
    daysOverdue: 0,
    agingCategory: 'CURRENT',
    status: 'PARTIALLY_PAID',
    subtotal: 127933,
    taxRatePercent: 8.75,
    taxAmount: 11194,
    totalAmount: 139127,
    amountPaid: 69563,
    balanceDue: 69564,
    paymentTerms: '50% Deposit on Signature, 50% Net 30 Flight End',
    currency: 'USD',
    lineItems: [
      {
        id: 'li_201',
        description: 'Sunset Strip Monolith (BB-102) & SF Wallscape (BB-104) — Q3/Q4 Metro Flight',
        category: 'MEDIA_RENTAL',
        quantity: 1,
        unitPrice: 115500,
        amount: 115500,
      },
      {
        id: 'li_202',
        description: 'Heavyweight Matte 14oz Vinyl + 50x30 Perforated Breathable Mesh Printing',
        category: 'PRINT_PRODUCTION',
        quantity: 1,
        unitPrice: 8200,
        amount: 8200,
      },
      {
        id: 'li_203',
        description: '60ft Boom Crane Rigging & Municipal Highway Encroachment Permits',
        category: 'RIGGING_INSTALLATION',
        quantity: 1,
        unitPrice: 4233,
        amount: 4233,
      },
    ],
    notes: 'Deposit received. Final payment due October 31, 2026.',
    bankRemittance: DEFAULT_BANK_INFO,
    paymentIds: ['pay_2'],
    createdAt: '2026-07-28',
    updatedAt: '2026-08-02',
  },
  {
    id: 'inv_3',
    invoiceNumber: 'INV-2026-003',
    clientId: 'cli_3',
    clientCompanyName: 'Vanguard Automotive Group',
    clientAccountNumber: 'CLI-1003',
    clientBillingAddress: '100 Renaissance Center, Suite 1900',
    clientCity: 'Detroit',
    clientState: 'MI',
    clientZipCode: '48243',
    clientEmail: 'billing@vanguardauto.com',
    campaignId: 'cmp_3',
    campaignNumber: 'CMP-2026-003',
    campaignName: 'EcoDrive Electric SUV Launch',
    contractId: 'cnt_3',
    contractNumber: 'CNT-2026-003',
    issueDate: '2026-10-06',
    dueDate: '2026-11-05',
    daysOverdue: 0,
    agingCategory: 'CURRENT',
    status: 'ISSUED',
    subtotal: 98500,
    taxRatePercent: 8.75,
    taxAmount: 8618,
    totalAmount: 107118,
    amountPaid: 0,
    balanceDue: 107118,
    paymentTerms: 'Net 30',
    currency: 'USD',
    lineItems: [
      {
        id: 'li_301',
        description: 'Kennedy Expressway Cantilever (BB-103) — Q4 Electric SUV Dominance Flight',
        category: 'MEDIA_RENTAL',
        quantity: 1,
        unitPrice: 88500,
        amount: 88500,
      },
      {
        id: 'li_302',
        description: 'Grand Format UV-Inhibited Seamless Vinyl Skin Printing & Chicago Freight',
        category: 'PRINT_PRODUCTION',
        quantity: 1,
        unitPrice: 6500,
        amount: 6500,
      },
      {
        id: 'li_303',
        description: 'Night Highway Rigging & Lane Encroachment Safety Traffic Control',
        category: 'RIGGING_INSTALLATION',
        quantity: 1,
        unitPrice: 3500,
        amount: 3500,
      },
    ],
    notes: 'Invoice generated pursuant to Master Agreement CNT-2026-003.',
    bankRemittance: DEFAULT_BANK_INFO,
    paymentIds: [],
    createdAt: '2026-10-06',
    updatedAt: '2026-10-06',
  },
  {
    id: 'inv_4',
    invoiceNumber: 'INV-2026-004',
    clientId: 'cli_4',
    clientCompanyName: 'Horizon Healthcare Network',
    clientAccountNumber: 'CLI-1004',
    clientBillingAddress: '1200 Brickell Avenue, 14th Floor',
    clientCity: 'Miami',
    clientState: 'FL',
    clientZipCode: '33131',
    clientEmail: 'finance@horizonhealth.org',
    campaignId: 'cmp_4',
    campaignNumber: 'CMP-2026-004',
    campaignName: 'Horizon Health Open Enrollment 2027',
    issueDate: '2026-08-25',
    dueDate: '2026-09-25',
    daysOverdue: 19,
    agingCategory: 'OVERDUE_1_30',
    status: 'OVERDUE',
    subtotal: 42243,
    taxRatePercent: 7.0,
    taxAmount: 2957,
    totalAmount: 45200,
    amountPaid: 0,
    balanceDue: 45200,
    paymentTerms: 'Net 30',
    currency: 'USD',
    lineItems: [
      {
        id: 'li_401',
        description: 'Biscayne Boulevard Gateway Monolith (BB-105) — Digital Slot Reservation',
        category: 'MEDIA_RENTAL',
        quantity: 1,
        unitPrice: 42243,
        amount: 42243,
      },
    ],
    notes: 'Past due notice. Please remit payment immediately to prevent flight pause.',
    bankRemittance: DEFAULT_BANK_INFO,
    paymentIds: [],
    createdAt: '2026-08-25',
    updatedAt: '2026-09-26',
  },
  {
    id: 'inv_5',
    invoiceNumber: 'INV-2026-005',
    clientId: 'cli_5',
    clientCompanyName: 'Peak Energy Beverages',
    clientAccountNumber: 'CLI-1005',
    clientBillingAddress: '789 Broadway, 5th Floor',
    clientCity: 'New York',
    clientState: 'NY',
    clientZipCode: '10003',
    clientEmail: 'billing@peakbeverages.com',
    campaignId: 'cmp_5',
    campaignNumber: 'CMP-2026-005',
    campaignName: 'Peak Energy Summer Metro Blitz',
    issueDate: '2026-05-28',
    dueDate: '2026-06-15',
    daysOverdue: 0,
    agingCategory: 'CURRENT',
    status: 'PAID',
    subtotal: 81309,
    taxRatePercent: 8.875,
    taxAmount: 7217,
    totalAmount: 88526,
    amountPaid: 88526,
    balanceDue: 0,
    paymentTerms: 'Due on Receipt',
    currency: 'USD',
    lineItems: [
      {
        id: 'li_501',
        description: 'Midtown Tunnel Approach (BB-106) — 3-Month Summer Blitz Full Rental',
        category: 'MEDIA_RENTAL',
        quantity: 1,
        unitPrice: 72000,
        amount: 72000,
      },
      {
        id: 'li_502',
        description: 'High-Gloss Heavy Vinyl Bulletin Production (48x14)',
        category: 'PRINT_PRODUCTION',
        quantity: 1,
        unitPrice: 5709,
        amount: 5709,
      },
      {
        id: 'li_503',
        description: 'Boom Crane Installation & End-of-Flight Vinyl Strike / Recycling',
        category: 'RIGGING_INSTALLATION',
        quantity: 1,
        unitPrice: 3600,
        amount: 3600,
      },
    ],
    notes: 'Paid in full via Stripe Card Checkout.',
    bankRemittance: DEFAULT_BANK_INFO,
    paymentIds: ['pay_3'],
    createdAt: '2026-05-28',
    updatedAt: '2026-06-05',
  },
];

const INVOICES_STORAGE_KEY = 'adversoft_invoices_v1';
const PAYMENTS_STORAGE_KEY = 'adversoft_payments_v1';

export function getStoredInvoices(tenantId?: string): InvoiceRecord[] {
  if (typeof window === 'undefined') return isDemoTenant(tenantId) ? INITIAL_INVOICES : [];
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey(INVOICES_STORAGE_KEY, tid);
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      if (isDemoTenant(tid)) {
        localStorage.setItem(key, JSON.stringify(INITIAL_INVOICES));
        return INITIAL_INVOICES;
      }
      return [];
    }
    const parsed: InvoiceRecord[] = JSON.parse(data);
    // Recalculate dynamic aging
    return parsed.map((inv) => {
      const aging = computeAging(inv.dueDate, inv.balanceDue, inv.status);
      return {
        ...inv,
        daysOverdue: aging.daysOverdue,
        agingCategory: aging.agingCategory,
        status: inv.status === 'PAID' ? 'PAID' : aging.calculatedStatus,
      };
    });
  } catch {
    return isDemoTenant(tid) ? INITIAL_INVOICES : [];
  }
}

export function saveStoredInvoices(invoices: InvoiceRecord[], tenantId?: string): void {
  if (typeof window === 'undefined') return;
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey(INVOICES_STORAGE_KEY, tid);
  try {
    localStorage.setItem(key, JSON.stringify(invoices));
    window.dispatchEvent(new CustomEvent('adversoft_invoices_updated', { detail: invoices }));
  } catch (err) {
    console.error('Failed to save invoices:', err);
  }
}

export function getStoredPayments(tenantId?: string): PaymentRecord[] {
  if (typeof window === 'undefined') return isDemoTenant(tenantId) ? INITIAL_PAYMENTS : [];
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey(PAYMENTS_STORAGE_KEY, tid);
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      if (isDemoTenant(tid)) {
        localStorage.setItem(key, JSON.stringify(INITIAL_PAYMENTS));
        return INITIAL_PAYMENTS;
      }
      return [];
    }
    return JSON.parse(data);
  } catch {
    return isDemoTenant(tid) ? INITIAL_PAYMENTS : [];
  }
}

export function saveStoredPayments(payments: PaymentRecord[], tenantId?: string): void {
  if (typeof window === 'undefined') return;
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey(PAYMENTS_STORAGE_KEY, tid);
  try {
    localStorage.setItem(key, JSON.stringify(payments));
    window.dispatchEvent(new CustomEvent('adversoft_payments_updated', { detail: payments }));
  } catch (err) {
    console.error('Failed to save payments:', err);
  }
}

export interface CreateInvoiceInput {
  clientId: string;
  campaignId?: string;
  contractId?: string;
  dueDate: string;
  paymentTerms?: string;
  taxRatePercent?: number;
  lineItems: {
    description: string;
    category: 'MEDIA_RENTAL' | 'PRINT_PRODUCTION' | 'RIGGING_INSTALLATION' | 'LIGHTING_ELECTRICITY' | 'DISCOUNT';
    amount: number;
  }[];
  notes?: string;
}

export function createInvoice(input: CreateInvoiceInput): {
  success: boolean;
  invoice?: InvoiceRecord;
  error?: string;
} {
  const client = INITIAL_CLIENTS.find((c) => c.id === input.clientId || c.accountNumber === input.clientId);
  if (!client) return { success: false, error: 'Client account not found.' };

  const current = getStoredInvoices();
  const invoiceNumber = `INV-2026-${String(current.length + 1).padStart(3, '0')}`;
  const today = new Date().toISOString().split('T')[0];

  const subtotal = input.lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxRate = input.taxRatePercent !== undefined ? input.taxRatePercent : 8.875;
  const taxAmount = Math.round((subtotal * taxRate) / 100);
  const totalAmount = subtotal + taxAmount;

  const campaigns = getStoredCampaigns();
  const camp = campaigns.find((c) => c.id === input.campaignId);

  const contracts = getStoredContracts();
  const cont = contracts.find((c) => c.id === input.contractId);

  const lineItems: InvoiceLineItem[] = input.lineItems.map((item, idx) => ({
    id: `li_${Date.now()}_${idx}`,
    description: item.description,
    category: item.category,
    quantity: 1,
    unitPrice: item.amount,
    amount: item.amount,
  }));

  const aging = computeAging(input.dueDate, totalAmount, 'ISSUED');

  const newInv: InvoiceRecord = {
    id: `inv_${Date.now()}`,
    invoiceNumber,
    clientId: client.id,
    clientCompanyName: client.companyName,
    clientAccountNumber: client.accountNumber,
    clientBillingAddress: client.billingAddress || '100 Corporate Blvd',
    clientCity: client.city || 'New York',
    clientState: client.state || 'NY',
    clientZipCode: client.zipCode || '10001',
    clientTaxId: client.taxId || 'US-EIN-99-0019283',
    clientEmail: client.contacts?.[0]?.email || 'billing@client.com',
    campaignId: camp?.id,
    campaignNumber: camp?.campaignNumber,
    campaignName: camp?.name,
    contractId: cont?.id,
    contractNumber: cont?.contractNumber,
    issueDate: today,
    dueDate: input.dueDate,
    daysOverdue: aging.daysOverdue,
    agingCategory: aging.agingCategory,
    status: 'ISSUED',
    subtotal,
    taxRatePercent: taxRate,
    taxAmount,
    totalAmount,
    amountPaid: 0,
    balanceDue: totalAmount,
    paymentTerms: input.paymentTerms || 'Net 30',
    currency: 'USD',
    lineItems,
    notes: input.notes || 'Payment due pursuant to advertising contract terms.',
    bankRemittance: DEFAULT_BANK_INFO,
    paymentIds: [],
    createdAt: today,
    updatedAt: today,
  };

  const updated = [newInv, ...current];
  saveStoredInvoices(updated);
  return { success: true, invoice: newInv };
}

export interface RecordPaymentInput {
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  notes?: string;
  receivedBy?: string;
}

export function recordPayment(input: RecordPaymentInput): {
  success: boolean;
  payment?: PaymentRecord;
  invoice?: InvoiceRecord;
  error?: string;
} {
  const invoices = getStoredInvoices();
  const inv = invoices.find((i) => i.id === input.invoiceId || i.invoiceNumber === input.invoiceId);
  if (!inv) return { success: false, error: 'Invoice not found.' };

  if (input.amount <= 0) {
    return { success: false, error: 'Payment amount must be greater than zero.' };
  }

  const currentPayments = getStoredPayments();
  const paymentNumber = `PAY-2026-${String(currentPayments.length + 1).padStart(3, '0')}`;
  const receiptNumber = `REC-2026-${String(currentPayments.length + 1).padStart(3, '0')}`;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

  const newPayment: PaymentRecord = {
    id: `pay_${Date.now()}`,
    paymentNumber,
    invoiceId: inv.id,
    invoiceNumber: inv.invoiceNumber,
    clientId: inv.clientId,
    clientCompanyName: inv.clientCompanyName,
    amount: input.amount,
    paymentDate: now,
    paymentMethod: input.paymentMethod,
    referenceNumber: input.referenceNumber || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
    status: 'COMPLETED',
    receivedBy: input.receivedBy || 'Marcus Brody (Finance)',
    receiptNumber,
    notes: input.notes,
    createdAt: new Date().toISOString().split('T')[0],
  };

  // Update invoice balance and status
  inv.amountPaid += input.amount;
  inv.balanceDue = Math.max(0, inv.totalAmount - inv.amountPaid);
  inv.paymentIds.push(newPayment.id);

  if (inv.balanceDue === 0) {
    inv.status = 'PAID';
    inv.daysOverdue = 0;
    inv.agingCategory = 'CURRENT';
  } else {
    inv.status = 'PARTIALLY_PAID';
  }
  inv.updatedAt = new Date().toISOString().split('T')[0];

  const updatedPayments = [newPayment, ...currentPayments];
  saveStoredPayments(updatedPayments);
  saveStoredInvoices([...invoices]);

  return { success: true, payment: newPayment, invoice: inv };
}

export function getFinancialMetrics() {
  const invoices = getStoredInvoices();
  const payments = getStoredPayments();

  const totalBilled = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalCollected = payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalOutstanding = invoices.reduce((sum, i) => sum + i.balanceDue, 0);

  const overdueInvoices = invoices.filter((i) => i.status === 'OVERDUE');
  const overdueAmount = overdueInvoices.reduce((sum, i) => sum + i.balanceDue, 0);

  const agingBuckets = {
    current: invoices
      .filter((i) => i.agingCategory === 'CURRENT' && i.balanceDue > 0)
      .reduce((sum, i) => sum + i.balanceDue, 0),
    days1_30: invoices
      .filter((i) => i.agingCategory === 'OVERDUE_1_30')
      .reduce((sum, i) => sum + i.balanceDue, 0),
    days31_60: invoices
      .filter((i) => i.agingCategory === 'OVERDUE_31_60')
      .reduce((sum, i) => sum + i.balanceDue, 0),
    days61_90: invoices
      .filter((i) => i.agingCategory === 'OVERDUE_61_90')
      .reduce((sum, i) => sum + i.balanceDue, 0),
    days90Plus: invoices
      .filter((i) => i.agingCategory === 'OVERDUE_90_PLUS')
      .reduce((sum, i) => sum + i.balanceDue, 0),
  };

  return {
    totalBilled,
    totalCollected,
    totalOutstanding,
    overdueAmount,
    overdueCount: overdueInvoices.length,
    agingBuckets,
    collectionEfficiencyPercent: totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 94,
    avgCollectionDays: 21.4,
  };
}
