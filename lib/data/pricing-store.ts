/**
 * Adversoft Pricing & Availability Engine Store
 * Module: Billboard rates, seasonal rules, discount tiers, availability calendar,
 * and conflict / double-booking prevention engine.
 */

import { INITIAL_BILLBOARDS, BillboardItem } from './billboards-store';

export interface SeasonalRule {
  id: string;
  name: string;
  code: string;
  startMonth: number; // 1-12
  startDay: number;
  endMonth: number;
  endDay: number;
  multiplier: number; // 1.2 = +20%
  description: string;
  isActive: boolean;
}

export interface DiscountRule {
  id: string;
  code: string;
  name: string;
  type: 'DURATION' | 'PACKAGE' | 'AGENCY' | 'PROMO';
  minDurationWeeks?: number;
  minSites?: number;
  discountPercentage: number;
  description: string;
  isActive: boolean;
}

export interface ServiceFeeConfig {
  id: string;
  code: string;
  name: string;
  category: 'PRODUCTION' | 'INSTALLATION' | 'CREATIVE' | 'INSPECTION';
  defaultCost: number;
  unit: 'FLAT' | 'PER_SQFT';
  description: string;
}

export interface FlightScheduleSlot {
  id: string;
  billboardId: string;
  billboardCode: string;
  billboardName: string;
  clientId?: string;
  clientName: string;
  campaignName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status: 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
  holdExpiresAt?: string;
  bookingRef?: string;
  notes?: string;
}

export interface PriceCalculationParams {
  billboardId: string;
  startDate: string;
  endDate: string;
  includeProduction?: boolean;
  includeInstallation?: boolean;
  includeArtworkDesign?: boolean;
  includeProofOfPosting?: boolean;
  applyAgencyDiscount?: boolean;
  promoCode?: string;
}

export interface PriceLineItem {
  label: string;
  category: 'MEDIA' | 'SEASONAL' | 'DISCOUNT' | 'SERVICE' | 'TAX';
  amount: number;
  description?: string;
}

export interface PriceCalculationResult {
  billboard: BillboardItem;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalWeeks: number;
  totalMonths: number;
  isMinDurationMet: boolean;
  minDurationDays: number;
  seasonalMultiplier: number;
  activeSeason?: string;
  baseMediaRate: number;
  seasonalAdjustment: number;
  discountsTotal: number;
  servicesTotal: number;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  lineItems: PriceLineItem[];
  hasConflict: boolean;
  conflictDetails?: FlightScheduleSlot[];
}

// -------------------------------------------------------------
// 1. SEASONAL RULES & SURGES
// -------------------------------------------------------------
export const SEASONAL_RULES: SeasonalRule[] = [
  {
    id: 'seas_q4',
    name: 'Q4 Holiday Peak Shopping Surge',
    code: 'Q4_HOLIDAY',
    startMonth: 10,
    startDay: 15,
    endMonth: 12,
    endDay: 31,
    multiplier: 1.20, // +20% surge
    description: 'High-demand fourth quarter holiday retail and luxury advertising rush.',
    isActive: true,
  },
  {
    id: 'seas_summer',
    name: 'Summer Tourism & Travel Corridor Peak',
    code: 'SUMMER_PEAK',
    startMonth: 6,
    startDay: 1,
    endMonth: 8,
    endDay: 31,
    multiplier: 1.15, // +15% surge
    description: 'High highway & beach corridor circulation during summer travel season.',
    isActive: true,
  },
  {
    id: 'seas_q1',
    name: 'Q1 Post-Holiday Value Window',
    code: 'Q1_STANDARD',
    startMonth: 1,
    startDay: 1,
    endMonth: 3,
    endDay: 31,
    multiplier: 1.0, // standard baseline
    description: 'Standard baseline outdoor advertising season.',
    isActive: true,
  },
];

