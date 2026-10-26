"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/protectedRoute';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import {
  CampaignRecord,
  CampaignStatus,
  CampaignSiteAllocation,
  CampaignTask,
  CampaignDeliverable,
  CampaignProofReport,
  TaskCategory,
  TaskPriority,
  getStoredCampaigns,
  saveStoredCampaigns,
  createCampaign,
  updateCampaignStatus,
  toggleCampaignTask,
  addCampaignTask,
  addProofPhoto,
  generateProofReport,
  getCampaignMetrics,
  computeFlightMetrics,
} from '@/lib/data/campaigns-store';
import { INITIAL_CLIENTS } from '@/lib/data/crm-store';
import { INITIAL_BILLBOARDS } from '@/lib/data/billboards-store';
import {
  getTenantCampaigns,
  saveTenantCampaigns,
  getTenantClients,
  getTenantBillboards,
} from '@/lib/tenant-store';
import {
  Layers,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
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
  Percent,
  Play,
  Pause,
  Camera,
  ListTodo,
  FolderKanban,
  TrendingUp,
  Image as ImageIcon,
  Tag,
  UploadCloud,
  ChevronRight,
  Users,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  CampaignStatus,
  { label: string; bg: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
  PLANNING: { label: 'Planning & Hold', bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock },
  SCHEDULED: { label: 'Scheduled Flight', bg: 'bg-blue-50', text: 'text-blue-700', icon: Calendar },
  LIVE: { label: 'Live on Billboard', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: Play },
  PAUSED: { label: 'Paused', bg: 'bg-amber-50', text: 'text-amber-700', icon: Pause },
  COMPLETED: { label: 'Concluded & POP', bg: 'bg-indigo-50', text: 'text-indigo-700', icon: CheckCircle2 },
  ARCHIVED: { label: 'Archived', bg: 'bg-slate-100', text: 'text-slate-600', icon: Clock },
};

const PRIORITY_BADGES: Record<TaskPriority, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-blue-50 text-blue-700',
  HIGH: 'bg-amber-50 text-amber-700',
  URGENT: 'bg-rose-50 text-rose-700 font-semibold',
};

