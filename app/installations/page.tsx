"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/protectedRoute';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import {
  InstallationWorkOrder,
  WorkOrderStatus,
  WorkOrderType,
  WorkOrderPriority,
  FieldCrew,
  InstallationProofPhotos,
  SafetyChecklist,
  getStoredWorkOrders,
  saveStoredWorkOrders,
  getFieldCrews,
  createWorkOrder,
  assignCrewToWorkOrder,
  updateWorkOrderStatus,
  uploadInstallationProof,
  updateSafetyChecklist,
  getInstallationMetrics,
} from '@/lib/data/installations-store';
import { getTenantBillboards } from '@/lib/tenant-store';
import { getStoredCampaigns } from '@/lib/data/campaigns-store';
import {
  Wrench,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Truck,
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
  Layers,
  HardHat,
  Compass,
  Phone,
  Wind,
  Sun,
  Moon,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Navigation,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  WorkOrderStatus,
  { label: string; bg: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
  PENDING_ASSIGNMENT: { label: 'Pending Dispatch', bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
  SCHEDULED: { label: 'Scheduled', bg: 'bg-blue-50', text: 'text-blue-700', icon: Calendar },
  CREW_EN_ROUTE: { label: 'Crew En Route', bg: 'bg-indigo-50', text: 'text-indigo-700', icon: Truck },
  IN_PROGRESS: { label: 'Rigging In Progress', bg: 'bg-purple-50', text: 'text-purple-700', icon: HardHat },
  COMPLETED: { label: 'Mounted & Verified', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 },
  CANCELLED: { label: 'Rescheduled / Aborted', bg: 'bg-rose-50', text: 'text-rose-700', icon: XCircle },
};

const TYPE_CONFIG: Record<WorkOrderType, { label: string; color: string }> = {
  INSTALLATION: { label: 'Initial Vinyl Mounting', color: 'bg-emerald-50 text-emerald-700' },
  TAKEDOWN: { label: 'Vinyl Strike & Recycling', color: 'bg-amber-50 text-amber-700' },
  RE_SKINNING: { label: 'Mid-Flight Re-Skin', color: 'bg-blue-50 text-blue-700' },
  DIGITAL_CALIBRATION: { label: 'Digital LED NOC Deploy', color: 'bg-indigo-50 text-indigo-700' },
};

const PRIORITY_BADGES: Record<WorkOrderPriority, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-blue-50 text-blue-700',
  HIGH: 'bg-amber-50 text-amber-700',
  URGENT: 'bg-rose-50 text-rose-700 font-bold',
};

export default function InstallationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Work Orders state
  const [workOrders, setWorkOrders] = useState<InstallationWorkOrder[]>([]);
  const crews = useMemo(() => getFieldCrews(), []);
  const campaigns = useMemo(() => getStoredCampaigns(), [workOrders]);
  const billboards = useMemo(() => getTenantBillboards(), [workOrders]);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [crewFilter, setCrewFilter] = useState<string>('ALL');

  // Drawers & Modals
  const [inspectOrder, setInspectOrder] = useState<InstallationWorkOrder | null>(null);
  const [activeTab, setActiveTab] = useState<'MANIFEST' | 'CREW' | 'SAFETY' | 'PROOF'>('MANIFEST');
  const [printableManifest, setPrintableManifest] = useState<InstallationWorkOrder | null>(null);

  // Modal dialog states
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form states: Assign Crew
  const [targetCrewId, setTargetCrewId] = useState('crew_alpha');
  const [assignDate, setAssignDate] = useState('2026-10-15');
  const [assignWindow, setAssignWindow] = useState('05:00 - 09:00 CST (Low Traffic Window)');

  // Form states: Upload POP Photos
  const [proofBeforeUrl, setProofBeforeUrl] = useState('');
  const [proofAfterDayUrl, setProofAfterDayUrl] = useState('');
  const [proofAfterNightUrl, setProofAfterNightUrl] = useState('');
  const [proofInspectorName, setProofInspectorName] = useState('Carlos Mendoza');
  const [proofNotes, setProofNotes] = useState('Heavyweight vinyl secured with 3-inch pipe pockets. 100% illumination compliance verified.');
  const [proofScore, setProofScore] = useState<number>(100);
  const [autoCompleteJob, setAutoCompleteJob] = useState(true);

  // Form states: Create Work Order
  const [newOrderType, setNewOrderType] = useState<WorkOrderType>('INSTALLATION');
  const [newOrderPriority, setNewOrderPriority] = useState<WorkOrderPriority>('HIGH');
  const [newOrderCampaignId, setNewOrderCampaignId] = useState('');
  const [newOrderBillboardId, setNewOrderBillboardId] = useState('');
  const [newOrderCrewId, setNewOrderCrewId] = useState('');
  const [newOrderDate, setNewOrderDate] = useState('2026-10-18');
  const [newOrderWindow, setNewOrderWindow] = useState('06:00 - 10:00 EST');
  const [newOrderInstructions, setNewOrderInstructions] = useState('Rigging crew requires 60ft boom crane and lane closure permit.');

  // Load work orders
  const refreshOrders = () => {
    const list = getStoredWorkOrders();
    setWorkOrders(list);
  };

  useEffect(() => {
    refreshOrders();
    const handleUpdate = () => refreshOrders();
    window.addEventListener('adversoft_installations_updated', handleUpdate);
    return () => window.removeEventListener('adversoft_installations_updated', handleUpdate);
  }, []);

  const metrics = useMemo(() => getInstallationMetrics(), [workOrders]);

  // Filtered list
  const filteredOrders = useMemo(() => {
    return workOrders.filter((w) => {
      if (statusFilter !== 'ALL' && w.status !== statusFilter) return false;
      if (typeFilter !== 'ALL' && w.type !== typeFilter) return false;
      if (crewFilter !== 'ALL' && w.crewId !== crewFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = w.workOrderNumber.toLowerCase().includes(q);
        const matchesCampaign = w.campaignName.toLowerCase().includes(q);
        const matchesClient = w.clientCompanyName.toLowerCase().includes(q);
        const matchesBb = w.billboardCode.toLowerCase().includes(q) || w.billboardCity.toLowerCase().includes(q);
        const matchesLead = w.leadTechnician && w.leadTechnician.toLowerCase().includes(q);
        if (!matchesRef && !matchesCampaign && !matchesClient && !matchesBb && !matchesLead) {
          return false;
        }
      }
      return true;
    });
  }, [workOrders, statusFilter, typeFilter, crewFilter, searchQuery]);

  // Handle Assign Crew
  const handleAssignCrew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectOrder) return;

    const res = assignCrewToWorkOrder(inspectOrder.id, targetCrewId, assignDate, assignWindow);
    if (res.success && res.workOrder) {
      toast({
        title: 'Field Crew Dispatched',
        description: `${res.workOrder.crewName} assigned for ${assignDate}.`,
        type: 'success',
      });
      refreshOrders();
      setInspectOrder(res.workOrder);
      setIsAssignModalOpen(false);
    } else {
      toast({ title: 'Dispatch Error', description: res.error || 'Failed to assign crew.', type: 'destructive' });
    }
  };

  // Handle Status Update
  const handleStatusUpdate = (orderId: string, newStatus: WorkOrderStatus) => {
    const res = updateWorkOrderStatus(orderId, newStatus);
    if (res.success && res.workOrder) {
      toast({
        title: 'Work Order Updated',
        description: `Order is now ${newStatus.replace(/_/g, ' ')}.`,
        type: 'success',
      });
      refreshOrders();
      if (inspectOrder && inspectOrder.id === orderId) {
        setInspectOrder(res.workOrder);
      }
    } else {
      toast({ title: 'Update Failed', description: res.error || 'Failed to update status.', type: 'destructive' });
    }
  };

  // Handle Upload Proof Photos
  const handleUploadProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectOrder) return;
    if (!proofAfterDayUrl.trim() && !proofAfterNightUrl.trim()) {
      toast({ title: 'Photo Required', description: 'Please provide at least one post-installation photo.', type: 'destructive' });
      return;
    }

    const res = uploadInstallationProof(inspectOrder.id, {
      beforePhotoUrl: proofBeforeUrl,
      afterDayPhotoUrl: proofAfterDayUrl,
      afterNightPhotoUrl: proofAfterNightUrl,
      inspectorName: proofInspectorName,
      inspectionNotes: proofNotes,
      illuminationScorePercent: Number(proofScore),
      autoComplete: autoCompleteJob,
    });

    if (res.success && res.workOrder) {
      toast({
        title: 'Proof-of-Posting Verified',
        description: 'Mounting photos and illumination telemetry logged successfully.',
        type: 'success',
      });
      refreshOrders();
      setInspectOrder(res.workOrder);
      setIsProofModalOpen(false);
      setProofBeforeUrl('');
      setProofAfterDayUrl('');
      setProofAfterNightUrl('');
    } else {
      toast({ title: 'Upload Failed', description: res.error || 'Failed to upload proof.', type: 'destructive' });
    }
  };

  // Handle Toggle Safety Checklist
  const handleToggleSafety = (key: keyof SafetyChecklist) => {
    if (!inspectOrder) return;
    const currentVal = inspectOrder.safetyChecklist[key];
    const updateObj: Partial<SafetyChecklist> = {};
    if (typeof currentVal === 'boolean') {
      (updateObj as any)[key] = !currentVal;
    }

    const res = updateSafetyChecklist(inspectOrder.id, updateObj);
    if (res.success && res.workOrder) {
      refreshOrders();
      setInspectOrder(res.workOrder);
    }
  };

  // Handle Create Work Order
  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderCampaignId || !newOrderBillboardId) {
      toast({ title: 'Missing Information', description: 'Please select campaign and billboard.', type: 'destructive' });
      return;
    }

    const res = createWorkOrder({
      type: newOrderType,
      priority: newOrderPriority,
      campaignId: newOrderCampaignId,
      billboardId: newOrderBillboardId,
      crewId: newOrderCrewId || undefined,
      scheduledDate: newOrderDate,
      scheduledTimeWindow: newOrderWindow,
      specialInstructions: newOrderInstructions,
    });

    if (res.success && res.workOrder) {
      toast({
        title: 'Work Order Generated',
        description: `Order ${res.workOrder.workOrderNumber} created and queued.`,
        type: 'success',
      });
      refreshOrders();
      setInspectOrder(res.workOrder);
      setIsCreateModalOpen(false);
    } else {
      toast({ title: 'Generation Failed', description: res.error || 'Failed to create work order.', type: 'destructive' });
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-8 pb-16">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Installation & Field Operations</h1>
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                Rigging Ops
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                Field Telemetry Active
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Field work orders, rigging crew dispatch, crane permits, and mobile proof-of-posting photo audits (before/after).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refreshOrders}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
              title="Refresh field operations"
            >
              <RefreshCw className="h-4 w-4 text-gray-500" />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => {
                if (campaigns.length === 0 || billboards.length === 0) {
                  toast({
                    title: 'Prerequisite Required',
                    description: 'Please register at least one Campaign and Billboard before generating work orders.',
                    type: 'destructive',
                  });
                  return;
                }
                setNewOrderCampaignId(campaigns[0].id);
                setNewOrderBillboardId(billboards[0].id);
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Generate Work Order</span>
            </button>
          </div>
        </div>

        {/* Executive KPI Metric Cards (Premium Dashboard Aesthetic: No black borders, soft shadows) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card
            onClick={() => setStatusFilter('SCHEDULED')}
            className="rounded-2xl p-5 shadow-sm bg-white border border-gray-100 flex flex-col justify-between cursor-pointer hover:border-blue-200 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">Scheduled Jobs</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-blue-600">{metrics.scheduledCount}</div>
              <p className="text-xs text-gray-500 mt-1">Crews and boom cranes assigned</p>
            </div>
          </Card>

          <Card
            onClick={() => setStatusFilter('IN_PROGRESS')}
            className="rounded-2xl p-5 shadow-sm bg-white border border-gray-100 flex flex-col justify-between cursor-pointer hover:border-purple-200 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-purple-600 uppercase tracking-wider">In Progress</span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <Truck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-purple-600">{metrics.inProgressCount}</div>
              <p className="text-xs text-gray-500 mt-1">Riggers actively mounting vinyl/LED</p>
            </div>
          </Card>

          <Card
            onClick={() => setStatusFilter('COMPLETED')}
            className="rounded-2xl p-5 shadow-sm bg-white border border-gray-100 flex flex-col justify-between cursor-pointer hover:border-emerald-200 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Completed & Verified</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-emerald-600">{metrics.completedCount}</div>
              <p className="text-xs text-gray-500 mt-1">Mounted with verified POP audit photos</p>
            </div>
          </Card>

          <Card
            onClick={() => setStatusFilter('PENDING_ASSIGNMENT')}
            className="rounded-2xl p-5 shadow-sm bg-white border border-gray-100 flex flex-col justify-between cursor-pointer hover:border-amber-200 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">Awaiting Dispatch</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-amber-600">{metrics.pendingAssignmentCount}</div>
              <p className="text-xs text-gray-500 mt-1">Work orders requiring crew allocation</p>
            </div>
          </Card>

          <Card className="rounded-2xl p-5 shadow-sm bg-white border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">On-Time Rigging SLA</span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-indigo-600">{metrics.onTimeRatePercent}%</div>
              <p className="text-xs text-gray-500 mt-1">{metrics.activeCrewsCount} field crews on duty</p>
            </div>
          </Card>
        </div>

        {/* Filter & Search Ribbon */}
        <Card className="rounded-2xl p-4 shadow-sm bg-white border border-gray-100">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search work orders by ref, campaign, client, billboard code, city, crew..."
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

            {/* Filter Dropdowns */}
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
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING_ASSIGNMENT">Awaiting Dispatch</option>
                </select>
              </div>

              {/* Job Type Filter */}
              <div className="flex items-center gap-1.5 bg-gray-50/80 px-3 py-2 rounded-xl text-xs font-medium text-gray-700">
                <span>Type:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-gray-900 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Operations</option>
                  <option value="INSTALLATION">Mounting</option>
                  <option value="TAKEDOWN">Takedown</option>
                  <option value="DIGITAL_CALIBRATION">Digital LED NOC</option>
                  <option value="RE_SKINNING">Re-Skinning</option>
                </select>
              </div>

              {/* Field Crew Filter */}
              <div className="flex items-center gap-1.5 bg-gray-50/80 px-3 py-2 rounded-xl text-xs font-medium text-gray-700">
                <span>Crew:</span>
                <select
                  value={crewFilter}
                  onChange={(e) => setCrewFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-gray-900 focus:outline-none cursor-pointer max-w-[140px] truncate"
                >
                  <option value="ALL">All Crews</option>
                  {crews.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name.split('—')[0].trim()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Filters */}
              {(statusFilter !== 'ALL' || typeFilter !== 'ALL' || crewFilter !== 'ALL' || searchQuery) && (
                <button
                  onClick={() => {
                    setStatusFilter('ALL');
                    setTypeFilter('ALL');
                    setCrewFilter('ALL');
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

        {/* Master Work Orders Grid */}
        <div className="grid grid-cols-1 gap-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm text-gray-400">
              <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <HardHat className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">No Field Work Orders Found</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mt-1 mb-6">
                {workOrders.length === 0
                  ? 'Your workspace has no field rigging orders yet. Generate mounting or takedown work orders to schedule crews and upload proof-of-posting photos.'
                  : 'No work orders matched your selected filters or search terms.'}
              </p>
              {workOrders.length === 0 && (
                <button
                  onClick={() => {
                    if (campaigns.length === 0 || billboards.length === 0) {
                      toast({
                        title: 'Prerequisite Required',
                        description: 'Please register at least one Campaign and Billboard before generating work orders.',
                        type: 'destructive',
                      });
                      return;
                    }
                    setNewOrderCampaignId(campaigns[0].id);
                    setNewOrderBillboardId(billboards[0].id);
                    setIsCreateModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow hover:bg-indigo-700 transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>Generate First Work Order</span>
                </button>
              )}
            </div>
          ) : (
            filteredOrders.map((wo) => {
              const statusMeta = STATUS_CONFIG[wo.status];
              const typeMeta = TYPE_CONFIG[wo.type];
              const StatusIcon = statusMeta.icon;
              const hasPhotos = Boolean(
                wo.proofPhotos.afterDayPhotoUrl || wo.proofPhotos.afterNightPhotoUrl
              );

              return (
                <div
                  key={wo.id}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition space-y-4"
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="p-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl text-xs font-mono">
                        {wo.workOrderNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3
                            onClick={() => {
                              setInspectOrder(wo);
                              setActiveTab('MANIFEST');
                            }}
                            className="font-bold text-gray-900 text-sm hover:text-indigo-600 cursor-pointer transition"
                          >
                            {wo.billboardCode} — {wo.billboardName}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusMeta.bg} ${statusMeta.text}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            <span>{statusMeta.label}</span>
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              PRIORITY_BADGES[wo.priority]
                            }`}
                          >
                            {wo.priority}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Campaign: <strong>{wo.campaignName}</strong> • Client: {wo.clientCompanyName} •{' '}
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-medium ${typeMeta.color}`}>
                            {typeMeta.label}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {wo.status === 'SCHEDULED' && (
                        <button
                          onClick={() => handleStatusUpdate(wo.id, 'IN_PROGRESS')}
                          className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-semibold hover:bg-purple-100 transition"
                        >
                          Start Rigging
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setInspectOrder(wo);
                          setIsProofModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-indigo-600 border border-gray-200 rounded-xl text-xs font-semibold hover:bg-indigo-50 transition"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        <span>Log Proof Photos</span>
                      </button>

                      <button
                        onClick={() => {
                          setInspectOrder(wo);
                          setActiveTab('MANIFEST');
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 shadow-sm transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Job Manifest</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Multi-Metric Operations Pillars */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-gray-50/60 p-3.5 rounded-xl border border-gray-100/60">
                    {/* Location Specs */}
                    <div>
                      <span className="text-gray-400 text-[10px] uppercase font-bold">Location & Height</span>
                      <div className="font-bold text-gray-900 mt-0.5">{wo.billboardCity}</div>
                      <p className="text-[11px] text-gray-500 truncate">
                        {wo.billboardCorridor} • {wo.structureHeightFeet}ft Height
                      </p>
                    </div>

                    {/* Crew Dispatch */}
                    <div>
                      <span className="text-gray-400 text-[10px] uppercase font-bold">Assigned Crew</span>
                      <div className="font-bold text-gray-900 mt-0.5">
                        {wo.crewName ? wo.crewName.split('—')[0].trim() : 'Unassigned'}
                      </div>
                      <p className="text-[11px] text-gray-500 truncate">
                        {wo.leadTechnician ? `Lead: ${wo.leadTechnician}` : 'Awaiting Dispatch'}
                      </p>
                    </div>

                    {/* Window & Weather */}
                    <div>
                      <span className="text-gray-400 text-[10px] uppercase font-bold">Schedule Window</span>
                      <div className="font-bold text-gray-900 mt-0.5">{wo.scheduledDate}</div>
                      <p className="text-[11px] text-gray-500 truncate">{wo.weatherForecast}</p>
                    </div>

                    {/* Proof Telemetry */}
                    <div>
                      <span className="text-gray-400 text-[10px] uppercase font-bold">POP Telemetry</span>
                      <div className="font-bold text-gray-900 mt-0.5 flex items-center gap-1">
                        {hasPhotos ? (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <Check className="h-3.5 w-3.5" /> Photos Verified
                          </span>
                        ) : (
                          <span className="text-amber-600">Pending Upload</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500">
                        {wo.proofPhotos.illuminationScorePercent
                          ? `${wo.proofPhotos.illuminationScorePercent}% Illumination`
                          : 'Pre-flight stage'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ========================================================================= */}
        {/* COMPREHENSIVE WORK ORDER INSPECTION DRAWER */}
        {/* ========================================================================= */}
        {inspectOrder && (
          <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-3xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
              {/* Drawer Header */}
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-gray-900">
                        {inspectOrder.workOrderNumber}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          STATUS_CONFIG[inspectOrder.status].bg
                        } ${STATUS_CONFIG[inspectOrder.status].text}`}
                      >
                        {STATUS_CONFIG[inspectOrder.status].label}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          TYPE_CONFIG[inspectOrder.type].color
                        }`}
                      >
                        {TYPE_CONFIG[inspectOrder.type].label}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 mt-1">
                      {inspectOrder.billboardCode} — {inspectOrder.billboardName}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Campaign: {inspectOrder.campaignName} • Client: {inspectOrder.clientCompanyName}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPrintableManifest(inspectOrder)}
                      className="p-2 rounded-xl text-gray-500 hover:bg-white hover:text-indigo-600 shadow-sm transition"
                      title="Print Job Manifest"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setInspectOrder(null)}
                      className="p-2 rounded-xl text-gray-500 hover:bg-white hover:text-gray-900 shadow-sm transition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-3 mt-5 border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('MANIFEST')}
                    className={`pb-2.5 px-2 text-xs font-semibold transition border-b-2 ${
                      activeTab === 'MANIFEST'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Job Manifest & Specs
                  </button>
                  <button
                    onClick={() => setActiveTab('CREW')}
                    className={`pb-2.5 px-2 text-xs font-semibold transition border-b-2 ${
                      activeTab === 'CREW'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Crew & Rigging Schedule
                  </button>
                  <button
                    onClick={() => setActiveTab('SAFETY')}
                    className={`pb-2.5 px-2 text-xs font-semibold transition border-b-2 ${
                      activeTab === 'SAFETY'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Safety Protocols & LOTO
                  </button>
                  <button
                    onClick={() => setActiveTab('PROOF')}
                    className={`pb-2.5 px-2 text-xs font-semibold transition border-b-2 ${
                      activeTab === 'PROOF'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Proof-of-Posting (POP)
                  </button>
                </div>
              </div>

              {/* Drawer Body Content */}
              <div className="p-6 space-y-6 flex-1 text-xs">
                {/* TAB 1: JOB MANIFEST & SPECS */}
                {activeTab === 'MANIFEST' && (
                  <div className="space-y-6">
                    {/* Structure Details Card */}
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                      <span className="font-bold text-gray-900 block flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-indigo-600" />
                        <span>Billboard Asset Specifications</span>
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                        <div>
                          <span className="text-gray-400">Address:</span>
                          <div className="font-bold text-gray-900">{inspectOrder.billboardAddress}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">City / Corridor:</span>
                          <div className="font-bold text-gray-900">
                            {inspectOrder.billboardCity} • {inspectOrder.billboardCorridor}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Dimensions & Height:</span>
                          <div className="font-bold text-gray-900">
                            {inspectOrder.dimensions} • {inspectOrder.structureHeightFeet}ft Height
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Special Instructions & Logistics */}
                    {inspectOrder.specialInstructions && (
                      <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-100 space-y-1 text-amber-900">
                        <span className="font-bold block flex items-center gap-1.5">
                          <HardHat className="h-4 w-4 text-amber-700" />
                          <span>Field Rigging & Access Instructions:</span>
                        </span>
                        <p className="text-[11px] leading-relaxed">{inspectOrder.specialInstructions}</p>
                      </div>
                    )}

                    {/* Linked Creative Deliverable */}
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                      <span className="font-bold text-gray-900 block">Linked Approved Creative:</span>
                      <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-gray-900 text-xs">{inspectOrder.artworkTitle || 'Standard Flight Skin'}</div>
                          <div className="text-[11px] text-gray-500">Ref: {inspectOrder.artworkNumber || 'ART-2026-001'}</div>
                        </div>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                          Approved for Mounting
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: CREW DISPATCH & SCHEDULE */}
                {activeTab === 'CREW' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900">Assigned Field Crew</h4>
                        <p className="text-gray-500">Riggers, certified technicians, and heavy vehicle equipment.</p>
                      </div>
                      <button
                        onClick={() => setIsAssignModalOpen(true)}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
                      >
                        Reassign Crew
                      </button>
                    </div>

                    {inspectOrder.crewName ? (
                      <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                          <div>
                            <span className="font-bold text-gray-900 text-sm">{inspectOrder.crewName}</span>
                            <div className="text-gray-500 text-[11px]">
                              Lead Technician: <strong>{inspectOrder.leadTechnician}</strong>
                            </div>
                          </div>
                          <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full">
                            Active Crew
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-[11px]">
                          <div>
                            <span className="text-gray-400">Scheduled Date:</span>
                            <div className="font-bold text-gray-900">{inspectOrder.scheduledDate}</div>
                          </div>
                          <div>
                            <span className="text-gray-400">Time Deployment Window:</span>
                            <div className="font-bold text-gray-900">{inspectOrder.scheduledTimeWindow}</div>
                          </div>
                        </div>

                        {/* Lifecycle Status Controls */}
                        <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                          <button
                            onClick={() => handleStatusUpdate(inspectOrder.id, 'CREW_EN_ROUTE')}
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg font-semibold hover:bg-indigo-100 transition"
                          >
                            Mark Crew En Route
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(inspectOrder.id, 'IN_PROGRESS')}
                            className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg font-semibold hover:bg-purple-100 transition"
                          >
                            Mark In Progress
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(inspectOrder.id, 'COMPLETED')}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
                          >
                            Mark Completed
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400">
                        <Truck className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="font-semibold text-gray-700">No Crew Assigned</p>
                        <p className="text-xs mt-1">Assign an available field rigging team to proceed with mounting.</p>
                        <button
                          onClick={() => setIsAssignModalOpen(true)}
                          className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition"
                        >
                          Dispatch Crew Now
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: RIGGING SAFETY & LOTO CHECKLIST */}
                {activeTab === 'SAFETY' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-bold text-gray-900">Rigging Safety & OSHA Verification</h4>
                      <p className="text-gray-500">Pre-mounting safety protocol sign-offs required prior to elevation.</p>
                    </div>

                    <div className="space-y-3">
                      <div
                        onClick={() => handleToggleSafety('harnessInspection')}
                        className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-indigo-200 transition"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-gray-900">Fall Protection Harness Inspection</div>
                          <p className="text-gray-500 text-[11px]">
                            ANSI Z359 compliant full-body harnesses inspected for wear, fraying, and carabiner locks.
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={inspectOrder.safetyChecklist.harnessInspection}
                          onChange={() => {}}
                          className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </div>

                      <div
                        onClick={() => handleToggleSafety('lotoElectricalLockout')}
                        className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-indigo-200 transition"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-gray-900">LOTO Electrical Breaker Lockout</div>
                          <p className="text-gray-500 text-[11px]">
                            Main breaker locked and tagged out to prevent electrical shock during floodlight replacement.
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={inspectOrder.safetyChecklist.lotoElectricalLockout}
                          onChange={() => {}}
                          className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </div>

                      <div
                        onClick={() => handleToggleSafety('policeTrafficPermit')}
                        className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-indigo-200 transition"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-gray-900">Traffic Encroachment & Lane Closure Permit</div>
                          <p className="text-gray-500 text-[11px]">
                            Municipal highway closure authorization active with traffic cones and hazard lights.
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={inspectOrder.safetyChecklist.policeTrafficPermit}
                          onChange={() => {}}
                          className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </div>

                      <div
                        onClick={() => handleToggleSafety('riggingHardwareCheck')}
                        className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-indigo-200 transition"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-gray-900">Rigging Hardware & Cable Tension Verification</div>
                          <p className="text-gray-500 text-[11px]">
                            Steel pipe pockets, ratchet tension straps, and galvanized safety pins verified.
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={inspectOrder.safetyChecklist.riggingHardwareCheck}
                          onChange={() => {}}
                          className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: PROOF OF POSTING (POP) PHOTOS */}
                {activeTab === 'PROOF' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900">Proof-of-Posting Photo Audits</h4>
                        <p className="text-gray-500">
                          Before mounting, daytime view, and nighttime illuminated photos with GPS timestamps.
                        </p>
                      </div>

                      <button
                        onClick={() => setIsProofModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        <span>Log Photo Proof</span>
                      </button>
                    </div>

                    {/* Photos Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Before Photo */}
                      <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 space-y-2">
                        <span className="font-bold text-gray-700 text-[11px] block">1. Before Mounting Shot</span>
                        <div className="h-40 bg-gray-950 rounded-xl overflow-hidden flex items-center justify-center">
                          {inspectOrder.proofPhotos.beforePhotoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={inspectOrder.proofPhotos.beforePhotoUrl}
                              alt="Before"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-500 text-xs italic">No photo logged</span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {inspectOrder.proofPhotos.beforeUploadedAt || 'Pending upload'}
                        </div>
                      </div>

                      {/* After Daytime Photo */}
                      <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 space-y-2">
                        <span className="font-bold text-gray-700 text-[11px] block flex items-center gap-1">
                          <Sun className="h-3.5 w-3.5 text-amber-500" />
                          <span>2. Daytime Finished View</span>
                        </span>
                        <div className="h-40 bg-gray-950 rounded-xl overflow-hidden flex items-center justify-center">
                          {inspectOrder.proofPhotos.afterDayPhotoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={inspectOrder.proofPhotos.afterDayPhotoUrl}
                              alt="After Day"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-500 text-xs italic">No photo logged</span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {inspectOrder.proofPhotos.afterDayUploadedAt || 'Pending upload'}
                        </div>
                      </div>

                      {/* After Nighttime Illuminated Photo */}
                      <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 space-y-2">
                        <span className="font-bold text-gray-700 text-[11px] block flex items-center gap-1">
                          <Moon className="h-3.5 w-3.5 text-indigo-400" />
                          <span>3. Nighttime Illuminated</span>
                        </span>
                        <div className="h-40 bg-gray-950 rounded-xl overflow-hidden flex items-center justify-center">
                          {inspectOrder.proofPhotos.afterNightPhotoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={inspectOrder.proofPhotos.afterNightPhotoUrl}
                              alt="After Night"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-500 text-xs italic">No photo logged</span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {inspectOrder.proofPhotos.afterNightUploadedAt || 'Pending upload'}
                        </div>
                      </div>
                    </div>

                    {/* Inspection Notes & GPS Coordinates */}
                    {inspectOrder.proofPhotos.inspectorName && (
                      <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-2 text-emerald-950">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">
                            Field Inspection by {inspectOrder.proofPhotos.inspectorName}
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                            {inspectOrder.proofPhotos.illuminationScorePercent}% Illumination
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800">{inspectOrder.proofPhotos.inspectionNotes}</p>
                        <div className="font-mono text-[10px] text-emerald-700">
                          GPS Coordinates: {inspectOrder.proofPhotos.gpsLatitude}° N,{' '}
                          {inspectOrder.proofPhotos.gpsLongitude}° W
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-6 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between">
                <button
                  onClick={() => setInspectOrder(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 transition"
                >
                  Close
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPrintableManifest(inspectOrder)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-gray-700 text-xs font-semibold rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Field Manifest</span>
                  </button>

                  <button
                    onClick={() => setIsProofModalOpen(true)}
                    className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 shadow-sm transition"
                  >
                    Log POP Photos
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ASSIGN CREW MODAL */}
        {/* ========================================================================= */}
        {isAssignModalOpen && inspectOrder && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Dispatch Field Crew</h3>
                    <p className="text-xs text-gray-500">{inspectOrder.workOrderNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAssignModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAssignCrew} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Field Rigging Team *</label>
                  <select
                    value={targetCrewId}
                    onChange={(e) => setTargetCrewId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {crews.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Lead: {c.leadTechnician})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Scheduled Deployment Date *</label>
                  <input
                    type="date"
                    required
                    value={assignDate}
                    onChange={(e) => setAssignDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Time Window / Curfew</label>
                  <input
                    type="text"
                    value={assignWindow}
                    onChange={(e) => setAssignWindow(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAssignModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-sm transition"
                  >
                    Dispatch Crew & Book Window
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LOG PROOF PHOTOS MODAL */}
        {/* ========================================================================= */}
        {isProofModalOpen && inspectOrder && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <Camera className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Upload Proof-of-Posting (POP)</h3>
                    <p className="text-xs text-gray-500">{inspectOrder.workOrderNumber} • {inspectOrder.billboardCode}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsProofModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUploadProof} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">1. Before Installation Image URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={proofBeforeUrl}
                    onChange={(e) => setProofBeforeUrl(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">2. After Daytime Image URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/..."
                    value={proofAfterDayUrl}
                    onChange={(e) => setProofAfterDayUrl(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setProofAfterDayUrl(
                        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop&q=80'
                      )
                    }
                    className="text-[10px] text-indigo-600 hover:underline mt-1 block"
                  >
                    Use Demo Highway View
                  </button>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">3. After Nighttime Illuminated URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={proofAfterNightUrl}
                    onChange={(e) => setProofAfterNightUrl(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setProofAfterNightUrl(
                        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80'
                      )
                    }
                    className="text-[10px] text-indigo-600 hover:underline mt-1 block"
                  >
                    Use Demo Illuminated LED
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Inspector Name</label>
                    <input
                      type="text"
                      value={proofInspectorName}
                      onChange={(e) => setProofInspectorName(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Illumination Score (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={proofScore}
                      onChange={(e) => setProofScore(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Field Inspection Debrief Notes</label>
                  <textarea
                    rows={2}
                    value={proofNotes}
                    onChange={(e) => setProofNotes(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="autoCompleteCheck"
                    checked={autoCompleteJob}
                    onChange={(e) => setAutoCompleteJob(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="autoCompleteCheck" className="font-semibold text-gray-700 cursor-pointer">
                    Automatically mark work order as COMPLETED upon photo verification
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsProofModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-sm transition"
                  >
                    Save Photos & Verify Job
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* GENERATE WORK ORDER MODAL */}
        {/* ========================================================================= */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Generate Installation Work Order</h3>
                  <p className="text-xs text-gray-500">Dispatch rigging team for billboard mounting or takedown.</p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateOrder} className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Operation Type *</label>
                    <select
                      value={newOrderType}
                      onChange={(e) => setNewOrderType(e.target.value as WorkOrderType)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="INSTALLATION">Initial Vinyl Mounting</option>
                      <option value="TAKEDOWN">Vinyl Strike & Takedown</option>
                      <option value="DIGITAL_CALIBRATION">Digital LED NOC Deploy</option>
                      <option value="RE_SKINNING">Mid-Flight Re-Skin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Job Priority</label>
                    <select
                      value={newOrderPriority}
                      onChange={(e) => setNewOrderPriority(e.target.value as WorkOrderPriority)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent (Overnight)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Campaign *</label>
                    <select
                      required
                      value={newOrderCampaignId}
                      onChange={(e) => setNewOrderCampaignId(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                      {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.campaignNumber} — {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Billboard *</label>
                    <select
                      required
                      value={newOrderBillboardId}
                      onChange={(e) => setNewOrderBillboardId(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                      {billboards.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.code} ({b.location.city})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Field Crew</label>
                    <select
                      value={newOrderCrewId}
                      onChange={(e) => setNewOrderCrewId(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Awaiting Crew Assignment...</option>
                      {crews.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name.split('—')[0].trim()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Scheduled Date</label>
                    <input
                      type="date"
                      required
                      value={newOrderDate}
                      onChange={(e) => setNewOrderDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Special Rigging Instructions</label>
                  <textarea
                    rows={2}
                    value={newOrderInstructions}
                    onChange={(e) => setNewOrderInstructions(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-sm transition"
                  >
                    Issue Field Work Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PRINTABLE FIELD RIGGING MANIFEST (window.print() ready) */}
        {/* ========================================================================= */}
        {printableManifest && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-gray-100 my-8">
              {/* Toolbar */}
              <div className="p-4 bg-gray-900 text-white flex items-center justify-between no-print">
                <div className="flex items-center gap-2">
                  <FileBadge className="h-5 w-5 text-indigo-400" />
                  <span className="font-semibold text-sm">
                    Field Rigging Work Order Manifest — {printableManifest.workOrderNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Manifest</span>
                  </button>
                  <button
                    onClick={() => setPrintableManifest(null)}
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
                      Field Engineering, Rigging & Structural Operations Bureau
                    </p>
                    <p className="text-gray-500 text-xs">
                      24/7 Field NOC Dispatch • dispatch@adversoft.com
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-gray-900">
                      WORK ORDER #{printableManifest.workOrderNumber}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Scheduled Date: {printableManifest.scheduledDate}
                    </div>
                    <span className="inline-block mt-1 text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded uppercase">
                      {printableManifest.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Section 1: Location & Rigging Specs */}
                <div>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                    1. BILLBOARD LOCATION & STRUCTURAL DETAILS
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border border-gray-200 text-xs">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-bold bg-gray-50 w-1/3">Billboard Identifier:</td>
                          <td className="p-2.5 font-semibold text-gray-900">
                            {printableManifest.billboardCode} — {printableManifest.billboardName}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-bold bg-gray-50">Street Address:</td>
                          <td className="p-2.5">
                            {printableManifest.billboardAddress}, {printableManifest.billboardCity}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-bold bg-gray-50">Corridor / Traffic Flow:</td>
                          <td className="p-2.5">{printableManifest.billboardCorridor}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-bold bg-gray-50">Face Size & Height:</td>
                          <td className="p-2.5">
                            {printableManifest.dimensions} Face Size • {printableManifest.structureHeightFeet}ft Above
                            Ground
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold bg-gray-50">Rigging Instructions:</td>
                          <td className="p-2.5 italic text-gray-700">
                            {printableManifest.specialInstructions || 'Standard rigging protocol.'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 2: Crew Dispatch & Schedule Window */}
                <div>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                    2. CREW DISPATCH & EQUIPMENT ASSIGNMENT
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border border-gray-200 text-xs">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-bold bg-gray-50 w-1/3">Field Crew:</td>
                          <td className="p-2.5 font-semibold text-gray-900">
                            {printableManifest.crewName || 'Unassigned Crew'}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-bold bg-gray-50">Lead Rigger / Technician:</td>
                          <td className="p-2.5">{printableManifest.leadTechnician || 'N/A'}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-bold bg-gray-50">Time Deployment Window:</td>
                          <td className="p-2.5">{printableManifest.scheduledTimeWindow}</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold bg-gray-50">Campaign Reference:</td>
                          <td className="p-2.5 font-semibold text-indigo-700">
                            {printableManifest.campaignName} ({printableManifest.clientCompanyName})
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 3: Safety Sign-off Block */}
                <div className="pt-4 border-t border-gray-200">
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                    3. FIELD RIGGING SAFETY SIGN-OFF
                  </h2>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="border border-gray-200 p-4 rounded-lg bg-gray-50/50 space-y-1 text-xs">
                      <div className="font-bold text-gray-900">LEAD RIGGER CERTIFICATION</div>
                      <div className="text-gray-500 text-[10px]">
                        I certify that harnesses, LOTO electrical breaker, crane outriggers, and cable tensions have
                        been verified in compliance with OSHA 1926.
                      </div>
                      <div className="pt-4 flex items-end justify-between">
                        <div>
                          <div className="font-serif italic text-xl text-gray-900">
                            {printableManifest.leadTechnician || 'Carlos Mendoza'}
                          </div>
                          <div className="text-[10px] text-gray-500">Authorized Signature</div>
                        </div>
                        <div className="text-right text-[10px] text-gray-400 font-mono">
                          Date: {printableManifest.scheduledDate}
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-200 p-4 rounded-lg bg-gray-50/50 text-center flex flex-col justify-between">
                      <div>
                        <div className="font-bold text-gray-900 text-xs">MOBILE POP AUDIT READY</div>
                        <div className="text-gray-500 text-[10px] mt-0.5">
                          Photo capture required within 2 hours of flight live activation.
                        </div>
                        <div className="font-mono text-xs text-indigo-700 font-bold mt-2">
                          JOB REF: {printableManifest.workOrderNumber}
                        </div>
                      </div>
                      <div className="text-[9px] text-gray-400 pt-2 border-t border-gray-200">
                        GPS Verified Telemetry • Adversoft Field NOC
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