// -------------------------------------------------------------
// 2. DISCOUNT TIERS
// -------------------------------------------------------------
export const DISCOUNT_RULES: DiscountRule[] = [
  {
    id: 'disc_4w',
    code: 'DURATION_4W',
    name: '4-Week Flight Commitment',
    type: 'DURATION',
    minDurationWeeks: 4,
    discountPercentage: 5,
    description: '5% incentive discount for continuous 4-week billboard commitments.',
    isActive: true,
  },
  {
    id: 'disc_12w',
    code: 'DURATION_12W',
    name: 'Quarterly Flight (12+ Weeks)',
    type: 'DURATION',
    minDurationWeeks: 12,
    discountPercentage: 10,
    description: '10% volume discount for quarterly continuous flight campaigns.',
    isActive: true,
  },
  {
    id: 'disc_24w',
    code: 'DURATION_24W',
    name: 'Semi-Annual Flight (24+ Weeks)',
    type: 'DURATION',
    minDurationWeeks: 24,
    discountPercentage: 15,
    description: '15% marquee partner discount for 6-month continuous campaigns.',
    isActive: true,
  },
  {
    id: 'disc_agency',
    code: 'AGENCY_COMMISSION',
    name: 'Accredited Media Agency Partner',
    type: 'AGENCY',
    discountPercentage: 15,
    description: '15% media agency commission rate for accredited media buyers.',
    isActive: true,
  },
  {
    id: 'disc_early2026',
    code: 'EARLY2026',
    name: 'Early Adopter Q4 Promo',
    type: 'PROMO',
    discountPercentage: 8,
    description: 'Special 8% introductory rate for registered marketplace partners.',
    isActive: true,
  },
];

// -------------------------------------------------------------
// 3. SERVICE FEES CONFIGURATION
// -------------------------------------------------------------
export const SERVICE_FEES: ServiceFeeConfig[] = [
  {
    id: 'fee_artwork',
    code: 'ARTWORK_DESIGN',
    name: 'High-Impact Creative Production & Resize',
    category: 'CREATIVE',
    defaultCost: 750,
    unit: 'FLAT',
    description: 'Studio creative adaptation, color grading, and format optimization.',
  },
  {
    id: 'fee_pop',
    code: 'PROOF_OF_POSTING',
    name: 'Day & Night High-Res POP Verification Photo Kit',
    category: 'INSPECTION',
    defaultCost: 150,
    unit: 'FLAT',
    description: 'Certified daylight and night-lit geo-tagged proof-of-posting report.',
  },
];

// -------------------------------------------------------------
// 4. ACTIVE FLIGHT SCHEDULES (OCT 2026 - FEB 2027)
// -------------------------------------------------------------
let schedulesStore: FlightScheduleSlot[] = [
  {
    id: 'sch_1',
    billboardId: 'bb_1',
    billboardCode: 'BB-101',
    billboardName: 'Times Square Spectacle LED',
    clientId: 'cli_1',
    clientName: 'Sterling Brands Ltd',
    campaignName: 'Sterling Luxe Holiday 2026',
    startDate: '2026-10-01',
    endDate: '2026-11-15',
    status: 'OCCUPIED',
    bookingRef: 'BKG-2026-001',
    notes: 'Primary digital slot locked for Times Square holiday kickoff.',
  },
  {
    id: 'sch_2',
    billboardId: 'bb_2',
    billboardCode: 'BB-102',
    billboardName: 'I-95 Northbound Highway Unipole',
    clientId: 'cli_2',
    clientName: 'Acme Corporation',
    campaignName: 'Acme Mobile 5G Nationwide',
    startDate: '2026-09-15',
    endDate: '2026-12-31',
    status: 'OCCUPIED',
    bookingRef: 'BKG-2026-002',
    notes: 'Standard 14x48 vinyl mounted and tensioned.',
  },
  {
    id: 'sch_3',
    billboardId: 'bb_4',
    billboardCode: 'BB-104',
    billboardName: 'Sunset Strip Horizon Wallscape',
    clientId: 'cli_3',
    clientName: 'Horizon Telecom',
    campaignName: 'Horizon 5G Unlimited Sunset',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    status: 'RESERVED',
    holdExpiresAt: '2026-10-05',
    bookingRef: 'BKG-2026-003',
    notes: 'Quotation sent #QUO-2026-012. Hold locked for 5 business days.',
  },
  {
    id: 'sch_4',
    billboardId: 'bb_5',
    billboardCode: 'BB-105',
    billboardName: 'Airport Expressway Unipole Face B',
    clientName: 'Adversoft Operations Fleet',
    campaignName: 'Annual Catwalk & Structural Recertification',
    startDate: '2026-10-05',
    endDate: '2026-10-18',
    status: 'MAINTENANCE',
    notes: 'Rigging overhaul, steel treatment, and LED floodlight swap.',
  },
  {
    id: 'sch_5',
    billboardId: 'bb_1',
    billboardCode: 'BB-101',
    billboardName: 'Times Square Spectacle LED',
    clientId: 'cli_2',
    clientName: 'Acme Corporation',
    campaignName: 'Acme Ultra Phone Holiday Countdown',
    startDate: '2026-12-01',
    endDate: '2027-01-05',
    status: 'RESERVED',
    holdExpiresAt: '2026-10-15',
    bookingRef: 'BKG-2026-008',
    notes: 'High-frequency New Year Times Square countdown slot.',
  },
  {
    id: 'sch_6',
    billboardId: 'bb_3',
    billboardCode: 'BB-103',
    billboardName: 'Ocean Parkway Double Gantry Face A',
    clientId: 'cli_4',
    clientName: 'Pure Beverage Co',
    campaignName: 'Winter Wave Hydration Flight',
    startDate: '2026-11-20',
    endDate: '2026-12-20',
    status: 'RESERVED',
    holdExpiresAt: '2026-10-10',
    bookingRef: 'BKG-2026-009',
    notes: 'MacArthur Causeway arterial approach hold.',
  },
];