export default function CampaignsPage() {
  const { user, tenant } = useAuth();
  const { toast } = useToast();

  // Campaign list state
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>(() => getTenantCampaigns(tenant?.id));
  const [clients, setClients] = useState(() => getTenantClients(tenant?.id));
  const [billboards, setBillboards] = useState(() => getTenantBillboards(tenant?.id));

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [clientFilter, setClientFilter] = useState<string>('ALL');

  // Modals & Inspection Drawers
  const [inspectCampaign, setInspectCampaign] = useState<CampaignRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SITES' | 'DELIVERABLES' | 'TASKS' | 'PROOF'>('OVERVIEW');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [printablePOPReport, setPrintablePOPReport] = useState<CampaignRecord | null>(null);

  // New Task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>('OPERATIONS');
  const [newTaskAssignee, setNewTaskAssignee] = useState('Carlos Mendoza');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('MEDIUM');
  const [newTaskNotes, setNewTaskNotes] = useState('');

  // Add Proof Photo form state
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [targetSiteId, setTargetSiteId] = useState('');
  const [photoType, setPhotoType] = useState<'DAY' | 'NIGHT' | 'INSTALL' | 'DRONE'>('NIGHT');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');

  // Create Campaign form state
  const [newName, setNewName] = useState('');
  const [newClientId, setNewClientId] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newBudget, setNewBudget] = useState<number>(50000);
  const [newManager, setNewManager] = useState('Alexandra Chen');
  const [newSelectedBillboards, setNewSelectedBillboards] = useState<string[]>([]);
  const [newAudience, setNewAudience] = useState('');

  // Load campaigns
  const refreshCampaigns = () => {
    const list = getTenantCampaigns(tenant?.id);
    setCampaigns(list);
    setClients(getTenantClients(tenant?.id));
    setBillboards(getTenantBillboards(tenant?.id));
  };

  useEffect(() => {
    refreshCampaigns();
    const handleUpdate = () => refreshCampaigns();
    window.addEventListener('adversoft_campaigns_updated', handleUpdate);
    window.addEventListener('adversoft_crm_clients_updated', handleUpdate);
    window.addEventListener('adversoft_billboards_updated', handleUpdate);
    window.addEventListener('adversoft_tenant_changed', handleUpdate);
    return () => {
      window.removeEventListener('adversoft_campaigns_updated', handleUpdate);
      window.removeEventListener('adversoft_crm_clients_updated', handleUpdate);
      window.removeEventListener('adversoft_billboards_updated', handleUpdate);
      window.removeEventListener('adversoft_tenant_changed', handleUpdate);
    };
  }, [tenant]);

  // Compute metrics
  const metrics = useMemo(() => {
    return getCampaignMetrics();
  }, [campaigns]);

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      if (clientFilter !== 'ALL' && c.clientId !== clientFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = c.campaignNumber.toLowerCase().includes(q);
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesClient = c.clientCompanyName.toLowerCase().includes(q);
        const matchesBrand = c.brandName.toLowerCase().includes(q);
        const matchesSite = c.sites.some(
          (s) =>
            s.billboardCode.toLowerCase().includes(q) ||
            s.billboardCity.toLowerCase().includes(q) ||
            s.billboardName.toLowerCase().includes(q)
        );
        if (!matchesRef && !matchesName && !matchesClient && !matchesBrand && !matchesSite) {
          return false;
        }
      }
      return true;
    });
  }, [campaigns, statusFilter, clientFilter, searchQuery]);

  // Handle Status Change
  const handleStatusChange = (campaignId: string, newStatus: CampaignStatus) => {
    const res = updateCampaignStatus(campaignId, newStatus);
    if (res.success && res.campaign) {
      toast({
        title: 'Campaign Status Updated',
        description: `Campaign is now ${newStatus}.`,
        type: 'success',
      });
      refreshCampaigns();
      if (inspectCampaign && inspectCampaign.id === campaignId) {
        setInspectCampaign(res.campaign);
      }
    } else {
      toast({ title: 'Update Failed', description: res.error || 'Failed to update status.', type: 'destructive' });
    }
  };

  // Handle Task Toggle
  const handleToggleTask = (campaignId: string, taskId: string) => {
    const res = toggleCampaignTask(campaignId, taskId);
    if (res.success && res.campaign) {
      refreshCampaigns();
      if (inspectCampaign && inspectCampaign.id === campaignId) {
        setInspectCampaign(res.campaign);
      }
    }
  };

  // Handle Add Task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectCampaign) return;
    if (!newTaskTitle.trim()) {
      toast({ title: 'Task Title Required', description: 'Please enter a task name.', type: 'destructive' });
      return;
    }

    const res = addCampaignTask(inspectCampaign.id, {
      title: newTaskTitle,
      category: newTaskCategory,
      assigneeName: newTaskAssignee,
      assigneeRole: 'Operations',
      dueDate: newTaskDueDate || inspectCampaign.flightStartDate,
      priority: newTaskPriority,
      notes: newTaskNotes,
    });

    if (res.success && res.campaign) {
      toast({ title: 'Milestone Task Added', description: 'Task assigned successfully.', type: 'success' });
      refreshCampaigns();
      setInspectCampaign(res.campaign);
      setNewTaskTitle('');
      setNewTaskNotes('');
    } else {
      toast({ title: 'Error Adding Task', description: res.error || 'Could not add task.', type: 'destructive' });
    }
  };

  // Handle Add Proof Photo
  const handleAddProofPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectCampaign) return;
    if (!targetSiteId) {
      toast({ title: 'Select Site', description: 'Please select a billboard site for this proof photo.', type: 'destructive' });
      return;
    }
    if (!photoUrl.trim()) {
      toast({ title: 'Photo URL Required', description: 'Please provide an image link.', type: 'destructive' });
      return;
    }

    const res = addProofPhoto(inspectCampaign.id, targetSiteId, {
      type: photoType,
      url: photoUrl,
      caption: photoCaption || 'Verified site photo inspection',
      illuminated: photoType === 'NIGHT',
    });

    if (res.success && res.campaign) {
      toast({ title: 'Proof Photo Logged', description: 'Photo saved to campaign POP gallery.', type: 'success' });
      refreshCampaigns();
      setInspectCampaign(res.campaign);
      setIsPhotoModalOpen(false);
      setPhotoUrl('');
      setPhotoCaption('');
    } else {
      toast({ title: 'Error Logging Photo', description: res.error || 'Could not log photo.', type: 'destructive' });
    }
  };

  // Handle Generate POP Report
  const handleGeneratePOP = (campaignId: string) => {
    const res = generateProofReport(
      campaignId,
      'Certified Proof-of-Performance report generated with verified site audits, camera telemetry, and illumination compliance.'
    );
    if (res.success && res.campaign) {
      toast({
        title: 'POP Dossier Certified',
        description: `Official Proof Report ${res.campaign.proofReport?.reportReferenceNumber} generated.`,
        type: 'success',
      });
      refreshCampaigns();
      if (inspectCampaign && inspectCampaign.id === campaignId) {
        setInspectCampaign(res.campaign);
      }
      setPrintablePOPReport(res.campaign);
    } else {
      toast({ title: 'Certification Error', description: res.error || 'Failed to generate POP report.', type: 'destructive' });
    }
  };

  // Handle Create Campaign
  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientId) {
      toast({ title: 'Missing Client', description: 'Please select an advertiser client.', type: 'destructive' });
      return;
    }
    if (!newStartDate || !newEndDate) {
      toast({ title: 'Missing Dates', description: 'Please provide flight start and end dates.', type: 'destructive' });
      return;
    }
    if (newSelectedBillboards.length === 0) {
      toast({ title: 'Select Billboards', description: 'Please select at least one billboard site.', type: 'destructive' });
      return;
    }

    const clientObj = clients.find((c) => c.id === newClientId);

    const res = createCampaign({
      name: newName || `${clientObj?.companyName || 'Brand'} 2026 Flight`,
      clientId: newClientId,
      brandName: newBrandName || clientObj?.companyName,
      flightStartDate: newStartDate,
      flightEndDate: newEndDate,
      totalBudget: Number(newBudget),
      campaignManager: newManager,
      targetAudienceSummary: newAudience,
      selectedBillboardIds: newSelectedBillboards,
    });

    if (res.success && res.campaign) {
      toast({
        title: 'Campaign Workspace Initialized',
        description: `Campaign ${res.campaign.campaignNumber} created with ${res.campaign.sites.length} allocated sites.`,
        type: 'success',
      });
      refreshCampaigns();
      setIsCreateModalOpen(false);
      setInspectCampaign(res.campaign);
      // Reset
      setNewName('');
      setNewBrandName('');
      setNewSelectedBillboards([]);
      setNewStartDate('');
      setNewEndDate('');
      setNewAudience('');
    } else {
      toast({ title: 'Creation Failed', description: res.error || 'Failed to create campaign.', type: 'destructive' });
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-8 pb-16">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Campaign Management</h1>
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                Flight Operations
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                POP Certified
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Central campaign command connecting flight dates, sites, creative deliverables, budgets, tasks, and proof-of-performance reports.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refreshCampaigns}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
              title="Refresh campaign workspaces"
            >
              <RefreshCw className="h-4 w-4 text-gray-500" />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => {
                setNewStartDate('2026-11-01');
                setNewEndDate('2026-12-31');
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>New Campaign Workspace</span>
            </button>
          </div>
        </div>

        {/* Executive KPI Metric Cards (Premium Dashboard Aesthetic: No black borders, soft shadows) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="rounded-2xl p-5 shadow-sm bg-white border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Flight Portfolio</span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-gray-900">
                ${metrics.totalFlightValue.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                ${metrics.totalSpend.toLocaleString()} actual deployed
              </p>
            </div>
          </Card>

          <Card
            onClick={() => setStatusFilter('LIVE')}
            className="rounded-2xl p-5 shadow-sm bg-white border border-gray-100 flex flex-col justify-between cursor-pointer hover:border-emerald-200 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Live Flights</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Play className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-emerald-600">{metrics.liveCount}</div>
              <p className="text-xs text-gray-500 mt-1">Actively broadcasting on billboard faces</p>
            </div>
          </Card>

          <Card
            onClick={() => setStatusFilter('SCHEDULED')}
            className="rounded-2xl p-5 shadow-sm bg-white border border-gray-100 flex flex-col justify-between cursor-pointer hover:border-blue-200 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">Scheduled Launches</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-blue-600">{metrics.scheduledCount}</div>
              <p className="text-xs text-gray-500 mt-1">Print & staging in progress</p>
            </div>
          </Card>

          <Card
            onClick={() => setStatusFilter('COMPLETED')}
            className="rounded-2xl p-5 shadow-sm bg-white border border-gray-100 flex flex-col justify-between cursor-pointer hover:border-indigo-200 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-indigo-600 uppercase tracking-wider">POP Certified</span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <FileBadge className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-indigo-600">{metrics.completedCount}</div>
              <p className="text-xs text-gray-500 mt-1">Flights concluded with proof reports</p>
            </div>
          </Card>

          <Card className="rounded-2xl p-5 shadow-sm bg-white border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Audience Impressions</span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-purple-700">
                {(metrics.totalImpressionsAll / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <span className="text-emerald-600 font-semibold">{metrics.avgCompletionRate}%</span>
                <span>avg flight pacing</span>
              </p>
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
                placeholder="Search campaigns by ref, brand, client, billboard code, or city..."
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
                  <option value="LIVE">Live Flights</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="PLANNING">Planning</option>
                  <option value="COMPLETED">Completed (POP)</option>
                  <option value="PAUSED">Paused</option>
                </select>
              </div>

              {/* Client Filter */}
              <div className="flex items-center gap-1.5 bg-gray-50/80 px-3 py-2 rounded-xl text-xs font-medium text-gray-700">
                <span>Client:</span>
                <select
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-gray-900 focus:outline-none cursor-pointer max-w-[150px] truncate"
                >
                  <option value="ALL">All Clients</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset */}
              {(statusFilter !== 'ALL' || clientFilter !== 'ALL' || searchQuery) && (
                <button
                  onClick={() => {
                    setStatusFilter('ALL');
                    setClientFilter('ALL');
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

        {/* Master Campaign Workspaces Grid */}
        <div className="grid grid-cols-1 gap-5">
          {campaigns.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm text-gray-400 space-y-3">
              <Layers className="h-10 w-10 mx-auto text-indigo-400" />
              <h3 className="text-base font-semibold text-gray-900">No campaigns launched in this workspace yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Your clean workspace starts fresh with zero active flights. Launch your first billboard campaign flight to track deliverables and POP audits.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm"
                >
                  + Launch First Campaign
                </button>
              </div>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm text-gray-400">
              <Layers className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <h3 className="text-base font-semibold text-gray-700">No campaigns found</h3>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or search keywords.</p>
            </div>
          ) : (
            filteredCampaigns.map((campaign) => {
              const statusMeta = STATUS_CONFIG[campaign.status];
              const StatusIcon = statusMeta.icon;
              const completedTasks = campaign.tasks.filter((t) => t.isCompleted).length;
              const totalTasks = campaign.tasks.length;
              const taskPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

              return (
                <div
                  key={campaign.id}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition space-y-5"
                >
                  {/* Card Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-xs">
                        {campaign.campaignNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2
                            onClick={() => {
                              setInspectCampaign(campaign);
                              setActiveTab('OVERVIEW');
                            }}
                            className="text-base font-bold text-gray-900 hover:text-indigo-600 cursor-pointer transition"
                          >
                            {campaign.name}
                          </h2>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusMeta.bg} ${statusMeta.text}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            <span>{statusMeta.label}</span>
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {campaign.clientCompanyName} ({campaign.clientAccountNumber}) • Brand:{' '}
                          <strong className="text-gray-700">{campaign.brandName}</strong> • Lead:{' '}
                          {campaign.campaignManager}
                        </p>
                      </div>
                    </div>

                    {/* Quick Status Controls */}
                    <div className="flex items-center gap-2">
                      {campaign.status === 'PLANNING' && (
                        <button
                          onClick={() => handleStatusChange(campaign.id, 'SCHEDULED')}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition"
                        >
                          Schedule Launch
                        </button>
                      )}
                      {campaign.status === 'SCHEDULED' && (
                        <button
                          onClick={() => handleStatusChange(campaign.id, 'LIVE')}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition"
                        >
                          Set Flight Live
                        </button>
                      )}
                      {campaign.status === 'LIVE' && (
                        <button
                          onClick={() => handleStatusChange(campaign.id, 'COMPLETED')}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition"
                        >
                          Conclude Flight
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setInspectCampaign(campaign);
                          setActiveTab('OVERVIEW');
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 shadow-sm transition"
                      >
                        <FolderKanban className="h-4 w-4" />
                        <span>Open Workspace</span>
                      </button>
                    </div>
                  </div>

                  {/* Flight Progress Bar */}
                  <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-100/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span>
                          Flight: <strong>{campaign.flightStartDate}</strong> → <strong>{campaign.flightEndDate}</strong>
                        </span>
                        <span className="text-gray-300">•</span>
                        <span>{campaign.totalFlightDays} total days</span>
                      </div>
                      <div className="font-semibold text-gray-900">
                        {campaign.status === 'COMPLETED' ? (
                          <span className="text-indigo-600">100% Completed</span>
                        ) : campaign.daysRemaining > 0 ? (
                          <span>
                            {campaign.daysRemaining} days remaining ({campaign.flightProgressPercent}%)
                          </span>
                        ) : (
                          <span className="text-rose-600">Flight Concluded</span>
                        )}
                      </div>
                    </div>
                    {/* Visual Progress Track */}
                    <div className="w-full bg-gray-200/80 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          campaign.status === 'COMPLETED'
                            ? 'bg-indigo-600'
                            : campaign.status === 'LIVE'
                            ? 'bg-emerald-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${campaign.flightProgressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* 4 Multi-Metric Pillars */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {/* Sites Allocation */}
                    <div
                      onClick={() => {
                        setInspectCampaign(campaign);
                        setActiveTab('SITES');
                      }}
                      className="p-3 bg-gray-50/60 rounded-xl hover:bg-gray-100/70 cursor-pointer transition"
                    >
                      <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                        Allocated Sites
                      </span>
                      <div className="text-sm font-bold text-gray-900 mt-0.5">
                        {campaign.sites.length} {campaign.sites.length === 1 ? 'Billboard' : 'Billboards'}
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {campaign.sites.map((s) => s.billboardCode).join(', ')}
                      </p>
                    </div>

                    {/* Budget vs Actual Spend */}
                    <div
                      onClick={() => {
                        setInspectCampaign(campaign);
                        setActiveTab('OVERVIEW');
                      }}
                      className="p-3 bg-gray-50/60 rounded-xl hover:bg-gray-100/70 cursor-pointer transition"
                    >
                      <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                        Spend / Budget
                      </span>
                      <div className="text-sm font-bold text-gray-900 mt-0.5">
                        ${campaign.actualSpend.toLocaleString()}{' '}
                        <span className="text-xs font-normal text-gray-400">
                          / ${campaign.totalBudget.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                        {Math.round((campaign.actualSpend / campaign.totalBudget) * 100)}% deployed
                      </p>
                    </div>

                    {/* Operational Tasks Progress */}
                    <div
                      onClick={() => {
                        setInspectCampaign(campaign);
                        setActiveTab('TASKS');
                      }}
                      className="p-3 bg-gray-50/60 rounded-xl hover:bg-gray-100/70 cursor-pointer transition"
                    >
                      <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                        Milestones & Tasks
                      </span>
                      <div className="text-sm font-bold text-gray-900 mt-0.5">
                        {completedTasks} / {totalTasks} Completed
                      </div>
                      <p className="text-[11px] text-indigo-600 font-medium mt-0.5">
                        {taskPercent}% milestone completion
                      </p>
                    </div>

                    {/* POP Proof Audit Status */}
                    <div
                      onClick={() => {
                        setInspectCampaign(campaign);
                        setActiveTab('PROOF');
                      }}
                      className="p-3 bg-gray-50/60 rounded-xl hover:bg-gray-100/70 cursor-pointer transition"
                    >
                      <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                        POP Audit Status
                      </span>
                      <div className="text-sm font-bold text-gray-900 mt-0.5 flex items-center gap-1.5">
                        {campaign.proofReport ? (
                          <span className="text-indigo-600 font-semibold flex items-center gap-1">
                            <FileBadge className="h-3.5 w-3.5" /> Certified
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium">In Progress</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {campaign.sites.reduce((acc, s) => acc + s.proofPhotos.length, 0)} audit photos
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ========================================================================= */}
        {/* CAMPAIGN WORKSPACE INSPECTION DRAWER (Comprehensive Multi-Tab Command) */}
        {/* ========================================================================= */}
        {inspectCampaign && (
          <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-3xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
              {/* Drawer Header */}
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-gray-900">
                        {inspectCampaign.campaignNumber}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          STATUS_CONFIG[inspectCampaign.status].bg
                        } ${STATUS_CONFIG[inspectCampaign.status].text}`}
                      >
                        {STATUS_CONFIG[inspectCampaign.status].label}
                      </span>
                      {inspectCampaign.proofReport && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold">
                          POP Certified
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 mt-1">{inspectCampaign.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Client: {inspectCampaign.clientCompanyName} • Brand: {inspectCampaign.brandName} • Lead: {inspectCampaign.campaignManager}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleGeneratePOP(inspectCampaign.id)}
                      className="p-2 rounded-xl text-gray-500 hover:bg-white hover:text-indigo-600 shadow-sm transition"
                      title="Generate / View Certified Proof Report"
                    >
                      <FileBadge className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setInspectCampaign(null)}
                      className="p-2 rounded-xl text-gray-500 hover:bg-white hover:text-gray-900 shadow-sm transition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Tabs Ribbon */}
                <div className="flex items-center gap-2 mt-5 border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('OVERVIEW')}
                    className={`pb-2.5 px-2 text-xs font-semibold transition border-b-2 ${
                      activeTab === 'OVERVIEW'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Overview & Budget
                  </button>
                  <button
                    onClick={() => setActiveTab('SITES')}
                    className={`pb-2.5 px-2 text-xs font-semibold transition border-b-2 ${
                      activeTab === 'SITES'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Allocated Sites ({inspectCampaign.sites.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('DELIVERABLES')}
                    className={`pb-2.5 px-2 text-xs font-semibold transition border-b-2 ${
                      activeTab === 'DELIVERABLES'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Creatives & Deliverables ({inspectCampaign.deliverables.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('TASKS')}
                    className={`pb-2.5 px-2 text-xs font-semibold transition border-b-2 ${
                      activeTab === 'TASKS'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Milestones & Tasks ({inspectCampaign.tasks.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('PROOF')}
                    className={`pb-2.5 px-2 text-xs font-semibold transition border-b-2 ${
                      activeTab === 'PROOF'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    POP & Photos
                  </button>
                </div>
              </div>

              {/* Drawer Tab Contents */}
              <div className="p-6 space-y-6 flex-1 text-xs">
                {/* TAB 1: OVERVIEW & BUDGET */}
                {activeTab === 'OVERVIEW' && (
                  <div className="space-y-6">
                    {/* Financial Pillars */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 bg-gray-50 rounded-xl">
                        <span className="text-gray-400 text-[10px] uppercase font-bold">Total Budget</span>
                        <div className="text-base font-bold text-gray-900 mt-0.5">
                          ${inspectCampaign.totalBudget.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-3.5 bg-gray-50 rounded-xl">
                        <span className="text-gray-400 text-[10px] uppercase font-bold">Actual Spend</span>
                        <div className="text-base font-bold text-emerald-600 mt-0.5">
                          ${inspectCampaign.actualSpend.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-3.5 bg-gray-50 rounded-xl">
                        <span className="text-gray-400 text-[10px] uppercase font-bold">Media Rental</span>
                        <div className="text-base font-bold text-gray-900 mt-0.5">
                          ${inspectCampaign.mediaCost.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-3.5 bg-gray-50 rounded-xl">
                        <span className="text-gray-400 text-[10px] uppercase font-bold">Prod & Rigging</span>
                        <div className="text-base font-bold text-gray-900 mt-0.5">
                          ${(inspectCampaign.productionCost + inspectCampaign.installationCost).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Flight Schedule Details */}
                    <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
                      <span className="font-semibold text-indigo-950 flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-indigo-600" />
                        <span>Flight Schedule & Execution Window</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-indigo-900">
                        <div>Start Date: <strong>{inspectCampaign.flightStartDate}</strong></div>
                        <div>End Date: <strong>{inspectCampaign.flightEndDate}</strong></div>
                        <div>Days Elapsed: <strong>{inspectCampaign.daysElapsed} of {inspectCampaign.totalFlightDays}d</strong></div>
                      </div>
                    </div>

                    {/* Audience & Strategic Brief */}
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                      <span className="font-semibold text-gray-900 block">Target Audience & Market Strategy:</span>
                      <p className="text-gray-700 leading-relaxed">{inspectCampaign.targetAudienceSummary}</p>
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {inspectCampaign.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 text-[11px] bg-white border border-gray-200 px-2 py-0.5 rounded-md font-medium text-gray-700"
                          >
                            <Tag className="h-3 w-3 text-gray-400" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Linked Legal Contract & Booking Reference */}
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                      <span className="font-semibold text-gray-900 block">Linked System References:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700">
                        <div className="p-2.5 bg-white rounded-lg border border-gray-200">
                          <span className="text-[10px] text-gray-400 uppercase font-semibold">Contract Agreement</span>
                          <div className="font-bold text-gray-900 mt-0.5">
                            {inspectCampaign.contractNumber || 'CNT-2026-001 (Active MSA)'}
                          </div>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg border border-gray-200">
                          <span className="text-[10px] text-gray-400 uppercase font-semibold">Inventory Booking</span>
                          <div className="font-bold text-gray-900 mt-0.5">
                            {inspectCampaign.bookingNumber || 'BKG-2026-001 (Confirmed)'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: ALLOCATED BILLBOARD SITES */}
                {activeTab === 'SITES' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-900">
                        Schedule A: Allocated Billboard Inventory ({inspectCampaign.sites.length})
                      </h4>
                      <span className="text-[11px] text-gray-500">Live Uptime Guarantee Active</span>
                    </div>

                    <div className="space-y-3">
                      {inspectCampaign.sites.map((site) => (
                        <div
                          key={site.id}
                          className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 text-sm">{site.billboardCode}</span>
                                <span className="font-semibold text-gray-800">{site.billboardName}</span>
                                {site.isDigital ? (
                                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                                    Digital LED ({site.shareOfVoicePercent}% SOV)
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-gray-100 text-gray-700 font-semibold px-2 py-0.5 rounded-full">
                                    Static Bulletin
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-gray-400" />
                                <span>
                                  {site.billboardCorridor}, {site.billboardCity} • Size: {site.dimensions}
                                </span>
                              </p>
                            </div>

                            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
                              {site.siteStatus}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-100 text-[11px]">
                            <div>
                              <span className="text-gray-400">Daily Imp.:</span>
                              <div className="font-bold text-gray-900">
                                {site.dailyImpressions.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-400">Total Imp.:</span>
                              <div className="font-bold text-gray-900">
                                {site.totalImpressions.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-400">Monthly Rent:</span>
                              <div className="font-bold text-gray-900">
                                ${site.monthlyRental.toLocaleString()}/mo
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-400">Proof Photos:</span>
                              <div className="font-bold text-indigo-600">
                                {site.proofPhotos.length} Captured
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: CREATIVES & DELIVERABLES */}
                {activeTab === 'DELIVERABLES' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-900">
                        Artwork Assets & Deliverables ({inspectCampaign.deliverables.length})
                      </h4>
                      <Link
                        href="/artwork"
                        className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                      >
                        <span>Open Artwork Approvals</span>
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>

                    <div className="space-y-3">
                      {inspectCampaign.deliverables.map((deliv) => (
                        <div
                          key={deliv.id}
                          className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-between"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900">{deliv.name}</span>
                              <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                                {deliv.format.replace(/_/g, ' ')}
                              </span>
                              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-mono">
                                v{deliv.version}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500">
                              Target Billboard: <strong>{deliv.siteCode}</strong> • Dimensions: {deliv.specDimensions}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
                              {deliv.status.replace(/_/g, ' ')}
                            </span>
                            <div className="text-[10px] text-gray-400 mt-1">Updated {deliv.updatedAt}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: MILESTONES & TASKS */}
                {activeTab === 'TASKS' && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-900">
                        Operational Checklist & Field Milestones ({inspectCampaign.tasks.length})
                      </h4>
                      <span className="text-xs text-indigo-600 font-semibold">
                        {inspectCampaign.tasks.filter((t) => t.isCompleted).length} Completed
                      </span>
                    </div>

                    {/* Task List */}
                    <div className="space-y-2.5">
                      {inspectCampaign.tasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => handleToggleTask(inspectCampaign.id, task.id)}
                          className={`p-3.5 rounded-xl border transition flex items-start gap-3 cursor-pointer ${
                            task.isCompleted
                              ? 'bg-gray-50/60 border-gray-100 text-gray-400 line-through'
                              : 'bg-white border-gray-100 text-gray-800 shadow-sm hover:border-indigo-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={task.isCompleted}
                            onChange={() => {}}
                            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${task.isCompleted ? 'line-through' : 'text-gray-900'}`}>
                                {task.title}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                  PRIORITY_BADGES[task.priority]
                                }`}
                              >
                                {task.priority}
                              </span>
                              <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                {task.category}
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              Assigned to: <strong>{task.assigneeName}</strong> ({task.assigneeRole}) • Due: {task.dueDate}
                            </div>
                            {task.notes && (
                              <p className="text-[11px] text-gray-600 italic mt-1">{task.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Milestone Task Form */}
                    <form onSubmit={handleAddTask} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                      <span className="font-bold text-gray-900 block">Add Campaign Task / Milestone</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="Task title (e.g. Schedule midnight crew for vinyl install)"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          className="sm:col-span-2 px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        <select
                          value={newTaskCategory}
                          onChange={(e) => setNewTaskCategory(e.target.value as TaskCategory)}
                          className="px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="OPERATIONS">Operations & Rigging</option>
                          <option value="CREATIVE">Creative & QA</option>
                          <option value="PRODUCTION">Print Production</option>
                          <option value="REPORTING">POP & Reporting</option>
                          <option value="FINANCE">Billing & Invoicing</option>
                        </select>
                        <select
                          value={newTaskPriority}
                          onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                          className="px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="LOW">Low Priority</option>
                          <option value="MEDIUM">Medium Priority</option>
                          <option value="HIGH">High Priority</option>
                          <option value="URGENT">Urgent Priority</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Assignee Name"
                          value={newTaskAssignee}
                          onChange={(e) => setNewTaskAssignee(e.target.value)}
                          className="px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                          type="date"
                          value={newTaskDueDate}
                          onChange={(e) => setNewTaskDueDate(e.target.value)}
                          className="px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
                      >
                        Add Task to Campaign
                      </button>
                    </form>
                  </div>
                )}

                {/* TAB 5: PROOF OF PERFORMANCE (POP) & PHOTOS */}
                {activeTab === 'PROOF' && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900">Proof-of-Performance (POP) Audit</h4>
                        <p className="text-[11px] text-gray-500">
                          Photo verification, illumination telemetry, and certified proof dossier.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (inspectCampaign.sites.length > 0) {
                              setTargetSiteId(inspectCampaign.sites[0].id);
                            }
                            setIsPhotoModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-indigo-600 border border-gray-200 rounded-lg font-semibold hover:bg-indigo-50 transition"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          <span>Log Photo</span>
                        </button>

                        <button
                          onClick={() => handleGeneratePOP(inspectCampaign.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
                        >
                          <FileBadge className="h-3.5 w-3.5" />
                          <span>Certify POP Dossier</span>
                        </button>
                      </div>
                    </div>

                    {/* POP Report Status Banner */}
                    {inspectCampaign.proofReport ? (
                      <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                            <FileCheck2 className="h-4 w-4 text-indigo-600" />
                            <span>Official Certificate: {inspectCampaign.proofReport.reportReferenceNumber}</span>
                          </span>
                          <button
                            onClick={() => setPrintablePOPReport(inspectCampaign)}
                            className="px-3 py-1 bg-white text-indigo-600 font-semibold rounded-lg shadow-sm border border-indigo-200 hover:bg-indigo-50 transition"
                          >
                            Print POP Certificate
                          </button>
                        </div>
                        <p className="text-indigo-800 text-[11px]">{inspectCampaign.proofReport.summaryNotes}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-indigo-950 pt-1 font-medium">
                          <div>Auditor: {inspectCampaign.proofReport.certifiedBy}</div>
                          <div>SLA Score: {inspectCampaign.proofReport.overallSlaScorePercent}%</div>
                          <div>Total Imp: {inspectCampaign.proofReport.totalImpressionsDelivered.toLocaleString()}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-100 text-amber-900 text-[11px]">
                        Campaign POP report not yet certified. Upload flight photos and click &quot;Certify POP Dossier&quot;
                        to issue formal client verification.
                      </div>
                    )}

                    {/* Photos Gallery */}
                    <div className="space-y-3">
                      <span className="font-bold text-gray-900 block">Verified Site Inspection Photos</span>
                      {inspectCampaign.sites.flatMap((s) => s.proofPhotos).length === 0 ? (
                        <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">
                          <Camera className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="font-medium">No inspection photos logged yet.</p>
                          <p className="text-[10px] mt-0.5">Click &quot;Log Photo&quot; to upload day and night proof.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {inspectCampaign.sites.flatMap((s) =>
                            s.proofPhotos.map((photo) => (
                              <div
                                key={photo.id}
                                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                              >
                                <div className="h-44 bg-gray-900 relative">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={photo.url}
                                    alt={photo.caption}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                                    <span className="text-[10px] bg-black/70 text-white font-bold px-2 py-0.5 rounded">
                                      {photo.type} SHOT
                                    </span>
                                    {photo.illuminated && (
                                      <span className="text-[10px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded">
                                        ILLUMINATED
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="p-3 space-y-1">
                                  <p className="font-semibold text-gray-800 text-[11px]">{photo.caption}</p>
                                  <div className="text-[10px] text-gray-400">
                                    Audited: {photo.verifiedAt}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-6 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between">
                <button
                  onClick={() => setInspectCampaign(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 transition"
                >
                  Close Workspace
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleGeneratePOP(inspectCampaign.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-indigo-600 text-xs font-semibold rounded-xl shadow-sm border border-gray-100 hover:bg-indigo-50 transition"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>View / Print POP Certificate</span>
                  </button>

                  {inspectCampaign.status === 'PLANNING' && (
                    <button
                      onClick={() => handleStatusChange(inspectCampaign.id, 'SCHEDULED')}
                      className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl shadow-sm hover:bg-indigo-700 transition"
                    >
                      Schedule Flight
                    </button>
                  )}
                  {inspectCampaign.status === 'SCHEDULED' && (
                    <button
                      onClick={() => handleStatusChange(inspectCampaign.id, 'LIVE')}
                      className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-sm hover:bg-emerald-700 transition"
                    >
                      Launch Flight Live
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LOG PROOF PHOTO MODAL */}
        {/* ========================================================================= */}
        {isPhotoModalOpen && inspectCampaign && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <Camera className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Log Proof Photo</h3>
                    <p className="text-xs text-gray-500">{inspectCampaign.campaignNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddProofPhoto} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Target Billboard Site *</label>
                  <select
                    required
                    value={targetSiteId}
                    onChange={(e) => setTargetSiteId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {inspectCampaign.sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.billboardCode} — {s.billboardName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Capture Lighting Condition *</label>
                  <select
                    value={photoType}
                    onChange={(e) => setPhotoType(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="NIGHT">Night Illuminated (Halogen / LED active)</option>
                    <option value="DAY">Daytime Natural Ambient Light</option>
                    <option value="INSTALL">Rigging / Installation In-Progress</option>
                    <option value="DRONE">Aerial Drone Sightline View</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Image URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/..."
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setPhotoUrl(
                          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80'
                        )
                      }
                      className="text-[10px] text-indigo-600 hover:underline"
                    >
                      Use Demo Night LED
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPhotoUrl(
                          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop&q=80'
                        )
                      }
                      className="text-[10px] text-indigo-600 hover:underline"
                    >
                      Use Demo Daytime Bulletin
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Audit Caption & Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Unobstructed sightline at 60mph, 100% illumination"
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsPhotoModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-sm transition"
                  >
                    Save Photo to POP Gallery
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* NEW CAMPAIGN WORKSPACE MODAL */}
        {/* ========================================================================= */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Initialize Campaign Workspace</h3>
                  <p className="text-xs text-gray-500">
                    Connect flight timeline, allocated sites, creative deliverables, and operational budgets.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCampaign} className="p-6 space-y-6 text-xs max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Client Account *</label>
                    <select
                      required
                      value={newClientId}
                      onChange={(e) => setNewClientId(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select Advertiser...</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.companyName} ({c.accountNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Campaign Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Q1 National Metro Domination"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Brand / Product Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Sterling Chrono Luxe"
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Campaign Manager</label>
                    <select
                      value={newManager}
                      onChange={(e) => setNewManager(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Alexandra Chen">Alexandra Chen (Campaign Director)</option>
                      <option value="Nathaniel Reed">Nathaniel Reed (Account Executive)</option>
                      <option value="Marcus Brody">Marcus Brody (SVP Media)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Flight Start Date *</label>
                    <input
                      type="date"
                      required
                      value={newStartDate}
                      onChange={(e) => setNewStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Flight End Date *</label>
                    <input
                      type="date"
                      required
                      value={newEndDate}
                      onChange={(e) => setNewEndDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Allocated Budget ($ USD) *</label>
                    <input
                      type="number"
                      required
                      min="5000"
                      step="1000"
                      value={newBudget}
                      onChange={(e) => setNewBudget(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Billboard Inventory Selection */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    Allocate Billboard Inventory Sites *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-100">
                    {billboards.map((bb) => {
                      const isSelected = newSelectedBillboards.includes(bb.id);
                      return (
                        <div
                          key={bb.id}
                          onClick={() => {
                            if (isSelected) {
                              setNewSelectedBillboards(newSelectedBillboards.filter((id) => id !== bb.id));
                            } else {
                              setNewSelectedBillboards([...newSelectedBillboards, bb.id]);
                            }
                          }}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition flex items-center justify-between ${
                            isSelected
                              ? 'bg-indigo-50/70 border-indigo-300 text-indigo-950'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100/50'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-xs">{bb.code} — {bb.name}</div>
                            <div className="text-[10px] text-gray-500">
                              {bb.location.city} • ${bb.monthlyRate.toLocaleString()}/mo
                            </div>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-indigo-600" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Target Audience & Market Focus</label>
                  <textarea
                    rows={2}
                    placeholder="Describe target demographics, commuter routes, and key impression objectives..."
                    value={newAudience}
                    onChange={(e) => setNewAudience(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-sm transition"
                  >
                    Initialize Workspace
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PRINTABLE POP REPORT CERTIFICATE (window.print() ready) */}
        {/* ========================================================================= */}
        {printablePOPReport && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-gray-100 my-8">
              {/* Toolbar */}
              <div className="p-4 bg-gray-900 text-white flex items-center justify-between no-print">
                <div className="flex items-center gap-2">
                  <FileBadge className="h-5 w-5 text-indigo-400" />
                  <span className="font-semibold text-sm">
                    Certified Proof-of-Performance Dossier — {printablePOPReport.campaignNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print POP Audit</span>
                  </button>
                  <button
                    onClick={() => setPrintablePOPReport(null)}
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
                      Independent Out-of-Home Audit & Verification Service
                    </p>
                    <p className="text-gray-500 text-xs">
                      Proof-of-Performance (POP) Audit Bureau • certification@adversoft.com
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-gray-900">
                      CERTIFICATE #{printablePOPReport.proofReport?.reportReferenceNumber || 'POP-2026-001'}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Certified: {printablePOPReport.proofReport?.generatedAt || new Date().toISOString().split('T')[0]}
                    </div>
                    <span className="inline-block mt-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded uppercase">
                      Verified & In-Compliance
                    </span>
                  </div>
                </div>

                {/* Campaign Summary Table */}
                <div>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                    1. AUDITED CAMPAIGN SPECIFICATIONS
                  </h2>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-bold bg-gray-50 w-1/3">Campaign Title:</td>
                          <td className="p-2.5 font-semibold text-gray-900">{printablePOPReport.name}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-bold bg-gray-50">Advertiser / Brand:</td>
                          <td className="p-2.5">
                            {printablePOPReport.clientCompanyName} — {printablePOPReport.brandName}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-bold bg-gray-50">Flight Verification Dates:</td>
                          <td className="p-2.5">
                            {printablePOPReport.flightStartDate} through {printablePOPReport.flightEndDate} (
                            {printablePOPReport.totalFlightDays} Flight Days)
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-bold bg-gray-50">Total Verified Impressions:</td>
                          <td className="p-2.5 font-bold text-indigo-700">
                            {(
                              printablePOPReport.proofReport?.totalImpressionsDelivered ||
                              printablePOPReport.sites.reduce((acc, s) => acc + s.totalImpressions, 0)
                            ).toLocaleString()}{' '}
                            Audited Traffic Passes
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold bg-gray-50">Illumination & SLA Score:</td>
                          <td className="p-2.5 font-bold text-emerald-700">
                            {printablePOPReport.proofReport?.overallSlaScorePercent || 99.6}% Illumination Compliance
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Schedule of Billboard Sites Audited */}
                <div>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                    2. ASSET INSPECTION & PERFORMANCE METRICS
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border border-gray-200 text-xs">
                      <thead>
                        <tr className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200">
                          <th className="p-2">Asset Code</th>
                          <th className="p-2">Site Name & Location</th>
                          <th className="p-2">Display Type</th>
                          <th className="p-2 text-right">Daily Pacing</th>
                          <th className="p-2 text-right">Total Verified Imp.</th>
                          <th className="p-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {printablePOPReport.sites.map((site) => (
                          <tr key={site.id}>
                            <td className="p-2 font-bold">{site.billboardCode}</td>
                            <td className="p-2">
                              {site.billboardName} ({site.billboardCity})
                            </td>
                            <td className="p-2">
                              {site.isDigital ? 'Digital LED Display' : 'Static Bulletin'}
                            </td>
                            <td className="p-2 text-right">{site.dailyImpressions.toLocaleString()}</td>
                            <td className="p-2 text-right font-semibold">
                              {site.totalImpressions.toLocaleString()}
                            </td>
                            <td className="p-2 text-right text-emerald-700 font-semibold">
                              Passed
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Audit Evidence Photo Log */}
                <div>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                    3. PHOTOGRAPHIC VERIFICATION LOG
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {printablePOPReport.sites.flatMap((s) => s.proofPhotos).slice(0, 4).map((photo) => (
                      <div key={photo.id} className="border border-gray-200 rounded-lg p-2 bg-gray-50/50">
                        <div className="h-36 bg-gray-900 rounded overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.url}
                            alt={photo.caption}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-[10px] font-semibold text-gray-800 mt-1.5">{photo.caption}</p>
                        <div className="text-[9px] text-gray-400 font-mono">
                          Timestamp: {photo.verifiedAt} • Condition: {photo.type}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Official Sign-off Seal */}
                <div className="pt-6 border-t border-gray-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase font-semibold">Certified Audit Executive:</div>
                    <div className="font-serif italic text-2xl text-indigo-950 mt-1">
                      {printablePOPReport.proofReport?.certifiedBy || 'Marcus Brody'}
                    </div>
                    <div className="font-bold text-gray-900 text-xs">
                      {printablePOPReport.proofReport?.certifiedBy || 'Marcus Brody'}
                    </div>
                    <div className="text-gray-500 text-[10px]">
                      {printablePOPReport.proofReport?.auditorTitle || 'Senior Vice President of Outdoor Media'}
                    </div>
                  </div>

                  <div className="border border-gray-300 p-3 rounded-lg text-center bg-gray-50/60 max-w-xs text-[10px] text-gray-500 font-mono">
                    <div className="font-bold text-gray-800">DIGITAL AUDIT SEAL</div>
                    <div>SHA-256: 7F8E-CMP-{printablePOPReport.id.slice(-6).toUpperCase()}</div>
                    <div>VERIFIED NOC TELEMETRY</div>
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
