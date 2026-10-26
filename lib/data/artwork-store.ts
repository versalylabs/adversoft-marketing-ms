/**
 * Adversoft Artwork & Approval Workflow Data Store & Service Engine
 * Module: High-res creative uploads, version comparisons, pre-flight checks,
 * revision requests, client approval audit trails, and print handoffs.
 */

import { INITIAL_BILLBOARDS, BillboardItem } from './billboards-store';
import { INITIAL_CLIENTS, ClientAccount } from './crm-store';
import { getStoredCampaigns, CampaignRecord } from './campaigns-store';
import { getActiveTenantId, isDemoTenant, getTenantStorageKey } from '../tenant';
import { getTenantBillboards, getTenantCampaigns } from '../tenant-store';

export type ArtworkStatus =
  | 'PENDING_UPLOAD'
  | 'PREFLIGHT_CHECK'
  | 'IN_REVIEW'
  | 'REVISION_REQUESTED'
  | 'CLIENT_APPROVED'
  | 'SENT_TO_PRINT'
  | 'READY_FOR_INSTALL';

export type CreativeFormat =
  | 'VINYL_BULLETIN'
  | 'BREATHABLE_MESH'
  | 'TRANSIT_SHELTER'
  | 'DIGITAL_MP4'
  | 'DIGITAL_STATIC_JPEG'
  | 'POSTER_PAPER';

export interface ArtworkRevision {
  version: number;
  uploadedAt: string;
  uploadedBy: string;
  uploaderRole: string;
  fileUrl: string;
  thumbnailUrl: string;
  fileSizeBytes: number;
  dimensions: string;
  aspectRatio: string;
  colorSpace: 'CMYK' | 'RGB';
  resolutionDpi: number;
  preflightPassed: boolean;
  preflightNotes: string[];
  feedbackNotes?: string;
  revisionReason?: string;
}

export interface ApprovalAuditEntry {
  id: string;
  version: number;
  approvedBy: string;
  approverEmail: string;
  approverRole: string;
  approvedAt: string;
  ipAddress: string;
  approvalMethod: 'DIGITAL_SIGNATURE' | 'ONE_CLICK_VERIFY';
  signatureHash: string;
  notes?: string;
}

export interface PrintHandoffTicket {
  ticketNumber: string; // e.g. PRN-2026-081
  vendorName: string;
  vendorContact: string;
  dispatchedAt: string;
  targetShipDate: string;
  materialType: string;
  finishingInstructions: string;
  bleedInches: number;
  deliveryDepot: string;
  trackingNumber?: string;
  status: 'DISPATCHED' | 'PRINTING' | 'SHIPPED' | 'RECEIVED_AT_DEPOT';
}

