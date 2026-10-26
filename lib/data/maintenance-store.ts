/**
 * Adversoft Maintenance & Structural Inspections Data Store & Service Engine
 * Module: Incident reports, bulb/damage work orders, technician assignments, repair logs,
 * structural safety compliance, and direct cost tracking.
 */

import { INITIAL_BILLBOARDS, BillboardItem, updateBillboardStatus } from './billboards-store';
import { getActiveTenantId, isDemoTenant, getTenantStorageKey } from '../tenant';
import { getTenantBillboards } from '../tenant-store';

export type MaintenanceIncidentType =
  | 'BULB_OUTAGE'
  | 'TORN_VINYL'
  | 'STRUCTURAL_DAMAGE'
  | 'STORM_DAMAGE'
  | 'ELECTRICAL_FAULT'
  | 'ROUTINE_INSPECTION'
  | 'VANDALISM_GRAFFITI';

export type MaintenanceSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type MaintenanceStatus =
  | 'REPORTED'
  | 'DISPATCHED'
  | 'UNDER_REPAIR'
  | 'RESOLVED'
  | 'CLOSED';

export interface MaintenanceTechnician {
  id: string;
  name: string;
  specialty: 'ELECTRICAL' | 'STRUCTURAL_RIGGER' | 'LED_TECHNICIAN' | 'GENERAL_MAINTENANCE';
  phone: string;
  vehicle: string;
  activeJobsCount: number;
}

export interface MaintenanceRecord {
  id: string;
  incidentNumber: string; // e.g. MNT-2026-001
  title: string;
  type: MaintenanceIncidentType;
  severity: MaintenanceSeverity;
  status: MaintenanceStatus;

  // Billboard Linkage
  billboardId: string;
  billboardCode: string;
  billboardName: string;
  billboardAddress: string;
  billboardCity: string;
  billboardCorridor: string;
  structureHeightFeet: number;

  // Reporting & SLA
  reportedBy: string;
  reporterContact: string;
  reportedAt: string;
  targetSlaHours: number;
  slaDeadline: string;

  // Technician & Field Dispatch
  technicianId?: string;
  technicianName?: string;
  technicianPhone?: string;

  // Cost & Parts Accounting
  partsReplaced?: string;
  partsCost: number;
  laborHours: number;
  hourlyRate: number;
  laborCost: number;
  totalCost: number;

  // Verification & Photos
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  rootCauseAnalysis?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  structuralSafetyCertified: boolean;

  createdAt: string;
  updatedAt: string;
}

export const INITIAL_TECHNICIANS: MaintenanceTechnician[] = [
  {
    id: 'tech_carlos',
    name: 'Carlos Mendoza',
    specialty: 'STRUCTURAL_RIGGER',
    phone: '+1 (555) 302-8819',
    vehicle: 'Boom Crane Rigging Truck #4',
    activeJobsCount: 1,
  },
  {
    id: 'tech_derrick',
    name: 'Derrick Hall',
    specialty: 'ELECTRICAL',
    phone: '+1 (555) 412-9904',
    vehicle: 'Electrical Utility Bucket Truck #2',
    activeJobsCount: 1,
  },
  {
    id: 'tech_lucas',
    name: 'Lucas Vance',
    specialty: 'LED_TECHNICIAN',
    phone: '+1 (555) 520-1176',
    vehicle: 'Mobile Digital NOC Diagnostics Van #7',
    activeJobsCount: 0,
  },
  {
    id: 'tech_elena',
    name: 'Elena Ramos',
    specialty: 'GENERAL_MAINTENANCE',
    phone: '+1 (555) 670-3341',
    vehicle: 'Rapid Response Service Van #3',
    activeJobsCount: 0,
  },
];

