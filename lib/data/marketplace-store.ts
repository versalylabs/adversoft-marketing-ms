/**
 * Adversoft Public Billboard Marketplace Data Store & Utilities
 * Module: Public-facing billboard discovery experience, multi-parameter filtering,
 * 360° billboard evaluation, instant booking request submission, and seamless CRM pipeline feeding.
 */

import { INITIAL_BILLBOARDS, BillboardItem, BillboardType } from './billboards-store';
import { addMarketplaceLead, SalesLead } from './crm-store';
import { createBooking, BookingRecord } from './bookings-store';

export interface MarketplaceFilterState {
  searchQuery: string;
  city: string;
  type: string;
  availability: 'ALL' | 'AVAILABLE_NOW' | 'UPCOMING';
  maxBudget: number;
  minTraffic: number;
  isDigitalOnly: boolean;
  sortBy: 'POPULAR' | 'PRICE_ASC' | 'PRICE_DESC' | 'TRAFFIC_DESC' | 'SIZE_DESC';
}

export interface MarketplaceBookingRequest {
  id: string;
  requestNumber: string; // e.g. REQ-2026-104
  billboardId: string;
  billboardCode: string;
  billboardName: string;
  billboardCity: string;
  billboardType: string;
  billboardThumbnail: string;

  // Advertiser Profile
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  industry: string;
  website?: string;

  // Flight Specs
  campaignName: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  durationWeeks: number;

  // Creative & Production
  requiresPrinting: boolean;
  requiresInstallation: boolean;
  requiresArtworkDesign: boolean;
  hasOwnArtwork: boolean;

  // Cost Breakdown
  baseRentalCost: number;
  productionCost: number;
  installationCost: number;
  designCost: number;
  totalEstimatedValue: number;

  // Notes & Logistics
  notes?: string;
  createdAt: string;
  status: 'PENDING_REVIEW' | 'QUOTATION_PREPARED' | 'CONTACTED' | 'CONVERTED';
  crmLeadId?: string;
  crmLeadNumber?: string;
}

const MARKETPLACE_REQUESTS_KEY = 'adversoft_marketplace_requests';
const MARKETPLACE_SHORTLIST_KEY = 'adversoft_marketplace_shortlist';

/**
 * Retrieve listed billboards for the public marketplace
 */
export function getMarketplaceBillboards(filters?: Partial<MarketplaceFilterState>): BillboardItem[] {
  // Only billboards explicitly designated for marketplace syndication
  let list = INITIAL_BILLBOARDS.filter((b) => b.isMarketplaceListed);

  if (!filters) return list;

  // Search Query (name, code, city, corridor, address)
  if (filters.searchQuery && filters.searchQuery.trim() !== '') {
    const q = filters.searchQuery.toLowerCase().trim();
    list = list.filter(
      (b) =>
        b.code.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q) ||
        b.location.city.toLowerCase().includes(q) ||
        b.location.corridorName.toLowerCase().includes(q) ||
        b.location.address.toLowerCase().includes(q)
    );
  }

  // City filter
  if (filters.city && filters.city !== 'ALL') {
    list = list.filter((b) => b.location.city.toLowerCase() === filters.city!.toLowerCase());
  }

  // Structure Type filter
  if (filters.type && filters.type !== 'ALL') {
    list = list.filter((b) => b.type === filters.type);
  }

  // Availability Filter
  if (filters.availability === 'AVAILABLE_NOW') {
    list = list.filter((b) => b.status === 'AVAILABLE');
  } else if (filters.availability === 'UPCOMING') {
    list = list.filter((b) => b.status === 'OCCUPIED' || b.status === 'RESERVED');
  }

  // Digital Only
  if (filters.isDigitalOnly) {
    list = list.filter((b) => b.isDigital);
  }

  // Min Daily Traffic Count (DEC)
  if (filters.minTraffic && filters.minTraffic > 0) {
    list = list.filter((b) => b.location.dailyTrafficCount >= filters.minTraffic!);
  }

  // Max Monthly Budget
  if (filters.maxBudget && filters.maxBudget > 0) {
    list = list.filter((b) => b.monthlyRate <= filters.maxBudget!);
  }

  // Sorting
  if (filters.sortBy) {
    switch (filters.sortBy) {
      case 'PRICE_ASC':
        list.sort((a, b) => a.monthlyRate - b.monthlyRate);
        break;
      case 'PRICE_DESC':
        list.sort((a, b) => b.monthlyRate - a.monthlyRate);
        break;
      case 'TRAFFIC_DESC':
        list.sort((a, b) => b.location.dailyTrafficCount - a.location.dailyTrafficCount);
        break;
      case 'SIZE_DESC':
        list.sort((a, b) => b.squareFeet - a.squareFeet);
        break;
      case 'POPULAR':
      default:
        // Prioritize Available first, then high traffic
        list.sort((a, b) => {
          if (a.status === 'AVAILABLE' && b.status !== 'AVAILABLE') return -1;
          if (b.status === 'AVAILABLE' && a.status !== 'AVAILABLE') return 1;
          return b.location.dailyTrafficCount - a.location.dailyTrafficCount;
        });
        break;
    }
  }

  return list;
}

