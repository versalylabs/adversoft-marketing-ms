/**
 * Adversoft Campaign Management Data Store & Service Engine
 * Module: Central campaign workspaces connecting flight dates, sites, deliverables,
 * budgets, tasks, and proof-of-performance (POP) reports.
 */

import { INITIAL_BILLBOARDS, BillboardItem } from './billboards-store';
import { INITIAL_CLIENTS, ClientAccount } from './crm-store';
import { getStoredContracts, ContractRecord } from './contracts-store';
import { getBookings, BookingRecord } from './bookings-store';
import { getActiveTenantId, isDemoTenant, getTenantStorageKey } from '../tenant';

export type CampaignStatus =
  | 'PLANNING'
  | 'SCHEDULED'
  | 'LIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ARCHIVED';

export type TaskCategory =
  | 'CREATIVE'
  | 'PRODUCTION'
  | 'OPERATIONS'
  | 'FINANCE'
  | 'REPORTING';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface CampaignTask {
  id: string;
  title: string;
  category: TaskCategory;
  assigneeName: string;
  assigneeRole: string;
  dueDate: string;
  isCompleted: boolean;
  priority: TaskPriority;
  notes?: string;
}

export interface ProofPhotoItem {
  id: string;
  type: 'DAY' | 'NIGHT' | 'INSTALL' | 'DRONE';
  url: string;
  caption: string;
  verifiedAt: string;
  illuminated: boolean;
}

export interface CampaignSiteAllocation {
  id: string;
  billboardId: string;
  billboardCode: string;
  billboardName: string;
  billboardCity: string;
  billboardCorridor: string;
  dimensions: string;
  isDigital: boolean;
  structureType: string;
  shareOfVoicePercent?: number; // for digital LED
  spotFrequencySeconds?: number;
  flightStartDate: string;
  flightEndDate: string;
  dailyImpressions: number;
  totalImpressions: number;
  monthlyRental: number;
  productionCost: number;
  installationCost: number;
  siteStatus: 'SCHEDULED' | 'INSTALLED' | 'LIVE' | 'TAKEDOWN_PENDING' | 'CONCLUDED';
  proofPhotos: ProofPhotoItem[];
}

export interface CampaignDeliverable {
  id: string;
  siteId: string;
  siteCode: string;
  name: string;
  specDimensions: string;
  format: 'VINYL_BULLETIN' | 'DIGITAL_MP4' | 'DIGITAL_STATIC_JPEG' | 'TRANSIT_SHELTER';
  status: 'PENDING_UPLOAD' | 'IN_REVIEW' | 'APPROVED' | 'SENT_TO_PRINT' | 'DISPATCHED';
  version: number;
  fileUrl?: string;
  updatedAt: string;
}

export interface CampaignProofReport {
  id: string;
  generatedAt: string;
  certifiedBy: string;
  auditorTitle: string;
  totalImpressionsDelivered: number;
  overallSlaScorePercent: number;
  reportReferenceNumber: string;
  summaryNotes: string;
}

export interface CampaignRecord {
  id: string;
  campaignNumber: string; // e.g. CMP-2026-001
  name: string;
  clientId: string;
  clientCompanyName: string;
  clientAccountNumber: string;
  brandName: string;
  contractId?: string;
  contractNumber?: string;
  bookingId?: string;
  bookingNumber?: string;

  // Flight Schedule & Progress
  flightStartDate: string; // YYYY-MM-DD
  flightEndDate: string;   // YYYY-MM-DD
  totalFlightDays: number;
  daysElapsed: number;
  daysRemaining: number;
  flightProgressPercent: number;
  status: CampaignStatus;

  // Management & Budget
  campaignManager: string;
  totalBudget: number;
  actualSpend: number;
  mediaCost: number;
  productionCost: number;
  installationCost: number;

  // Linked Entities
  sites: CampaignSiteAllocation[];
  tasks: CampaignTask[];
  deliverables: CampaignDeliverable[];
  proofReport?: CampaignProofReport;

  // Metadata
  tags: string[];
  targetAudienceSummary: string;
  createdAt: string;
  updatedAt: string;
}

export function computeFlightMetrics(startDateStr: string, endDateStr: string, status: CampaignStatus) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(startDateStr);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDateStr);
  end.setHours(0, 0, 0, 0);

  const totalFlightDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

  if (status === 'COMPLETED') {
    return {
      totalFlightDays,
      daysElapsed: totalFlightDays,
      daysRemaining: 0,
      flightProgressPercent: 100,
    };
  }

  if (today < start) {
    // Has not started yet
    const daysUntilStart = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return {
      totalFlightDays,
      daysElapsed: 0,
      daysRemaining: totalFlightDays,
      flightProgressPercent: 0,
    };
  }

  if (today > end) {
    return {
      totalFlightDays,
      daysElapsed: totalFlightDays,
      daysRemaining: 0,
      flightProgressPercent: 100,
    };
  }

  const daysElapsed = Math.min(
    totalFlightDays,
    Math.max(0, Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
  );
  const daysRemaining = Math.max(0, totalFlightDays - daysElapsed);
  const flightProgressPercent = Math.min(100, Math.round((daysElapsed / totalFlightDays) * 100));

  return {
    totalFlightDays,
    daysElapsed,
    daysRemaining,
    flightProgressPercent,
  };
}