export const INITIAL_MAINTENANCE: MaintenanceRecord[] = [
  {
    id: 'mnt_1',
    incidentNumber: 'MNT-2026-001',
    title: 'LED Matrix Power Supply Unit & Ribbon Cable Swap',
    type: 'ELECTRICAL_FAULT',
    severity: 'MEDIUM',
    status: 'RESOLVED',
    billboardId: 'bb_1',
    billboardCode: 'BB-101',
    billboardName: 'Times Square Spectacle LED',
    billboardAddress: '1540 Broadway (45th & 46th St)',
    billboardCity: 'New York',
    billboardCorridor: 'Times Square Bowtie Plaza',
    structureHeightFeet: 85,
    reportedBy: 'NOC Automated Telemetry System',
    reporterContact: 'noc-alerts@adversoft.com',
    reportedAt: '2026-09-22 03:15',
    targetSlaHours: 12,
    slaDeadline: '2026-09-22 15:15',
    technicianId: 'tech_lucas',
    technicianName: 'Lucas Vance',
    technicianPhone: '+1 (555) 520-1176',
    partsReplaced: '4x Meanwell 5V 60A LED Power Supplies, 2x Gold-Plated Ribbon Cables',
    partsCost: 680,
    laborHours: 4,
    hourlyRate: 185,
    laborCost: 740,
    totalCost: 1420,
    beforePhotoUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    afterPhotoUrl:
      'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&auto=format&fit=crop&q=80',
    rootCauseAnalysis: 'Power surge on sub-panel caused fuse blow on PSU bank #3, causing 3x3 pixel tile flicker.',
    resolutionNotes: 'Replaced faulty power supplies, sealed junction box with silicone weatherproofing, restored 100% luminance.',
    resolvedAt: '2026-09-22 08:30',
    structuralSafetyCertified: true,
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22',
  },
  {
    id: 'mnt_2',
    incidentNumber: 'MNT-2026-002',
    title: 'Halogen Floodlight #2 & #4 Ballast Failure',
    type: 'BULB_OUTAGE',
    severity: 'HIGH',
    status: 'DISPATCHED',
    billboardId: 'bb_2',
    billboardCode: 'BB-102',
    billboardName: 'Sunset Strip Monolith Spectacular',
    billboardAddress: '8490 Sunset Blvd',
    billboardCity: 'Los Angeles',
    billboardCorridor: 'Sunset Boulevard Creative Mile',
    structureHeightFeet: 65,
    reportedBy: 'Night Field Patrol — Unit LA-3',
    reporterContact: 'patrol-la@adversoft.com',
    reportedAt: '2026-10-12 21:40',
    targetSlaHours: 12,
    slaDeadline: '2026-10-13 09:40',
    technicianId: 'tech_derrick',
    technicianName: 'Derrick Hall',
    technicianPhone: '+1 (555) 412-9904',
    partsReplaced: '2x 400W Metal Halide Bulbs, 1x Advance Quad-Tap Ballast Kit',
    partsCost: 310,
    laborHours: 3,
    hourlyRate: 150,
    laborCost: 450,
    totalCost: 760,
    beforePhotoUrl:
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop&q=80',
    rootCauseAnalysis: 'Capacitor failure on ballast secondary loop caused lamps #2 and #4 to extinguish.',
    structuralSafetyCertified: true,
    createdAt: '2026-10-12',
    updatedAt: '2026-10-13',
  },
  {
    id: 'mnt_3',
    incidentNumber: 'MNT-2026-003',
    title: 'Southwest Corner Ratchet Strap Wind Shear Detachment',
    type: 'TORN_VINYL',
    severity: 'CRITICAL',
    status: 'UNDER_REPAIR',
    billboardId: 'bb_3',
    billboardCode: 'BB-103',
    billboardName: 'Kennedy Expressway Double-Faced Cantilever',
    billboardAddress: 'I-90 / I-94 at Armitage Ave Overpass',
    billboardCity: 'Chicago',
    billboardCorridor: 'I-90 / I-94 Kennedy Expressway',
    structureHeightFeet: 70,
    reportedBy: 'Illinois DOT Highway Advisory',
    reporterContact: 'traffic-operations@idot.state.il.us',
    reportedAt: '2026-10-14 06:15',
    targetSlaHours: 4,
    slaDeadline: '2026-10-14 10:15',
    technicianId: 'tech_carlos',
    technicianName: 'Carlos Mendoza',
    technicianPhone: '+1 (555) 302-8819',
    partsReplaced: 'Heavyweight Ratchet Tension Straps (2in x 30ft), Safety Anchor Shackles',
    partsCost: 195,
    laborHours: 3.5,
    hourlyRate: 175,
    laborCost: 612,
    totalCost: 807,
    beforePhotoUrl:
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80',
    rootCauseAnalysis: 'Wind gusts exceeding 48mph caused friction tear on lower corner grommet.',
    structuralSafetyCertified: false,
    createdAt: '2026-10-14',
    updatedAt: '2026-10-14',
  },
  {
    id: 'mnt_4',
    incidentNumber: 'MNT-2026-004',
    title: 'Quarterly Catwalk Weld & Torque Bolt Load Inspection',
    type: 'ROUTINE_INSPECTION',
    severity: 'LOW',
    status: 'REPORTED',
    billboardId: 'bb_4',
    billboardCode: 'BB-104',
    billboardName: 'Downtown Financial Wallscape',
    billboardAddress: '555 California St',
    billboardCity: 'San Francisco',
    billboardCorridor: 'Market Street Commercial Center',
    structureHeightFeet: 90,
    reportedBy: 'Compliance & Safety Department',
    reporterContact: 'safety@adversoft.com',
    reportedAt: '2026-10-10 09:00',
    targetSlaHours: 72,
    slaDeadline: '2026-10-13 09:00',
    partsCost: 0,
    laborHours: 2.5,
    hourlyRate: 150,
    laborCost: 375,
    totalCost: 375,
    structuralSafetyCertified: false,
    createdAt: '2026-10-10',
    updatedAt: '2026-10-10',
  },
  {
    id: 'mnt_5',
    incidentNumber: 'MNT-2026-005',
    title: 'LED Cabinet Intake Ventilation Filter Replacement',
    type: 'ROUTINE_INSPECTION',
    severity: 'LOW',
    status: 'CLOSED',
    billboardId: 'bb_5',
    billboardCode: 'BB-105',
    billboardName: 'Biscayne Boulevard Gateway Monolith',
    billboardAddress: '1800 Biscayne Blvd',
    billboardCity: 'Miami',
    billboardCorridor: 'Biscayne Corridor / Downtown Connector',
    structureHeightFeet: 45,
    reportedBy: 'Biscayne Facilities Team',
    reporterContact: 'facilities@biscaynegateway.com',
    reportedAt: '2026-09-18 11:00',
    targetSlaHours: 48,
    slaDeadline: '2026-09-20 11:00',
    technicianId: 'tech_elena',
    technicianName: 'Elena Ramos',
    technicianPhone: '+1 (555) 670-3341',
    partsReplaced: '6x MERV 11 Dust & Moisture Air Intake Filters',
    partsCost: 120,
    laborHours: 2,
    hourlyRate: 100,
    laborCost: 200,
    totalCost: 320,
    beforePhotoUrl:
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
    afterPhotoUrl:
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
    resolutionNotes: 'Filters replaced, intake fans vacuumed, temperature telemetry nominal at 31°C.',
    resolvedAt: '2026-09-19 14:00',
    structuralSafetyCertified: true,
    createdAt: '2026-09-18',
    updatedAt: '2026-09-19',
  },
];

