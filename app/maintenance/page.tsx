"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/protectedRoute';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import {
  MaintenanceRecord,
  MaintenanceIncidentType,
  MaintenanceSeverity,
  MaintenanceStatus,
  MaintenanceTechnician,
  getStoredMaintenanceRecords,
  saveStoredMaintenanceRecords,
  getMaintenanceTechnicians,
  createMaintenanceIncident,
  dispatchMaintenanceTechnician,
  updateMaintenanceStatus,
  resolveMaintenanceIncident,
  getMaintenanceMetrics,
} from '@/lib/data/maintenance-store';
import { getTenantBillboards } from '@/lib/tenant-store';
import {
  ShieldAlert,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Wrench,
  Truck,
  DollarSign,
  Calendar,
  Building,
  ArrowRight,
  Printer,
  Eye,
  RefreshCw,
  Sparkles,
  MapPin,
  ShieldCheck,
  Check,
  X,
  FileCheck2,
  FileBadge,
  Camera,
  HardHat,
  Zap,
  Lightbulb,
  Scissors,
  Flame,
  Phone,
  Sliders,
  Maximize2,
  ChevronRight,
  TrendingDown,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  MaintenanceStatus,
  { label: string; bg: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
  REPORTED: { label: 'Incident Reported', bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
  DISPATCHED: { label: 'Technician Dispatched', bg: 'bg-blue-50', text: 'text-blue-700', icon: Truck },
  UNDER_REPAIR: { label: 'Repair Underway', bg: 'bg-purple-50', text: 'text-purple-700', icon: Wrench },
  RESOLVED: { label: 'Repaired & Verified', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 },
  CLOSED: { label: 'Closed & Archived', bg: 'bg-slate-100', text: 'text-slate-600', icon: ShieldCheck },
};

const SEVERITY_CONFIG: Record<
  MaintenanceSeverity,
  { label: string; badge: string; icon: React.ComponentType<{ className?: string }> }
> = {
  CRITICAL: { label: 'Critical (4hr SLA)', badge: 'bg-rose-50 text-rose-700 border-rose-200 font-bold', icon: AlertTriangle },
  HIGH: { label: 'High (12hr SLA)', badge: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold', icon: Clock },
  MEDIUM: { label: 'Medium (48hr SLA)', badge: 'bg-blue-50 text-blue-700 border-blue-200', icon: InfoIcon },
  LOW: { label: 'Low (Scheduled)', badge: 'bg-gray-100 text-gray-700 border-gray-200', icon: CheckCircle2 },
};

function InfoIcon(props: { className?: string }) {
  return <Clock {...props} />;
}

const TYPE_CONFIG: Record<
  MaintenanceIncidentType,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  BULB_OUTAGE: { label: 'Lighting & Bulb Outage', icon: Lightbulb },
  TORN_VINYL: { label: 'Torn Vinyl / Edge Shear', icon: Scissors },
  STRUCTURAL_DAMAGE: { label: 'Structural & Catwalk', icon: ShieldAlert },
  STORM_DAMAGE: { label: 'Storm & Wind Damage', icon: AlertTriangle },
  ELECTRICAL_FAULT: { label: 'Electrical & Breaker Trip', icon: Zap },
  ROUTINE_INSPECTION: { label: 'Quarterly Inspection', icon: ShieldCheck },
  VANDALISM_GRAFFITI: { label: 'Vandalism & Graffiti', icon: Wrench },
};

export default function MaintenancePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Incidents state
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const technicians = useMemo(() => getMaintenanceTechnicians(), []);
  const billboards = useMemo(() => getTenantBillboards(), [records]);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Drawers & Modals
  const [inspectRecord, setInspectRecord] = useState<MaintenanceRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TECH' | 'COSTS' | 'PHOTOS'>('OVERVIEW');
  const [printableCertificate, setPrintableCertificate] = useState<MaintenanceRecord | null>(null);

  // Modal dialog states
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Form states: Dispatch Tech
  const [targetTechId, setTargetTechId] = useState('tech_carlos');

  // Form states: Resolve Incident
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveRootCause, setResolveRootCause] = useState('Normal wear and tear from seasonal weather changes.');
  const [resolvePartsReplaced, setResolvePartsReplaced] = useState('Replacement hardware & weather seal.');
  const [resolvePartsCost, setResolvePartsCost] = useState<number>(150);
  const [resolveLaborHours, setResolveLaborHours] = useState<number>(3);
  const [resolveAfterPhoto, setResolveAfterPhoto] = useState('');
  const [restoreAvailability, setRestoreAvailability] = useState(true);

  // Form states: Report Incident
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<MaintenanceIncidentType>('BULB_OUTAGE');
  const [newSeverity, setNewSeverity] = useState<MaintenanceSeverity>('HIGH');
  const [newBillboardId, setNewBillboardId] = useState('');
  const [newReportedBy, setNewReportedBy] = useState('Field Patrol Team');
  const [newReporterContact, setNewReporterContact] = useState('patrol@adversoft.com');
  const [newPreassignTechId, setNewPreassignTechId] = useState('');
  const [newPartsNeeded, setNewPartsNeeded] = useState('');
  const [newBeforePhoto, setNewBeforePhoto] = useState('');
  const [flagMaintenanceStatus, setFlagMaintenanceStatus] = useState(true);

  // Load records
  const refreshRecords = () => {
    const list = getStoredMaintenanceRecords();
    setRecords(list);
  };

  useEffect(() => {
    refreshRecords();
    const handleUpdate = () => refreshRecords();
    window.addEventListener('adversoft_maintenance_updated', handleUpdate);
    return () => window.removeEventListener('adversoft_maintenance_updated', handleUpdate);
  }, []);

  const metrics = useMemo(() => getMaintenanceMetrics(), [records]);

  // Filtered list
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (severityFilter !== 'ALL' && r.severity !== severityFilter) return false;
      if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = r.incidentNumber.toLowerCase().includes(q);
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesBb = r.billboardCode.toLowerCase().includes(q) || r.billboardCity.toLowerCase().includes(q);
        const matchesTech = r.technicianName && r.technicianName.toLowerCase().includes(q);
        if (!matchesRef && !matchesTitle && !matchesBb && !matchesTech) {
          return false;
        }
      }
      return true;
    });
  }, [records, statusFilter, severityFilter, typeFilter, searchQuery]);

  // Handle Dispatch Tech
  const handleDispatchTech = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectRecord) return;

    const res = dispatchMaintenanceTechnician(inspectRecord.id, targetTechId);
    if (res.success && res.record) {
      toast({
        title: 'Technician Dispatched',
        description: `${res.record.technicianName} assigned to ${res.record.incidentNumber}.`,
        type: 'success',
      });
      refreshRecords();
      setInspectRecord(res.record);
      setIsDispatchModalOpen(false);
    } else {
      toast({ title: 'Dispatch Failed', description: res.error || 'Failed to dispatch technician.', type: 'destructive' });
    }
  };

  // Handle Status Update
  const handleStatusUpdate = (recordId: string, newStatus: MaintenanceStatus) => {
    const res = updateMaintenanceStatus(recordId, newStatus);
    if (res.success && res.record) {
      toast({
        title: 'Incident Status Updated',
        description: `Incident is now ${newStatus.replace(/_/g, ' ')}.`,
        type: 'success',
      });
      refreshRecords();
      if (inspectRecord && inspectRecord.id === recordId) {
        setInspectRecord(res.record);
      }
    } else {
      toast({ title: 'Update Failed', description: res.error || 'Failed to update status.', type: 'destructive' });
    }
  };

  // Handle Resolve Incident
  const handleResolveIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectRecord) return;
    if (!resolveNotes.trim()) {
      toast({ title: 'Resolution Notes Required', description: 'Please provide repair details.', type: 'destructive' });
      return;
    }

    const res = resolveMaintenanceIncident(inspectRecord.id, {
      resolutionNotes: resolveNotes,
      rootCauseAnalysis: resolveRootCause,
      partsReplaced: resolvePartsReplaced,
      partsCost: Number(resolvePartsCost),
      laborHours: Number(resolveLaborHours),
      afterPhotoUrl: resolveAfterPhoto,
      restoreBillboardAvailability: restoreAvailability,
    });

    if (res.success && res.record) {
      toast({
        title: 'Incident Certified & Resolved',
        description: `${res.record.incidentNumber} repaired with structural sign-off.`,
        type: 'success',
      });
      refreshRecords();
      setInspectRecord(res.record);
      setIsResolveModalOpen(false);
      setResolveNotes('');
      setResolveAfterPhoto('');
    } else {
      toast({ title: 'Resolution Failed', description: res.error || 'Failed to resolve incident.', type: 'destructive' });
    }
  };

  // Handle Report Incident
  const handleReportIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBillboardId) {
      toast({ title: 'Missing Billboard', description: 'Please select a billboard asset.', type: 'destructive' });
      return;
    }
    if (!newTitle.trim()) {
      toast({ title: 'Title Required', description: 'Please enter incident fault title.', type: 'destructive' });
      return;
    }

    const res = createMaintenanceIncident({
      title: newTitle,
      type: newType,
      severity: newSeverity,
      billboardId: newBillboardId,
      reportedBy: newReportedBy,
      reporterContact: newReporterContact,
      technicianId: newPreassignTechId || undefined,
      partsReplaced: newPartsNeeded,
      beforePhotoUrl: newBeforePhoto,
      setBillboardToMaintenance: flagMaintenanceStatus,
    });

    if (res.success && res.record) {
      toast({
        title: 'Maintenance Incident Filed',
        description: `Work order ${res.record.incidentNumber} generated with ${res.record.targetSlaHours}hr SLA.`,
        type: 'success',
      });
      refreshRecords();
      setInspectRecord(res.record);
      setIsReportModalOpen(false);
      setNewTitle('');
      setNewBeforePhoto('');
    } else {
      toast({ title: 'Report Failed', description: res.error || 'Failed to file incident.', type: 'destructive' });
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-8 pb-16">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Maintenance & Structural Inspections</h1>
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                Safety & Repairs
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                OSHA 1926 Certified
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Track physical repairs, emergency lighting fixes, torn vinyl recovery, structural safety inspections, and cost logs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refreshRecords}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
              title="Refresh maintenance tickets"
            >
              <RefreshCw className="h-4 w-4 text-gray-500" />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => {
                if (billboards.length === 0) {
                  toast({
                    title: 'Prerequisite Required',
                    description: 'Please register at least one Billboard asset before reporting maintenance incidents.',
                    type: 'destructive',
                  });
                  return;
                }
                setNewBillboardId(billboards[0].id);
                setIsReportModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Report Incident / Fault</span>
            </button>
          </div>
        </div>

        {/* Executive KPI Metric Cards (Premium Dashboard Aesthetic: No black borders, soft shadows) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card
            onClick={() => setStatusFilter('REPORTED')}
            className="rounded-2xl p-5 shadow-sm bg-white border border-gray-100 flex flex-col justify-between cursor-pointer hover:border-amber-200 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">Open Tickets</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-amber-600">{metrics.openCount}</div>
              <p className="text-xs text-gray-500 mt-1">Active repairs requiring tech action</p>
            </div>
          </Card>

          <Card
            onClick={() => setSeverityFilter('CRITICAL')}
            className="rounded-2xl p-5 shadow-sm bg-white border border-gray-100 flex flex-col justify-between cursor-pointer hover:border-rose-200 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-rose-600 uppercase tracking-wider">Critical SLA Emergencies</span>
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-rose-600">{metrics.criticalCount}</div>
              <p className="text-xs text-gray-500 mt-1">4-hour emergency response ceiling</p>
            </div>
          </Card>

          <Card
            onClick={() => setStatusFilter('RESOLVED')}
            className="rounded-2xl p-5 shadow-sm bg-white border border-gray-100 flex flex-col justify-between cursor-pointer hover:border-emerald-200 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Repaired & Certified</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-emerald-600">{metrics.resolvedCount}</div>
              <p className="text-xs text-gray-500 mt-1">Sign-off photos & torque verified</p>
            </div>
          </Card>

          <Card className="rounded-2xl p-5 shadow-sm bg-white border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Repair Cost</span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-gray-900">${metrics.totalCostSum.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">Parts & technician labor expenditure</p>
            </div>
          </Card>

          <Card className="rounded-2xl p-5 shadow-sm bg-white border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Mean Resolution SLA</span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-indigo-600">{metrics.avgResolutionHours} hrs</div>
              <p className="text-xs text-gray-500 mt-1">Average fault recovery turnaround</p>
            </div>
          </Card>
        </div>

        {/* Filter Ribbon & Search Bar */}
        <Card className="rounded-2xl p-4 shadow-sm bg-white border border-gray-100">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search incidents by ref, title, billboard code, city, or technician..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50/70 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-gray-900 transition placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Select Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-gray-50/80 px-3 py-2 rounded-xl text-xs font-medium text-gray-700">
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-gray-900 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="REPORTED">Reported</option>
                  <option value="DISPATCHED">Dispatched</option>
                  <option value="UNDER_REPAIR">Under Repair</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>

              {/* Severity Filter */}
              <div className="flex items-center gap-1.5 bg-gray-50/80 px-3 py-2 rounded-xl text-xs font-medium text-gray-700">
                <span>Severity:</span>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-gray-900 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Severities</option>
                  <option value="CRITICAL">🚨 Critical (4h)</option>
                  <option value="HIGH">⚠️ High (12h)</option>
                  <option value="MEDIUM">Medium (48h)</option>
                  <option value="LOW">Low (Routine)</option>
                </select>
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-1.5 bg-gray-50/80 px-3 py-2 rounded-xl text-xs font-medium text-gray-700">
                <span>Type:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-gray-900 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Types</option>
                  <option value="BULB_OUTAGE">Bulb Outage</option>
                  <option value="TORN_VINYL">Torn Vinyl</option>
                  <option value="ELECTRICAL_FAULT">Electrical Fault</option>
                  <option value="STRUCTURAL_DAMAGE">Structural Damage</option>
                  <option value="ROUTINE_INSPECTION">Inspection</option>
                </select>
              </div>

              {/* Clear */}
              {(statusFilter !== 'ALL' || severityFilter !== 'ALL' || typeFilter !== 'ALL' || searchQuery) && (
                <button
                  onClick={() => {
                    setStatusFilter('ALL');
                    setSeverityFilter('ALL');
                    setTypeFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition"
                >
                  <X className="h-3 w-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* Master Incidents Grid */}
        <div className="grid grid-cols-1 gap-4">
          {filteredRecords.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm text-gray-400">
              <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">No Maintenance Incidents Found</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mt-1 mb-6">
                {records.length === 0
                  ? 'Your workspace has no reported maintenance issues or inspection tickets. Report structural, electrical, or vinyl faults to dispatch technicians.'
                  : 'No maintenance records matched your selected filters or search terms.'}
              </p>
              {records.length === 0 && (
                <button
                  onClick={() => {
                    if (billboards.length === 0) {
                      toast({
                        title: 'Prerequisite Required',
                        description: 'Please register at least one Billboard asset before reporting maintenance incidents.',
                        type: 'destructive',
                      });
                      return;
                    }
                    setNewBillboardId(billboards[0].id);
                    setIsReportModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow hover:bg-indigo-700 transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>Report First Incident</span>
                </button>
              )}
            </div>
          ) : (
            filteredRecords.map((rec) => {
              const statusMeta = STATUS_CONFIG[rec.status];
              const severityMeta = SEVERITY_CONFIG[rec.severity];
              const typeMeta = TYPE_CONFIG[rec.type];
              const StatusIcon = statusMeta.icon;
              const TypeIcon = typeMeta.icon;

              return (
                <div
                  key={rec.id}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition space-y-4"
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="p-3 bg-rose-50 text-rose-700 font-bold rounded-xl text-xs font-mono">
                        {rec.incidentNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3
                            onClick={() => {
                              setInspectRecord(rec);
                              setActiveTab('OVERVIEW');
                            }}
                            className="font-bold text-gray-900 text-sm hover:text-indigo-600 cursor-pointer transition"
                          >
                            {rec.title}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusMeta.bg} ${statusMeta.text}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            <span>{statusMeta.label}</span>
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border ${severityMeta.badge}`}
                          >
                            {severityMeta.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                          <span>
                            Asset: <strong>{rec.billboardCode}</strong> ({rec.billboardCity})
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="flex items-center gap-1 text-gray-600">
                            <TypeIcon className="h-3 w-3 text-gray-400" />
                            <span>{typeMeta.label}</span>
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Quick Action buttons */}
                    <div className="flex items-center gap-2">
                      {rec.status === 'REPORTED' && (
                        <button
                          onClick={() => {
                            setInspectRecord(rec);
                            setIsDispatchModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition"
                        >
                          Dispatch Tech
                        </button>
                      )}

                      {['DISPATCHED', 'UNDER_REPAIR'].includes(rec.status) && (
                        <button
                          onClick={() => {
                            setInspectRecord(rec);
                            setIsResolveModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 shadow-sm transition"
                        >
                          Resolve & Sign Off
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setInspectRecord(rec);
                          setActiveTab('OVERVIEW');
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 shadow-sm transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Incident Log</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Multi-Metric Operations Pillars */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-gray-50/60 p-3.5 rounded-xl border border-gray-100/60">
                    {/* Location Specs */}
                    <div>
                      <span className="text-gray-400 text-[10px] uppercase font-bold">Location & Height</span>
                      <div className="font-bold text-gray-900 mt-0.5">{rec.billboardCity}</div>
                      <p className="text-[11px] text-gray-500 truncate">
                        {rec.billboardCorridor} • {rec.structureHeightFeet}ft Height
                      </p>
                    </div>

                    {/* Assigned Technician */}
                    <div>
                      <span className="text-gray-400 text-[10px] uppercase font-bold">Technician</span>
                      <div className="font-bold text-gray-900 mt-0.5">
                        {rec.technicianName || 'Awaiting Dispatch'}
                      </div>
                      <p className="text-[11px] text-gray-500 truncate">
                        {rec.technicianPhone || 'Dispatch hotline active'}
                      </p>
                    </div>

                    {/* SLA Deadline */}
                    <div>
                      <span className="text-gray-400 text-[10px] uppercase font-bold">SLA Target</span>
                      <div className="font-bold text-gray-900 mt-0.5">{rec.targetSlaHours}h Response Window</div>
                      <p className="text-[11px] text-gray-500 truncate">Deadline: {rec.slaDeadline}</p>
                    </div>

                    {/* Repair Expense */}
                    <div>
                      <span className="text-gray-400 text-[10px] uppercase font-bold">Repair Cost</span>
                      <div className="font-bold text-gray-900 mt-0.5">${rec.totalCost.toLocaleString()}</div>
                      <p className="text-[11px] text-emerald-600 font-medium">
                        ${rec.partsCost} parts + ${rec.laborCost} labor
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ========================================================================= */}
        {/* COMPREHENSIVE MAINTENANCE INCIDENT INSPECTION DRAWER */}
        {/* ========================================================================= */}
        {inspectRecord && (
          <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-3xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
              {/* Drawer Top Header */}
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-gray-900">
                        {inspectRecord.incidentNumber}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          STATUS_CONFIG[inspectRecord.status].bg
                        } ${STATUS_CONFIG[inspectRecord.status].text}`}
                      >
                        {STATUS_CONFIG[inspectRecord.status].label}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full border ${
                          SEVERITY_CONFIG[inspectRecord.severity].badge
                        }`}
                      >
                        {SEVERITY_CONFIG[inspectRecord.severity].label}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 mt-1">{inspectRecord.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Billboard: {inspectRecord.billboardCode} — {inspectRecord.billboardName} ({inspectRecord.billboardCity})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPrintableCertificate(inspectRecord)}
                      className="p-2 rounded-xl text-gray-500 hover:bg-white hover:text-indigo-600 shadow-sm transition"
                      title="Print Structural Certificate"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setInspectRecord(null)}
                      className="p-2 rounded-xl text-gray-500 hover:bg-white hover:text-gray-900 shadow-sm transition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-3 mt-5 border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('OVERVIEW')}
                    className={`pb-2.5 px-2 text-xs font-semibold transition border-b-2 ${
                      activeTab === 'OVERVIEW'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Incident Overview & SLA
                  </button>
                  <button
                    onClick={() => setActiveTab('TECH')}
                    className={`pb-2.5 px-2 text-xs font-semibold transition border-b-2 ${
                      activeTab === 'TECH'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Technician Dispatch
                  </button>
                  <button
                    onClick={() => setActiveTab('COSTS')}
                    className={`pb-2.5 px-2 text-xs font-semibold transition border-b-2 ${
                      activeTab === 'COSTS'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Parts & Cost Ledger (${inspectRecord.totalCost})
                  </button>
                  <button
                    onClick={() => setActiveTab('PHOTOS')}
                    className={`pb-2.5 px-2 text-xs font-semibold transition border-b-2 ${
                      activeTab === 'PHOTOS'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Photos & Root Cause
                  </button>
                </div>
              </div>

              {/* Drawer Tab Content */}
              <div className="p-6 space-y-6 flex-1 text-xs">
                {/* TAB 1: INCIDENT OVERVIEW & SLA */}
                {activeTab === 'OVERVIEW' && (
                  <div className="space-y-6">
                    {/* Structure Details Card */}
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                      <span className="font-bold text-gray-900 block flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-indigo-600" />
                        <span>Billboard Asset Location & Specs</span>
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                        <div>
                          <span className="text-gray-400">Street Address:</span>
                          <div className="font-bold text-gray-900">{inspectRecord.billboardAddress}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">City & Corridor:</span>
                          <div className="font-bold text-gray-900">
                            {inspectRecord.billboardCity} • {inspectRecord.billboardCorridor}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Structure Height:</span>
                          <div className="font-bold text-gray-900">{inspectRecord.structureHeightFeet}ft Above Ground</div>
                        </div>
                      </div>
                    </div>

                    {/* SLA Alert Banner */}
                    <div
                      className={`p-4 rounded-2xl border flex items-center justify-between ${
                        inspectRecord.severity === 'CRITICAL'
                          ? 'bg-rose-50/60 border-rose-200 text-rose-950'
                          : 'bg-indigo-50/50 border-indigo-100 text-indigo-950'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-xl ${
                            inspectRecord.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          <Clock className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-bold text-xs">
                            SLA Target Window: {inspectRecord.targetSlaHours} Hours
                          </div>
                          <div className="text-[11px] text-gray-600 mt-0.5">
                            Reported: {inspectRecord.reportedAt} • Deadline: <strong>{inspectRecord.slaDeadline}</strong>
                          </div>
                        </div>
                      </div>

                      {['DISPATCHED', 'UNDER_REPAIR'].includes(inspectRecord.status) && (
                        <button
                          onClick={() => setIsResolveModalOpen(true)}
                          className="px-3.5 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg shadow-sm hover:bg-emerald-700 transition"
                        >
                          Resolve Issue
                        </button>
                      )}
                    </div>

                    {/* Reporter Info */}
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                      <span className="text-gray-400 text-[10px] uppercase font-bold">Incident Reported By:</span>
                      <div className="font-bold text-gray-900 text-xs">{inspectRecord.reportedBy}</div>
                      <div className="text-gray-500 text-[11px]">Contact: {inspectRecord.reporterContact}</div>
                    </div>
                  </div>
                )}

                {/* TAB 2: TECHNICIAN DISPATCH */}
                {activeTab === 'TECH' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900">Assigned Technician</h4>
                        <p className="text-gray-500">Certified field technician deployed for structural repair.</p>
                      </div>

                      <button
                        onClick={() => setIsDispatchModalOpen(true)}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
                      >
                        Change Technician
                      </button>
                    </div>

                    {inspectRecord.technicianName ? (
                      <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                          <div>
                            <span className="font-bold text-gray-900 text-sm">{inspectRecord.technicianName}</span>
                            <div className="text-gray-500 text-[11px]">
                              Direct Mobile: <strong>{inspectRecord.technicianPhone}</strong>
                            </div>
                          </div>
                          <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full">
                            Assigned Tech
                          </span>
                        </div>

                        {/* Status Switcher Controls */}
                        <div className="pt-2 flex items-center gap-2">
                          <button
                            onClick={() => handleStatusUpdate(inspectRecord.id, 'DISPATCHED')}
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-semibold hover:bg-blue-100 transition"
                          >
                            Mark Dispatched
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(inspectRecord.id, 'UNDER_REPAIR')}
                            className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg font-semibold hover:bg-purple-100 transition"
                          >
                            Mark Under Repair
                          </button>
                          <button
                            onClick={() => setIsResolveModalOpen(true)}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
                          >
                            Mark Resolved
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400">
                        <Wrench className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="font-semibold text-gray-700">No Technician Assigned</p>
                        <p className="text-xs mt-1">Assign an on-duty technician to resolve this fault.</p>
                        <button
                          onClick={() => setIsDispatchModalOpen(true)}
                          className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition"
                        >
                          Dispatch Technician Now
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: PARTS & COST ACCOUNTING */}
                {activeTab === 'COSTS' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900">Repair Cost Ledger</h4>
                        <p className="text-gray-500">Itemized components, replacement parts, and technician labor.</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 uppercase font-bold">Total Expense</span>
                        <div className="text-base font-bold text-gray-900">
                          ${inspectRecord.totalCost.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
                      <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-4">
                        <div>
                          <span className="text-gray-400 text-[10px] uppercase font-bold">Replacement Parts</span>
                          <div className="text-sm font-bold text-gray-900 mt-0.5">
                            ${inspectRecord.partsCost.toLocaleString()}
                          </div>
                          <p className="text-[11px] text-gray-600 mt-1">
                            {inspectRecord.partsReplaced || 'No replacement parts logged.'}
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-400 text-[10px] uppercase font-bold">Field Labor</span>
                          <div className="text-sm font-bold text-gray-900 mt-0.5">
                            ${inspectRecord.laborCost.toLocaleString()}
                          </div>
                          <p className="text-[11px] text-gray-600 mt-1">
                            {inspectRecord.laborHours} hours @ ${inspectRecord.hourlyRate}/hr
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Accounting Code: MAINT-{inspectRecord.billboardCode}</span>
                        <span>Depreciation Asset Ledger: ACTIVE</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: PHOTOS & ROOT CAUSE */}
                {activeTab === 'PHOTOS' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-bold text-gray-900">Visual Evidence & Root Cause Analysis</h4>
                      <p className="text-gray-500">Damage documentation before and after repair execution.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Before Photo */}
                      <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                        <span className="font-bold text-gray-700 text-[11px] block">1. Damage / Outage Before Repair</span>
                        <div className="h-44 bg-gray-950 rounded-xl overflow-hidden flex items-center justify-center">
                          {inspectRecord.beforePhotoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={inspectRecord.beforePhotoUrl}
                              alt="Before"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-500 text-xs italic">No photo attached</span>
                          )}
                        </div>
                      </div>

                      {/* After Photo */}
                      <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                        <span className="font-bold text-gray-700 text-[11px] block">2. Repaired & Illumination Verified</span>
                        <div className="h-44 bg-gray-950 rounded-xl overflow-hidden flex items-center justify-center">
                          {inspectRecord.afterPhotoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={inspectRecord.afterPhotoUrl}
                              alt="After"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-500 text-xs italic">Pending repair completion</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Root Cause & Resolution Notes */}
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                      <span className="font-bold text-gray-900 block">Root Cause Engineering Analysis:</span>
                      <p className="text-gray-700 text-[11px] leading-relaxed">
                        {inspectRecord.rootCauseAnalysis || 'Under technical evaluation.'}
                      </p>
                      {inspectRecord.resolutionNotes && (
                        <div className="pt-2 border-t border-gray-200">
                          <span className="font-bold text-gray-900 block text-xs">Resolution Notes:</span>
                          <p className="text-gray-700 text-[11px] mt-0.5">{inspectRecord.resolutionNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-6 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between">
                <button
                  onClick={() => setInspectRecord(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 transition"
                >
                  Close
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPrintableCertificate(inspectRecord)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-gray-700 text-xs font-semibold rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Structural Certificate</span>
                  </button>

                  {['REPORTED', 'DISPATCHED', 'UNDER_REPAIR'].includes(inspectRecord.status) && (
                    <button
                      onClick={() => setIsResolveModalOpen(true)}
                      className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 shadow-sm transition"
                    >
                      Resolve Incident
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DISPATCH TECHNICIAN MODAL */}
        {/* ========================================================================= */}
        {isDispatchModalOpen && inspectRecord && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Dispatch Field Technician</h3>
                    <p className="text-xs text-gray-500">{inspectRecord.incidentNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleDispatchTech} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Select Field Technician *</label>
                  <select
                    value={targetTechId}
                    onChange={(e) => setTargetTechId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.specialty.replace(/_/g, ' ')}) — {t.vehicle}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-blue-950 space-y-1">
                  <span className="font-semibold block">SLA Commitment:</span>
                  <p className="text-[11px]">
                    Technician will be dispatched with mobile parts van to meet the {inspectRecord.targetSlaHours}h response
                    guarantee.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsDispatchModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-sm transition"
                  >
                    Confirm Dispatch
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* RESOLVE INCIDENT MODAL */}
        {/* ========================================================================= */}
        {isResolveModalOpen && inspectRecord && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Resolve & Certify Repair</h3>
                    <p className="text-xs text-gray-500">{inspectRecord.incidentNumber} • {inspectRecord.billboardCode}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsResolveModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleResolveIncident} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Resolution Work Notes *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Describe repair actions performed (e.g. Replaced faulty ballast, tightened ratchet straps, re-torqued bolts)..."
                    value={resolveNotes}
                    onChange={(e) => setResolveNotes(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Root Cause Analysis</label>
                  <input
                    type="text"
                    value={resolveRootCause}
                    onChange={(e) => setResolveRootCause(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Replacement Parts Item</label>
                    <input
                      type="text"
                      value={resolvePartsReplaced}
                      onChange={(e) => setResolvePartsReplaced(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Parts Cost ($)</label>
                    <input
                      type="number"
                      value={resolvePartsCost}
                      onChange={(e) => setResolvePartsCost(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Technician Labor Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={resolveLaborHours}
                    onChange={(e) => setResolveLaborHours(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">After-Repair Photo URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={resolveAfterPhoto}
                    onChange={(e) => setResolveAfterPhoto(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setResolveAfterPhoto(
                        'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&auto=format&fit=crop&q=80'
                      )
                    }
                    className="text-[10px] text-indigo-600 hover:underline mt-1 block"
                  >
                    Use Demo Repaired Photo
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="restoreAvailCheck"
                    checked={restoreAvailability}
                    onChange={(e) => setRestoreAvailability(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="restoreAvailCheck" className="font-semibold text-gray-700 cursor-pointer">
                    Restore billboard status to AVAILABLE in inventory
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsResolveModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 shadow-sm transition"
                  >
                    Certify Resolution & Close
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* REPORT INCIDENT MODAL */}
        {/* ========================================================================= */}
        {isReportModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">File Maintenance Incident</h3>
                  <p className="text-xs text-gray-500">Log damage, lighting outage, or scheduled safety inspection.</p>
                </div>
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleReportIncident} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Billboard Asset *</label>
                  <select
                    required
                    value={newBillboardId}
                    onChange={(e) => setNewBillboardId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {billboards.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code} — {b.name} ({b.location.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Fault Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lower section lighting out, wind tear on corner"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Incident Type</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as MaintenanceIncidentType)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="BULB_OUTAGE">Lighting & Bulb Outage</option>
                      <option value="TORN_VINYL">Torn Vinyl / Edge Shear</option>
                      <option value="ELECTRICAL_FAULT">Electrical & Breaker Trip</option>
                      <option value="STRUCTURAL_DAMAGE">Structural & Catwalk</option>
                      <option value="STORM_DAMAGE">Storm & Wind Damage</option>
                      <option value="ROUTINE_INSPECTION">Quarterly Inspection</option>
                      <option value="VANDALISM_GRAFFITI">Vandalism & Graffiti</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Severity / SLA</label>
                    <select
                      value={newSeverity}
                      onChange={(e) => setNewSeverity(e.target.value as MaintenanceSeverity)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="CRITICAL">🚨 Critical (4-hour SLA)</option>
                      <option value="HIGH">⚠️ High (12-hour SLA)</option>
                      <option value="MEDIUM">Medium (48-hour SLA)</option>
                      <option value="LOW">Low (Routine Scheduled)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Reported By</label>
                    <input
                      type="text"
                      value={newReportedBy}
                      onChange={(e) => setNewReportedBy(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Reporter Contact</label>
                    <input
                      type="text"
                      value={newReporterContact}
                      onChange={(e) => setNewReporterContact(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Damage Photo URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={newBeforePhoto}
                    onChange={(e) => setNewBeforePhoto(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="flagMntCheck"
                    checked={flagMaintenanceStatus}
                    onChange={(e) => setFlagMaintenanceStatus(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="flagMntCheck" className="font-semibold text-gray-700 cursor-pointer">
                    Temporarily flag billboard status as MAINTENANCE to block bookings
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-sm transition"
                  >
                    Submit Ticket & Dispatch
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PRINTABLE STRUCTURAL COMPLIANCE CERTIFICATE (window.print() ready) */}
        {/* ========================================================================= */}
        {printableCertificate && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-gray-100 my-8">
              {/* Toolbar */}
              <div className="p-4 bg-gray-900 text-white flex items-center justify-between no-print">
                <div className="flex items-center gap-2">
                  <FileBadge className="h-5 w-5 text-indigo-400" />
                  <span className="font-semibold text-sm">
                    Structural Maintenance & Safety Compliance Certificate — {printableCertificate.incidentNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Certificate</span>
                  </button>
                  <button
                    onClick={() => setPrintableCertificate(null)}
                    className="p-1.5 text-gray-400 hover:text-white rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Printable Body */}
              <div className="p-10 space-y-8 text-gray-800 text-xs font-sans bg-white leading-relaxed">
                {/* Header */}
                <div className="border-b border-gray-200 pb-6 flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-gray-900 uppercase">
                      Adversoft Outdoor Media LLC
                    </h1>
                    <p className="text-gray-500 text-xs mt-0.5">
                      Structural Engineering, Electrical Safety & Quality Bureau
                    </p>
                    <p className="text-gray-500 text-xs">
                      OSHA 1926 Compliance Operations • structural-engineering@adversoft.com
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-gray-900">
                      SAFETY CERTIFICATE #{printableCertificate.incidentNumber}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Inspection Date: {printableCertificate.resolvedAt || printableCertificate.updatedAt}
                    </div>
                    <span className="inline-block mt-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded uppercase">
                      Certified Structural Integrity
                    </span>
                  </div>
                </div>

                {/* Section 1: Billboard Structure Details */}
                <div>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                    1. AUDITED BILLBOARD ASSET DETAILS
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border border-gray-200 text-xs">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-bold bg-gray-50 w-1/3">Billboard Identifier:</td>
                          <td className="p-2.5 font-semibold text-gray-900">
                            {printableCertificate.billboardCode} — {printableCertificate.billboardName}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-bold bg-gray-50">Physical Address:</td>
                          <td className="p-2.5">
                            {printableCertificate.billboardAddress}, {printableCertificate.billboardCity}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-bold bg-gray-50">Corridor / Location:</td>
                          <td className="p-2.5">{printableCertificate.billboardCorridor}</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold bg-gray-50">Structural Height:</td>
                          <td className="p-2.5">{printableCertificate.structureHeightFeet} Feet Above Grade</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 2: Fault & Resolution Findings */}
                <div>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                    2. INCIDENT REMEDIATION & ROOT CAUSE FINDINGS
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border border-gray-200 text-xs">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-bold bg-gray-50 w-1/3">Incident Classification:</td>
                          <td className="p-2.5 font-semibold text-gray-900">{printableCertificate.title}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-bold bg-gray-50">Root Cause Analysis:</td>
                          <td className="p-2.5">
                            {printableCertificate.rootCauseAnalysis || 'Normal environmental operational fatigue.'}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-bold bg-gray-50">Corrective Measures:</td>
                          <td className="p-2.5">
                            {printableCertificate.resolutionNotes || 'Component replaced and structural integrity re-certified.'}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold bg-gray-50">Parts Installed:</td>
                          <td className="p-2.5 font-mono text-[11px]">
                            {printableCertificate.partsReplaced || 'OEM components installed.'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 3: Engineering Sign-off */}
                <div className="pt-4 border-t border-gray-200">
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                    3. CERTIFIED ENGINEERING & COMPLIANCE SEAL
                  </h2>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="border border-gray-200 p-4 rounded-lg bg-gray-50/50 space-y-1">
                      <div className="font-bold text-gray-900">CHIEF STRUCTURAL INSPECTOR</div>
                      <div className="text-gray-500 text-[10px]">
                        Certified under OSHA 1926 standards for wind shear load, weld integrity, and electrical
                        grounding.
                      </div>
                      <div className="pt-4 flex items-end justify-between">
                        <div>
                          <div className="font-serif italic text-xl text-gray-900">
                            {printableCertificate.technicianName || 'Carlos Mendoza'}
                          </div>
                          <div className="text-[10px] text-gray-500">Lead Certified Inspector</div>
                        </div>
                        <div className="text-right text-[10px] text-gray-400 font-mono">
                          Verified: {printableCertificate.resolvedAt || printableCertificate.updatedAt}
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-200 p-4 rounded-lg bg-gray-50/50 text-center flex flex-col justify-between">
                      <div>
                        <div className="font-bold text-gray-900 text-xs">OFFICIAL STRUCTURAL SEAL</div>
                        <div className="text-gray-500 text-[10px] mt-0.5">
                          Torque bolts calibrated to 180 ft-lbs. 100% Illumination certified.
                        </div>
                        <div className="font-mono text-xs text-emerald-700 font-bold mt-2">
                          OSHA-1926-COMPLIANT
                        </div>
                      </div>
                      <div className="text-[9px] text-gray-400 pt-2 border-t border-gray-200">
                        Adversoft Structural Operations Bureau
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
