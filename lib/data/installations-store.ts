/**
 * Adversoft Installation & Field Operations Data Store & Service Engine
 * Module: Work orders, crew dispatch, scheduling, and mobile proof-of-posting (POP) photo uploads (before/after).
 */

import { INITIAL_BILLBOARDS, BillboardItem } from './billboards-store';
import { INITIAL_CLIENTS, ClientAccount } from './crm-store';
import { getStoredCampaigns, CampaignRecord } from './campaigns-store';
import { getStoredArtworks, ArtworkRecord } from './artwork-store';
import { getActiveTenantId, isDemoTenant, getTenantStorageKey } from '../tenant';
import { getTenantBillboards, getTenantCampaigns } from '../tenant-store';

export type WorkOrderStatus =
  | 'PENDING_ASSIGNMENT'
  | 'SCHEDULED'
  | 'CREW_EN_ROUTE'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type WorkOrderType =
  | 'INSTALLATION'
  | 'TAKEDOWN'
  | 'RE_SKINNING'
  | 'DIGITAL_CALIBRATION';

export type WorkOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface FieldCrew {
  id: string;
  name: string;
  leadTechnician: string;
  technicianCount: number;
  vehicleType: string;
  phone: string;
  status: 'AVAILABLE' | 'ON_JOB' | 'OFF_DUTY';
}

export interface InstallationProofPhotos {
  beforePhotoUrl?: string;
  beforeUploadedAt?: string;
  afterDayPhotoUrl?: string;
  afterDayUploadedAt?: string;
  afterNightPhotoUrl?: string;
  afterNightUploadedAt?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  inspectorName?: string;
  inspectionNotes?: string;
  illuminationScorePercent?: number;
}

export interface SafetyChecklist {
  harnessInspection: boolean;
  lotoElectricalLockout: boolean;
  windSpeedCheckMph: number;
  policeTrafficPermit: boolean;
  riggingHardwareCheck: boolean;
}

export interface InstallationWorkOrder {
  id: string;
  workOrderNumber: string; // e.g. WO-2026-001
  type: WorkOrderType;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;

  // Connected Campaign & Client
  campaignId: string;
  campaignNumber: string;
  campaignName: string;
  clientId: string;
  clientCompanyName: string;

  // Billboard Location Specs
  billboardId: string;
  billboardCode: string;
  billboardName: string;
  billboardAddress: string;
  billboardCity: string;
  billboardCorridor: string;
  structureHeightFeet: number;
  dimensions: string;

  // Linked Artwork
  artworkId?: string;
  artworkNumber?: string;
  artworkTitle?: string;

  // Crew Dispatch & Schedule
  crewId?: string;
  crewName?: string;
  leadTechnician?: string;
  scheduledDate: string;
  scheduledTimeWindow: string; // e.g. "05:00 - 09:00 EST"
  estimatedDurationHours: number;
  weatherForecast: string;

