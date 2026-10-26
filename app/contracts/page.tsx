"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/protectedRoute';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import {
  ContractRecord,
  ContractStatus,
  ContractType,
  ExpirationAlertTier,
  ContractScheduleItem,
  getStoredContracts,
  saveStoredContracts,
  createContract,
  signContractByClient,
  countersignByAdversoft,
  renewContract,
  getContractMetrics,
  computeDaysRemaining,
  computeAlertTier,
} from '@/lib/data/contracts-store';
import { INITIAL_CLIENTS, ClientAccount } from '@/lib/data/crm-store';
import { INITIAL_BILLBOARDS, BillboardItem } from '@/lib/data/billboards-store';
import {
  getTenantContracts,
  saveTenantContracts,
  getTenantClients,
  getTenantBillboards,
} from '@/lib/tenant-store';
import { getStoredQuotations, QuotationRecord } from '@/lib/data/quotations-store';
import { getBookings, BookingRecord } from '@/lib/data/bookings-store';
import {
  FileText,
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
  Copy,
  ExternalLink,
  ChevronRight,
  Eye,
  RefreshCw,
  Sparkles,
  MapPin,
  ShieldCheck,
  PenTool,
  RotateCw,
  Send,
  Download,
  Check,
  X,
  AlertCircle,
  FileCheck2,
  FileBadge,
  Layers,
  Percent,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  ContractStatus,
  { label: string; bg: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
  DRAFT: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock },
  PENDING_SIGNATURE: { label: 'Pending Signatures', bg: 'bg-amber-50', text: 'text-amber-700', icon: PenTool },
  ACTIVE: { label: 'Active & Executed', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 },
  EXPIRING_SOON: { label: 'Expiring Soon', bg: 'bg-rose-50', text: 'text-rose-700', icon: AlertTriangle },
  EXPIRED: { label: 'Expired', bg: 'bg-slate-100', text: 'text-slate-600', icon: Clock },
  TERMINATED: { label: 'Terminated', bg: 'bg-rose-100', text: 'text-rose-800', icon: XCircle },
  RENEWED: { label: 'Renewed', bg: 'bg-indigo-50', text: 'text-indigo-700', icon: RotateCw },
};

const ALERT_CONFIG: Record<
  ExpirationAlertTier,
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  CRITICAL_30: {
    label: '≤ 30d Expiry',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
    icon: AlertTriangle,
  },
  WARNING_60: {
    label: '31-60d Expiry',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 font-medium',
    icon: AlertCircle,
  },
  NOTICE_90: {
    label: '61-90d Notice',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 font-normal',
    icon: Clock,
  },
  HEALTHY: {
    label: '> 90d Active',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
  EXPIRED: {
    label: 'Expired',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    icon: XCircle,
  },
};

const TYPE_CONFIG: Record<ContractType, { label: string; color: string }> = {
  MASTER_SERVICES_AGREEMENT: { label: 'Master Agreement (MSA)', color: 'text-indigo-700 bg-indigo-50' },
  SINGLE_FLIGHT_IO: { label: 'Single-Flight IO', color: 'text-blue-700 bg-blue-50' },
  LONG_TERM_LICENSE: { label: 'Long-Term License', color: 'text-emerald-700 bg-emerald-50' },
  MULTI_MARKET_NETWORK: { label: 'Multi-Market Network', color: 'text-purple-700 bg-purple-50' },
};

