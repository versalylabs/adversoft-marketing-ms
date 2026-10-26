/**
 * Adversoft Booking System Data Store
 * Module: Full booking lifecycle (Draft -> Pending -> Reserved -> Confirmed -> Active -> Completed / Cancelled / Expired),
 * guided workflow: Select Client -> Select Billboard -> Select Dates -> Check Availability -> Calculate Price -> Create Booking,
 * booking extensions, cancellations, renewals, and collision prevention.
 */

import { INITIAL_BILLBOARDS, BillboardItem } from './billboards-store';
import { INITIAL_CLIENTS, ClientAccount } from './crm-store';
import {
  calculateFlightPrice,
  checkScheduleConflict,
  createFlightHold,
  removeFlightSchedule,
  PriceCalculationResult,
} from './pricing-store';

export type BookingStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'RESERVED'
  | 'CONFIRMED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface BookingAuditEvent {
  id: string;
  action: string;
  author: string;
  timestamp: string;
  details: string;
}

export interface BookingRecord {
  id: string;
  bookingNumber: string; // e.g. BKG-2026-001
  clientId: string;
  clientName: string;
  clientEmail?: string;
  campaignName: string;
  brandName?: string;

  // Billboard Details
  billboardId: string;
  billboardCode: string;
  billboardName: string;
  billboardCity: string;
  billboardCorridor: string;
  billboardType: string;
  billboardThumbnail: string;

  // Dates & Duration
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  durationDays: number;
  durationWeeks: number;

  // Financial Breakdown
  status: BookingStatus;
  baseAmount: number;
  seasonalSurgeAmount: number;
  discountAmount: number;
  productionCost: number;
  installationCost: number;
  creativeCost: number;
  taxAmount: number;
  totalAmount: number;

  // Operational Specs
  includeProduction: boolean;
  includeInstallation: boolean;
  includeArtworkDesign: boolean;
  includeProofOfPosting: boolean;

  // Lifecycle
  holdExpiresAt?: string;
  cancellationReason?: string;
  renewedFromBookingId?: string;
  renewedToBookingId?: string;

  notes: string;
  history: BookingAuditEvent[];
  createdAt: string;
  updatedAt: string;
}