export const INITIAL_CAMPAIGNS: CampaignRecord[] = [
  {
    id: 'cmp_1',
    campaignNumber: 'CMP-2026-001',
    name: 'Sterling Luxe Holiday 2026',
    clientId: 'cli_1',
    clientCompanyName: 'Sterling Brands Ltd',
    clientAccountNumber: 'CLI-1001',
    brandName: 'Sterling Haute Horlogerie',
    contractId: 'cnt_1',
    contractNumber: 'CNT-2026-001',
    bookingId: 'bkg_1',
    bookingNumber: 'BKG-2026-001',
    flightStartDate: '2026-10-01',
    flightEndDate: '2026-11-15',
    ...computeFlightMetrics('2026-10-01', '2026-11-15', 'LIVE'),
    status: 'LIVE',
    campaignManager: 'Alexandra Chen',
    totalBudget: 65000,
    actualSpend: 45414,
    mediaCost: 42933,
    productionCost: 1800,
    installationCost: 681,
    tags: ['Luxury', 'Holiday', 'Spectacular LED', 'Times Square'],
    targetAudienceSummary: 'High-net-worth international travelers, retail shoppers, and luxury lifestyle consumers.',
    sites: [
      {
        id: 'csite_1',
        billboardId: 'bb_1',
        billboardCode: 'BB-101',
        billboardName: 'Times Square Spectacle LED',
        billboardCity: 'New York',
        billboardCorridor: 'Times Square Bowtie Plaza',
        dimensions: "48' x 14'",
        isDigital: true,
        structureType: 'DIGITAL_LED',
        shareOfVoicePercent: 25.0,
        spotFrequencySeconds: 60,
        flightStartDate: '2026-10-01',
        flightEndDate: '2026-11-15',
        dailyImpressions: 450000,
        totalImpressions: 20700000,
        monthlyRental: 28000,
        productionCost: 0,
        installationCost: 350,
        siteStatus: 'LIVE',
        proofPhotos: [
          {
            id: 'pop_1',
            type: 'NIGHT',
            url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
            caption: 'Times Square Spectacle illuminated night rotation at 20:30 EST (99.8% luminosity)',
            verifiedAt: '2026-10-02 20:32',
            illuminated: true,
          },
          {
            id: 'pop_2',
            type: 'DAY',
            url: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&auto=format&fit=crop&q=80',
            caption: 'Daytime pedestrian eye-level capture with high pedestrian density',
            verifiedAt: '2026-10-03 14:15',
            illuminated: false,
          },
        ],
      },
    ],
    tasks: [
      {
        id: 'tsk_101',
        title: 'Ingest 4K UHD 60fps MP4 Master Video Assets',
        category: 'CREATIVE',
        assigneeName: 'Lucas Vance',
        assigneeRole: 'Motion Graphics Lead',
        dueDate: '2026-09-28',
        isCompleted: true,
        priority: 'URGENT',
        notes: 'Passed 4K resolution QA check with 10-bit color profile.',
      },
      {
        id: 'tsk_102',
        title: 'Run Brightness & Dayparting CMS Calibration',
        category: 'OPERATIONS',
        assigneeName: 'Derrick Hall',
        assigneeRole: 'Field NOC Engineer',
        dueDate: '2026-09-30',
        isCompleted: true,
        priority: 'HIGH',
        notes: 'Dynamic ambient sensor calibrated for Times Square nighttime dimming standards.',
      },
      {
        id: 'tsk_103',
        title: 'Mid-Flight Camera Verification & Live Traffic Audit',
        category: 'REPORTING',
        assigneeName: 'Alexandra Chen',
        assigneeRole: 'Campaign Director',
        dueDate: '2026-10-20',
        isCompleted: false,
        priority: 'MEDIUM',
        notes: 'Scheduled for week 3 foot-traffic audit.',
      },
      {
        id: 'tsk_104',
        title: 'Publish Final POP Proof-of-Performance Package',
        category: 'REPORTING',
        assigneeName: 'Alexandra Chen',
        assigneeRole: 'Campaign Director',
        dueDate: '2026-11-18',
        isCompleted: false,
        priority: 'HIGH',
        notes: 'Client requires formal notarized proof certificate with high-res photo audit.',
      },
    ],
    deliverables: [
      {
        id: 'deliv_101',
        siteId: 'csite_1',
        siteCode: 'BB-101',
        name: 'Sterling Chronograph 15s Hero Loop (4K UHD)',
        specDimensions: "3840 x 1080 (32:9 Aspect)",
        format: 'DIGITAL_MP4',
        status: 'DISPATCHED',
        version: 2,
        fileUrl: 'https://adversoft.cdn.io/creatives/sterling-holiday-4k-v2.mp4',
        updatedAt: '2026-09-29',
      },
    ],
    proofReport: {
      id: 'rep_101',
      generatedAt: '2026-10-05',
      certifiedBy: 'Marcus Brody',
      auditorTitle: 'Senior Vice President of Outdoor Media',
      totalImpressionsDelivered: 4250000,
      overallSlaScorePercent: 99.4,
      reportReferenceNumber: 'POP-2026-001',
      summaryNotes: 'Flight active with 0 logged downtime incidents. Impressions pacing at +4.2% above initial estimates.',
    },
    createdAt: '2026-09-20',
    updatedAt: '2026-10-05',
  },
  {
    id: 'cmp_2',
    campaignNumber: 'CMP-2026-002',
    name: 'AI Cloud Platform Q4 Launch',
    clientId: 'cli_2',
    clientCompanyName: 'Apex Global Technologies',
    clientAccountNumber: 'CLI-1002',
    brandName: 'Apex Cloud Neural OS',
    contractId: 'cnt_2',
    contractNumber: 'CNT-2026-002',
    bookingId: 'bkg_2',
    bookingNumber: 'BKG-2026-002',
    flightStartDate: '2026-08-01',
    flightEndDate: '2026-10-31',
    ...computeFlightMetrics('2026-08-01', '2026-10-31', 'LIVE'),
    status: 'LIVE',
    campaignManager: 'Alexandra Chen',
    totalBudget: 145000,
    actualSpend: 127933,
    mediaCost: 115500,
    productionCost: 8200,
    installationCost: 4233,
    tags: ['Tech & SaaS', 'Multi-Market', 'Silicon Valley', 'Sunset Strip'],
    targetAudienceSummary: 'Enterprise software decision makers, tech founders, engineers, and venture capital partners.',
    sites: [
      {
        id: 'csite_2a',
        billboardId: 'bb_2',
        billboardCode: 'BB-102',
        billboardName: 'Sunset Strip Monolith Spectacular',
        billboardCity: 'Los Angeles',
        billboardCorridor: 'Sunset Boulevard Creative Mile',
        dimensions: "60' x 20'",
        isDigital: false,
        structureType: 'BULLETIN_VINYL',
        flightStartDate: '2026-08-01',
        flightEndDate: '2026-10-31',
        dailyImpressions: 280000,
        totalImpressions: 25760000,
        monthlyRental: 22000,
        productionCost: 3200,
        installationCost: 1800,
        siteStatus: 'LIVE',
        proofPhotos: [
          {
            id: 'pop_3',
            type: 'DAY',
            url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop&q=80',
            caption: 'Sunset Boulevard westbound traffic view showing heavy afternoon congestion',
            verifiedAt: '2026-08-03 16:40',
            illuminated: false,
          },
        ],
      },
      {
        id: 'csite_2b',
        billboardId: 'bb_4',
        billboardCode: 'BB-104',
        billboardName: 'Downtown Financial Wallscape',
        billboardCity: 'San Francisco',
        billboardCorridor: 'Market Street Commercial Center',
        dimensions: "50' x 30'",
        isDigital: false,
        structureType: 'WALLSCAPE',
        flightStartDate: '2026-08-01',
        flightEndDate: '2026-10-31',
        dailyImpressions: 195000,
        totalImpressions: 17940000,
        monthlyRental: 16500,
        productionCost: 5000,
        installationCost: 2433,
        siteStatus: 'LIVE',
        proofPhotos: [
          {
            id: 'pop_4',
            type: 'NIGHT',
            url: 'https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?w=800&auto=format&fit=crop&q=80',
            caption: 'Market Street night illumination with halogen flood fixtures fully active',
            verifiedAt: '2026-08-04 21:10',
            illuminated: true,
          },
        ],
      },
    ],
    tasks: [
      {
        id: 'tsk_201',
        title: 'Large-Format Vinyl Mesh Proof Approval for Wallscape',
        category: 'CREATIVE',
        assigneeName: 'Lucas Vance',
        assigneeRole: 'Print Production Manager',
        dueDate: '2026-07-22',
        isCompleted: true,
        priority: 'HIGH',
      },
      {
        id: 'tsk_202',
        title: 'Boom Crane Rigging Permit & Police Escort Coordination',
        category: 'OPERATIONS',
        assigneeName: 'Carlos Mendoza',
        assigneeRole: 'Field Operations Supervisor',
        dueDate: '2026-07-28',
        isCompleted: true,
        priority: 'URGENT',
      },
      {
        id: 'tsk_203',
        title: 'Final POP Certification & Client Debrief Meeting',
        category: 'REPORTING',
        assigneeName: 'Alexandra Chen',
        assigneeRole: 'Campaign Director',
        dueDate: '2026-11-03',
        isCompleted: false,
        priority: 'HIGH',
      },
    ],
    deliverables: [
      {
        id: 'deliv_201',
        siteId: 'csite_2a',
        siteCode: 'BB-102',
        name: 'Apex Neural Cloud — Sunset Strip Vinyl Skin',
        specDimensions: "60' x 20' Heavyweight Vinyl",
        format: 'VINYL_BULLETIN',
        status: 'DISPATCHED',
        version: 1,
        updatedAt: '2026-07-25',
      },
      {
        id: 'deliv_202',
        siteId: 'csite_2b',
        siteCode: 'BB-104',
        name: 'Apex Neural Cloud — Financial Wallscape 50x30 Mesh',
        specDimensions: "50' x 30' Breathable Mesh Banner",
        format: 'VINYL_BULLETIN',
        status: 'DISPATCHED',
        version: 2,
        updatedAt: '2026-07-26',
      },
    ],
    proofReport: {
      id: 'rep_201',
      generatedAt: '2026-09-15',
      certifiedBy: 'Carlos Mendoza',
      auditorTitle: 'Field Operations Supervisor',
      totalImpressionsDelivered: 36500000,
      overallSlaScorePercent: 99.1,
      reportReferenceNumber: 'POP-2026-002',
      summaryNotes: 'Bi-weekly photo audit shows crisp vinyl tensioning and 100% illumination compliance across both markets.',
    },
    createdAt: '2026-07-15',
    updatedAt: '2026-09-15',
  },
  {
    id: 'cmp_3',
    campaignNumber: 'CMP-2026-003',
    name: 'EcoDrive Electric SUV Launch',
    clientId: 'cli_3',
    clientCompanyName: 'Vanguard Automotive Group',
    clientAccountNumber: 'CLI-1003',
    brandName: 'Vanguard Electra EV',
    contractId: 'cnt_3',
    contractNumber: 'CNT-2026-003',
    bookingId: 'bkg_3',
    bookingNumber: 'BKG-2026-003',
    flightStartDate: '2026-10-15',
    flightEndDate: '2026-12-31',
    ...computeFlightMetrics('2026-10-15', '2026-12-31', 'SCHEDULED'),
    status: 'SCHEDULED',
    campaignManager: 'Nathaniel Reed',
    totalBudget: 110000,
    actualSpend: 98500,
    mediaCost: 88500,
    productionCost: 6500,
    installationCost: 3500,
    tags: ['Automotive', 'Electric Vehicles', 'Midwest Arterials', 'Static + Digital'],
    targetAudienceSummary: 'Eco-conscious commuters, luxury automobile purchasers, and suburban family heads.',
    sites: [
      {
        id: 'csite_3',
        billboardId: 'bb_3',
        billboardCode: 'BB-103',
        billboardName: 'Kennedy Expressway Double-Faced Cantilever',
        billboardCity: 'Chicago',
        billboardCorridor: 'I-90 / I-94 Kennedy Expressway',
        dimensions: "48' x 14'",
        isDigital: false,
        structureType: 'BULLETIN_VINYL',
        flightStartDate: '2026-10-15',
        flightEndDate: '2026-12-31',
        dailyImpressions: 340000,
        totalImpressions: 26180000,
        monthlyRental: 14500,
        productionCost: 2800,
        installationCost: 1200,
        siteStatus: 'SCHEDULED',
        proofPhotos: [],
      },
    ],
    tasks: [
      {
        id: 'tsk_301',
        title: 'Approve High-Res Color Separation Test Proof',
        category: 'CREATIVE',
        assigneeName: 'Lucas Vance',
        assigneeRole: 'Creative Director',
        dueDate: '2026-10-06',
        isCompleted: true,
        priority: 'HIGH',
      },
      {
        id: 'tsk_302',
        title: 'Print & Ship Heavyweight Vinyl Skins to Chicago Depot',
        category: 'PRODUCTION',
        assigneeName: 'Midwest Print Partners',
        assigneeRole: 'Print Vendor',
        dueDate: '2026-10-10',
        isCompleted: false,
        priority: 'URGENT',
      },
      {
        id: 'tsk_303',
        title: 'Rigging Crew Pre-Installation Site Walkthrough',
        category: 'OPERATIONS',
        assigneeName: 'Derrick Hall',
        assigneeRole: 'Field NOC Engineer',
        dueDate: '2026-10-14',
        isCompleted: false,
        priority: 'MEDIUM',
      },
    ],
    deliverables: [
      {
        id: 'deliv_301',
        siteId: 'csite_3',
        siteCode: 'BB-103',
        name: 'Vanguard Electra SUV — Kennedy Express Outbound Face',
        specDimensions: "48' x 14' Seamless Vinyl with 3in Pockets",
        format: 'VINYL_BULLETIN',
        status: 'SENT_TO_PRINT',
        version: 1,
        updatedAt: '2026-10-04',
      },
    ],
    createdAt: '2026-09-22',
    updatedAt: '2026-10-04',
  },
  {
    id: 'cmp_4',
    campaignNumber: 'CMP-2026-004',
    name: 'Horizon Health Open Enrollment 2027',
    clientId: 'cli_4',
    clientCompanyName: 'Horizon Healthcare Network',
    clientAccountNumber: 'CLI-1004',
    brandName: 'Horizon Advantage HMO',
    flightStartDate: '2026-11-01',
    flightEndDate: '2027-01-15',
    ...computeFlightMetrics('2026-11-01', '2027-01-15', 'PLANNING'),
    status: 'PLANNING',
    campaignManager: 'Nathaniel Reed',
    totalBudget: 75000,
    actualSpend: 0,
    mediaCost: 65000,
    productionCost: 6000,
    installationCost: 4000,
    tags: ['Healthcare', 'Open Enrollment', 'Transit & Arterials'],
    targetAudienceSummary: 'Families, self-employed professionals, and regional corporate HR benefit coordinators.',
    sites: [
      {
        id: 'csite_4',
        billboardId: 'bb_5',
        billboardCode: 'BB-105',
        billboardName: 'Biscayne Boulevard Gateway Monolith',
        billboardCity: 'Miami',
        billboardCorridor: 'Biscayne Corridor / Downtown Connector',
        dimensions: "36' x 12'",
        isDigital: true,
        structureType: 'DIGITAL_LED',
        shareOfVoicePercent: 16.6,
        spotFrequencySeconds: 90,
        flightStartDate: '2026-11-01',
        flightEndDate: '2027-01-15',
        dailyImpressions: 210000,
        totalImpressions: 15750000,
        monthlyRental: 18500,
        productionCost: 0,
        installationCost: 250,
        siteStatus: 'SCHEDULED',
        proofPhotos: [],
      },
    ],
    tasks: [
      {
        id: 'tsk_401',
        title: 'Draft Healthcare Disclaimer & Regulatory Sign-Off',
        category: 'CREATIVE',
        assigneeName: 'Nathaniel Reed',
        assigneeRole: 'Compliance Officer',
        dueDate: '2026-10-18',
        isCompleted: false,
        priority: 'HIGH',
      },
      {
        id: 'tsk_402',
        title: 'Finalize Schedule A Booking Reservation in System',
        category: 'OPERATIONS',
        assigneeName: 'Nathaniel Reed',
        assigneeRole: 'Campaign Director',
        dueDate: '2026-10-20',
        isCompleted: false,
        priority: 'MEDIUM',
      },
    ],
    deliverables: [
      {
        id: 'deliv_401',
        siteId: 'csite_4',
        siteCode: 'BB-105',
        name: 'Horizon Health Enrollment 10s Digital Spot',
        specDimensions: "1920 x 640 (3:1 Aspect)",
        format: 'DIGITAL_STATIC_JPEG',
        status: 'IN_REVIEW',
        version: 1,
        updatedAt: '2026-10-02',
      },
    ],
    createdAt: '2026-10-01',
    updatedAt: '2026-10-02',
  },
  {
    id: 'cmp_5',
    campaignNumber: 'CMP-2026-005',
    name: 'Peak Energy Summer Metro Blitz',
    clientId: 'cli_5',
    clientCompanyName: 'Peak Energy Beverages',
    clientAccountNumber: 'CLI-1005',
    brandName: 'Peak Zero Ultra',
    flightStartDate: '2026-06-01',
    flightEndDate: '2026-08-31',
    ...computeFlightMetrics('2026-06-01', '2026-08-31', 'COMPLETED'),
    status: 'COMPLETED',
    campaignManager: 'Alexandra Chen',
    totalBudget: 85000,
    actualSpend: 81400,
    mediaCost: 72000,
    productionCost: 5800,
    installationCost: 3600,
    tags: ['Beverage', 'Youth Culture', 'Summer Season', 'High Frequency'],
    targetAudienceSummary: 'Active lifestyle youth, college students, athletes, and daily highway commuters.',
    sites: [
      {
        id: 'csite_5',
        billboardId: 'bb_6',
        billboardCode: 'BB-106',
        billboardName: 'Midtown Tunnel Approach High-Impact Bulletin',
        billboardCity: 'New York',
        billboardCorridor: 'Long Island Expressway Midtown Approach',
        dimensions: "48' x 14'",
        isDigital: false,
        structureType: 'BULLETIN_VINYL',
        flightStartDate: '2026-06-01',
        flightEndDate: '2026-08-31',
        dailyImpressions: 310000,
        totalImpressions: 28520000,
        monthlyRental: 24000,
        productionCost: 2900,
        installationCost: 1800,
        siteStatus: 'CONCLUDED',
        proofPhotos: [
          {
            id: 'pop_5',
            type: 'DAY',
            url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80',
            caption: 'Clear midday direct approach capture showing uninterrupted sightlines from 800ft',
            verifiedAt: '2026-06-04 12:30',
            illuminated: false,
          },
        ],
      },
    ],
    tasks: [
      {
        id: 'tsk_501',
        title: 'Takedown and Recycle Summer Vinyl Banners',
        category: 'OPERATIONS',
        assigneeName: 'Carlos Mendoza',
        assigneeRole: 'Field Operations Supervisor',
        dueDate: '2026-09-02',
        isCompleted: true,
        priority: 'MEDIUM',
      },
      {
        id: 'tsk_502',
        title: 'Issue Comprehensive Certified POP Performance Dossier',
        category: 'REPORTING',
        assigneeName: 'Alexandra Chen',
        assigneeRole: 'Campaign Director',
        dueDate: '2026-09-05',
        isCompleted: true,
        priority: 'HIGH',
      },
    ],
    deliverables: [
      {
        id: 'deliv_501',
        siteId: 'csite_5',
        siteCode: 'BB-106',
        name: 'Peak Zero Summer Burst 48x14 Vinyl',
        specDimensions: "48' x 14' Heavy Vinyl",
        format: 'VINYL_BULLETIN',
        status: 'DISPATCHED',
        version: 2,
        updatedAt: '2026-05-28',
      },
    ],
    proofReport: {
      id: 'rep_501',
      generatedAt: '2026-09-05',
      certifiedBy: 'Marcus Brody',
      auditorTitle: 'Senior Vice President of Outdoor Media',
      totalImpressionsDelivered: 29150000,
      overallSlaScorePercent: 99.8,
      reportReferenceNumber: 'POP-2026-005',
      summaryNotes: 'Campaign executed with 100% illumination compliance and zero structural or creative discrepancies.',
    },
    createdAt: '2026-05-10',
    updatedAt: '2026-09-05',
  },
];