/**
 * Aggregate public marketplace metrics
 */
export function getMarketplaceMetrics() {
  const listed = INITIAL_BILLBOARDS.filter((b) => b.isMarketplaceListed);
  const totalEyes = listed.reduce((acc, b) => acc + b.location.dailyTrafficCount, 0);
  const cities = Array.from(new Set(listed.map((b) => b.location.city)));
  const availableCount = listed.filter((b) => b.status === 'AVAILABLE').length;

  return {
    totalListed: listed.length,
    totalDailyTraffic: totalEyes,
    citiesCovered: cities.length,
    availableNowCount: availableCount,
    citiesList: cities,
  };
}

/**
 * Retrieve saved shortlist from LocalStorage
 */
export function getStoredShortlist(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(MARKETPLACE_SHORTLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Toggle an asset in the shortlist
 */
export function toggleStoredShortlist(billboardId: string): string[] {
  if (typeof window === 'undefined') return [];
  const current = getStoredShortlist();
  const exists = current.includes(billboardId);
  const updated = exists ? current.filter((id) => id !== billboardId) : [...current, billboardId];

  try {
    localStorage.setItem(MARKETPLACE_SHORTLIST_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('adversoft_shortlist_updated', { detail: updated }));
  } catch (err) {
    console.error('Failed to toggle shortlist:', err);
  }

  return updated;
}

/**
 * Retrieve past marketplace inquiries submitted in this browser
 */
export function getStoredMarketplaceRequests(): MarketplaceBookingRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(MARKETPLACE_REQUESTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Submit a formal booking request from the public marketplace.
 * Directly generates a lead into the internal CRM pipeline and
 * registers a tentative booking record in the booking engine!
 */
export function submitMarketplaceBookingRequest(params: {
  billboard: BillboardItem;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  industry?: string;
  website?: string;
  campaignName: string;
  startDate: string;
  endDate: string;
  requiresPrinting: boolean;
  requiresInstallation: boolean;
  requiresArtworkDesign: boolean;
  hasOwnArtwork: boolean;
  notes?: string;
}): {
  success: boolean;
  request: MarketplaceBookingRequest;
  crmLead: SalesLead;
  bookingRecord?: BookingRecord;
} {
  const start = new Date(params.startDate);
  const end = new Date(params.endDate);
  const diffTime = Math.max(0, end.getTime() - start.getTime());
  const durationDays = Math.max(params.billboard.minBookingDays || 7, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const durationWeeks = Math.ceil(durationDays / 7);

  // Calculate pricing breakdown
  let baseRentalCost = 0;
  if (durationDays >= 28) {
    baseRentalCost = (params.billboard.monthlyRate / 30) * durationDays;
  } else {
    baseRentalCost = durationWeeks * params.billboard.weeklyRate;
  }

  const productionCost = params.requiresPrinting ? params.billboard.productionCost : 0;
  const installationCost = params.requiresInstallation ? params.billboard.installationCost : 0;
  const designCost = params.requiresArtworkDesign ? 950 : 0;

  const totalEstimatedValue = Math.round(baseRentalCost + productionCost + installationCost + designCost);

  // 1. Generate Request ID
  const reqNumber = `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  // 2. Feed directly into the CRM pipeline as a high-intent MARKETPLACE SalesLead
  const crmLead = addMarketplaceLead({
    companyName: params.companyName,
    contactName: params.contactName,
    contactEmail: params.contactEmail,
    contactPhone: params.contactPhone,
    billboardName: params.billboard.name,
    billboardCode: params.billboard.code,
    startDate: params.startDate,
    endDate: params.endDate,
    estimatedValue: totalEstimatedValue,
    preferredLocations: `${params.billboard.code} — ${params.billboard.location.corridorName}, ${params.billboard.location.city}`,
    notes: `[Public Marketplace Booking Request #${reqNumber}]
Campaign: "${params.campaignName}"
Industry: ${params.industry || 'General Advertiser'}
Website: ${params.website || 'N/A'}
Flight: ${params.startDate} to ${params.endDate} (${durationDays} days / ${durationWeeks} wks)
Specs: ${params.billboard.widthFeet}' x ${params.billboard.heightFeet}' (${params.billboard.squareFeet} sq ft)
Printing: ${params.requiresPrinting ? 'Yes ($' + productionCost + ')' : 'No'}
Rigging/Install: ${params.requiresInstallation ? 'Yes ($' + installationCost + ')' : 'No'}
Design Support: ${params.requiresArtworkDesign ? 'Yes ($' + designCost + ')' : 'No'}
Advertiser Notes: ${params.notes || 'None provided.'}`,
  });

  // 3. Register tentative booking in Booking System
  let createdBooking: BookingRecord | undefined;
  try {
    const bookingResult = createBooking({
      clientId: 'cli_1', // default placeholder client or assigned dynamically
      campaignName: params.campaignName || `Marketplace Flight - ${params.companyName}`,
      brandName: params.companyName,
      billboardId: params.billboard.id,
      startDate: params.startDate,
      endDate: params.endDate,
      includeProduction: params.requiresPrinting,
      includeInstallation: params.requiresInstallation,
      includeArtworkDesign: params.requiresArtworkDesign,
      includeProofOfPosting: true,
      authorName: `Public Web (${params.contactName})`,
      notes: `Inbound Marketplace Request #${reqNumber}. Lead #${crmLead.leadNumber}.`,
      initialStatus: 'PENDING_REVIEW',
    });

    if (bookingResult.success) {
      createdBooking = bookingResult.booking;
    }
  } catch (err) {
    console.warn('Booking engine initialization deferred:', err);
  }

  // 4. Construct Marketplace Booking Request entity
  const requestRecord: MarketplaceBookingRequest = {
    id: `req_${Date.now()}`,
    requestNumber: reqNumber,
    billboardId: params.billboard.id,
    billboardCode: params.billboard.code,
    billboardName: params.billboard.name,
    billboardCity: params.billboard.location.city,
    billboardType: params.billboard.type,
    billboardThumbnail: params.billboard.photos[0],
    companyName: params.companyName,
    contactName: params.contactName,
    contactEmail: params.contactEmail,
    contactPhone: params.contactPhone,
    industry: params.industry || 'Commercial Brand',
    website: params.website,
    campaignName: params.campaignName,
    startDate: params.startDate,
    endDate: params.endDate,
    durationDays,
    durationWeeks,
    requiresPrinting: params.requiresPrinting,
    requiresInstallation: params.requiresInstallation,
    requiresArtworkDesign: params.requiresArtworkDesign,
    hasOwnArtwork: params.hasOwnArtwork,
    baseRentalCost: Math.round(baseRentalCost),
    productionCost,
    installationCost,
    designCost,
    totalEstimatedValue,
    notes: params.notes,
    createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: 'PENDING_REVIEW',
    crmLeadId: crmLead.id,
    crmLeadNumber: crmLead.leadNumber,
  };

  // 5. Store in localStorage
  if (typeof window !== 'undefined') {
    try {
      const existing = getStoredMarketplaceRequests();
      const updated = [requestRecord, ...existing];
      localStorage.setItem(MARKETPLACE_REQUESTS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('adversoft_marketplace_request_created', { detail: requestRecord }));
    } catch (e) {
      console.error('Failed to save marketplace request:', e);
    }
  }

  return {
    success: true,
    request: requestRecord,
    crmLead,
    bookingRecord: createdBooking,
  };
}