  // Quality & Safety
  safetyChecklist: SafetyChecklist;
  proofPhotos: InstallationProofPhotos;
  specialInstructions?: string;

  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const INITIAL_CREWS: FieldCrew[] = [
  {
    id: 'crew_alpha',
    name: 'Crew Alpha — High-Altitude Rigging',
    leadTechnician: 'Carlos Mendoza',
    technicianCount: 4,
    vehicleType: '60ft Boom Crane Truck (Unit #4)',
    phone: '+1 (555) 302-8819',
    status: 'AVAILABLE',
  },
  {
    id: 'crew_bravo',
    name: 'Crew Bravo — Expressway Rapid Deployment',
    leadTechnician: 'Derrick Hall',
    technicianCount: 3,
    vehicleType: '45ft Scissor Lift Truck (Unit #2)',
    phone: '+1 (555) 412-9904',
    status: 'ON_JOB',
  },
  {
    id: 'crew_gamma',
    name: 'Crew Gamma — Digital NOC & LED Calibration',
    leadTechnician: 'Lucas Vance',
    technicianCount: 2,
    vehicleType: 'Mobile NOC Diagnostics Van (Unit #7)',
    phone: '+1 (555) 520-1176',
    status: 'AVAILABLE',
  },
];

export const INITIAL_WORK_ORDERS: InstallationWorkOrder[] = [
  {
    id: 'wo_1',
    workOrderNumber: 'WO-2026-001',
    type: 'DIGITAL_CALIBRATION',
    status: 'COMPLETED',
    priority: 'HIGH',
    campaignId: 'cmp_1',
    campaignNumber: 'CMP-2026-001',
    campaignName: 'Sterling Luxe Holiday 2026',
    clientId: 'cli_1',
    clientCompanyName: 'Sterling Brands Ltd',
    billboardId: 'bb_1',
    billboardCode: 'BB-101',
    billboardName: 'Times Square Spectacle LED',
    billboardAddress: '1540 Broadway (45th & 46th St)',
    billboardCity: 'New York',
    billboardCorridor: 'Times Square Bowtie Plaza',
    structureHeightFeet: 85,
    dimensions: "48' x 14'",
    artworkId: 'art_1',
    artworkNumber: 'ART-2026-001',
    artworkTitle: 'Sterling Haute Horlogerie 4K Holiday Master Loop',
    crewId: 'crew_gamma',
    crewName: 'Crew Gamma — Digital NOC & LED Calibration',
    leadTechnician: 'Lucas Vance',
    scheduledDate: '2026-09-30',
    scheduledTimeWindow: '02:00 - 05:00 EST (Low Traffic Window)',
    estimatedDurationHours: 3,
    weatherForecast: 'Clear, 62°F, 4mph Wind',
    safetyChecklist: {
      harnessInspection: true,
      lotoElectricalLockout: true,
      windSpeedCheckMph: 4,
      policeTrafficPermit: true,
      riggingHardwareCheck: true,
    },
    proofPhotos: {
      beforePhotoUrl:
        'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=800&auto=format&fit=crop&q=80',
      beforeUploadedAt: '2026-09-30 02:15',
      afterDayPhotoUrl:
        'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&auto=format&fit=crop&q=80',
      afterDayUploadedAt: '2026-09-30 14:20',
      afterNightPhotoUrl:
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
      afterNightUploadedAt: '2026-09-30 20:45',
      gpsLatitude: 40.758896,
      gpsLongitude: -73.98513,
      inspectorName: 'Lucas Vance',
      inspectionNotes:
        '4K UHD loop ingest confirmed. Brightness dayparting curves programmed for Times Square night illumination standard. 100% LED modules active.',
      illuminationScorePercent: 99.8,
    },
    specialInstructions: 'Access via rear maintenance gantry door on 46th St. Coordinate with building security for roof access.',
    completedAt: '2026-09-30 21:00',
    createdAt: '2026-09-25',
    updatedAt: '2026-09-30',
  },
  {
    id: 'wo_2',
    workOrderNumber: 'WO-2026-002',
    type: 'INSTALLATION',
    status: 'COMPLETED',
    priority: 'URGENT',
    campaignId: 'cmp_2',
    campaignNumber: 'CMP-2026-002',
    campaignName: 'AI Cloud Platform Q4 Launch',
    clientId: 'cli_2',
    clientCompanyName: 'Apex Global Technologies',
    billboardId: 'bb_2',
    billboardCode: 'BB-102',
    billboardName: 'Sunset Strip Monolith Spectacular',
    billboardAddress: '8490 Sunset Blvd',
    billboardCity: 'Los Angeles',
    billboardCorridor: 'Sunset Boulevard Creative Mile',
    structureHeightFeet: 65,
    dimensions: "60' x 20'",
    artworkId: 'art_2',
    artworkNumber: 'ART-2026-002',
    artworkTitle: 'Apex Cloud Neural OS — Sunset Strip Heavy Vinyl',
    crewId: 'crew_alpha',
    crewName: 'Crew Alpha — High-Altitude Rigging',
    leadTechnician: 'Carlos Mendoza',
    scheduledDate: '2026-07-31',
    scheduledTimeWindow: '04:00 - 08:00 PST (Curfew Window)',
    estimatedDurationHours: 4,
    weatherForecast: 'Dry & Calm, 66°F, 3mph Wind',
    safetyChecklist: {
      harnessInspection: true,
      lotoElectricalLockout: true,
      windSpeedCheckMph: 3,
      policeTrafficPermit: true,
      riggingHardwareCheck: true,
    },
    proofPhotos: {
      beforePhotoUrl:
        'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=800&auto=format&fit=crop&q=80',
      beforeUploadedAt: '2026-07-31 04:20',
      afterDayPhotoUrl:
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop&q=80',
      afterDayUploadedAt: '2026-07-31 07:45',
      afterNightPhotoUrl:
        'https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?w=800&auto=format&fit=crop&q=80',
      afterNightUploadedAt: '2026-07-31 21:15',
      gpsLatitude: 34.0928,
      gpsLongitude: -118.3789,
      inspectorName: 'Carlos Mendoza',
      inspectionNotes:
        '14oz heavy matte vinyl tensioned without wrinkles. Top & bottom pipe pockets secured with steel pins. All 6 halogen floodlights illuminated.',
      illuminationScorePercent: 100.0,
    },
    specialInstructions: 'City lane closure permit valid from 03:30 to 08:30. Traffic cones and crash attenuator truck mandatory.',
    completedAt: '2026-07-31 08:15',
    createdAt: '2026-07-24',
    updatedAt: '2026-07-31',
  },
  {
    id: 'wo_3',
    workOrderNumber: 'WO-2026-003',
    type: 'INSTALLATION',
    status: 'SCHEDULED',
    priority: 'HIGH',
    campaignId: 'cmp_3',
    campaignNumber: 'CMP-2026-003',
    campaignName: 'EcoDrive Electric SUV Launch',
    clientId: 'cli_3',
    clientCompanyName: 'Vanguard Automotive Group',
    billboardId: 'bb_3',
    billboardCode: 'BB-103',
    billboardName: 'Kennedy Expressway Double-Faced Cantilever',
    billboardAddress: 'I-90 / I-94 at Armitage Ave Overpass',
    billboardCity: 'Chicago',
    billboardCorridor: 'I-90 / I-94 Kennedy Expressway',
    structureHeightFeet: 70,
    dimensions: "48' x 14'",
    artworkId: 'art_3',
    artworkNumber: 'ART-2026-003',
    artworkTitle: 'EcoDrive Vanguard Electra SUV — Cantilever Face',
    crewId: 'crew_bravo',
    crewName: 'Crew Bravo — Expressway Rapid Deployment',
    leadTechnician: 'Derrick Hall',
    scheduledDate: '2026-10-15',
    scheduledTimeWindow: '05:00 - 09:00 CST',
    estimatedDurationHours: 3.5,
    weatherForecast: 'Partly Cloudy, 54°F, 7mph Wind',
    safetyChecklist: {
      harnessInspection: true,
      lotoElectricalLockout: false,
      windSpeedCheckMph: 7,
      policeTrafficPermit: true,
      riggingHardwareCheck: true,
    },
    proofPhotos: {},
    specialInstructions: 'Northbound shoulder staging. IDOT highway encroachment permit approved. Confirm vinyl delivery from Chicago depot prior to dispatch.',
    createdAt: '2026-10-06',
    updatedAt: '2026-10-06',
  },
  {
    id: 'wo_4',
    workOrderNumber: 'WO-2026-004',
    type: 'DIGITAL_CALIBRATION',
    status: 'PENDING_ASSIGNMENT',
    priority: 'MEDIUM',
    campaignId: 'cmp_4',
    campaignNumber: 'CMP-2026-004',
    campaignName: 'Horizon Health Open Enrollment 2027',
    clientId: 'cli_4',
    clientCompanyName: 'Horizon Healthcare Network',
    billboardId: 'bb_5',
    billboardCode: 'BB-105',
    billboardName: 'Biscayne Boulevard Gateway Monolith',
    billboardAddress: '1800 Biscayne Blvd',
    billboardCity: 'Miami',
    billboardCorridor: 'Biscayne Corridor / Downtown Connector',
    structureHeightFeet: 45,
    dimensions: "36' x 12'",
    artworkId: 'art_4',
    artworkNumber: 'ART-2026-004',
    artworkTitle: 'Horizon Advantage Health Open Enrollment 10s Spot',
    scheduledDate: '2026-11-01',
    scheduledTimeWindow: '08:00 - 11:00 EST',
    estimatedDurationHours: 2,
    weatherForecast: 'Sunny, 78°F, 5mph Wind',
    safetyChecklist: {
      harnessInspection: false,
      lotoElectricalLockout: false,
      windSpeedCheckMph: 5,
      policeTrafficPermit: false,
      riggingHardwareCheck: false,
    },
    proofPhotos: {},
    specialInstructions: 'Remote network upload scheduled. On-site optical brightness check required following daylight rotation.',
    createdAt: '2026-10-08',
    updatedAt: '2026-10-08',
  },
  {
    id: 'wo_5',
    workOrderNumber: 'WO-2026-005',
    type: 'TAKEDOWN',
    status: 'COMPLETED',
    priority: 'MEDIUM',
    campaignId: 'cmp_5',
    campaignNumber: 'CMP-2026-005',
    campaignName: 'Peak Energy Summer Metro Blitz',
    clientId: 'cli_5',
    clientCompanyName: 'Peak Energy Beverages',
    billboardId: 'bb_6',
    billboardCode: 'BB-106',
    billboardName: 'Midtown Tunnel Approach High-Impact Bulletin',
    billboardAddress: '49-10 Hunters Point Ave, Long Island City',
    billboardCity: 'New York',
    billboardCorridor: 'Long Island Expressway Midtown Approach',
    structureHeightFeet: 55,
    dimensions: "48' x 14'",
    artworkId: 'art_5',
    artworkNumber: 'ART-2026-005',
    artworkTitle: 'Peak Zero Ultra Summer Splash — Midtown Bulletin',
    crewId: 'crew_alpha',
    crewName: 'Crew Alpha — High-Altitude Rigging',
    leadTechnician: 'Carlos Mendoza',
    scheduledDate: '2026-09-02',
    scheduledTimeWindow: '06:00 - 09:30 EST',
    estimatedDurationHours: 3.5,
    weatherForecast: 'Overcast, 70°F, 6mph Wind',
    safetyChecklist: {
      harnessInspection: true,
      lotoElectricalLockout: true,
      windSpeedCheckMph: 6,
      policeTrafficPermit: true,
      riggingHardwareCheck: true,
    },
    proofPhotos: {
      beforePhotoUrl:
        'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80',
      beforeUploadedAt: '2026-09-02 06:15',
      afterDayPhotoUrl:
        'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=800&auto=format&fit=crop&q=80',
      afterDayUploadedAt: '2026-09-02 09:10',
      gpsLatitude: 40.7397,
      gpsLongitude: -73.9387,
      inspectorName: 'Carlos Mendoza',
      inspectionNotes: 'Summer vinyl carefully rolled, bundled, and delivered to Brooklyn depot for eco-recycling.',
    },
    specialInstructions: 'Carefully roll vinyl onto cardboard core. Do not fold to avoid creasing if client exercises ROFR hold.',
    completedAt: '2026-09-02 09:30',
    createdAt: '2026-08-28',
    updatedAt: '2026-09-02',
  },
];

const INSTALLATIONS_STORAGE_KEY = 'adversoft_installations_v1';

export function getStoredWorkOrders(tenantId?: string): InstallationWorkOrder[] {
  if (typeof window === 'undefined') return isDemoTenant(tenantId) ? INITIAL_WORK_ORDERS : [];
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey(INSTALLATIONS_STORAGE_KEY, tid);
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      if (isDemoTenant(tid)) {
        localStorage.setItem(key, JSON.stringify(INITIAL_WORK_ORDERS));
        return INITIAL_WORK_ORDERS;
      }
      return [];
    }
    return JSON.parse(data);
  } catch {
    return isDemoTenant(tid) ? INITIAL_WORK_ORDERS : [];
  }
}