const CAMPAIGNS_STORAGE_KEY = 'adversoft_campaigns_v1';

export function getStoredCampaigns(tenantId?: string): CampaignRecord[] {
  if (typeof window === 'undefined') return isDemoTenant(tenantId) ? INITIAL_CAMPAIGNS : [];
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey(CAMPAIGNS_STORAGE_KEY, tid);
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      if (isDemoTenant(tid)) {
        localStorage.setItem(key, JSON.stringify(INITIAL_CAMPAIGNS));
        return INITIAL_CAMPAIGNS;
      }
      return [];
    }
    const parsed: CampaignRecord[] = JSON.parse(data);
    // Recalculate dynamic flight progress
    return parsed.map((c) => ({
      ...c,
      ...computeFlightMetrics(c.flightStartDate, c.flightEndDate, c.status),
    }));
  } catch {
    return isDemoTenant(tid) ? INITIAL_CAMPAIGNS : [];
  }
}

export function saveStoredCampaigns(campaigns: CampaignRecord[], tenantId?: string): void {
  if (typeof window === 'undefined') return;
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey(CAMPAIGNS_STORAGE_KEY, tid);
  try {
    localStorage.setItem(key, JSON.stringify(campaigns));
    window.dispatchEvent(new CustomEvent('adversoft_campaigns_updated', { detail: campaigns }));
  } catch (err) {
    console.error('Failed to save campaigns:', err);
  }
}