// -------------------------------------------------------------
// 5. CONFLICT & DOUBLE-BOOKING PREVENTION ENGINE
// -------------------------------------------------------------

/**
 * Checks if a requested flight period overlaps with existing bookings, holds, or maintenance.
 * Strict interval collision rule:
 * Range A [startA, endA] overlaps with Range B [startB, endB] iff (startA <= endB && endA >= startB).
 */
export function checkScheduleConflict(
  billboardId: string,
  startDate: string,
  endDate: string,
  excludeSlotId?: string
): {
  hasConflict: boolean;
  conflictingSlots: FlightScheduleSlot[];
  nextAvailableDate?: string;
} {
  const reqStart = new Date(startDate).getTime();
  const reqEnd = new Date(endDate).getTime();

  if (isNaN(reqStart) || isNaN(reqEnd) || reqStart > reqEnd) {
    return { hasConflict: false, conflictingSlots: [] };
  }

  const matches = schedulesStore.filter((slot) => {
    if (slot.billboardId !== billboardId) return false;
    if (excludeSlotId && slot.id === excludeSlotId) return false;

    const slotStart = new Date(slot.startDate).getTime();
    const slotEnd = new Date(slot.endDate).getTime();

    // Check overlap: StartA <= EndB and EndA >= StartB
    return reqStart <= slotEnd && reqEnd >= slotStart;
  });

  let nextAvailableDate: string | undefined = undefined;
  if (matches.length > 0) {
    // Find the latest end date among the conflicting slots
    const latestEndTimestamp = Math.max(
      ...matches.map((m) => new Date(m.endDate).getTime())
    );
    const dayAfter = new Date(latestEndTimestamp + 24 * 60 * 60 * 1000);
    nextAvailableDate = dayAfter.toISOString().split('T')[0];
  }

  return {
    hasConflict: matches.length > 0,
    conflictingSlots: matches,
    nextAvailableDate,
  };
}

// -------------------------------------------------------------
// 6. PRICE & QUOTE CALCULATION ENGINE
// -------------------------------------------------------------