export function saveStoredWorkOrders(workOrders: InstallationWorkOrder[], tenantId?: string): void {
  if (typeof window === 'undefined') return;
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey(INSTALLATIONS_STORAGE_KEY, tid);
  try {
    localStorage.setItem(key, JSON.stringify(workOrders));
    window.dispatchEvent(new CustomEvent('adversoft_installations_updated', { detail: workOrders }));
  } catch (err) {
    console.error('Failed to save work orders:', err);
  }
}

export function getFieldCrews(): FieldCrew[] {
  return INITIAL_CREWS;
}

export interface CreateWorkOrderInput {
  type: WorkOrderType;
  priority: WorkOrderPriority;
  campaignId: string;
  billboardId: string;
  artworkId?: string;
  crewId?: string;
  scheduledDate: string;
  scheduledTimeWindow?: string;
  specialInstructions?: string;
}

export function createWorkOrder(input: CreateWorkOrderInput): {
  success: boolean;
  workOrder?: InstallationWorkOrder;
  error?: string;
} {
  const campaigns = getTenantCampaigns();
  const camp = campaigns.find((c) => c.id === input.campaignId || c.campaignNumber === input.campaignId);
  if (!camp) return { success: false, error: 'Campaign not found.' };

  const billboards = getTenantBillboards();
  const bb = billboards.find((b) => b.id === input.billboardId || b.code === input.billboardId);
  if (!bb) return { success: false, error: 'Billboard asset not found.' };

  const current = getStoredWorkOrders();
  const workOrderNumber = `WO-2026-${String(current.length + 1).padStart(3, '0')}`;
  const today = new Date().toISOString().split('T')[0];

  const crew = INITIAL_CREWS.find((c) => c.id === input.crewId);

  const newWo: InstallationWorkOrder = {
    id: `wo_${Date.now()}`,
    workOrderNumber,
    type: input.type,
    status: input.crewId ? 'SCHEDULED' : 'PENDING_ASSIGNMENT',
    priority: input.priority,
    campaignId: camp.id,
    campaignNumber: camp.campaignNumber,
    campaignName: camp.name,
    clientId: camp.clientId,
    clientCompanyName: camp.clientCompanyName,
    billboardId: bb.id,
    billboardCode: bb.code,
    billboardName: bb.name,
    billboardAddress: bb.location.address,
    billboardCity: bb.location.city,
    billboardCorridor: bb.location.corridorName,
    structureHeightFeet: bb.structureHeightFeet || 60,
    dimensions: `${bb.widthFeet}' x ${bb.heightFeet}'`,
    crewId: crew?.id,
    crewName: crew?.name,
    leadTechnician: crew?.leadTechnician,
    scheduledDate: input.scheduledDate,
    scheduledTimeWindow: input.scheduledTimeWindow || '06:00 - 10:00 EST',
    estimatedDurationHours: 3.5,
    weatherForecast: 'Weather check pending flight window',
    safetyChecklist: {
      harnessInspection: false,
      lotoElectricalLockout: false,
      windSpeedCheckMph: 5,
      policeTrafficPermit: false,
      riggingHardwareCheck: false,
    },
    proofPhotos: {},
    specialInstructions: input.specialInstructions,
    createdAt: today,
    updatedAt: today,
  };

  const updated = [newWo, ...current];
  saveStoredWorkOrders(updated);
  return { success: true, workOrder: newWo };
}