export interface CreateCampaignInput {
  name: string;
  clientId: string;
  brandName?: string;
  contractId?: string;
  bookingId?: string;
  flightStartDate: string;
  flightEndDate: string;
  totalBudget: number;
  campaignManager?: string;
  targetAudienceSummary?: string;
  tags?: string[];
  selectedBillboardIds: string[];
}

export function createCampaign(input: CreateCampaignInput): {
  success: boolean;
  campaign?: CampaignRecord;
  error?: string;
} {
  const clients = INITIAL_CLIENTS;
  const client = clients.find((c) => c.id === input.clientId || c.accountNumber === input.clientId);
  if (!client) {
    return { success: false, error: 'Client account not found.' };
  }

  const sDate = new Date(input.flightStartDate);
  const eDate = new Date(input.flightEndDate);
  if (eDate <= sDate) {
    return { success: false, error: 'Flight end date must be after flight start date.' };
  }

  const current = getStoredCampaigns();
  const nextNum = 10 + current.length;
  const campaignNumber = `CMP-2026-${String(nextNum).padStart(3, '0')}`;
  const today = new Date().toISOString().split('T')[0];

  const flightMetrics = computeFlightMetrics(input.flightStartDate, input.flightEndDate, 'PLANNING');

  const selectedSites: CampaignSiteAllocation[] = [];
  const initialDeliverables: CampaignDeliverable[] = [];

  let totalMediaCost = 0;
  let totalProdCost = 0;
  let totalInstallCost = 0;

  for (const bId of input.selectedBillboardIds) {
    const bb = INITIAL_BILLBOARDS.find((b) => b.id === bId || b.code === bId);
    if (!bb) continue;

    const siteId = `csite_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const months = Math.max(0.5, Number((flightMetrics.totalFlightDays / 30).toFixed(1)));
    const siteMonthly = bb.monthlyRate;
    const siteTotalRent = Math.round(siteMonthly * months);
    const prodCost = bb.productionCost;
    const installCost = bb.installationCost;

    totalMediaCost += siteTotalRent;
    totalProdCost += prodCost;
    totalInstallCost += installCost;

    selectedSites.push({
      id: siteId,
      billboardId: bb.id,
      billboardCode: bb.code,
      billboardName: bb.name,
      billboardCity: bb.location.city,
      billboardCorridor: bb.location.corridorName,
      dimensions: `${bb.widthFeet}' x ${bb.heightFeet}'`,
      isDigital: bb.isDigital,
      structureType: bb.type,
      shareOfVoicePercent: bb.isDigital ? 20.0 : undefined,
      spotFrequencySeconds: bb.isDigital ? 60 : undefined,
      flightStartDate: input.flightStartDate,
      flightEndDate: input.flightEndDate,
      dailyImpressions: bb.location.dailyTrafficCount,
      totalImpressions: bb.location.dailyTrafficCount * flightMetrics.totalFlightDays,
      monthlyRental: siteMonthly,
      productionCost: prodCost,
      installationCost: installCost,
      siteStatus: 'SCHEDULED',
      proofPhotos: [],
    });

    initialDeliverables.push({
      id: `deliv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      siteId,
      siteCode: bb.code,
      name: `${input.brandName || input.name} — ${bb.code} Artwork`,
      specDimensions: `${bb.widthFeet}' x ${bb.heightFeet}'`,
      format: bb.isDigital ? 'DIGITAL_MP4' : 'VINYL_BULLETIN',
      status: 'PENDING_UPLOAD',
      version: 1,
      updatedAt: today,
    });
  }

  const initialTasks: CampaignTask[] = [
    {
      id: `tsk_${Date.now()}_1`,
      title: 'Review Client Creative Brief & Dimension Specifications',
      category: 'CREATIVE',
      assigneeName: input.campaignManager || 'Alexandra Chen',
      assigneeRole: 'Campaign Director',
      dueDate: input.flightStartDate,
      isCompleted: false,
      priority: 'HIGH',
      notes: 'Confirm high-resolution artwork specs conform to billboard sizes.',
    },
    {
      id: `tsk_${Date.now()}_2`,
      title: 'Confirm Billboard Booking Hold & Technical Readiness',
      category: 'OPERATIONS',
      assigneeName: 'Carlos Mendoza',
      assigneeRole: 'Field Operations Supervisor',
      dueDate: input.flightStartDate,
      isCompleted: false,
      priority: 'HIGH',
      notes: 'Inspect structural lighting and power access prior to installation.',
    },
    {
      id: `tsk_${Date.now()}_3`,
      title: 'Post-Install Proof-of-Posting Photo Audit',
      category: 'REPORTING',
      assigneeName: input.campaignManager || 'Alexandra Chen',
      assigneeRole: 'Campaign Director',
      dueDate: input.flightStartDate,
      isCompleted: false,
      priority: 'URGENT',
      notes: 'Upload day and night illuminated photos within 48 hours of flight live date.',
    },
  ];

  const totalCalculated = totalMediaCost + totalProdCost + totalInstallCost;
  const finalBudget = Math.max(input.totalBudget, totalCalculated);

  const newCampaign: CampaignRecord = {
    id: `cmp_${Date.now()}`,
    campaignNumber,
    name: input.name,
    clientId: client.id,
    clientCompanyName: client.companyName,
    clientAccountNumber: client.accountNumber,
    brandName: input.brandName || client.companyName,
    contractId: input.contractId,
    bookingId: input.bookingId,
    flightStartDate: input.flightStartDate,
    flightEndDate: input.flightEndDate,
    ...flightMetrics,
    status: 'PLANNING',
    campaignManager: input.campaignManager || 'Alexandra Chen',
    totalBudget: finalBudget,
    actualSpend: 0,
    mediaCost: totalMediaCost,
    productionCost: totalProdCost,
    installationCost: totalInstallCost,
    sites: selectedSites,
    tasks: initialTasks,
    deliverables: initialDeliverables,
    tags: input.tags && input.tags.length > 0 ? input.tags : ['Out-of-Home', 'Brand Awareness'],
    targetAudienceSummary:
      input.targetAudienceSummary || 'Urban professionals, motorists, and metropolitan consumers.',
    createdAt: today,
    updatedAt: today,
  };

  const updated = [newCampaign, ...current];
  saveStoredCampaigns(updated);
  return { success: true, campaign: newCampaign };
}