export function calculateFlightPrice(params: PriceCalculationParams): PriceCalculationResult | null {
  const billboard = INITIAL_BILLBOARDS.find(
    (b) => b.id === params.billboardId || b.code === params.billboardId
  );
  if (!billboard) return null;

  const start = new Date(params.startDate);
  const end = new Date(params.endDate);
  const diffTime = end.getTime() - start.getTime();
  const totalDays = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);
  const totalWeeks = Math.round((totalDays / 7) * 10) / 10;
  const totalMonths = Math.round((totalDays / 30.41) * 10) / 10;

  const isMinDurationMet = totalDays >= billboard.minBookingDays;
  const minDurationDays = billboard.minBookingDays;

  // 1. Calculate Base Media Rental
  // Pro-rate smartly: if >= 30 days use monthlyRate, if >= 7 days use weeklyRate, else dailyRate
  let baseMediaRate = 0;
  if (totalDays >= 28) {
    const months = totalDays / 30;
    baseMediaRate = Math.round(billboard.monthlyRate * months);
  } else if (totalDays >= 7) {
    const weeks = totalDays / 7;
    baseMediaRate = Math.round(billboard.weeklyRate * weeks);
  } else {
    baseMediaRate = billboard.dailyRate * totalDays;
  }

  // 2. Seasonal Multipliers
  // Determine if flight intersects active seasonal surges
  let activeSeason: SeasonalRule | undefined = undefined;
  let seasonalMultiplier = 1.0;

  // Check if start or end falls into any active rule
  const startMonth = start.getMonth() + 1;
  const endMonth = end.getMonth() + 1;

  for (const rule of SEASONAL_RULES) {
    if (!rule.isActive) continue;
    if (
      (startMonth >= rule.startMonth && startMonth <= rule.endMonth) ||
      (endMonth >= rule.startMonth && endMonth <= rule.endMonth)
    ) {
      if (rule.multiplier > seasonalMultiplier) {
        seasonalMultiplier = rule.multiplier;
        activeSeason = rule;
      }
    }
  }

  const seasonalAdjustment = seasonalMultiplier > 1.0
    ? Math.round(baseMediaRate * (seasonalMultiplier - 1.0))
    : 0;

  const mediaWithSeason = baseMediaRate + seasonalAdjustment;

  // 3. Discount Calculations
  const lineItems: PriceLineItem[] = [
    {
      label: `Base Media Flight Rental (${totalDays} days / ${totalWeeks} wks)`,
      category: 'MEDIA',
      amount: baseMediaRate,
      description: `@ ${totalDays >= 28 ? '$' + billboard.monthlyRate.toLocaleString() + '/mo' : '$' + billboard.weeklyRate.toLocaleString() + '/wk'}`,
    },
  ];

  if (seasonalAdjustment > 0 && activeSeason) {
    lineItems.push({
      label: `Seasonal Surge: ${activeSeason.name} (+${Math.round((seasonalMultiplier - 1) * 100)}%)`,
      category: 'SEASONAL',
      amount: seasonalAdjustment,
      description: activeSeason.description,
    });
  }

  let discountsTotal = 0;

  // Duration Discount
  let durationDiscountPct = 0;
  let durationRuleName = '';
  if (totalWeeks >= 24) {
    durationDiscountPct = 15;
    durationRuleName = 'Semi-Annual Commitment (24+ wks)';
  } else if (totalWeeks >= 12) {
    durationDiscountPct = 10;
    durationRuleName = 'Quarterly Commitment (12+ wks)';
  } else if (totalWeeks >= 4) {
    durationDiscountPct = 5;
    durationRuleName = 'Continuous 4-Week Flight';
  }

  if (durationDiscountPct > 0) {
    const durDiscountAmt = Math.round(mediaWithSeason * (durationDiscountPct / 100));
    discountsTotal += durDiscountAmt;
    lineItems.push({
      label: `Flight Duration Discount: ${durationRuleName} (-${durationDiscountPct}%)`,
      category: 'DISCOUNT',
      amount: -durDiscountAmt,
      description: `Applied against media subtotal`,
    });
  }

  // Agency Commission
  if (params.applyAgencyDiscount) {
    const agencyDiscountAmt = Math.round((mediaWithSeason - discountsTotal) * 0.15);
    discountsTotal += agencyDiscountAmt;
    lineItems.push({
      label: 'Accredited Agency Media Commission (-15%)',
      category: 'DISCOUNT',
      amount: -agencyDiscountAmt,
      description: 'Standard 4A media agency partner allowance',
    });
  }

  // Promo Code
  if (params.promoCode && params.promoCode.trim().toUpperCase() === 'EARLY2026') {
    const promoAmt = Math.round((mediaWithSeason - discountsTotal) * 0.08);
    discountsTotal += promoAmt;
    lineItems.push({
      label: 'Promo Voucher: EARLY2026 (-8%)',
      category: 'DISCOUNT',
      amount: -promoAmt,
      description: 'Promotional credit applied',
    });
  }

  // 4. Physical & Creative Service Add-ons
  let servicesTotal = 0;

  if (params.includeProduction && !billboard.isDigital) {
    const prodCost = billboard.productionCost || 1200;
    servicesTotal += prodCost;
    lineItems.push({
      label: `Vinyl Printing & Finishing (${billboard.squareFeet} sq ft)`,
      category: 'SERVICE',
      amount: prodCost,
      description: 'Heavyweight 13oz UV-resistant flex banner with reinforced hems',
    });
  }

  if (params.includeInstallation) {
    const instCost = billboard.installationCost || 750;
    servicesTotal += instCost;
    lineItems.push({
      label: billboard.isDigital ? 'Digital Content Deployment & Ingestion' : 'Physical Rigging & Boom Crane Mounting',
      category: 'SERVICE',
      amount: instCost,
      description: billboard.isDigital ? 'Server ingest, QA, and rotation sync' : 'Licensed crew rigging, safety cabling, and nighttime focus',
    });
  }

  if (params.includeArtworkDesign) {
    const designFee = 750;
    servicesTotal += designFee;
    lineItems.push({
      label: 'Custom OOH Graphic Design & 4K Creative Adaptation',
      category: 'SERVICE',
      amount: designFee,
      description: 'Senior art director layout and vector preparation',
    });
  }

  if (params.includeProofOfPosting) {
    const popFee = 150;
    servicesTotal += popFee;
    lineItems.push({
      label: 'Certified Daytime & Nighttime POP Photographic Kit',
      category: 'SERVICE',
      amount: popFee,
      description: 'Geo-stamped high resolution photos for advertiser audit',
    });
  }

  // Subtotal & Taxes
  const subtotal = Math.max(0, mediaWithSeason - discountsTotal + servicesTotal);
  const taxRate = 0.0825; // 8.25% state & local advertising sales tax
  const taxAmount = Math.round(subtotal * taxRate);
  const grandTotal = subtotal + taxAmount;

  lineItems.push({
    label: 'State & Municipal OOH Advertising Tax (8.25%)',
    category: 'TAX',
    amount: taxAmount,
    description: 'Mandatory jurisdictional tax',
  });

  // Check conflicts
  const conflictCheck = checkScheduleConflict(billboard.id, params.startDate, params.endDate);

  return {
    billboard,
    startDate: params.startDate,
    endDate: params.endDate,
    totalDays,
    totalWeeks,
    totalMonths,
    isMinDurationMet,
    minDurationDays,
    seasonalMultiplier,
    activeSeason: activeSeason?.name,
    baseMediaRate,
    seasonalAdjustment,
    discountsTotal,
    servicesTotal,
    subtotal,
    taxAmount,
    grandTotal,
    lineItems,
    hasConflict: conflictCheck.hasConflict,
    conflictDetails: conflictCheck.conflictingSlots,
  };
}