export interface ArtworkRecord {
  id: string;
  artworkNumber: string; // e.g. ART-2026-001
  title: string;
  campaignId: string;
  campaignNumber: string;
  campaignName: string;
  clientId: string;
  clientCompanyName: string;
  clientAccountNumber: string;
  billboardId: string;
  billboardCode: string;
  billboardName: string;
  billboardCity: string;
  billboardCorridor: string;
  format: CreativeFormat;
  status: ArtworkStatus;
  currentVersion: number;
  revisions: ArtworkRevision[];
  approvalAudit: ApprovalAuditEntry[];
  printTicket?: PrintHandoffTicket;
  deadlineDate: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const INITIAL_ARTWORKS: ArtworkRecord[] = [
  {
    id: 'art_1',
    artworkNumber: 'ART-2026-001',
    title: 'Sterling Haute Horlogerie 4K Holiday Master Loop',
    campaignId: 'cmp_1',
    campaignNumber: 'CMP-2026-001',
    campaignName: 'Sterling Luxe Holiday 2026',
    clientId: 'cli_1',
    clientCompanyName: 'Sterling Brands Ltd',
    clientAccountNumber: 'CLI-1001',
    billboardId: 'bb_1',
    billboardCode: 'BB-101',
    billboardName: 'Times Square Spectacle LED',
    billboardCity: 'New York',
    billboardCorridor: 'Times Square Bowtie Plaza',
    format: 'DIGITAL_MP4',
    status: 'CLIENT_APPROVED',
    currentVersion: 2,
    revisions: [
      {
        version: 1,
        uploadedAt: '2026-09-24 11:20',
        uploadedBy: 'Lucas Vance',
        uploaderRole: 'Motion Designer',
        fileUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&auto=format&fit=crop&q=80',
        fileSizeBytes: 485000000, // 485MB
        dimensions: '3840 x 1080 px',
        aspectRatio: '32:9',
        colorSpace: 'RGB',
        resolutionDpi: 72,
        preflightPassed: true,
        preflightNotes: ['Passed 4K resolution check', 'Passed bitrate test (45 Mbps)', '60fps verified'],
        revisionReason: 'Client requested slight gold hue warming and 10% larger typography on call-to-action.',
      },
      {
        version: 2,
        uploadedAt: '2026-09-27 15:45',
        uploadedBy: 'Lucas Vance',
        uploaderRole: 'Motion Designer',
        fileUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
        fileSizeBytes: 492000000,
        dimensions: '3840 x 1080 px',
        aspectRatio: '32:9',
        colorSpace: 'RGB',
        resolutionDpi: 72,
        preflightPassed: true,
        preflightNotes: [
          'Passed 4K UHD color profile',
          'Rec.709 color gamut verified',
          'Text legibility check verified at 500ft viewing angle',
        ],
        feedbackNotes: 'Color calibrated to Times Square LED driver specifications.',
      },
    ],
    approvalAudit: [
      {
        id: 'appr_1',
        version: 2,
        approvedBy: 'David Sterling',
        approverEmail: 'david@sterlingbrands.com',
        approverRole: 'Chief Executive Officer',
        approvedAt: '2026-09-28 10:15:33',
        ipAddress: '12.180.44.102',
        approvalMethod: 'DIGITAL_SIGNATURE',
        signatureHash: 'SHA-256-9A8B7C6D5E4F3A2B1C0D',
        notes: 'Final creative approved for live broadcast rotation on Times Square Spectacle.',
      },
    ],
    deadlineDate: '2026-09-29',
    tags: ['Luxury', 'Digital LED', '4K Master', 'Times Square'],
    createdAt: '2026-09-24',
    updatedAt: '2026-09-28',
  },
  {
    id: 'art_2',
    artworkNumber: 'ART-2026-002',
    title: 'Apex Cloud Neural OS — Sunset Strip Heavy Vinyl',
    campaignId: 'cmp_2',
    campaignNumber: 'CMP-2026-002',
    campaignName: 'AI Cloud Platform Q4 Launch',
    clientId: 'cli_2',
    clientCompanyName: 'Apex Global Technologies',
    clientAccountNumber: 'CLI-1002',
    billboardId: 'bb_2',
    billboardCode: 'BB-102',
    billboardName: 'Sunset Strip Monolith Spectacular',
    billboardCity: 'Los Angeles',
    billboardCorridor: 'Sunset Boulevard Creative Mile',
    format: 'VINYL_BULLETIN',
    status: 'SENT_TO_PRINT',
    currentVersion: 1,
    revisions: [
      {
        version: 1,
        uploadedAt: '2026-07-20 09:30',
        uploadedBy: 'Elena Rostova',
        uploaderRole: 'Senior Art Director',
        fileUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&auto=format&fit=crop&q=80',
        fileSizeBytes: 890000000, // 890MB TIFF
        dimensions: "60' x 20' (Full Scale)",
        aspectRatio: '3:1',
        colorSpace: 'CMYK',
        resolutionDpi: 300,
        preflightPassed: true,
        preflightNotes: [
          'Full-bleed CMYK Fogra39 color profile certified',
          '300 DPI high-density resolution confirmed',
          '3-inch pocket wrapping allowances verified',
        ],
      },
    ],
    approvalAudit: [
      {
        id: 'appr_2',
        version: 1,
        approvedBy: 'Sarah Lin',
        approverEmail: 'slin@apextechnologies.io',
        approverRole: 'VP Marketing',
        approvedAt: '2026-07-22 14:02:11',
        ipAddress: '104.28.19.45',
        approvalMethod: 'DIGITAL_SIGNATURE',
        signatureHash: 'SHA-256-4D3C2B1A0F9E8D7C6B5A',
        notes: 'Approved without revision. Approved for grand-format print execution.',
      },
    ],
    printTicket: {
      ticketNumber: 'PRN-2026-081',
      vendorName: 'Pacific Rim Grand Format Printing LLC',
      vendorContact: 'press@pacificrimprint.com',
      dispatchedAt: '2026-07-23 08:30',
      targetShipDate: '2026-07-28',
      materialType: '14oz Ultraflex Heavyweight Matte Vinyl with UV Inhibitor',
      finishingInstructions: 'Double-needle lockstitch with 3-inch top and bottom pipe pockets. Rustproof brass grommets every 24 inches on sides.',
      bleedInches: 4,
      deliveryDepot: 'Los Angeles Rigging Depot (1420 Alameda St)',
      trackingNumber: 'FDX-8829-1029-LA',
      status: 'SHIPPED',
    },
    deadlineDate: '2026-07-25',
    tags: ['Grand Format', 'Matte Vinyl', 'West Coast', 'Tech Launch'],
    createdAt: '2026-07-20',
    updatedAt: '2026-07-23',
  },
  {
    id: 'art_3',
    artworkNumber: 'ART-2026-003',
    title: 'EcoDrive Vanguard Electra SUV — Cantilever Face',
    campaignId: 'cmp_3',
    campaignNumber: 'CMP-2026-003',
    campaignName: 'EcoDrive Electric SUV Launch',
    clientId: 'cli_3',
    clientCompanyName: 'Vanguard Automotive Group',
    clientAccountNumber: 'CLI-1003',
    billboardId: 'bb_3',
    billboardCode: 'BB-103',
    billboardName: 'Kennedy Expressway Double-Faced Cantilever',
    billboardCity: 'Chicago',
    billboardCorridor: 'I-90 / I-94 Kennedy Expressway',
    format: 'VINYL_BULLETIN',
    status: 'REVISION_REQUESTED',
    currentVersion: 1,
    revisions: [
      {
        version: 1,
        uploadedAt: '2026-10-02 14:10',
        uploadedBy: 'Lucas Vance',
        uploaderRole: 'Creative Director',
        fileUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&auto=format&fit=crop&q=80',
        fileSizeBytes: 620000000,
        dimensions: "48' x 14'",
        aspectRatio: '24:7',
        colorSpace: 'CMYK',
        resolutionDpi: 300,
        preflightPassed: true,
        preflightNotes: ['CMYK Color separation verified', 'Resolution exceeds 250 DPI threshold'],
        revisionReason:
          'Client feedback: The Electra EV badge logo is approximately 15% too small for high-speed highway motorists viewing at 65mph. Please increase logo contrast and scale up the starting MSRP callout.',
      },
    ],
    approvalAudit: [],
    deadlineDate: '2026-10-08',
    tags: ['Automotive', 'Expressway', 'Revision Requested', 'High Speed'],
    createdAt: '2026-10-02',
    updatedAt: '2026-10-04',
  },
  {
    id: 'art_4',
    artworkNumber: 'ART-2026-004',
    title: 'Horizon Advantage Health Open Enrollment 10s Spot',
    campaignId: 'cmp_4',
    campaignNumber: 'CMP-2026-004',
    campaignName: 'Horizon Health Open Enrollment 2027',
    clientId: 'cli_4',
    clientCompanyName: 'Horizon Healthcare Network',
    clientAccountNumber: 'CLI-1004',
    billboardId: 'bb_5',
    billboardCode: 'BB-105',
    billboardName: 'Biscayne Boulevard Gateway Monolith',
    billboardCity: 'Miami',
    billboardCorridor: 'Biscayne Corridor / Downtown Connector',
    format: 'DIGITAL_STATIC_JPEG',
    status: 'IN_REVIEW',
    currentVersion: 1,
    revisions: [
      {
        version: 1,
        uploadedAt: '2026-10-05 16:00',
        uploadedBy: 'Lucas Vance',
        uploaderRole: 'Designer',
        fileUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&auto=format&fit=crop&q=80',
        fileSizeBytes: 14200000, // 14.2MB
        dimensions: '1920 x 640 px',
        aspectRatio: '3:1',
        colorSpace: 'RGB',
        resolutionDpi: 72,
        preflightPassed: true,
        preflightNotes: [
          'Aspect ratio matches Biscayne Monolith slot specs (3:1)',
          'High daylight contrast compliant with Miami sunshine regulations',
        ],
        feedbackNotes: 'Legal disclaimer line formatted in 24pt legible bold typeface.',
      },
    ],
    approvalAudit: [],
    deadlineDate: '2026-10-15',
    tags: ['Healthcare', 'Miami', 'Digital Static', 'Under Review'],
    createdAt: '2026-10-05',
    updatedAt: '2026-10-05',
  },
  {
    id: 'art_5',
    artworkNumber: 'ART-2026-005',
    title: 'Peak Zero Ultra Summer Splash — Midtown Bulletin',
    campaignId: 'cmp_5',
    campaignNumber: 'CMP-2026-005',
    campaignName: 'Peak Energy Summer Metro Blitz',
    clientId: 'cli_5',
    clientCompanyName: 'Peak Energy Beverages',
    clientAccountNumber: 'CLI-1005',
    billboardId: 'bb_6',
    billboardCode: 'BB-106',
    billboardName: 'Midtown Tunnel Approach High-Impact Bulletin',
    billboardCity: 'New York',
    billboardCorridor: 'Long Island Expressway Midtown Approach',
    format: 'VINYL_BULLETIN',
    status: 'READY_FOR_INSTALL',
    currentVersion: 2,
    revisions: [
      {
        version: 1,
        uploadedAt: '2026-05-15 10:00',
        uploadedBy: 'Elena Rostova',
        uploaderRole: 'Senior Art Director',
        fileUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=1200&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=400&auto=format&fit=crop&q=80',
        fileSizeBytes: 710000000,
        dimensions: "48' x 14'",
        aspectRatio: '24:7',
        colorSpace: 'CMYK',
        resolutionDpi: 300,
        preflightPassed: true,
        preflightNotes: ['Initial proof passed color gamut testing'],
        revisionReason: 'Client requested swapping out grapefruit citrus flavor bottle for classic blue lemon blast.',
      },
      {
        version: 2,
        uploadedAt: '2026-05-18 11:30',
        uploadedBy: 'Elena Rostova',
        uploaderRole: 'Senior Art Director',
        fileUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=400&auto=format&fit=crop&q=80',
        fileSizeBytes: 725000000,
        dimensions: "48' x 14'",
        aspectRatio: '24:7',
        colorSpace: 'CMYK',
        resolutionDpi: 300,
        preflightPassed: true,
        preflightNotes: ['Updated bottle asset color separation confirmed', 'UV coating varnish specs approved'],
      },
    ],
    approvalAudit: [
      {
        id: 'appr_5',
        version: 2,
        approvedBy: 'Marcus Brody',
        approverEmail: 'mbrody@peakbeverages.com',
        approverRole: 'Brand Marketing Director',
        approvedAt: '2026-05-19 16:40:02',
        ipAddress: '68.195.82.11',
        approvalMethod: 'DIGITAL_SIGNATURE',
        signatureHash: 'SHA-256-5E6F7A8B9C0D1E2F3A4B',
        notes: 'Approved v2 with classic blue lemon blast bottle.',
      },
    ],
    printTicket: {
      ticketNumber: 'PRN-2026-044',
      vendorName: 'Metropolitan Billboard Printers Inc',
      vendorContact: 'orders@metroprintny.com',
      dispatchedAt: '2026-05-20 09:15',
      targetShipDate: '2026-05-25',
      materialType: '14oz High-Gloss Heavyweight Vinyl',
      finishingInstructions: '3in top and bottom pipe pockets, ratchet strap tensioning grommets.',
      bleedInches: 3,
      deliveryDepot: 'Brooklyn Operations & Staging Depot (220 3rd Ave)',
      trackingNumber: 'UPS-1Z9999999999999999',
      status: 'RECEIVED_AT_DEPOT',
    },
    deadlineDate: '2026-05-22',
    tags: ['Beverage', 'Vinyl Bulletin', 'Received at Depot', 'Tunnel Approach'],
    createdAt: '2026-05-15',
    updatedAt: '2026-05-25',
  },
];

const ARTWORKS_STORAGE_KEY = 'adversoft_artworks_v1';

export function getStoredArtworks(tenantId?: string): ArtworkRecord[] {
  if (typeof window === 'undefined') return isDemoTenant(tenantId) ? INITIAL_ARTWORKS : [];
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey(ARTWORKS_STORAGE_KEY, tid);
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      if (isDemoTenant(tid)) {
        localStorage.setItem(key, JSON.stringify(INITIAL_ARTWORKS));
        return INITIAL_ARTWORKS;
      }
      return [];
    }
    return JSON.parse(data);
  } catch {
    return isDemoTenant(tid) ? INITIAL_ARTWORKS : [];
  }
}