export function updateCampaignStatus(
  campaignId: string,
  newStatus: CampaignStatus,
  reason?: string
): { success: boolean; campaign?: CampaignRecord; error?: string } {
  const campaigns = getStoredCampaigns();
  const c = campaigns.find((item) => item.id === campaignId || item.campaignNumber === campaignId);
  if (!c) return { success: false, error: 'Campaign not found.' };

  c.status = newStatus;
  c.updatedAt = new Date().toISOString().split('T')[0];

  // If set to live, actualSpend reflects initial production & media
  if (newStatus === 'LIVE' && c.actualSpend === 0) {
    c.actualSpend = Math.round(c.productionCost + c.installationCost + c.mediaCost * 0.5);
  } else if (newStatus === 'COMPLETED') {
    c.actualSpend = c.mediaCost + c.productionCost + c.installationCost;
    c.daysRemaining = 0;
    c.flightProgressPercent = 100;
  }

  saveStoredCampaigns([...campaigns]);
  return { success: true, campaign: c };
}

export function toggleCampaignTask(
  campaignId: string,
  taskId: string
): { success: boolean; campaign?: CampaignRecord; error?: string } {
  const campaigns = getStoredCampaigns();
  const c = campaigns.find((item) => item.id === campaignId || item.campaignNumber === campaignId);
  if (!c) return { success: false, error: 'Campaign not found.' };

  const task = c.tasks.find((t) => t.id === taskId);
  if (!task) return { success: false, error: 'Task not found.' };

  task.isCompleted = !task.isCompleted;
  c.updatedAt = new Date().toISOString().split('T')[0];

  saveStoredCampaigns([...campaigns]);
  return { success: true, campaign: c };
}