export default function ContractsPage() {
  const { user, tenant } = useAuth();
  const { toast } = useToast();

  // Contracts list state
  const [contracts, setContracts] = useState<ContractRecord[]>(() => getTenantContracts(tenant?.id));
  const [clients, setClients] = useState(() => getTenantClients(tenant?.id));
  const [billboards, setBillboards] = useState(() => getTenantBillboards(tenant?.id));

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [alertFilter, setAlertFilter] = useState<string>('ALL');
  const [clientFilter, setClientFilter] = useState<string>('ALL');

  // Modals & Drawers
  const [inspectContract, setInspectContract] = useState<ContractRecord | null>(null);
  const [printableContract, setPrintableContract] = useState<ContractRecord | null>(null);
  const [renewTarget, setRenewTarget] = useState<ContractRecord | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Renewal Form state
  const [renewMonths, setRenewMonths] = useState<number>(3);
  const [renewEscalation, setRenewEscalation] = useState<number>(3);

  // E-Sign Form state
  const [signClientModalTarget, setSignClientModalTarget] = useState<ContractRecord | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('');
  const [signAdversoftModalTarget, setSignAdversoftModalTarget] = useState<ContractRecord | null>(null);
  const [officerName, setOfficerName] = useState('Marcus Brody');
  const [officerTitle, setOfficerTitle] = useState('Senior Vice President of Outdoor Media');

  // Create Contract Form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<ContractType>('MASTER_SERVICES_AGREEMENT');
  const [newClientId, setNewClientId] = useState('');
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newBillingFrequency, setNewBillingFrequency] = useState<'MONTHLY' | 'UPFRONT' | 'QUARTERLY'>('MONTHLY');
  const [newPaymentTerms, setNewPaymentTerms] = useState('50% on execution, 50% Net 30 upon flight activation');
  const [newROFR, setNewROFR] = useState<boolean>(true);
  const [newCancellationDays, setNewCancellationDays] = useState<number>(30);
  const [newIlluminationSLA, setNewIlluminationSLA] = useState<number>(98.5);
  const [newGoverningLaw, setNewGoverningLaw] = useState('State of New York');
  const [newSpecialProvisions, setNewSpecialProvisions] = useState('Standard illumination, routine maintenance, and certified proof-of-posting guarantee.');
  const [newSelectedBillboards, setNewSelectedBillboards] = useState<string[]>([]);
  const [autoSignAdversoft, setAutoSignAdversoft] = useState<boolean>(true);

  // Load contracts
  const refreshContracts = () => {
    const list = getTenantContracts(tenant?.id);
    setContracts(list);
    setClients(getTenantClients(tenant?.id));
    setBillboards(getTenantBillboards(tenant?.id));
  };

  useEffect(() => {
    refreshContracts();
    const handleUpdate = () => refreshContracts();
    window.addEventListener('adversoft_contracts_updated', handleUpdate);
    window.addEventListener('adversoft_crm_clients_updated', handleUpdate);
    window.addEventListener('adversoft_billboards_updated', handleUpdate);
    window.addEventListener('adversoft_tenant_changed', handleUpdate);
    return () => {
      window.removeEventListener('adversoft_contracts_updated', handleUpdate);
      window.removeEventListener('adversoft_crm_clients_updated', handleUpdate);
      window.removeEventListener('adversoft_billboards_updated', handleUpdate);
      window.removeEventListener('adversoft_tenant_changed', handleUpdate);
    };
  }, [tenant]);

  // Compute metrics
  const metrics = useMemo(() => {
    return getContractMetrics();
  }, [contracts]);

  // Filtered contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      if (alertFilter !== 'ALL' && c.expirationAlertTier !== alertFilter) return false;
      if (clientFilter !== 'ALL' && c.clientId !== clientFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = c.contractNumber.toLowerCase().includes(q);
        const matchesClient = c.clientCompanyName.toLowerCase().includes(q);
        const matchesCampaign = c.campaignName.toLowerCase().includes(q);
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesCity = c.items.some((item) => item.billboardCity.toLowerCase().includes(q));
        if (!matchesRef && !matchesClient && !matchesCampaign && !matchesTitle && !matchesCity) {
          return false;
        }
      }
      return true;
    });
  }, [contracts, statusFilter, alertFilter, clientFilter, searchQuery]);

  // Handle Client Sign
  const handleClientSign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signClientModalTarget) return;
    if (!signerName.trim() || !signerTitle.trim()) {
      toast({ title: 'Signatory Missing', description: 'Please enter signatory full name and title.', type: 'destructive' });
      return;
    }

    const res = signContractByClient(signClientModalTarget.id, signerName, signerTitle);
    if (res.success && res.contract) {
      toast({
        title: 'Agreement Signed by Client',
        description: `Digital signature registered for ${signerName} (${signerTitle}).`,
        type: 'success',
      });
      refreshContracts();
      if (inspectContract && inspectContract.id === signClientModalTarget.id) {
        setInspectContract(res.contract);
      }
      setSignClientModalTarget(null);
      setSignerName('');
      setSignerTitle('');
    } else {
      toast({ title: 'Error Signing', description: res.error || 'Failed to apply signature.', type: 'destructive' });
    }
  };

  // Handle Adversoft Sign
  const handleAdversoftSign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signAdversoftModalTarget) return;

    const res = countersignByAdversoft(signAdversoftModalTarget.id, officerName, officerTitle);
    if (res.success && res.contract) {
      toast({
        title: 'Countersignature Executed',
        description: `Adversoft authorized signature verified for ${officerName}.`,
        type: 'success',
      });
      refreshContracts();
      if (inspectContract && inspectContract.id === signAdversoftModalTarget.id) {
        setInspectContract(res.contract);
      }
      setSignAdversoftModalTarget(null);
    } else {
      toast({ title: 'Error Countersigning', description: res.error || 'Failed to apply signature.', type: 'destructive' });
    }
  };

  // Handle Renewal Execution
  const handleExecuteRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewTarget) return;

    const res = renewContract(renewTarget.id, Number(renewMonths), Number(renewEscalation));
    if (res.success && res.newContract) {
      toast({
        title: 'Contract Successfully Renewed!',
        description: `Generated successor agreement ${res.newContract.contractNumber} extending ${renewMonths} months.`,
        type: 'success',
      });
      refreshContracts();
      if (inspectContract && inspectContract.id === renewTarget.id) {
        setInspectContract(res.newContract);
      }
      setRenewTarget(null);
    } else {
      toast({ title: 'Renewal Failed', description: res.error || 'Could not renew agreement.', type: 'destructive' });
    }
  };

  // Handle New Contract Creation
  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientId) {
      toast({ title: 'Missing Client', description: 'Please select a client account.', type: 'destructive' });
      return;
    }
    if (!newStartDate || !newEndDate) {
      toast({ title: 'Missing Dates', description: 'Please provide start and end flight dates.', type: 'destructive' });
      return;
    }
    if (newSelectedBillboards.length === 0) {
      toast({ title: 'Select Billboard', description: 'Please select at least one billboard site for Schedule A.', type: 'destructive' });
      return;
    }

    const selectedBbObjs = billboards.filter((b) => newSelectedBillboards.includes(b.id));
    const sDate = new Date(newStartDate);
    const eDate = new Date(newEndDate);
    const days = Math.max(7, Math.ceil((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)));
    const months = Number((days / 30).toFixed(1));

    const totalMonthly = selectedBbObjs.reduce((sum, b) => sum + b.monthlyRate, 0);
    const totalContractVal = Math.round(totalMonthly * months);
    const deposit = Math.round(totalContractVal * 0.5);

    const clientObj = clients.find((c) => c.id === newClientId);

    const res = createContract({
      title: newTitle || `Outdoor Advertising Agreement — ${clientObj?.companyName || 'Client'}`,
      type: newType,
      clientId: newClientId,
      campaignName: newCampaignName || `${clientObj?.companyName || 'Brand'} 2026 Flight`,
      startDate: newStartDate,
      endDate: newEndDate,
      monthlyBillingAmount: totalMonthly,
      totalContractValue: totalContractVal,
      depositAmount: deposit,
      paymentTerms: newPaymentTerms,
      billingFrequency: newBillingFrequency,
      rightOfFirstRefusal: newROFR,
      cancellationNoticeDays: Number(newCancellationDays),
      illuminationSlaPercent: Number(newIlluminationSLA),
      governingLaw: newGoverningLaw,
      specialProvisions: newSpecialProvisions,
      items: selectedBbObjs.map((b) => ({
        billboardId: b.id,
        startDate: newStartDate,
        endDate: newEndDate,
      })),
      authorName: officerName,
      autoSignAdversoft,
    });

    if (res.success && res.contract) {
      toast({
        title: 'Agreement Generated',
        description: `Contract ${res.contract.contractNumber} created successfully.`,
        type: 'success',
      });
      refreshContracts();
      setIsCreateModalOpen(false);
      setInspectContract(res.contract);
      // Reset form
      setNewTitle('');
      setNewCampaignName('');
      setNewSelectedBillboards([]);
      setNewStartDate('');
      setNewEndDate('');
    } else {
      toast({ title: 'Failed to Create', description: res.error || 'Contract generation failed.', type: 'destructive' });
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-8 pb-16">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Contract Management</h1>
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                Legal Agreements
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                ROFR Engine
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Advertising agreements, dual digital signatures, legal clauses, renewal tracking, and 30/60/90-day expiration alerts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refreshContracts}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
              title="Refresh contract records"
            >
              <RefreshCw className="h-4 w-4 text-gray-500" />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => {
                setNewStartDate('2026-11-01');
                setNewEndDate('2027-01-31');
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>New Advertising Agreement</span>
            </button>
          </div>
        </div>

        {/* Portfolio KPI Metric Cards (Premium Dashboard Aesthetic: No black borders, soft shadows) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="rounded-2xl p-5 shadow-sm bg-white border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Portfolio</span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-gray-900">
                ${metrics.totalPortfolioValue.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <span>{metrics.activeCount} active contracts</span>
                <span className="text-gray-300">•</span>
                <span className="text-indigo-600 font-medium">{metrics.avgTermMonths} mo avg</span>
              </p>
            </div>
          </Card>

          <Card
            onClick={() => {
              setAlertFilter('CRITICAL_30');
              setStatusFilter('ALL');
            }}
            className="rounded-2xl p-5 shadow-sm bg-white border border-gray-100 flex flex-col justify-between cursor-pointer hover:border-rose-200 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-rose-600 uppercase tracking-wider">30-Day Critical</span>
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-rose-600">{metrics.critical30Count}</div>
              <p className="text-xs text-gray-500 mt-1">Requires immediate renewal or takedown notice</p>
            </div>
          </Card>

          <Card
            onClick={() => {
              setAlertFilter('WARNING_60');
              setStatusFilter('ALL');
            }}
            className="rounded-2xl p-5 shadow-sm bg-white border border-gray-100 flex flex-col justify-between cursor-pointer hover:border-amber-200 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">60-Day Warning</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-amber-600">{metrics.warning60Count}</div>
              <p className="text-xs text-gray-500 mt-1">ROFR renewal outreach window</p>
            </div>
          </Card>

          <Card
            onClick={() => {
              setAlertFilter('NOTICE_90');
              setStatusFilter('ALL');
            }}
            className="rounded-2xl p-5 shadow-sm bg-white border border-gray-100 flex flex-col justify-between cursor-pointer hover:border-blue-200 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">90-Day Pipeline</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-blue-600">{metrics.notice90Count}</div>
              <p className="text-xs text-gray-500 mt-1">Upcoming renewal cycle scheduling</p>
            </div>
          </Card>

          <Card
            onClick={() => {
              setStatusFilter('PENDING_SIGNATURE');
              setAlertFilter('ALL');
            }}
            className="rounded-2xl p-5 shadow-sm bg-white border border-gray-100 flex flex-col justify-between cursor-pointer hover:border-amber-200 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Signatures</span>
              <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                <PenTool className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-orange-600">{metrics.pendingSignatureCount}</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting client or countersignature</p>
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
                placeholder="Search by contract reference, client company, campaign title, city..."
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
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING_SIGNATURE">Pending Signatures</option>
                  <option value="EXPIRING_SOON">Expiring Soon</option>
                  <option value="RENEWED">Renewed</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>

              {/* Expiration Alert Filter */}
              <div className="flex items-center gap-1.5 bg-gray-50/80 px-3 py-2 rounded-xl text-xs font-medium text-gray-700">
                <span>Expiry Alert:</span>
                <select
                  value={alertFilter}
                  onChange={(e) => setAlertFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-gray-900 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Horizons</option>
                  <option value="CRITICAL_30">🚨 ≤ 30-Day Critical</option>
                  <option value="WARNING_60">⚠️ 31-60 Day Warning</option>
                  <option value="NOTICE_90">ℹ️ 61-90 Day Notice</option>
                  <option value="HEALTHY">✓ Healthy (&gt;90d)</option>
                  <option value="EXPIRED">Expired</option>
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

              {/* Clear Filters */}
              {(statusFilter !== 'ALL' || alertFilter !== 'ALL' || clientFilter !== 'ALL' || searchQuery) && (
                <button
                  onClick={() => {
                    setStatusFilter('ALL');
                    setAlertFilter('ALL');
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

        {/* Master Contracts Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-indigo-600" />
              <h2 className="text-sm font-semibold text-gray-900">
                Advertising Agreements ({filteredContracts.length})
              </h2>
            </div>
            <span className="text-xs text-gray-500">
              Dual Sign-offs • ROFR Locked • 30/60/90d Radar
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/60 text-gray-500 font-medium border-b border-gray-100">
                  <th className="py-3.5 px-6">Contract Ref & Type</th>
                  <th className="py-3.5 px-6">Client & Account</th>
                  <th className="py-3.5 px-6">Campaign & Sites</th>
                  <th className="py-3.5 px-6">Term & Expiration Alert</th>
                  <th className="py-3.5 px-6">Portfolio Value</th>
                  <th className="py-3.5 px-6">Digital Signatures</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {contracts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center">
                      <FileCheck2 className="mx-auto h-10 w-10 text-indigo-400 mb-2" />
                      <h4 className="text-sm font-semibold text-gray-900">No Legal Agreements in this Workspace</h4>
                      <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                        Your clean workspace starts fresh with zero contracts. Draft your first MSA, Insertion Order, or Annual Retainer agreement.
                      </p>
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 shadow-sm transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Draft First Contract</span>
                      </button>
                    </td>
                  </tr>
                ) : filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm font-medium">No advertising agreements found.</p>
                      <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or search terms.</p>
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((contract) => {
                    const statusMeta = STATUS_CONFIG[contract.status];
                    const alertMeta = ALERT_CONFIG[contract.expirationAlertTier];
                    const typeMeta = TYPE_CONFIG[contract.type];
                    const StatusIcon = statusMeta.icon;
                    const AlertIcon = alertMeta.icon;

                    const bothSigned =
                      contract.adversoftSignature.status === 'SIGNED' &&
                      contract.clientSignature.status === 'SIGNED';

                    return (
                      <tr
                        key={contract.id}
                        className="hover:bg-gray-50/60 transition group cursor-pointer"
                        onClick={() => setInspectContract(contract)}
                      >
                        {/* Ref & Type */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 group-hover:text-indigo-600 transition">
                              {contract.contractNumber}
                            </span>
                            {contract.renewedFromContractNumber && (
                              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
                                Renewal
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-1 max-w-[220px]">
                            {contract.title}
                          </div>
                          <span
                            className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${typeMeta.color}`}
                          >
                            {typeMeta.label}
                          </span>
                        </td>

                        {/* Client */}
                        <td className="py-4 px-6">
                          <div className="font-semibold text-gray-900">{contract.clientCompanyName}</div>
                          <div className="text-[11px] text-gray-500">{contract.clientAccountNumber}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            Signatory: {contract.clientSignature.signatoryName || 'Authorized Rep'}
                          </div>
                        </td>

                        {/* Campaign & Sites */}
                        <td className="py-4 px-6">
                          <div className="font-medium text-gray-900 line-clamp-1 max-w-[180px]">
                            {contract.campaignName}
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span>
                              {contract.items.length} {contract.items.length === 1 ? 'Site' : 'Sites'} (
                              {contract.items.map((i) => i.billboardCity).filter((v, i, a) => a.indexOf(v) === i).join(', ')})
                            </span>
                          </div>
                          {contract.rightOfFirstRefusal && (
                            <span className="inline-flex items-center gap-0.5 mt-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                              ROFR Protected
                            </span>
                          )}
                        </td>

                        {/* Term & Expiration Alert */}
                        <td className="py-4 px-6">
                          <div className="text-[11px] text-gray-900 font-medium">
                            {contract.startDate} → {contract.endDate}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            {contract.durationMonths} months ({contract.durationDays} days)
                          </div>
                          <div className="mt-1.5">
                            <span
                              className={`inline-flex items-center gap-1 border px-2 py-0.5 rounded-full text-[10px] ${alertMeta.badgeClass}`}
                            >
                              <AlertIcon className="h-3 w-3" />
                              <span>
                                {contract.daysRemaining > 0
                                  ? `${contract.daysRemaining}d remaining`
                                  : 'Term Concluded'}
                              </span>
                            </span>
                          </div>
                        </td>

                        {/* Portfolio Value */}
                        <td className="py-4 px-6">
                          <div className="font-bold text-gray-900 text-sm">
                            ${contract.totalContractValue.toLocaleString()}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            ${contract.monthlyBillingAmount.toLocaleString()}/mo
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            Freq: {contract.billingFrequency}
                          </div>
                        </td>

                        {/* Digital Signatures */}
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              {contract.adversoftSignature.status === 'SIGNED' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                                  <Check className="h-3 w-3" />
                                  <span>Adversoft</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600">
                                  <Clock className="h-3 w-3" />
                                  <span>Adversoft</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {contract.clientSignature.status === 'SIGNED' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                                  <Check className="h-3 w-3" />
                                  <span>Client</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600">
                                  <Clock className="h-3 w-3" />
                                  <span>Client</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusMeta.bg} ${statusMeta.text}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            <span>{statusMeta.label}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td
                          className="py-4 px-6 text-right space-x-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Quick Sign Adversoft button if pending */}
                          {contract.adversoftSignature.status === 'PENDING' && (
                            <button
                              onClick={() => {
                                setSignAdversoftModalTarget(contract);
                              }}
                              className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition"
                              title="Execute Adversoft Countersignature"
                            >
                              <PenTool className="h-4 w-4" />
                            </button>
                          )}

                          {/* Quick Sign Client button if pending */}
                          {contract.clientSignature.status === 'PENDING' && (
                            <button
                              onClick={() => {
                                setSignerName(contract.clientSignature.signatoryName || '');
                                setSignerTitle(contract.clientSignature.signatoryTitle || '');
                                setSignClientModalTarget(contract);
                              }}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                              title="Execute Client Digital Signature"
                            >
                              <FileCheck2 className="h-4 w-4" />
                            </button>
                          )}

                          {/* Quick Renew button */}
                          {['ACTIVE', 'EXPIRING_SOON', 'EXPIRED'].includes(contract.status) && (
                            <button
                              onClick={() => {
                                setRenewTarget(contract);
                              }}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                              title="Renew Agreement (ROFR Exercise)"
                            >
                              <RotateCw className="h-4 w-4" />
                            </button>
                          )}

                          {/* Print / Legal Agreement View */}
                          <button
                            onClick={() => setPrintableContract(contract)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                            title="Print Formal Agreement PDF"
                          >
                            <Printer className="h-4 w-4" />
                          </button>

                          {/* Inspect Drawer */}
                          <button
                            onClick={() => setInspectContract(contract)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            title="Inspect Details & Clauses"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CONTRACT INSPECTION DRAWER */}
        {/* ========================================================================= */}
        {inspectContract && (
          <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
              {/* Drawer Header */}
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">
                      {inspectContract.contractNumber}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        STATUS_CONFIG[inspectContract.status].bg
                      } ${STATUS_CONFIG[inspectContract.status].text}`}
                    >
                      {STATUS_CONFIG[inspectContract.status].label}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full border ${
                        ALERT_CONFIG[inspectContract.expirationAlertTier].badgeClass
                      }`}
                    >
                      {ALERT_CONFIG[inspectContract.expirationAlertTier].label}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mt-1">
                    {inspectContract.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Client: {inspectContract.clientCompanyName} ({inspectContract.clientAccountNumber})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPrintableContract(inspectContract)}
                    className="p-2 rounded-xl text-gray-500 hover:bg-white hover:text-gray-900 shadow-sm transition"
                    title="Print Agreement"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setInspectContract(null)}
                    className="p-2 rounded-xl text-gray-500 hover:bg-white hover:text-gray-900 shadow-sm transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Drawer Body */}
              <div className="p-6 space-y-6 flex-1 text-xs">
                {/* Financial & Term Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-500 text-[10px] uppercase font-medium">Total Contract</span>
                    <div className="text-base font-bold text-gray-900 mt-0.5">
                      ${inspectContract.totalContractValue.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-500 text-[10px] uppercase font-medium">Monthly Rate</span>
                    <div className="text-base font-bold text-gray-900 mt-0.5">
                      ${inspectContract.monthlyBillingAmount.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-500 text-[10px] uppercase font-medium">Duration</span>
                    <div className="text-base font-bold text-gray-900 mt-0.5">
                      {inspectContract.durationMonths} Months
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-500 text-[10px] uppercase font-medium">Deposit Required</span>
                    <div className="text-base font-bold text-gray-900 mt-0.5">
                      ${inspectContract.depositAmount.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Term Dates & Days Remaining Alert Banner */}
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between ${
                    inspectContract.daysRemaining <= 30
                      ? 'bg-rose-50/60 border-rose-200'
                      : inspectContract.daysRemaining <= 60
                      ? 'bg-amber-50/60 border-amber-200'
                      : 'bg-indigo-50/50 border-indigo-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        inspectContract.daysRemaining <= 30
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-xs">
                        Term Flight Dates: {inspectContract.startDate} to {inspectContract.endDate}
                      </div>
                      <div className="text-[11px] text-gray-600 mt-0.5">
                        {inspectContract.daysRemaining > 0 ? (
                          <>
                            <span className="font-bold text-gray-900">
                              {inspectContract.daysRemaining} days remaining
                            </span>{' '}
                            in active flight window.
                          </>
                        ) : (
                          <span className="font-bold text-rose-600">Agreement flight has expired.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setRenewTarget(inspectContract);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-indigo-600 font-semibold rounded-lg shadow-sm border border-gray-100 hover:bg-indigo-50 transition"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    <span>Renew Term</span>
                  </button>
                </div>

                {/* Legal & Commercial Terms */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-indigo-600" />
                    <span>Legal Clauses & Operational Provisions</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-gray-50/70 rounded-xl space-y-1">
                      <span className="text-gray-500 font-medium">Right of First Refusal (ROFR):</span>
                      <p className="font-semibold text-gray-900">
                        {inspectContract.rightOfFirstRefusal
                          ? 'Protected (Client holds 30-day renewal priority)'
                          : 'Not Included'}
                      </p>
                    </div>

                    <div className="p-3.5 bg-gray-50/70 rounded-xl space-y-1">
                      <span className="text-gray-500 font-medium">Illumination & SLA Guarantee:</span>
                      <p className="font-semibold text-gray-900">
                        {inspectContract.illuminationSlaPercent}% uptime guarantee
                      </p>
                    </div>

                    <div className="p-3.5 bg-gray-50/70 rounded-xl space-y-1">
                      <span className="text-gray-500 font-medium">Cancellation Notice Period:</span>
                      <p className="font-semibold text-gray-900">
                        {inspectContract.cancellationNoticeDays} Days Written Notice
                      </p>
                    </div>

                    <div className="p-3.5 bg-gray-50/70 rounded-xl space-y-1">
                      <span className="text-gray-500 font-medium">Governing Jurisdiction:</span>
                      <p className="font-semibold text-gray-900">{inspectContract.governingLaw}</p>
                    </div>
                  </div>

                  {inspectContract.paymentTerms && (
                    <div className="mt-3 p-3.5 bg-gray-50/70 rounded-xl space-y-1">
                      <span className="text-gray-500 font-medium">Payment & Billing Terms:</span>
                      <p className="text-gray-900 font-medium">{inspectContract.paymentTerms}</p>
                    </div>
                  )}

                  {inspectContract.specialProvisions && (
                    <div className="mt-3 p-3.5 bg-gray-50/70 rounded-xl space-y-1">
                      <span className="text-gray-500 font-medium">Special Provisions & Rider Notes:</span>
                      <p className="text-gray-900 italic">{inspectContract.specialProvisions}</p>
                    </div>
                  )}
                </div>

                {/* Schedule A: Billboard Inventory Items */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-indigo-600" />
                    <span>Schedule A: Billboard Inventory & Flight Allocations</span>
                  </h4>
                  <div className="space-y-2">
                    {inspectContract.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{item.billboardCode}</span>
                            <span className="text-gray-600 font-medium">{item.billboardName}</span>
                            {item.isDigital ? (
                              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
                                Digital LED
                              </span>
                            ) : (
                              <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-medium">
                                Static Bulletin
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-500 mt-1">
                            {item.billboardCorridor}, {item.billboardCity} • {item.dimensions}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            Flight: {item.startDate} to {item.endDate} ({item.durationDays} days)
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-gray-900 text-sm">
                            ${item.monthlyRental.toLocaleString()}/mo
                          </div>
                          <div className="text-[10px] text-gray-500">
                            Total: ${item.totalRental.toLocaleString()}
                          </div>
                          {item.installationCost > 0 && (
                            <div className="text-[10px] text-gray-400">
                              +${item.installationCost} install
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dual Digital Sign-Offs & Audit Logs */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <PenTool className="h-4 w-4 text-indigo-600" />
                    <span>Dual Digital Sign-Offs & Execution Status</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Adversoft Signatory Block */}
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-900">Adversoft Outdoor Media LLC</span>
                        {inspectContract.adversoftSignature.status === 'SIGNED' ? (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="h-3 w-3" /> Signed
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                            Pending
                          </span>
                        )}
                      </div>

                      {inspectContract.adversoftSignature.status === 'SIGNED' ? (
                        <div className="space-y-1.5">
                          <div className="font-serif italic text-lg text-indigo-900 tracking-wider">
                            {inspectContract.adversoftSignature.signatureImageText ||
                              inspectContract.adversoftSignature.signatoryName}
                          </div>
                          <div className="text-[11px] font-medium text-gray-900">
                            {inspectContract.adversoftSignature.signatoryName}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {inspectContract.adversoftSignature.signatoryTitle}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            Signed: {inspectContract.adversoftSignature.signedAt}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            IP: {inspectContract.adversoftSignature.ipAddress}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 mt-2">
                          <p className="text-gray-500 text-[11px]">
                            Awaiting official executive countersignature from Adversoft media authority.
                          </p>
                          <button
                            onClick={() => setSignAdversoftModalTarget(inspectContract)}
                            className="w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
                          >
                            Sign as Adversoft Officer
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Client Signatory Block */}
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-900">
                          {inspectContract.clientCompanyName}
                        </span>
                        {inspectContract.clientSignature.status === 'SIGNED' ? (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="h-3 w-3" /> Signed
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                            Pending
                          </span>
                        )}
                      </div>

                      {inspectContract.clientSignature.status === 'SIGNED' ? (
                        <div className="space-y-1.5">
                          <div className="font-serif italic text-lg text-emerald-900 tracking-wider">
                            {inspectContract.clientSignature.signatureImageText ||
                              inspectContract.clientSignature.signatoryName}
                          </div>
                          <div className="text-[11px] font-medium text-gray-900">
                            {inspectContract.clientSignature.signatoryName}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {inspectContract.clientSignature.signatoryTitle}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            Signed: {inspectContract.clientSignature.signedAt}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            IP: {inspectContract.clientSignature.ipAddress}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 mt-2">
                          <p className="text-gray-500 text-[11px]">
                            Awaiting authorized client digital endorsement and contract acceptance.
                          </p>
                          <button
                            onClick={() => {
                              setSignerName(inspectContract.clientSignature.signatoryName || '');
                              setSignerTitle(inspectContract.clientSignature.signatoryTitle || '');
                              setSignClientModalTarget(inspectContract);
                            }}
                            className="w-full py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
                          >
                            Apply Client Digital Signature
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Successor & Renewal Linkage */}
                {(inspectContract.renewedFromContractNumber || inspectContract.renewedToContractNumber) && (
                  <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                    <span className="font-semibold text-indigo-900 flex items-center gap-1.5">
                      <RotateCw className="h-4 w-4 text-indigo-600" />
                      <span>Contract Continuity Chain</span>
                    </span>
                    {inspectContract.renewedFromContractNumber && (
                      <p className="text-indigo-800">
                        Renewed from previous agreement{' '}
                        <span className="font-bold">{inspectContract.renewedFromContractNumber}</span>.
                      </p>
                    )}
                    {inspectContract.renewedToContractNumber && (
                      <p className="text-indigo-800">
                        Successor agreement issued as{' '}
                        <span className="font-bold">{inspectContract.renewedToContractNumber}</span>.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-6 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between">
                <button
                  onClick={() => setInspectContract(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 transition"
                >
                  Close
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPrintableContract(inspectContract);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-gray-700 text-xs font-semibold rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>View / Print PDF</span>
                  </button>

                  {['ACTIVE', 'EXPIRING_SOON', 'EXPIRED'].includes(inspectContract.status) && (
                    <button
                      onClick={() => setRenewTarget(inspectContract)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl shadow-sm hover:bg-indigo-700 transition"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                      <span>Renew Agreement</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ONE-CLICK RENEWAL MODAL */}
        {/* ========================================================================= */}
        {renewTarget && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <RotateCw className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Exercise Renewal Option</h3>
                    <p className="text-xs text-gray-500">Contract {renewTarget.contractNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setRenewTarget(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleExecuteRenewal} className="p-6 space-y-5 text-xs">
                {/* Current Terms Summary */}
                <div className="p-3.5 bg-gray-50 rounded-xl space-y-1">
                  <div className="flex justify-between text-gray-600">
                    <span>Client:</span>
                    <span className="font-semibold text-gray-900">{renewTarget.clientCompanyName}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Current Term:</span>
                    <span className="font-semibold text-gray-900">
                      {renewTarget.startDate} to {renewTarget.endDate}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Current Monthly Rental:</span>
                    <span className="font-semibold text-gray-900">
                      ${renewTarget.monthlyBillingAmount.toLocaleString()}/mo
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Right of First Refusal:</span>
                    <span className="font-semibold text-emerald-700">Active & Enforceable</span>
                  </div>
                </div>

                {/* Duration Option */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1.5">
                    Renewal Flight Duration (Months)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 3, 6, 12].map((m) => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setRenewMonths(m)}
                        className={`py-2 text-center rounded-xl font-semibold border transition ${
                          renewMonths === m
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {m} {m === 1 ? 'Month' : 'Months'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rate Escalation */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1.5">
                    Annual Escalation / Price Adjustment (%)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="25"
                      value={renewEscalation}
                      onChange={(e) => setRenewEscalation(Number(e.target.value))}
                      className="w-24 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-gray-500">
                      New monthly:{' '}
                      <strong className="text-gray-900">
                        $
                        {Math.round(
                          renewTarget.monthlyBillingAmount * (1 + renewEscalation / 100)
                        ).toLocaleString()}
                        /mo
                      </strong>
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Standard ROFR agreements include +3% CPI rate indexation.
                  </p>
                </div>

                {/* Projected Renewal Preview */}
                <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 text-indigo-950 space-y-1">
                  <span className="font-semibold block">Renewal Projection:</span>
                  <div className="flex justify-between text-[11px]">
                    <span>Projected Start Date:</span>
                    <span className="font-semibold">
                      {new Date(new Date(renewTarget.endDate).getTime() + 86400000)
                        .toISOString()
                        .split('T')[0]}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Projected Total Portfolio Value:</span>
                    <span className="font-bold">
                      $
                      {Math.round(
                        renewTarget.monthlyBillingAmount *
                          (1 + renewEscalation / 100) *
                          renewMonths
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRenewTarget(null)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-sm transition"
                  >
                    Execute Renewal Agreement
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CLIENT E-SIGN MODAL */}
        {/* ========================================================================= */}
        {signClientModalTarget && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <PenTool className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Client Digital Signature</h3>
                    <p className="text-xs text-gray-500">{signClientModalTarget.contractNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSignClientModalTarget(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleClientSign} className="p-6 space-y-4 text-xs">
                <p className="text-gray-600">
                  By signing below, the client affirms acceptance of all terms, schedule rates, and flight
                  obligations for{' '}
                  <strong className="text-gray-900">{signClientModalTarget.campaignName}</strong>.
                </p>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Signatory Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. David Sterling"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Signatory Official Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chief Executive Officer"
                    value={signerTitle}
                    onChange={(e) => setSignerTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-gray-900"
                  />
                </div>

                {signerName && (
                  <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 text-center">
                    <span className="text-[10px] text-emerald-800 uppercase font-bold tracking-wider">
                      Signature Rendering Preview
                    </span>
                    <div className="font-serif italic text-2xl text-emerald-900 mt-1">
                      {signerName}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setSignClientModalTarget(null)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 shadow-sm transition"
                  >
                    Confirm & Execute Signature
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ADVERSOFT COUNTERSIGN MODAL */}
        {/* ========================================================================= */}
        {signAdversoftModalTarget && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Adversoft Countersignature</h3>
                    <p className="text-xs text-gray-500">{signAdversoftModalTarget.contractNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSignAdversoftModalTarget(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAdversoftSign} className="p-6 space-y-4 text-xs">
                <p className="text-gray-600">
                  Affirm official corporate authorization on behalf of Adversoft Outdoor Media LLC to ratify
                  agreement{' '}
                  <strong className="text-gray-900">
                    {signAdversoftModalTarget.contractNumber}
                  </strong>
                  .
                </p>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Adversoft Officer Name</label>
                  <input
                    type="text"
                    required
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Officer Title</label>
                  <input
                    type="text"
                    required
                    value={officerTitle}
                    onChange={(e) => setOfficerTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  />
                </div>

                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 text-center">
                  <span className="text-[10px] text-indigo-800 uppercase font-bold tracking-wider">
                    Executive Stamp Preview
                  </span>
                  <div className="font-serif italic text-2xl text-indigo-900 mt-1">{officerName}</div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setSignAdversoftModalTarget(null)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-sm transition"
                  >
                    Ratify & Execute
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* NEW AGREEMENT CREATION MODAL */}
        {/* ========================================================================= */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Create Advertising Agreement</h3>
                  <p className="text-xs text-gray-500">
                    Draft legally binding MSA or IO contract with Schedule A billboard allocations.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateContract} className="p-6 space-y-6 text-xs max-h-[80vh] overflow-y-auto">
                {/* Client & Agreement Meta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Client Account *</label>
                    <select
                      required
                      value={newClientId}
                      onChange={(e) => setNewClientId(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    >
                      <option value="">Select Client Account...</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.companyName} ({c.accountNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Agreement Type *</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as ContractType)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    >
                      <option value="MASTER_SERVICES_AGREEMENT">Master Services Agreement (MSA)</option>
                      <option value="SINGLE_FLIGHT_IO">Single-Flight Insertion Order</option>
                      <option value="LONG_TERM_LICENSE">Long-Term Real Estate License</option>
                      <option value="MULTI_MARKET_NETWORK">Multi-Market Network Agreement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Agreement Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Master Outdoor Advertising Agreement"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Campaign Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Spring Brand Launch 2027"
                      value={newCampaignName}
                      onChange={(e) => setNewCampaignName(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Flight Start Date *</label>
                    <input
                      type="date"
                      required
                      value={newStartDate}
                      onChange={(e) => setNewStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Flight End Date *</label>
                    <input
                      type="date"
                      required
                      value={newEndDate}
                      onChange={(e) => setNewEndDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    />
                  </div>
                </div>

                {/* Schedule A Inventory Selector */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    Schedule A: Billboard Inventory Selection *
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

                {/* Terms & Clauses */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Billing Frequency</label>
                    <select
                      value={newBillingFrequency}
                      onChange={(e) => setNewBillingFrequency(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    >
                      <option value="MONTHLY">Monthly Billing</option>
                      <option value="UPFRONT">100% Upfront</option>
                      <option value="QUARTERLY">Quarterly Installments</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Cancellation Notice (Days)</label>
                    <input
                      type="number"
                      value={newCancellationDays}
                      onChange={(e) => setNewCancellationDays(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Illumination SLA (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newIlluminationSLA}
                      onChange={(e) => setNewIlluminationSLA(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="rofrCheckbox"
                      checked={newROFR}
                      onChange={(e) => setNewROFR(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <label htmlFor="rofrCheckbox" className="font-semibold text-gray-700 cursor-pointer">
                      Grant Right of First Refusal (ROFR) Renewal Priority to Client
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoSignCheckbox"
                      checked={autoSignAdversoft}
                      onChange={(e) => setAutoSignAdversoft(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <label htmlFor="autoSignCheckbox" className="font-semibold text-gray-700 cursor-pointer">
                      Auto-apply Adversoft authorized signature upon contract generation
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Special Legal Provisions</label>
                  <textarea
                    rows={2}
                    value={newSpecialProvisions}
                    onChange={(e) => setNewSpecialProvisions(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-gray-900"
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
                    Generate & Issue Agreement
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PRINTABLE LEGAL AGREEMENT VIEW (PDF / window.print() ready) */}
        {/* ========================================================================= */}
        {printableContract && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-gray-100 my-8">
              {/* Action Toolbar */}
              <div className="p-4 bg-gray-900 text-white flex items-center justify-between no-print">
                <div className="flex items-center gap-2">
                  <FileBadge className="h-5 w-5 text-indigo-400" />
                  <span className="font-semibold text-sm">
                    Executed Agreement Document — {printableContract.contractNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Agreement</span>
                  </button>
                  <button
                    onClick={() => setPrintableContract(null)}
                    className="p-1.5 text-gray-400 hover:text-white rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Printable Document Body */}
              <div className="p-10 space-y-8 text-gray-800 text-xs font-sans bg-white leading-relaxed">
                {/* Header */}
                <div className="border-b border-gray-200 pb-6 flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-gray-900 uppercase">
                      Adversoft Outdoor Media LLC
                    </h1>
                    <p className="text-gray-500 text-xs mt-1">
                      Premier Out-of-Home & Digital Signage Network Infrastructure
                    </p>
                    <p className="text-gray-500 text-xs">
                      1000 Broadway, 42nd Floor, New York, NY 10018 • legal@adversoft.com
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      AGREEMENT #{printableContract.contractNumber}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Executed Date: {printableContract.createdAt}
                    </div>
                    <div className="text-xs font-semibold text-indigo-700 mt-1 uppercase">
                      {printableContract.type.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>

                {/* Recitals & Parties */}
                <div>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                    1. PARTIES & ENGAGEMENT
                  </h2>
                  <p className="text-gray-700">
                    This Outdoor Advertising Agreement (&ldquo;Agreement&rdquo;) is entered into between{' '}
                    <strong>Adversoft Outdoor Media LLC</strong> (&ldquo;Operator&rdquo;) and{' '}
                    <strong>{printableContract.clientCompanyName}</strong> (&ldquo;Advertiser&rdquo;),
                    having its principal office located at{' '}
                    <span className="italic">{printableContract.clientBillingAddress}, {printableContract.clientCity}, {printableContract.clientState} {printableContract.clientZipCode}</span>
                    {printableContract.clientTaxId ? ` (Tax ID: ${printableContract.clientTaxId})` : ''}.
                  </p>
                </div>

                {/* Commercial Terms Summary */}
                <div>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                    2. COMMERCIAL SUMMARY & TERM
                  </h2>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-bold bg-gray-50 w-1/3">Campaign Identifier:</td>
                          <td className="p-2.5">{printableContract.campaignName}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-bold bg-gray-50">Flight Schedule:</td>
                          <td className="p-2.5">
                            {printableContract.startDate} through {printableContract.endDate} (
                            {printableContract.durationMonths} Months / {printableContract.durationDays} Days)
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-bold bg-gray-50">Total Contract Value:</td>
                          <td className="p-2.5 font-bold text-gray-900">
                            ${printableContract.totalContractValue.toLocaleString()} USD
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-bold bg-gray-50">Monthly Rental Consideration:</td>
                          <td className="p-2.5">
                            ${printableContract.monthlyBillingAmount.toLocaleString()} USD / month
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-bold bg-gray-50">Execution Deposit:</td>
                          <td className="p-2.5">${printableContract.depositAmount.toLocaleString()} USD</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold bg-gray-50">Payment Terms:</td>
                          <td className="p-2.5">{printableContract.paymentTerms}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Schedule A Inventory */}
                <div>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                    3. SCHEDULE A — LICENSED BILLBOARD ASSETS
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border border-gray-200 text-xs">
                      <thead>
                        <tr className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200">
                          <th className="p-2">Code</th>
                          <th className="p-2">Site Name & Location</th>
                          <th className="p-2">Structure Type</th>
                          <th className="p-2">Dimensions</th>
                          <th className="p-2 text-right">Monthly Rate</th>
                          <th className="p-2 text-right">Total Site Fee</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {printableContract.items.map((item) => (
                          <tr key={item.id}>
                            <td className="p-2 font-bold">{item.billboardCode}</td>
                            <td className="p-2">
                              {item.billboardName} ({item.billboardCorridor}, {item.billboardCity})
                            </td>
                            <td className="p-2">
                              {item.isDigital ? 'Digital LED Display' : 'Static Vinyl Bulletin'}
                            </td>
                            <td className="p-2">{item.dimensions}</td>
                            <td className="p-2 text-right">${item.monthlyRental.toLocaleString()}</td>
                            <td className="p-2 text-right font-semibold">
                              ${item.totalRental.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Standard Legal Clauses */}
                <div>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                    4. LEGAL PROVISIONS & SERVICE LEVEL STANDARDS
                  </h2>
                  <div className="space-y-2 text-gray-700">
                    <p>
                      <strong>A. Right of First Refusal (ROFR):</strong>{' '}
                      {printableContract.rightOfFirstRefusal
                        ? 'Operator hereby confers upon Advertiser the exclusive Right of First Refusal to extend or renew the flight period on all assets listed in Schedule A, subject to written notice delivered no later than 30 calendar days prior to contract termination.'
                        : 'No Right of First Refusal is conferred under this Agreement.'}
                    </p>
                    <p>
                      <strong>B. Service Level & Illumination Guarantee:</strong> Operator guarantees an
                      illumination SLA of not less than {printableContract.illuminationSlaPercent}% during all
                      customary operating hours. Downtime exceeding 48 cumulative hours per month shall be
                      compensated via prorated billing credits or flight duration extension.
                    </p>
                    <p>
                      <strong>C. Governing Jurisdiction:</strong> This agreement shall be governed and
                      construed in accordance with the laws of {printableContract.governingLaw}.
                    </p>
                  </div>
                </div>

                {/* Dual Execution Signature Blocks */}
                <div className="pt-6 border-t border-gray-200">
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                    5. DIGITAL SIGN-OFFS & VERIFIED EXECUTION
                  </h2>

                  <div className="grid grid-cols-2 gap-8">
                    {/* Adversoft Signatory Block */}
                    <div className="border border-gray-200 p-4 rounded-lg bg-gray-50/50">
                      <div className="text-xs font-bold uppercase text-gray-500 mb-2">
                        Signed for Operator: Adversoft Outdoor Media LLC
                      </div>
                      <div className="h-14 flex items-center border-b border-gray-300">
                        <span className="font-serif italic text-2xl text-indigo-900">
                          {printableContract.adversoftSignature.signatureImageText ||
                            printableContract.adversoftSignature.signatoryName}
                        </span>
                      </div>
                      <div className="mt-2 text-xs space-y-0.5">
                        <div className="font-bold text-gray-900">
                          {printableContract.adversoftSignature.signatoryName}
                        </div>
                        <div className="text-gray-600">
                          {printableContract.adversoftSignature.signatoryTitle}
                        </div>
                        <div className="text-gray-500 font-mono text-[10px]">
                          Audit Timestamp: {printableContract.adversoftSignature.signedAt || 'Pending'}
                        </div>
                        <div className="text-gray-400 font-mono text-[10px]">
                          IP Hash: {printableContract.adversoftSignature.ipAddress}
                        </div>
                      </div>
                    </div>

                    {/* Client Signatory Block */}
                    <div className="border border-gray-200 p-4 rounded-lg bg-gray-50/50">
                      <div className="text-xs font-bold uppercase text-gray-500 mb-2">
                        Signed for Advertiser: {printableContract.clientCompanyName}
                      </div>
                      <div className="h-14 flex items-center border-b border-gray-300">
                        {printableContract.clientSignature.status === 'SIGNED' ? (
                          <span className="font-serif italic text-2xl text-emerald-900">
                            {printableContract.clientSignature.signatureImageText ||
                              printableContract.clientSignature.signatoryName}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Pending Execution</span>
                        )}
                      </div>
                      <div className="mt-2 text-xs space-y-0.5">
                        <div className="font-bold text-gray-900">
                          {printableContract.clientSignature.signatoryName}
                        </div>
                        <div className="text-gray-600">
                          {printableContract.clientSignature.signatoryTitle}
                        </div>
                        <div className="text-gray-500 font-mono text-[10px]">
                          Audit Timestamp: {printableContract.clientSignature.signedAt || 'Pending'}
                        </div>
                        <div className="text-gray-400 font-mono text-[10px]">
                          IP Hash: {printableContract.clientSignature.ipAddress || 'Pending'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center text-[10px] text-gray-400 pt-6 border-t border-gray-100">
                  Adversoft Outdoor Advertising Management System • Legally Binding Electronic Document •
                  Hash: SHA-256-{printableContract.id.slice(-8).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