const MAINTENANCE_STORAGE_KEY = 'adversoft_maintenance_v1';

export function getStoredMaintenanceRecords(tenantId?: string): MaintenanceRecord[] {
  if (typeof window === 'undefined') return isDemoTenant(tenantId) ? INITIAL_MAINTENANCE : [];
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey(MAINTENANCE_STORAGE_KEY, tid);
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      if (isDemoTenant(tid)) {
        localStorage.setItem(key, JSON.stringify(INITIAL_MAINTENANCE));
        return INITIAL_MAINTENANCE;
      }
      return [];
    }
    return JSON.parse(data);
  } catch {
    return isDemoTenant(tid) ? INITIAL_MAINTENANCE : [];
  }
}

export function saveStoredMaintenanceRecords(records: MaintenanceRecord[], tenantId?: string): void {
  if (typeof window === 'undefined') return;
  const tid = tenantId || getActiveTenantId();
  const key = getTenantStorageKey(MAINTENANCE_STORAGE_KEY, tid);
  try {
    localStorage.setItem(key, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent('adversoft_maintenance_updated', { detail: records }));
  } catch (err) {
    console.error('Failed to save maintenance records:', err);
  }
}

export function getMaintenanceTechnicians(): MaintenanceTechnician[] {
  return INITIAL_TECHNICIANS;
}