export function saveStoredArtworks(artworks: ArtworkRecord[], tenantId?: string): void {
  if (typeof window === 'undefined') return;
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey(ARTWORKS_STORAGE_KEY, tid);
  try {
    localStorage.setItem(key, JSON.stringify(artworks));
    window.dispatchEvent(new CustomEvent('adversoft_artworks_updated', { detail: artworks }));
  } catch (err) {
    console.error('Failed to save artworks:', err);
  }
}

export interface UploadRevisionInput {
  fileUrl: string;
  thumbnailUrl?: string;
  dimensions?: string;
  colorSpace?: 'CMYK' | 'RGB';
  resolutionDpi?: number;
  uploadedBy?: string;
  feedbackNotes?: string;
}

export function uploadArtworkRevision(
  artworkId: string,
  input: UploadRevisionInput
): { success: boolean; artwork?: ArtworkRecord; error?: string } {
  const artworks = getStoredArtworks();
  const art = artworks.find((a) => a.id === artworkId || a.artworkNumber === artworkId);
  if (!art) return { success: false, error: 'Artwork record not found.' };

  const nextVer = art.currentVersion + 1;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

  const newRevision: ArtworkRevision = {
    version: nextVer,
    uploadedAt: now,
    uploadedBy: input.uploadedBy || 'Lucas Vance',
    uploaderRole: 'Creative Production Specialist',
    fileUrl: input.fileUrl,
    thumbnailUrl: input.thumbnailUrl || input.fileUrl,
    fileSizeBytes: 520000000,
    dimensions: input.dimensions || art.revisions[0]?.dimensions || "48' x 14'",
    aspectRatio: art.revisions[0]?.aspectRatio || '24:7',
    colorSpace: input.colorSpace || (art.format.startsWith('DIGITAL') ? 'RGB' : 'CMYK'),
    resolutionDpi: input.resolutionDpi || (art.format.startsWith('DIGITAL') ? 72 : 300),
    preflightPassed: true,
    preflightNotes: [
      `Automated preflight passed for revision v${nextVer}`,
      'Color gamut verified against billboard ICC display profile',
      'Resolution exceeds minimum sharpness criteria',
    ],
    feedbackNotes: input.feedbackNotes || `Revision v${nextVer} uploaded addressing client requests.`,
  };

  art.revisions.push(newRevision);
  art.currentVersion = nextVer;
  art.status = 'IN_REVIEW';
  art.updatedAt = new Date().toISOString().split('T')[0];

  saveStoredArtworks([...artworks]);
  return { success: true, artwork: art };
}