export const INITIAL_BOOKINGS: BookingRecord[] = [
  {
    id: 'bkg_1',
    bookingNumber: 'BKG-2026-001',
    clientId: 'cli_1',
    clientName: 'Sterling Brands Ltd',
    clientEmail: 'david@sterlingbrands.com',
    campaignName: 'Sterling Luxe Holiday 2026',
    brandName: 'Sterling Luxury Goods',
    billboardId: 'bb_1',
    billboardCode: 'BB-101',
    billboardName: 'Times Square Spectacle LED',
    billboardCity: 'New York',
    billboardCorridor: 'Times Square Bowtie Plaza',
    billboardType: 'DIGITAL_LED',
    billboardThumbnail: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop&q=80',
    startDate: '2026-10-01',
    endDate: '2026-11-15',
    durationDays: 46,
    durationWeeks: 6.6,
    status: 'ACTIVE',
    baseAmount: 42933,
    seasonalSurgeAmount: 8587,
    discountAmount: 2576,
    productionCost: 0,
    installationCost: 350,
    creativeCost: 750,
    taxAmount: 4129,
    totalAmount: 54173,
    includeProduction: false,
    includeInstallation: true,
    includeArtworkDesign: true,
    includeProofOfPosting: true,
    notes: 'Premier flagship holiday spot in Times Square. 4K digital screen rotation.',
    history: [
      {
        id: 'aud_1',
        action: 'Flight Activated',
        author: 'System Auto-Scheduler',
        timestamp: 'Oct 01, 2026 00:00',
        details: 'Flight entered active display cycle.',
      },
      {
        id: 'aud_2',
        action: 'Booking Confirmed',
        author: 'Marcus Brody (Sales Director)',
        timestamp: 'Sep 24, 2026 14:15',
        details: 'Signed master contract CNT-2026-001 and approved proof voucher.',
      },
      {
        id: 'aud_3',
        action: 'Booking Created',
        author: 'Marcus Brody',
        timestamp: 'Sep 18, 2026 10:30',
        details: 'Initial booking draft established from quote #QUO-2026-008.',
      },
    ],
    createdAt: '2026-09-18',
    updatedAt: '2026-10-01',
  },
  {
    id: 'bkg_2',
    bookingNumber: 'BKG-2026-002',
    clientId: 'cli_2',
    clientName: 'Acme Corporation',
    clientEmail: 's.jenkins@acmecorp.com',
    campaignName: 'Acme Mobile 5G Nationwide',
    brandName: 'Acme Mobile Technologies',
    billboardId: 'bb_2',
    billboardCode: 'BB-102',
    billboardName: 'I-95 Northbound Highway Unipole',
    billboardCity: 'Stamford',
    billboardCorridor: 'I-95 Gold Coast Arterial',
    billboardType: 'STATIC_BULLETIN',
    billboardThumbnail: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop&q=80',
    startDate: '2026-09-15',
    endDate: '2026-12-31',
    durationDays: 108,
    durationWeeks: 15.4,
    status: 'ACTIVE',
    baseAmount: 35280,
    seasonalSurgeAmount: 7056,
    discountAmount: 4234,
    productionCost: 1400,
    installationCost: 850,
    creativeCost: 0,
    taxAmount: 3329,
    totalAmount: 43681,
    includeProduction: true,
    includeInstallation: true,
    includeArtworkDesign: false,
    includeProofOfPosting: true,
    notes: 'Q4 heavy commuter reach along I-95 corridor heading into NYC metro.',
    history: [
      {
        id: 'aud_4',
        action: 'Flight Activated',
        author: 'System Auto-Scheduler',
        timestamp: 'Sep 15, 2026 00:00',
        details: 'Physical vinyl verified mounted by David Miller (Tech).',
      },
      {
        id: 'aud_5',
        action: 'Booking Confirmed',
        author: 'Lucas Vance (Sales Agent)',
        timestamp: 'Sep 05, 2026 11:20',
        details: 'Client PO #ACME-9912 approved.',
      },
    ],
    createdAt: '2026-08-28',
    updatedAt: '2026-09-15',
  },
  {
    id: 'bkg_3',
    bookingNumber: 'BKG-2026-003',
    clientId: 'cli_3',
    clientName: 'Horizon Telecom',
    clientEmail: 'mchang@horizontelecom.com',
    campaignName: 'Horizon 5G Unlimited Sunset',
    brandName: 'Horizon 5G Wireless',
    billboardId: 'bb_4',
    billboardCode: 'BB-104',
    billboardName: 'Sunset Strip Horizon Wallscape',
    billboardCity: 'Los Angeles',
    billboardCorridor: 'Sunset Strip Entertainment Mile',
    billboardType: 'WALLSCAPE',
    billboardThumbnail: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=800&auto=format&fit=crop&q=80',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    durationDays: 31,
    durationWeeks: 4.4,
    status: 'RESERVED',
    holdExpiresAt: '2026-10-05',
    baseAmount: 22733,
    seasonalSurgeAmount: 4547,
    discountAmount: 1364,
    productionCost: 3200,
    installationCost: 2100,
    creativeCost: 0,
    taxAmount: 2575,
    totalAmount: 33791,
    includeProduction: true,
    includeInstallation: true,
    includeArtworkDesign: false,
    includeProofOfPosting: true,
    notes: 'Hold granted pending board approval of Q4 West Coast media budget.',
    history: [
      {
        id: 'aud_6',
        action: '5-Day Hold Created',
        author: 'Marcus Brody',
        timestamp: 'Sep 26, 2026 15:00',
        details: 'Hold timer set to expire on Oct 05, 2026.',
      },
    ],
    createdAt: '2026-09-26',
    updatedAt: '2026-09-26',
  },
  {
    id: 'bkg_4',
    bookingNumber: 'BKG-2026-004',
    clientId: 'cli_4',
    clientName: 'Pure Beverage Co',
    clientEmail: 'athorne@purebeverage.com',
    campaignName: 'PureWater Natural Wave Push',
    brandName: 'PureWater Natural Springs',
    billboardId: 'bb_3',
    billboardCode: 'BB-103',
    billboardName: 'Ocean Parkway Double Gantry Face A',
    billboardCity: 'Miami',
    billboardCorridor: 'South Beach Gateway Causeway',
    billboardType: 'GANTRY',
    billboardThumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    startDate: '2026-11-20',
    endDate: '2026-12-20',
    durationDays: 31,
    durationWeeks: 4.4,
    status: 'CONFIRMED',
    baseAmount: 7750,
    seasonalSurgeAmount: 1550,
    discountAmount: 465,
    productionCost: 1100,
    installationCost: 750,
    creativeCost: 0,
    taxAmount: 881,
    totalAmount: 11566,
    includeProduction: true,
    includeInstallation: true,
    includeArtworkDesign: false,
    includeProofOfPosting: true,
    notes: 'Confirmed for South Beach Causeway gantry. Artwork in pre-flight color review.',
    history: [
      {
        id: 'aud_7',
        action: 'Booking Confirmed',
        author: 'Lucas Vance',
        timestamp: 'Sep 25, 2026 16:40',
        details: 'Deposit payment received and slot locked.',
      },
      {
        id: 'aud_8',
        action: 'Quote Accepted',
        author: 'Amanda Thorne (Client)',
        timestamp: 'Sep 24, 2026 09:15',
        details: 'Approved via client portal.',
      },
    ],
    createdAt: '2026-09-22',
    updatedAt: '2026-09-25',
  },
  {
    id: 'bkg_5',
    bookingNumber: 'BKG-2026-005',
    clientId: 'cli_5',
    clientName: 'Apex Health Systems',
    clientEmail: 'ereed@apexhealth.org',
    campaignName: 'New Regional Emergency Center Launch',
    brandName: 'Apex Regional Medical Center',
    billboardId: 'bb_6',
    billboardCode: 'BB-106',
    billboardName: 'Silicon Valley Highway 101 Digital Arch',
    billboardCity: 'San Jose',
    billboardCorridor: 'Silicon Valley Tech Express (US-101)',
    billboardType: 'DIGITAL_LED',
    billboardThumbnail: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
    startDate: '2026-11-01',
    endDate: '2026-11-30',
    durationDays: 30,
    durationWeeks: 4.3,
    status: 'PENDING_REVIEW',
    baseAmount: 19500,
    seasonalSurgeAmount: 3900,
    discountAmount: 1170,
    productionCost: 0,
    installationCost: 250,
    creativeCost: 750,
    taxAmount: 1916,
    totalAmount: 25146,
    includeProduction: false,
    includeInstallation: true,
    includeArtworkDesign: true,
    includeProofOfPosting: true,
    notes: 'RFP submitted by Dr. Evelyn Reed. Pending legal review and credit clearance.',
    history: [
      {
        id: 'aud_9',
        action: 'Proposal Submitted for Review',
        author: 'Marcus Brody',
        timestamp: 'Sep 27, 2026 13:00',
        details: 'Pending finance credit limit check.',
      },
    ],
    createdAt: '2026-09-27',
    updatedAt: '2026-09-27',
  },
  {
    id: 'bkg_6',
    bookingNumber: 'BKG-2026-006',
    clientId: 'cli_2',
    clientName: 'Acme Corporation',
    clientEmail: 's.jenkins@acmecorp.com',
    campaignName: 'Summer Product Blitz 2026',
    brandName: 'Acme Mobile Technologies',
    billboardId: 'bb_7',
    billboardCode: 'BB-107',
    billboardName: 'Magnificent Mile Luxury Transit Shelter',
    billboardCity: 'Chicago',
    billboardCorridor: 'Magnificent Mile Retail Corridor',
    billboardType: 'TRANSIT_SHELTER',
    billboardThumbnail: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80',
    startDate: '2026-06-01',
    endDate: '2026-08-31',
    durationDays: 92,
    durationWeeks: 13.1,
    status: 'COMPLETED',
    baseAmount: 11653,
    seasonalSurgeAmount: 1748,
    discountAmount: 1340,
    productionCost: 350,
    installationCost: 180,
    creativeCost: 0,
    taxAmount: 1039,
    totalAmount: 13630,
    includeProduction: true,
    includeInstallation: true,
    includeArtworkDesign: false,
    includeProofOfPosting: true,
    notes: 'Completed summer run on Michigan Avenue. Renewal requested for Spring 2027.',
    history: [
      {
        id: 'aud_10',
        action: 'Campaign Completed',
        author: 'System Auto-Scheduler',
        timestamp: 'Aug 31, 2026 23:59',
        details: 'Full contract flight term served successfully.',
      },
    ],
    createdAt: '2026-05-10',
    updatedAt: '2026-09-01',
  },
];