export interface CreateMaintenanceInput {
  title: string;
  type: MaintenanceIncidentType;
  severity: MaintenanceSeverity;
  billboardId: string;
  reportedBy: string;
  reporterContact?: string;
  technicianId?: string;
  targetSlaHours?: number;
  partsReplaced?: string;
  partsCost?: number;
  laborHours?: number;
  beforePhotoUrl?: string;
  setBillboardToMaintenance?: boolean;
}

export function createMaintenanceIncident(input: CreateMaintenanceInput): {
  success: boolean;
  record?: MaintenanceRecord;
  error?: string;
} {
  const billboards = getTenantBillboards();
  const bb = billboards.find((b) => b.id === input.billboardId || b.code === input.billboardId);
  if (!bb) return { success: false, error: 'Billboard asset not found.' };

  const current = getStoredMaintenanceRecords();
  const incidentNumber = `MNT-2026-${String(current.length + 1).padStart(3, '0')}`;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  const today = new Date().toISOString().split('T')[0];

  const slaHours = input.targetSlaHours || (input.severity === 'CRITICAL' ? 4 : input.severity === 'HIGH' ? 12 : 48);
  const deadline = new Date(Date.now() + slaHours * 3600000).toISOString().replace('T', ' ').substring(0, 16);

  const tech = INITIAL_TECHNICIANS.find((t) => t.id === input.technicianId);
  const pCost = input.partsCost || 0;
  const lHours = input.laborHours || 2;
  const hRate = 160;
  const lCost = lHours * hRate;
  const tCost = pCost + lCost;

  const newRec: MaintenanceRecord = {
    id: `mnt_${Date.now()}`,
    incidentNumber,
    title: input.title,
    type: input.type,
    severity: input.severity,
    status: tech ? 'DISPATCHED' : 'REPORTED',
    billboardId: bb.id,
    billboardCode: bb.code,
    billboardName: bb.name,
    billboardAddress: bb.location.address,
    billboardCity: bb.location.city,
    billboardCorridor: bb.location.corridorName,
    structureHeightFeet: bb.structureHeightFeet || 60,
    reportedBy: input.reportedBy || 'Operations Field Patrol',
    reporterContact: input.reporterContact || 'ops@adversoft.com',
    reportedAt: now,
    targetSlaHours: slaHours,
    slaDeadline: deadline,
    technicianId: tech?.id,
    technicianName: tech?.name,
    technicianPhone: tech?.phone,
    partsReplaced: input.partsReplaced,
    partsCost: pCost,
    laborHours: lHours,
    hourlyRate: hRate,
    laborCost: lCost,
    totalCost: tCost,
    beforePhotoUrl: input.beforePhotoUrl,
    structuralSafetyCertified: false,
    createdAt: today,
    updatedAt: today,
  };

  if (input.setBillboardToMaintenance) {
    updateBillboardStatus(bb.id, 'MAINTENANCE');
  }

  const updated = [newRec, ...current];
  saveStoredMaintenanceRecords(updated);
  return { success: true, record: newRec };
}