export function addCampaignTask(
  campaignId: string,
  taskInput: {
    title: string;
    category: TaskCategory;
    assigneeName: string;
    assigneeRole: string;
    dueDate: string;
    priority: TaskPriority;
    notes?: string;
  }
): { success: boolean; campaign?: CampaignRecord; error?: string } {
  const campaigns = getStoredCampaigns();
  const c = campaigns.find((item) => item.id === campaignId || item.campaignNumber === campaignId);
  if (!c) return { success: false, error: 'Campaign not found.' };

  const newTask: CampaignTask = {
    id: `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: taskInput.title,
    category: taskInput.category,
    assigneeName: taskInput.assigneeName,
    assigneeRole: taskInput.assigneeRole,
    dueDate: taskInput.dueDate,
    isCompleted: false,
    priority: taskInput.priority,
    notes: taskInput.notes,
  };

  c.tasks.push(newTask);
  c.updatedAt = new Date().toISOString().split('T')[0];

  saveStoredCampaigns([...campaigns]);
  return { success: true, campaign: c };
}

export function addProofPhoto(
  campaignId: string,
  siteId: string,
  photo: {
    type: 'DAY' | 'NIGHT' | 'INSTALL' | 'DRONE';
    url: string;
    caption: string;
    illuminated?: boolean;
  }
): { success: boolean; campaign?: CampaignRecord; error?: string } {
  const campaigns = getStoredCampaigns();
  const c = campaigns.find((item) => item.id === campaignId || item.campaignNumber === campaignId);
  if (!c) return { success: false, error: 'Campaign not found.' };

  const site = c.sites.find((s) => s.id === siteId || s.billboardId === siteId || s.billboardCode === siteId);
  if (!site) return { success: false, error: 'Site allocation not found.' };

  const newPhoto: ProofPhotoItem = {
    id: `pop_${Date.now()}`,
    type: photo.type,
    url: photo.url,
    caption: photo.caption,
    verifiedAt: new Date().toLocaleString(),
    illuminated: photo.illuminated ?? (photo.type === 'NIGHT'),
  };

  site.proofPhotos.push(newPhoto);
  site.siteStatus = 'LIVE';
  c.updatedAt = new Date().toISOString().split('T')[0];

  saveStoredCampaigns([...campaigns]);
  return { success: true, campaign: c };
}

export function generateProofReport(
  campaignId: string,
  summaryNotes: string,
  certifiedBy: string = 'Marcus Brody'
): { success: boolean; campaign?: CampaignRecord; error?: string } {
  const campaigns = getStoredCampaigns();
  const c = campaigns.find((item) => item.id === campaignId || item.campaignNumber === campaignId);
  if (!c) return { success: false, error: 'Campaign not found.' };

  const totalDelivered = c.sites.reduce((sum, s) => {
    const elapsedFrac = Math.max(0.1, c.flightProgressPercent / 100);
    return sum + Math.round(s.totalImpressions * elapsedFrac);
  }, 0);

  const report: CampaignProofReport = {
    id: `rep_${Date.now()}`,
    generatedAt: new Date().toISOString().split('T')[0],
    certifiedBy,
    auditorTitle: 'Senior Vice President of Outdoor Media',
    totalImpressionsDelivered: totalDelivered,
    overallSlaScorePercent: 99.6,
    reportReferenceNumber: `POP-${c.campaignNumber.replace('CMP-', '')}`,
    summaryNotes:
      summaryNotes ||
      `Official certified Out-of-Home Proof-of-Performance dossier for ${c.name}. All billboard sites audited for illumination, print fidelity, and uptime compliance.`,
  };

  c.proofReport = report;
  c.updatedAt = new Date().toISOString().split('T')[0];

  saveStoredCampaigns([...campaigns]);
  return { success: true, campaign: c };
}

export function getCampaignMetrics() {
  const list = getStoredCampaigns();
  const total = list.length;
  const liveCount = list.filter((c) => c.status === 'LIVE').length;
  const scheduledCount = list.filter((c) => c.status === 'SCHEDULED').length;
  const planningCount = list.filter((c) => c.status === 'PLANNING').length;
  const completedCount = list.filter((c) => c.status === 'COMPLETED').length;

  const totalFlightValue = list.reduce((sum, c) => sum + c.totalBudget, 0);
  const totalSpend = list.reduce((sum, c) => sum + c.actualSpend, 0);

  const totalImpressionsAll = list.reduce((sum, c) => {
    return sum + c.sites.reduce((sSum, site) => sSum + site.totalImpressions, 0);
  }, 0);

  const avgCompletionRate =
    list.length > 0
      ? Number(
          (
            list.reduce((sum, c) => sum + c.flightProgressPercent, 0) / list.length
          ).toFixed(1)
        )
      : 99.4;

  return {
    total,
    liveCount,
    scheduledCount,
    planningCount,
    completedCount,
    totalFlightValue,
    totalSpend,
    totalImpressionsAll,
    avgCompletionRate,
  };
}