// In-Memory store
let bookingsStore: BookingRecord[] = [...INITIAL_BOOKINGS];

// -------------------------------------------------------------
// REPOSITORY METHODS
// -------------------------------------------------------------

export function getBookings(filters?: {
  status?: string;
  clientId?: string;
  billboardId?: string;
  search?: string;
}): BookingRecord[] {
  let list = [...bookingsStore];

  if (filters?.status && filters.status !== 'ALL') {
    list = list.filter((b) => b.status === filters.status);
  }
  if (filters?.clientId && filters.clientId !== 'ALL') {
    list = list.filter((b) => b.clientId === filters.clientId);
  }
  if (filters?.billboardId && filters.billboardId !== 'ALL') {
    list = list.filter((b) => b.billboardId === filters.billboardId);
  }
  if (filters?.search && filters.search.trim() !== '') {
    const q = filters.search.toLowerCase().trim();
    list = list.filter(
      (b) =>
        b.bookingNumber.toLowerCase().includes(q) ||
        b.clientName.toLowerCase().includes(q) ||
        b.campaignName.toLowerCase().includes(q) ||
        b.billboardCode.toLowerCase().includes(q) ||
        b.billboardName.toLowerCase().includes(q) ||
        b.billboardCity.toLowerCase().includes(q)
    );
  }

  return list;
}