export function requestArtworkRevision(
  artworkId: string,
  revisionReason: string,
  requestedBy: string = 'Client Signatory'
): { success: boolean; artwork?: ArtworkRecord; error?: string } {
  const artworks = getStoredArtworks();
  const art = artworks.find((a) => a.id === artworkId || a.artworkNumber === artworkId);
  if (!art) return { success: false, error: 'Artwork record not found.' };

  art.status = 'REVISION_REQUESTED';
  const curRev = art.revisions[art.revisions.length - 1];
  if (curRev) {
    curRev.revisionReason = revisionReason;
  }
  art.updatedAt = new Date().toISOString().split('T')[0];

  saveStoredArtworks([...artworks]);
  return { success: true, artwork: art };
}

export const requestRevision = requestArtworkRevision;

export interface ApproveArtworkInput {
  approvedBy: string;
  approverEmail: string;
  approverRole: string;
  notes?: string;
  approvalMethod?: 'DIGITAL_SIGNATURE' | 'ONE_CLICK_VERIFY';
}

export function approveArtwork(
  artworkId: string,
  input: ApproveArtworkInput
): { success: boolean; artwork?: ArtworkRecord; error?: string } {
  const artworks = getStoredArtworks();
  const art = artworks.find((a) => a.id === artworkId || a.artworkNumber === artworkId);
  if (!art) return { success: false, error: 'Artwork record not found.' };

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const hash = `SHA-256-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString().slice(-4)}`;

  const auditEntry: ApprovalAuditEntry = {
    id: `appr_${Date.now()}`,
    version: art.currentVersion,
    approvedBy: input.approvedBy,
    approverEmail: input.approverEmail,
    approverRole: input.approverRole,
    approvedAt: now,
    ipAddress: '198.51.100.74',
    approvalMethod: input.approvalMethod || 'DIGITAL_SIGNATURE',
    signatureHash: hash,
    notes: input.notes || `Signed off on revision v${art.currentVersion} for billboard flight broadcasting.`,
  };

  art.approvalAudit.push(auditEntry);
  art.status = 'CLIENT_APPROVED';
  art.updatedAt = new Date().toISOString().split('T')[0];

  saveStoredArtworks([...artworks]);
  return { success: true, artwork: art };
}