export function assignCrewToWorkOrder(
  workOrderId: string,
  crewId: string,
  scheduledDate: string,
  timeWindow: string = '06:00 - 10:00 EST'
): { success: boolean; workOrder?: InstallationWorkOrder; error?: string } {
  const orders = getStoredWorkOrders();
  const wo = orders.find((o) => o.id === workOrderId || o.workOrderNumber === workOrderId);
  if (!wo) return { success: false, error: 'Work order not found.' };

  const crew = INITIAL_CREWS.find((c) => c.id === crewId);
  if (!crew) return { success: false, error: 'Field crew not found.' };

  wo.crewId = crew.id;
  wo.crewName = crew.name;
  wo.leadTechnician = crew.leadTechnician;
  wo.scheduledDate = scheduledDate;
  wo.scheduledTimeWindow = timeWindow;
  wo.status = 'SCHEDULED';
  wo.updatedAt = new Date().toISOString().split('T')[0];

  saveStoredWorkOrders([...orders]);
  return { success: true, workOrder: wo };
}

export function updateWorkOrderStatus(
  workOrderId: string,
  newStatus: WorkOrderStatus
): { success: boolean; workOrder?: InstallationWorkOrder; error?: string } {
  const orders = getStoredWorkOrders();
  const wo = orders.find((o) => o.id === workOrderId || o.workOrderNumber === workOrderId);
  if (!wo) return { success: false, error: 'Work order not found.' };

  wo.status = newStatus;
  if (newStatus === 'COMPLETED') {
    wo.completedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
  }
  wo.updatedAt = new Date().toISOString().split('T')[0];

  saveStoredWorkOrders([...orders]);
  return { success: true, workOrder: wo };
}