export function getBookingById(id: string): BookingRecord | undefined {
  return bookingsStore.find((b) => b.id === id || b.bookingNumber === id);
}

export interface CreateBookingInput {
  clientId: string;
  campaignName: string;
  brandName?: string;
  billboardId: string;
  startDate: string;
  endDate: string;
  includeProduction: boolean;
  includeInstallation: boolean;
  includeArtworkDesign: boolean;
  includeProofOfPosting: boolean;
  applyAgencyDiscount?: boolean;
  promoCode?: string;
  notes?: string;
  authorName?: string;
  initialStatus?: BookingStatus;
}

export function createBooking(input: CreateBookingInput): {
  success: boolean;
  booking?: BookingRecord;
  error?: string;
} {
  const client = INITIAL_CLIENTS.find((c) => c.id === input.clientId);
  if (!client) {
    return { success: false, error: 'Client account not found.' };
  }

  const billboard = INITIAL_BILLBOARDS.find((b) => b.id === input.billboardId);
  if (!billboard) {
    return { success: false, error: 'Billboard structure not found.' };
  }

  // Double-booking conflict check
  const conflict = checkScheduleConflict(billboard.id, input.startDate, input.endDate);
  if (conflict.hasConflict) {
    const c = conflict.conflictingSlots[0];
    return {
      success: false,
      error: `Conflict detected: Billboard is already ${c.status} by ${c.clientName} from ${c.startDate} to ${c.endDate}. Next available window: ${conflict.nextAvailableDate}.`,
    };
  }

  // Calculate pricing breakdown
  const calc = calculateFlightPrice({
    billboardId: billboard.id,
    startDate: input.startDate,
    endDate: input.endDate,
    includeProduction: input.includeProduction,
    includeInstallation: input.includeInstallation,
    includeArtworkDesign: input.includeArtworkDesign,
    includeProofOfPosting: input.includeProofOfPosting,
    applyAgencyDiscount: input.applyAgencyDiscount,
    promoCode: input.promoCode,
  });

  if (!calc) {
    return { success: false, error: 'Failed to calculate yield pricing.' };
  }

  const now = new Date().toISOString().split('T')[0];
  const newBookingId = `bkg_${Date.now()}`;
  const bookingNum = `BKG-2026-${String(bookingsStore.length + 1).padStart(3, '0')}`;
  const status = input.initialStatus || 'CONFIRMED';

  const newBooking: BookingRecord = {
    id: newBookingId,
    bookingNumber: bookingNum,
    clientId: client.id,
    clientName: client.companyName,
    clientEmail: client.contacts[0]?.email,
    campaignName: input.campaignName,
    brandName: input.brandName || client.dbaName,
    billboardId: billboard.id,
    billboardCode: billboard.code,
    billboardName: billboard.name,
    billboardCity: billboard.location.city,
    billboardCorridor: billboard.location.corridorName,
    billboardType: billboard.type,
    billboardThumbnail: billboard.photos[0],
    startDate: input.startDate,
    endDate: input.endDate,
    durationDays: calc.totalDays,
    durationWeeks: calc.totalWeeks,
    status,
    baseAmount: calc.baseMediaRate,
    seasonalSurgeAmount: calc.seasonalAdjustment,
    discountAmount: calc.discountsTotal,
    productionCost: input.includeProduction && !billboard.isDigital ? (billboard.productionCost || 1200) : 0,
    installationCost: input.includeInstallation ? (billboard.installationCost || 750) : 0,
    creativeCost: input.includeArtworkDesign ? 750 : 0,
    taxAmount: calc.taxAmount,
    totalAmount: calc.grandTotal,
    includeProduction: input.includeProduction,
    includeInstallation: input.includeInstallation,
    includeArtworkDesign: input.includeArtworkDesign,
    includeProofOfPosting: input.includeProofOfPosting,
    notes: input.notes || '',
    history: [
      {
        id: `aud_${Date.now()}`,
        action: `Booking Created (${status})`,
        author: input.authorName || 'Sales Agent',
        timestamp: new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        details: `Initial contract flight registered. Total: $${calc.grandTotal.toLocaleString()}`,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  // Synchronize with pricing schedule store so that conflict engine knows about this booking
  createFlightHold({
    billboardId: billboard.id,
    billboardCode: billboard.code,
    billboardName: billboard.name,
    clientId: client.id,
    clientName: client.companyName,
    campaignName: input.campaignName,
    startDate: input.startDate,
    endDate: input.endDate,
    status: status === 'RESERVED' ? 'RESERVED' : 'OCCUPIED',
    bookingRef: bookingNum,
    notes: input.notes,
  });

  bookingsStore.unshift(newBooking);
  return { success: true, booking: newBooking };
}

export function updateBookingStatus(
  id: string,
  newStatus: BookingStatus,
  author: string,
  notes?: string
): BookingRecord | null {
  const index = bookingsStore.findIndex((b) => b.id === id || b.bookingNumber === id);
  if (index === -1) return null;

  const current = bookingsStore[index];
  const audit: BookingAuditEvent = {
    id: `aud_${Date.now()}`,
    action: `Status Changed to ${newStatus}`,
    author,
    timestamp: new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    details: notes || `Operational status transitioned from ${current.status} to ${newStatus}.`,
  };

  bookingsStore[index] = {
    ...current,
    status: newStatus,
    history: [audit, ...current.history],
    updatedAt: new Date().toISOString().split('T')[0],
  };

  return bookingsStore[index];
}

export function extendBooking(
  id: string,
  newEndDate: string,
  author: string,
  notes?: string
): {
  success: boolean;
  booking?: BookingRecord;
  error?: string;
} {
  const booking = bookingsStore.find((b) => b.id === id || b.bookingNumber === id);
  if (!booking) return { success: false, error: 'Booking not found.' };

  if (new Date(newEndDate) <= new Date(booking.endDate)) {
    return { success: false, error: 'New end date must be after current end date.' };
  }

  // Check collision for extended range: [booking.endDate + 1 day, newEndDate]
  const currentEndEpoch = new Date(booking.endDate).getTime();
  const extensionStart = new Date(currentEndEpoch + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const conflict = checkScheduleConflict(booking.billboardId, extensionStart, newEndDate);
  if (conflict.hasConflict) {
    const c = conflict.conflictingSlots[0];
    return {
      success: false,
      error: `Cannot extend flight: Overlaps with ${c.campaignName} (${c.clientName}) scheduled from ${c.startDate} to ${c.endDate}.`,
    };
  }

  // Recalculate full flight with new end date
  const calc = calculateFlightPrice({
    billboardId: booking.billboardId,
    startDate: booking.startDate,
    endDate: newEndDate,
    includeProduction: booking.includeProduction,
    includeInstallation: booking.includeInstallation,
    includeArtworkDesign: booking.includeArtworkDesign,
    includeProofOfPosting: booking.includeProofOfPosting,
  });

  if (!calc) return { success: false, error: 'Failed to recalculate extended flight price.' };

  const prevEnd = booking.endDate;
  booking.endDate = newEndDate;
  booking.durationDays = calc.totalDays;
  booking.durationWeeks = calc.totalWeeks;
  booking.totalAmount = calc.grandTotal;
  booking.baseAmount = calc.baseMediaRate;
  booking.seasonalSurgeAmount = calc.seasonalAdjustment;
  booking.discountAmount = calc.discountsTotal;
  booking.taxAmount = calc.taxAmount;
  booking.updatedAt = new Date().toISOString().split('T')[0];

  booking.history.unshift({
    id: `aud_${Date.now()}`,
    action: `Flight Extended to ${newEndDate}`,
    author,
    timestamp: new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    details: notes || `Flight extended from ${prevEnd} to ${newEndDate} (+${calc.totalDays - booking.durationDays} days). New total: $${calc.grandTotal.toLocaleString()}`,
  });

  return { success: true, booking };
}

export function cancelBooking(
  id: string,
  reason: string,
  author: string
): {
  success: boolean;
  booking?: BookingRecord;
  error?: string;
} {
  const booking = bookingsStore.find((b) => b.id === id || b.bookingNumber === id);
  if (!booking) return { success: false, error: 'Booking not found.' };

  booking.status = 'CANCELLED';
  booking.cancellationReason = reason;
  booking.updatedAt = new Date().toISOString().split('T')[0];

  booking.history.unshift({
    id: `aud_${Date.now()}`,
    action: 'Booking Cancelled',
    author,
    timestamp: new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    details: `Reason: ${reason}. Inventory slot released back to available pool.`,
  });

  return { success: true, booking };
}

export function renewBooking(
  id: string,
  newStartDate: string,
  newEndDate: string,
  author: string
): {
  success: boolean;
  newBooking?: BookingRecord;
  error?: string;
} {
  const prevBooking = bookingsStore.find((b) => b.id === id || b.bookingNumber === id);
  if (!prevBooking) return { success: false, error: 'Original booking not found.' };

  const result = createBooking({
    clientId: prevBooking.clientId,
    campaignName: `${prevBooking.campaignName} (Renewal)`,
    brandName: prevBooking.brandName,
    billboardId: prevBooking.billboardId,
    startDate: newStartDate,
    endDate: newEndDate,
    includeProduction: false, // existing vinyl may be reused
    includeInstallation: true,
    includeArtworkDesign: false,
    includeProofOfPosting: true,
    authorName: author,
    notes: `Renewal of contract ${prevBooking.bookingNumber}`,
    initialStatus: 'CONFIRMED',
  });

  if (!result.success || !result.booking) {
    return { success: false, error: result.error };
  }

  prevBooking.renewedToBookingId = result.booking.id;
  result.booking.renewedFromBookingId = prevBooking.id;

  return { success: true, newBooking: result.booking };
}

export function getBookingMetrics() {
  const total = bookingsStore.length;
  const active = bookingsStore.filter((b) => b.status === 'ACTIVE').length;
  const confirmed = bookingsStore.filter((b) => b.status === 'CONFIRMED').length;
  const reserved = bookingsStore.filter((b) => b.status === 'RESERVED').length;
  const pending = bookingsStore.filter((b) => b.status === 'PENDING_REVIEW').length;
  const completed = bookingsStore.filter((b) => b.status === 'COMPLETED').length;
  const cancelled = bookingsStore.filter((b) => b.status === 'CANCELLED').length;

  const totalContractValue = bookingsStore
    .filter((b) => ['ACTIVE', 'CONFIRMED', 'RESERVED', 'COMPLETED'].includes(b.status))
    .reduce((sum, b) => sum + b.totalAmount, 0);

  return {
    total,
    active,
    confirmed,
    reserved,
    pending,
    completed,
    cancelled,
    totalContractValue,
  };
}