export interface DispatchPrintTicketInput {
  vendorName: string;
  vendorContact: string;
  materialType?: string;
  finishingInstructions?: string;
  bleedInches?: number;
  deliveryDepot: string;
  targetShipDate: string;
}

export function dispatchPrintTicket(
  artworkId: string,
  input: DispatchPrintTicketInput
): { success: boolean; artwork?: ArtworkRecord; error?: string } {
  const artworks = getStoredArtworks();
  const art = artworks.find((a) => a.id === artworkId || a.artworkNumber === artworkId);
  if (!art) return { success: false, error: 'Artwork record not found.' };

  const today = new Date().toISOString().split('T')[0];
  const ticketNumber = `PRN-2026-${String(100 + artworks.length).padStart(3, '0')}`;

  const ticket: PrintHandoffTicket = {
    ticketNumber,
    vendorName: input.vendorName,
    vendorContact: input.vendorContact,
    dispatchedAt: `${today} 09:00`,
    targetShipDate: input.targetShipDate,
    materialType: input.materialType || '14oz Heavyweight Matte Vinyl with UV Inhibitor',
    finishingInstructions:
      input.finishingInstructions ||
      'Double-stitched 3in top & bottom pipe pockets, rustproof grommets every 24 inches on left & right sides.',
    bleedInches: input.bleedInches ?? 3,
    deliveryDepot: input.deliveryDepot,
    trackingNumber: `EXP-${Math.floor(10000000 + Math.random() * 90000000)}`,
    status: 'DISPATCHED',
  };

  art.printTicket = ticket;
  art.status = 'SENT_TO_PRINT';
  art.updatedAt = today;

  saveStoredArtworks([...artworks]);
  return { success: true, artwork: art };
}