export interface UploadProofInput {
  beforePhotoUrl?: string;
  afterDayPhotoUrl?: string;
  afterNightPhotoUrl?: string;
  inspectorName?: string;
  inspectionNotes?: string;
  illuminationScorePercent?: number;
  autoComplete?: boolean;
}

export function uploadInstallationProof(
  workOrderId: string,
  input: UploadProofInput
): { success: boolean; workOrder?: InstallationWorkOrder; error?: string } {
  const orders = getStoredWorkOrders();
  const wo = orders.find((o) => o.id === workOrderId || o.workOrderNumber === workOrderId);
  if (!wo) return { success: false, error: 'Work order not found.' };

  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

  if (input.beforePhotoUrl) {
    wo.proofPhotos.beforePhotoUrl = input.beforePhotoUrl;
    wo.proofPhotos.beforeUploadedAt = now;
  }
  if (input.afterDayPhotoUrl) {
    wo.proofPhotos.afterDayPhotoUrl = input.afterDayPhotoUrl;
    wo.proofPhotos.afterDayUploadedAt = now;
  }
  if (input.afterNightPhotoUrl) {
    wo.proofPhotos.afterNightPhotoUrl = input.afterNightPhotoUrl;
    wo.proofPhotos.afterNightUploadedAt = now;
  }

  wo.proofPhotos.inspectorName = input.inspectorName || wo.leadTechnician || 'Field Operations Lead';
  wo.proofPhotos.inspectionNotes = input.inspectionNotes || 'Proof-of-posting verified with unobstructed viewing sightline.';
  wo.proofPhotos.illuminationScorePercent = input.illuminationScorePercent ?? 99.5;
  wo.proofPhotos.gpsLatitude = wo.billboardCity === 'New York' ? 40.758896 : 34.0928;
  wo.proofPhotos.gpsLongitude = wo.billboardCity === 'New York' ? -73.98513 : -118.3789;

  if (input.autoComplete || (wo.proofPhotos.afterDayPhotoUrl && wo.proofPhotos.afterNightPhotoUrl)) {
    wo.status = 'COMPLETED';
    wo.completedAt = now;
  }

  wo.updatedAt = new Date().toISOString().split('T')[0];
  saveStoredWorkOrders([...orders]);
  return { success: true, workOrder: wo };
}