// -------------------------------------------------------------
// 7. REPOSITORY MUTATIONS
// -------------------------------------------------------------

export function getAllSchedules(): FlightScheduleSlot[] {
  return [...schedulesStore];
}

export function getBillboardSchedule(billboardId: string): FlightScheduleSlot[] {
  return schedulesStore.filter(
    (s) => s.billboardId === billboardId || s.billboardCode === billboardId
  );
}

export function createFlightHold(slot: Omit<FlightScheduleSlot, 'id'>): {
  success: boolean;
  slot?: FlightScheduleSlot;
  error?: string;
} {
  const conflict = checkScheduleConflict(slot.billboardId, slot.startDate, slot.endDate);
  if (conflict.hasConflict) {
    return {
      success: false,
      error: `Conflict detected: Billboard is already ${conflict.conflictingSlots[0].status} by ${conflict.conflictingSlots[0].clientName} from ${conflict.conflictingSlots[0].startDate} to ${conflict.conflictingSlots[0].endDate}. Next open slot begins ${conflict.nextAvailableDate}.`,
    };
  }

  const newSlot: FlightScheduleSlot = {
    ...slot,
    id: `sch_${Date.now()}`,
  };

  schedulesStore.push(newSlot);
  return { success: true, slot: newSlot };
}

export function removeFlightSchedule(id: string): boolean {
  const initialLen = schedulesStore.length;
  schedulesStore = schedulesStore.filter((s) => s.id !== id);
  return schedulesStore.length < initialLen;
}