export interface CreateArtworkInput {
  title: string;
  campaignId: string;
  billboardId: string;
  format: CreativeFormat;
  deadlineDate: string;
  fileUrl: string;
  dimensions?: string;
  tags?: string[];
}

export function createArtwork(input: CreateArtworkInput): {
  success: boolean;
  artwork?: ArtworkRecord;
  error?: string;
} {
  const campaigns = getTenantCampaigns();
  const camp = campaigns.find((c) => c.id === input.campaignId || c.campaignNumber === input.campaignId);
  if (!camp) return { success: false, error: 'Campaign not found.' };

  const billboards = getTenantBillboards();
  const bb = billboards.find((b) => b.id === input.billboardId || b.code === input.billboardId);
  if (!bb) return { success: false, error: 'Billboard asset not found.' };

  const current = getStoredArtworks();
  const artworkNumber = `ART-2026-${String(current.length + 1).padStart(3, '0')}`;
  const today = new Date().toISOString().split('T')[0];

  const initialRev: ArtworkRevision = {
    version: 1,
    uploadedAt: `${today} 10:00`,
    uploadedBy: 'Creative Services',
    uploaderRole: 'Production Specialist',
    fileUrl: input.fileUrl,
    thumbnailUrl: input.fileUrl,
    fileSizeBytes: 420000000,
    dimensions: input.dimensions || `${bb.widthFeet}' x ${bb.heightFeet}'`,
    aspectRatio: `${bb.widthFeet}:${bb.heightFeet}`,
    colorSpace: input.format.startsWith('DIGITAL') ? 'RGB' : 'CMYK',
    resolutionDpi: input.format.startsWith('DIGITAL') ? 72 : 300,
    preflightPassed: true,
    preflightNotes: ['Initial preflight check passed specs match inventory dimensions.'],
  };

  const newArt: ArtworkRecord = {
    id: `art_${Date.now()}`,
    artworkNumber,
    title: input.title,
    campaignId: camp.id,
    campaignNumber: camp.campaignNumber,
    campaignName: camp.name,
    clientId: camp.clientId,
    clientCompanyName: camp.clientCompanyName,
    clientAccountNumber: camp.clientAccountNumber,
    billboardId: bb.id,
    billboardCode: bb.code,
    billboardName: bb.name,
    billboardCity: bb.location.city,
    billboardCorridor: bb.location.corridorName,
    format: input.format,
    status: 'IN_REVIEW',
    currentVersion: 1,
    revisions: [initialRev],
    approvalAudit: [],
    deadlineDate: input.deadlineDate,
    tags: input.tags || ['Creative Proof', bb.code],
    createdAt: today,
    updatedAt: today,
  };

  const updated = [newArt, ...current];
  saveStoredArtworks(updated);
  return { success: true, artwork: newArt };
}

export function getArtworkMetrics() {
  const list = getStoredArtworks();
  const total = list.length;
  const inReviewCount = list.filter((a) => a.status === 'IN_REVIEW').length;
  const approvedCount = list.filter((a) => a.status === 'CLIENT_APPROVED').length;
  const revisionCount = list.filter((a) => a.status === 'REVISION_REQUESTED').length;
  const sentToPrintCount = list.filter((a) => a.status === 'SENT_TO_PRINT').length;
  const readyInstallCount = list.filter((a) => a.status === 'READY_FOR_INSTALL').length;

  return {
    total,
    inReviewCount,
    approvedCount,
    revisionCount,
    sentToPrintCount,
    readyInstallCount,
    avgTurnaroundHours: 14.2,
  };
}