export function updateSafetyChecklist(
  workOrderId: string,
  checklist: Partial<SafetyChecklist>
): { success: boolean; workOrder?: InstallationWorkOrder; error?: string } {
  const orders = getStoredWorkOrders();
  const wo = orders.find((o) => o.id === workOrderId || o.workOrderNumber === workOrderId);
  if (!wo) return { success: false, error: 'Work order not found.' };

  wo.safetyChecklist = { ...wo.safetyChecklist, ...checklist };
  wo.updatedAt = new Date().toISOString().split('T')[0];

  saveStoredWorkOrders([...orders]);
  return { success: true, workOrder: wo };
}

export function getInstallationMetrics() {
  const list = getStoredWorkOrders();
  const total = list.length;
  const scheduledCount = list.filter((w) => w.status === 'SCHEDULED').length;
  const inProgressCount = list.filter((w) => ['CREW_EN_ROUTE', 'IN_PROGRESS'].includes(w.status)).length;
  const completedCount = list.filter((w) => w.status === 'COMPLETED').length;
  const pendingAssignmentCount = list.filter((w) => w.status === 'PENDING_ASSIGNMENT').length;

  return {
    total,
    scheduledCount,
    inProgressCount,
    completedCount,
    pendingAssignmentCount,
    activeCrewsCount: INITIAL_CREWS.filter((c) => c.status !== 'OFF_DUTY').length,
    onTimeRatePercent: 98.7,
  };
}