export function dispatchMaintenanceTechnician(
  recordId: string,
  technicianId: string
): { success: boolean; record?: MaintenanceRecord; error?: string } {
  const records = getStoredMaintenanceRecords();
  const rec = records.find((r) => r.id === recordId || r.incidentNumber === recordId);
  if (!rec) return { success: false, error: 'Maintenance record not found.' };

  const tech = INITIAL_TECHNICIANS.find((t) => t.id === technicianId);
  if (!tech) return { success: false, error: 'Technician not found.' };

  rec.technicianId = tech.id;
  rec.technicianName = tech.name;
  rec.technicianPhone = tech.phone;
  rec.status = 'DISPATCHED';
  rec.updatedAt = new Date().toISOString().split('T')[0];

  saveStoredMaintenanceRecords([...records]);
  return { success: true, record: rec };
}

export function updateMaintenanceStatus(
  recordId: string,
  newStatus: MaintenanceStatus
): { success: boolean; record?: MaintenanceRecord; error?: string } {
  const records = getStoredMaintenanceRecords();
  const rec = records.find((r) => r.id === recordId || r.incidentNumber === recordId);
  if (!rec) return { success: false, error: 'Maintenance record not found.' };

  rec.status = newStatus;
  if (newStatus === 'RESOLVED' || newStatus === 'CLOSED') {
    rec.resolvedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    rec.structuralSafetyCertified = true;
  }
  rec.updatedAt = new Date().toISOString().split('T')[0];

  saveStoredMaintenanceRecords([...records]);
  return { success: true, record: rec };
}

export interface ResolveIncidentInput {
  resolutionNotes: string;
  rootCauseAnalysis?: string;
  partsReplaced?: string;
  partsCost?: number;
  laborHours?: number;
  afterPhotoUrl?: string;
  restoreBillboardAvailability?: boolean;
}

export function resolveMaintenanceIncident(
  recordId: string,
  input: ResolveIncidentInput
): { success: boolean; record?: MaintenanceRecord; error?: string } {
  const records = getStoredMaintenanceRecords();
  const rec = records.find((r) => r.id === recordId || r.incidentNumber === recordId);
  if (!rec) return { success: false, error: 'Maintenance record not found.' };

  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  rec.status = 'RESOLVED';
  rec.resolvedAt = now;
  rec.resolutionNotes = input.resolutionNotes;
  rec.rootCauseAnalysis = input.rootCauseAnalysis || 'Standard component lifecycle wear resolved.';
  if (input.partsReplaced) rec.partsReplaced = input.partsReplaced;
  if (input.partsCost !== undefined) rec.partsCost = Number(input.partsCost);
  if (input.laborHours !== undefined) {
    rec.laborHours = Number(input.laborHours);
    rec.laborCost = rec.laborHours * rec.hourlyRate;
  }
  rec.totalCost = rec.partsCost + rec.laborCost;
  if (input.afterPhotoUrl) rec.afterPhotoUrl = input.afterPhotoUrl;
  rec.structuralSafetyCertified = true;
  rec.updatedAt = new Date().toISOString().split('T')[0];

  if (input.restoreBillboardAvailability) {
    updateBillboardStatus(rec.billboardId, 'AVAILABLE');
  }

  saveStoredMaintenanceRecords([...records]);
  return { success: true, record: rec };
}

export function getMaintenanceMetrics() {
  const list = getStoredMaintenanceRecords();
  const total = list.length;
  const openCount = list.filter((r) => ['REPORTED', 'DISPATCHED', 'UNDER_REPAIR'].includes(r.status)).length;
  const criticalCount = list.filter((r) => r.severity === 'CRITICAL' && r.status !== 'RESOLVED' && r.status !== 'CLOSED').length;
  const resolvedCount = list.filter((r) => r.status === 'RESOLVED' || r.status === 'CLOSED').length;
  const totalCostSum = list.reduce((sum, r) => sum + r.totalCost, 0);

  return {
    total,
    openCount,
    criticalCount,
    resolvedCount,
    totalCostSum,
    avgResolutionHours: 6.2,
  };
}
