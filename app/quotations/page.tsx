"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/protectedRoute';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import {
  QuotationRecord,
  QuotationStatus,
  QuotationLineItem,
  getStoredQuotations,
  saveStoredQuotations,
  createQuotation,
  updateQuotationStatus,
  approveQuotation,
  createQuotationRevision,
  getQuotationMetrics,
} from '@/lib/data/quotations-store';
import { INITIAL_CLIENTS, ClientAccount } from '@/lib/data/crm-store';
import { INITIAL_BILLBOARDS, BillboardItem } from '@/lib/data/billboards-store';
import { getBookings, BookingRecord } from '@/lib/data/bookings-store';
import {
  getTenantQuotations,
  saveTenantQuotations,
  getTenantClients,
  getTenantBillboards,
} from '@/lib/tenant-store';
import {
  FileSpreadsheet,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  DollarSign,
  Calendar,
  Building,
  ArrowRight,
  Download,
  Printer,
  Copy,
  ExternalLink,
  ChevronRight,
  Send,
  Eye,
  RefreshCw,
  Sparkles,
  MapPin,
  Maximize2,
  Zap,
  Tag,
  Check,
  X,
  SlidersHorizontal,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  QuotationStatus,
  { label: string; bg: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
  DRAFT: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock },
  SENT: { label: 'Issued / Sent', bg: 'bg-blue-50', text: 'text-blue-700', icon: Send },
  CLIENT_REVIEW: { label: 'Client Review', bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
  APPROVED: { label: 'Approved & Confirmed', bg: 'bg-emerald-50 text-emerald-700', text: 'text-emerald-700', icon: CheckCircle2 },
  REJECTED: { label: 'Declined', bg: 'bg-rose-50', text: 'text-rose-700', icon: XCircle },
  EXPIRED: { label: 'Expired', bg: 'bg-slate-100', text: 'text-slate-600', icon: AlertCircle },
};

export default function QuotationsPage() {
  const { user, tenant } = useAuth();
  const { toast } = useToast();

  // Quotations List State
  const [quotations, setQuotations] = useState<QuotationRecord[]>(() => getTenantQuotations(tenant?.id));
  const [clients, setClients] = useState(() => getTenantClients(tenant?.id));
  const [billboards, setBillboards] = useState(() => getTenantBillboards(tenant?.id));

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [clientFilter, setClientFilter] = useState<string>('ALL');

  // Modals & Drawers
  const [inspectQuotation, setInspectQuotation] = useState<QuotationRecord | null>(null);
  const [printableQuotation, setPrintableQuotation] = useState<QuotationRecord | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [clientFeedbackModalTarget, setClientFeedbackModalTarget] = useState<QuotationRecord | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState('');

  // Create Form State
  const [newQuoteClientId, setNewQuoteClientId] = useState('');
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [newBookingId, setNewBookingId] = useState('');
  const [newDiscountType, setNewDiscountType] = useState<'PERCENTAGE' | 'FIXED' | 'NONE'>('NONE');
  const [newDiscountValue, setNewDiscountValue] = useState(0);
  const [newDiscountReason, setNewDiscountReason] = useState('');
  const [newTaxRate, setNewTaxRate] = useState(8.25);
  const [newValidityDays, setNewValidityDays] = useState(14);
  const [newPaymentTerms, setNewPaymentTerms] = useState('50% on signature, 50% Net 30 upon flight activation');
  const [newNotes, setNewNotes] = useState('');

  // Line items state inside create modal
  const [formItems, setFormItems] = useState<
    {
      billboardId: string;
      startDate: string;
      endDate: string;
      includeProduction: boolean;
      includeInstallation: boolean;
      includeArtworkDesign: boolean;
    }[]
  >([]);

  // Initialize and listen to storage sync
  useEffect(() => {
    setQuotations(getTenantQuotations(tenant?.id));
    setClients(getTenantClients(tenant?.id));
    setBillboards(getTenantBillboards(tenant?.id));

    const handleUpdate = () => {
      setQuotations(getTenantQuotations(tenant?.id));
      setClients(getTenantClients(tenant?.id));
      setBillboards(getTenantBillboards(tenant?.id));
    };

    window.addEventListener('adversoft_quotations_updated', handleUpdate);
    window.addEventListener('adversoft_crm_clients_updated', handleUpdate);
    window.addEventListener('adversoft_billboards_updated', handleUpdate);
    window.addEventListener('adversoft_tenant_changed', handleUpdate);
    return () => {
      window.removeEventListener('adversoft_quotations_updated', handleUpdate);
      window.removeEventListener('adversoft_crm_clients_updated', handleUpdate);
      window.removeEventListener('adversoft_billboards_updated', handleUpdate);
      window.removeEventListener('adversoft_tenant_changed', handleUpdate);
    };
  }, [tenant]);

  // Metrics
  const metrics = useMemo(() => {
    return getQuotationMetrics();
  }, [quotations]);

  // Clients & Billboards for dropdowns
  const availableClients = clients;
  const availableBillboards = billboards;

  // Filtered Quotations
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
      const matchesClient = clientFilter === 'ALL' || q.clientId === clientFilter;
      const matchesQuery =
        q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.clientCompanyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.campaignName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.items.some((i) => i.billboardCode.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesClient && matchesQuery;
    });
  }, [quotations, statusFilter, clientFilter, searchQuery]);

  // Initialize create modal with defaults
  const handleOpenCreateModal = () => {
    if (availableClients.length === 0) {
      toast.error('No Clients in Workspace', 'Please add at least one client in your CRM directory before compiling a quotation.');
      return;
    }
    if (availableBillboards.length === 0) {
      toast.error('No Billboards in Workspace', 'Please register at least one billboard asset before compiling a quotation.');
      return;
    }

    const defaultClient = availableClients[0];
    const defaultBillboard = availableBillboards[0];

    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() + 14);
    const end = new Date(start);
    end.setDate(start.getDate() + 28);

    setNewQuoteClientId(defaultClient.id);
    setNewCampaignName(`${defaultClient.companyName} OOH Flight 2026`);
    setNewBrandName(defaultClient.dbaName || defaultClient.companyName);
    setNewBookingId('');
    setNewDiscountType('NONE');
    setNewDiscountValue(0);
    setNewDiscountReason('');
    setNewTaxRate(8.25);
    setNewValidityDays(14);
    setNewPaymentTerms('50% on signature, 50% Net 30 upon flight activation');
    setNewNotes('Proposal prepared following client brief and target flight parameters.');

    setFormItems([
      {
        billboardId: defaultBillboard.id,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        includeProduction: !defaultBillboard.isDigital,
        includeInstallation: true,
        includeArtworkDesign: false,
      },
    ]);

    setIsCreateModalOpen(true);
  };

  // Add line item in form
  const handleAddFormItem = () => {
    if (availableBillboards.length === 0) return;
    const defaultBillboard = availableBillboards[Math.min(formItems.length, availableBillboards.length - 1)] || availableBillboards[0];
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() + 14);
    const end = new Date(start);
    end.setDate(start.getDate() + 28);

    setFormItems([
      ...formItems,
      {
        billboardId: defaultBillboard.id,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        includeProduction: !defaultBillboard.isDigital,
        includeInstallation: true,
        includeArtworkDesign: false,
      },
    ]);
  };

  // Remove line item in form
  const handleRemoveFormItem = (index: number) => {
    if (formItems.length <= 1) {
      toast.error('Minimum Items', 'A quotation must contain at least one billboard line item.');
      return;
    }
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  // Dynamic estimate calculations for create modal
  const formGrossTotal = useMemo(() => {
    let sum = 0;
    for (const item of formItems) {
      const b = availableBillboards.find((bb) => bb.id === item.billboardId);
      if (!b) continue;
      const s = new Date(item.startDate);
      const e = new Date(item.endDate);
      const days = Math.max(7, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
      const weeks = Math.ceil(days / 7);
      const rental = days >= 28 ? Math.round((b.monthlyRate / 30) * days) : weeks * b.weeklyRate;
      const prod = item.includeProduction ? b.productionCost : 0;
      const inst = item.includeInstallation ? b.installationCost : 0;
      const art = item.includeArtworkDesign ? 950 : 0;
      sum += rental + prod + inst + art;
    }
    return sum;
  }, [formItems, availableBillboards]);

  const formDiscountAmount = useMemo(() => {
    if (newDiscountType === 'PERCENTAGE' && newDiscountValue > 0) {
      return Math.round(formGrossTotal * (newDiscountValue / 100));
    }
    if (newDiscountType === 'FIXED' && newDiscountValue > 0) {
      return Math.min(newDiscountValue, formGrossTotal);
    }
    return 0;
  }, [formGrossTotal, newDiscountType, newDiscountValue]);

  const formTaxAmount = useMemo(() => {
    const net = Math.max(0, formGrossTotal - formDiscountAmount);
    return Math.round(net * (newTaxRate / 100));
  }, [formGrossTotal, formDiscountAmount, newTaxRate]);

  const formFinalTotal = useMemo(() => {
    const net = Math.max(0, formGrossTotal - formDiscountAmount);
    return net + formTaxAmount;
  }, [formGrossTotal, formDiscountAmount, formTaxAmount]);

  // Submit Create Quotation
  const handleCreateSubmit = (initialStatus: QuotationStatus) => {
    if (!newQuoteClientId || formItems.length === 0) {
      toast.error('Incomplete Quotation', 'Please select a client and at least one billboard structure.');
      return;
    }

    const res = createQuotation({
      clientId: newQuoteClientId,
      campaignName: newCampaignName || 'Outdoor Advertising Flight 2026',
      brandName: newBrandName,
      bookingId: newBookingId || undefined,
      items: formItems,
      discountType: newDiscountType,
      discountValue: Number(newDiscountValue) || 0,
      discountReason: newDiscountReason,
      taxRate: Number(newTaxRate) / 100,
      paymentTerms: newPaymentTerms,
      validityDays: Number(newValidityDays) || 14,
      notes: newNotes,
      preparedBy: user?.name || 'Sales Director',
      initialStatus,
    });

    if (res.success && res.quotation) {
      const updated = [res.quotation, ...quotations];
      setQuotations(updated);
      saveTenantQuotations(updated, tenant?.id);
      setIsCreateModalOpen(false);
      setInspectQuotation(res.quotation);
      toast.success(
        'Quotation Created',
        `Proposal #${res.quotation.quotationNumber} ($${res.quotation.totalAmount.toLocaleString()}) saved as ${initialStatus}.`
      );
    } else {
      toast.error('Creation Failed', res.error || 'Could not compile quotation.');
    }
  };

  // One-click Approve Quotation (triggers Booking CONFIRMED!)
  const handleApproveQuotation = (q: QuotationRecord) => {
    const res = approveQuotation(q.id, user?.name || 'Authorized Client');
    if (res.success && res.quotation) {
      const updated = quotations.map((qItem) => qItem.id === res.quotation!.id ? res.quotation! : qItem);
      setQuotations(updated);
      saveTenantQuotations(updated, tenant?.id);
      setInspectQuotation(res.quotation);
      toast.success(
        'Quotation Approved & Booking Confirmed!',
        `Quotation #${res.quotation.quotationNumber} approved. Associated booking is now CONFIRMED.`
      );
    } else {
      toast.error('Approval Error', res.error || 'Failed to approve quotation.');
    }
  };

  // Create Revision
  const handleCreateRevision = (q: QuotationRecord) => {
    const res = createQuotationRevision(q.id, user?.name || 'Sales Executive');
    if (res.success && res.quotation) {
      const updated = [res.quotation, ...quotations];
      setQuotations(updated);
      saveTenantQuotations(updated, tenant?.id);
      setInspectQuotation(res.quotation);
      toast.success(
        'Revision Generated',
        `New draft revision #${res.quotation.quotationNumber} created from ${q.quotationNumber}.`
      );
    } else {
      toast.error('Revision Error', res.error || 'Failed to generate revision.');
    }
  };

  // Submit Feedback / Rejection
  const handleSubmitFeedback = (status: QuotationStatus) => {
    if (!clientFeedbackModalTarget) return;
    const res = updateQuotationStatus(clientFeedbackModalTarget.id, status, {
      feedback: feedbackNotes,
    });

    if (res.success && res.quotation) {
      setClientFeedbackModalTarget(null);
      setFeedbackNotes('');
      if (inspectQuotation?.id === res.quotation.id) {
        setInspectQuotation(res.quotation);
      }
      toast.info('Status Updated', `Quotation status updated to ${status}.`);
    }
  };

  // Trigger Print View
  const handlePrint = (q: QuotationRecord) => {
    setPrintableQuotation(q);
    setTimeout(() => {
      window.print();
    }, 400);
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* ======================================================== */}
        {/* 1. HEADER & KPI CARDS */}
        {/* ======================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Commercial Proposals
              </span>
              <span className="text-xs text-gray-500 font-medium">
                Workflow: Request &rarr; Quote &rarr; Client Review &rarr; Approval &rarr; Booking Confirmed
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Quotations &amp; Commercial Proposals
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Multi-site OOH proposals with line-item rentals, vinyl production, rigging, custom discount tiers, taxes, and printable PDF export.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Quotation</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 bg-white border-gray-100 shadow-sm rounded-xl">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
              Active Pipeline Value
            </span>
            <div className="text-2xl font-black text-indigo-600 mt-0.5">
              ${(metrics.pipelineValue / 1000).toFixed(0)}k
            </div>
            <span className="text-[11px] text-gray-500 font-medium block mt-0.5">
              {metrics.pendingClientReviewCount} proposals under review
            </span>
          </Card>

          <Card className="p-4 bg-white border-gray-100 shadow-sm rounded-xl">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
              Won / Approved Quotes
            </span>
            <div className="text-2xl font-black text-emerald-700 mt-0.5">
              ${(metrics.approvedValue / 1000).toFixed(0)}k
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
              {metrics.approvedCount} confirmed bookings
            </span>
          </Card>

          <Card className="p-4 bg-white border-gray-100 shadow-sm rounded-xl">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
              Quote Win Rate
            </span>
            <div className="text-2xl font-black text-gray-900 mt-0.5">
              {metrics.winRate}%
            </div>
            <span className="text-[11px] text-gray-500 font-medium block mt-0.5">
              Client acceptance ratio
            </span>
          </Card>

          <Card className="p-4 bg-white border-gray-100 shadow-sm rounded-xl">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
              Draft / Expired
            </span>
            <div className="text-2xl font-black text-gray-900 mt-0.5">
              {metrics.draftCount} Drafts • {metrics.expiredCount} Expired
            </div>
            <span className="text-[11px] text-gray-500 font-medium block mt-0.5">
              {metrics.total} total system proposals
            </span>
          </Card>
        </div>

        {/* ======================================================== */}
        {/* 2. FILTER & SEARCH RIBBON */}
        {/* ======================================================== */}
        <Card className="p-3 bg-white border-gray-100 shadow-sm rounded-xl">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search quotes by number (QUO-2026-001), client name, or billboard code..."
                className="w-full pl-9 pr-8 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdowns */}
            <div className="flex items-center gap-2">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-xs font-semibold text-gray-800 focus:bg-white focus:outline-hidden"
              >
                <option value="ALL">All Statuses ({quotations.length})</option>
                <option value="DRAFT">Draft</option>
                <option value="SENT">Issued / Sent</option>
                <option value="CLIENT_REVIEW">Under Client Review</option>
                <option value="APPROVED">Approved &amp; Confirmed</option>
                <option value="REJECTED">Declined</option>
                <option value="EXPIRED">Expired</option>
              </select>

              {/* Client Filter */}
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-xs font-semibold text-gray-800 focus:bg-white focus:outline-hidden"
              >
                <option value="ALL">All Clients ({availableClients.length})</option>
                {availableClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* ======================================================== */}
        {/* 3. QUOTATIONS DATA TABLE */}
        {/* ======================================================== */}
        <Card className="border-gray-100 shadow-sm bg-white rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Quote Reference</th>
                  <th className="py-3.5 px-4 font-semibold">Client &amp; Contact</th>
                  <th className="py-3.5 px-4 font-semibold">Campaign &amp; Billboard Sites</th>
                  <th className="py-3.5 px-3 font-semibold">Validity / Expiry</th>
                  <th className="py-3.5 px-4 font-semibold">Financial Breakdown</th>
                  <th className="py-3.5 px-3 font-semibold">Status</th>
                  <th className="py-3.5 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quotations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center">
                      <FileSpreadsheet className="mx-auto h-10 w-10 text-indigo-400 mb-2" />
                      <h4 className="text-sm font-semibold text-gray-900">No Proposals Generated in this Workspace</h4>
                      <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                        Your clean workspace starts fresh with zero sales quotations. Compile and send your first media proposal.
                      </p>
                      <button
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 shadow-sm transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Generate First Proposal</span>
                      </button>
                    </td>
                  </tr>
                ) : filteredQuotations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400 text-xs">
                      No quotations match your active filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredQuotations.map((q) => {
                    const statusCfg = STATUS_CONFIG[q.status];
                    const StatusIcon = statusCfg.icon;

                    return (
                      <tr key={q.id} className="hover:bg-gray-50/70 transition-colors">
                        {/* Quote Number & Version */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-indigo-600">
                              {q.quotationNumber}
                            </span>
                            {q.version > 1 && (
                              <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-[10px] font-bold text-indigo-700">
                                v{q.version}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            Issued: {q.issuedDate}
                          </div>
                          {q.bookingNumber && (
                            <Link
                              href="/bookings"
                              className="text-[10px] text-gray-500 hover:text-indigo-600 font-mono flex items-center gap-1 mt-0.5"
                            >
                              <span>{q.bookingNumber}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          )}
                        </td>

                        {/* Client & Contact */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-gray-900 text-xs">
                            {q.clientCompanyName}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {q.clientContactName}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {q.clientEmail}
                          </div>
                        </td>

                        {/* Campaign & Sites */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-gray-900 text-xs line-clamp-1">
                            {q.campaignName}
                          </div>
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {q.items.map((i) => (
                              <span
                                key={i.id}
                                className="px-2 py-0.5 rounded bg-gray-100 text-[10px] font-mono text-gray-700"
                              >
                                {i.billboardCode} ({i.billboardCity})
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Validity / Expiry */}
                        <td className="py-3.5 px-3 text-xs">
                          <div className="font-medium text-gray-900">
                            Valid until {q.expiryDate}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            {q.validityDays} days window
                          </div>
                        </td>

                        {/* Financial Breakdown */}
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-bold text-gray-900 text-sm">
                            ${q.totalAmount.toLocaleString()}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            Rental: ${q.rentalSubtotal.toLocaleString()}
                            {q.discountAmount > 0 && (
                              <span className="text-emerald-600 font-medium ml-1">
                                (-${q.discountAmount.toLocaleString()})
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            Prod/Rig: ${(q.productionSubtotal + q.installationSubtotal).toLocaleString()} • Tax: ${q.taxAmount.toLocaleString()}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3 text-xs">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-xs ${statusCfg.bg} ${statusCfg.text}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusCfg.label}
                          </span>
                          {q.approvedAt && (
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              Approved {q.approvedAt.split(' ')[0]}
                            </div>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Inspect */}
                            <button
                              onClick={() => setInspectQuotation(q)}
                              className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-all"
                            >
                              Inspect
                            </button>

                            {/* Print / PDF */}
                            <button
                              onClick={() => handlePrint(q)}
                              className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all"
                              title="Print / Save PDF"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Approve CTA if Pending Review */}
                            {q.status !== 'APPROVED' && q.status !== 'REJECTED' && (
                              <button
                                onClick={() => handleApproveQuotation(q)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-xs"
                                title="Approve quote and confirm booking"
                              >
                                Approve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ======================================================== */}
        {/* 4. MODAL: INSPECT QUOTATION DRAWER */}
        {/* ======================================================== */}
        {inspectQuotation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white border border-gray-100 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 relative">
              <button
                onClick={() => setInspectQuotation(null)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4 pr-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                      {inspectQuotation.quotationNumber}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-xs ${
                        STATUS_CONFIG[inspectQuotation.status].bg
                      } ${STATUS_CONFIG[inspectQuotation.status].text}`}
                    >
                      {STATUS_CONFIG[inspectQuotation.status].label}
                    </span>
                    <span className="text-xs text-gray-500">
                      Version {inspectQuotation.version}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {inspectQuotation.campaignName}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Prepared for: <span className="font-semibold text-gray-800">{inspectQuotation.clientCompanyName}</span> ({inspectQuotation.clientAccountNumber})
                  </p>
                </div>

                {/* Top Action CTAs */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePrint(inspectQuotation)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center gap-1.5 shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Print PDF</span>
                  </button>

                  {inspectQuotation.status !== 'APPROVED' ? (
                    <button
                      onClick={() => handleApproveQuotation(inspectQuotation)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve &amp; Confirm Booking</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCreateRevision(inspectQuotation)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center gap-1.5 shadow-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Create Revision</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
                {/* Left 2 Cols: Line items table & terms */}
                <div className="md:col-span-2 space-y-5">
                  {/* Line Items Table */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-2.5 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                      Scheduled Billboard Structures ({inspectQuotation.items.length})
                    </h3>
                    <div className="rounded-xl border border-gray-100 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b border-gray-100">
                          <tr>
                            <th className="py-2.5 px-3 font-semibold">Structure</th>
                            <th className="py-2.5 px-3 font-semibold">Flight Dates</th>
                            <th className="py-2.5 px-3 font-semibold">Specs</th>
                            <th className="py-2.5 px-3 font-semibold text-right">Line Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {inspectQuotation.items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/50">
                              <td className="py-2.5 px-3">
                                <span className="font-mono font-bold text-indigo-600 mr-1">
                                  {item.billboardCode}
                                </span>
                                <span className="font-semibold text-gray-900 block">
                                  {item.billboardName}
                                </span>
                                <span className="text-[11px] text-gray-400">
                                  {item.billboardCity} • {item.billboardCorridor}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-gray-700">
                                <div>{item.startDate} &rarr; {item.endDate}</div>
                                <div className="text-[11px] text-gray-400">
                                  {item.durationDays} days ({item.durationWeeks} wks)
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-gray-700">
                                <div>{item.dimensions}</div>
                                <div className="text-[11px] text-gray-400">
                                  {item.isDigital ? 'Digital High-LED' : 'Printed Vinyl'}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                                ${item.itemSubtotal.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Operational Notes */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-1.5">
                      Proposal Scope &amp; Notes
                    </h3>
                    <p className="text-xs text-gray-700 leading-relaxed bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                      {inspectQuotation.notes || 'No custom notes provided.'}
                    </p>
                  </div>

                  {/* Commercial Terms */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-2">
                      Terms of Acceptance &amp; Payment Schedule
                    </h3>
                    <ul className="space-y-1.5 text-xs text-gray-600 bg-gray-50/70 p-3.5 rounded-xl border border-gray-100">
                      <li className="font-semibold text-gray-900 mb-1">
                        Payment: {inspectQuotation.paymentTerms}
                      </li>
                      {inspectQuotation.termsAndConditions.map((term, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{term}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Right 1 Col: Financial Audit & Client Card */}
                <div className="space-y-4">
                  {/* Financial Summary Card */}
                  <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-100 space-y-3">
                    <span className="text-xs font-semibold uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      Financial Summary
                    </span>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Billboard Space Rental:</span>
                        <span className="font-semibold text-gray-900">
                          ${inspectQuotation.rentalSubtotal.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Vinyl Printing / Production:</span>
                        <span className="font-semibold text-gray-900">
                          ${inspectQuotation.productionSubtotal.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Field Rigging &amp; Install:</span>
                        <span className="font-semibold text-gray-900">
                          ${inspectQuotation.installationSubtotal.toLocaleString()}
                        </span>
                      </div>
                      {inspectQuotation.artworkSubtotal > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Creative Graphic Design:</span>
                          <span className="font-semibold text-gray-900">
                            ${inspectQuotation.artworkSubtotal.toLocaleString()}
                          </span>
                        </div>
                      )}

                      <div className="border-t border-gray-200/60 pt-2 flex justify-between items-center">
                        <span className="text-gray-500 font-medium">Gross Subtotal:</span>
                        <span className="font-bold text-gray-900">
                          ${inspectQuotation.grossAmount.toLocaleString()}
                        </span>
                      </div>

                      {inspectQuotation.discountAmount > 0 && (
                        <div className="flex justify-between items-center text-emerald-700">
                          <span>
                            Discount ({inspectQuotation.discountReason || 'Contract Incentive'}):
                          </span>
                          <span className="font-bold">
                            -${inspectQuotation.discountAmount.toLocaleString()}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-gray-500">
                        <span>Sales / Local Ad Tax ({(inspectQuotation.taxRate * 100).toFixed(2)}%):</span>
                        <span className="font-semibold text-gray-900">
                          ${inspectQuotation.taxAmount.toLocaleString()}
                        </span>
                      </div>

                      <div className="border-t border-gray-200/60 pt-2 flex justify-between items-center">
                        <span className="text-gray-900 font-bold text-sm">Total Proposal Value:</span>
                        <span className="text-lg font-black text-gray-900">
                          ${inspectQuotation.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Client Account Info */}
                  <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-100 space-y-2 text-xs">
                    <span className="text-xs font-semibold uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-indigo-600" />
                      Client Signatory Profile
                    </span>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Company Name:</span>
                      <span className="font-semibold text-gray-900">{inspectQuotation.clientCompanyName}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Primary Contact:</span>
                      <span className="font-medium text-gray-900">
                        {inspectQuotation.clientContactName} ({inspectQuotation.clientEmail})
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Billing Address:</span>
                      <span className="text-gray-700">
                        {inspectQuotation.billingAddress}, {inspectQuotation.city}, {inspectQuotation.state} {inspectQuotation.zipCode}
                      </span>
                    </div>
                  </div>

                  {/* Approval Status Card */}
                  {inspectQuotation.status === 'APPROVED' && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-xs space-y-1.5">
                      <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Client Signature Confirmed</span>
                      </div>
                      <div className="text-emerald-700">
                        Approved by: <span className="font-semibold">{inspectQuotation.approvedBy}</span>
                      </div>
                      <div className="text-emerald-600 text-[11px]">
                        Timestamp: {inspectQuotation.approvedAt}
                      </div>
                      {inspectQuotation.bookingNumber && (
                        <div className="pt-2 border-t border-emerald-200/60 text-emerald-800 font-medium">
                          Active Booking: <span className="font-mono font-bold">{inspectQuotation.bookingNumber}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action buttons for review/rejection */}
                  {inspectQuotation.status === 'CLIENT_REVIEW' && (
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => {
                          setClientFeedbackModalTarget(inspectQuotation);
                        }}
                        className="flex-1 py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition-all"
                      >
                        Decline / Feedback
                      </button>
                      <button
                        onClick={() => handleApproveQuotation(inspectQuotation)}
                        className="flex-1 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold transition-all shadow-xs"
                      >
                        Client Approve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 5. MODAL: CREATE NEW QUOTATION (INTERACTIVE BUILDER) */}
        {/* ======================================================== */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white border border-gray-100 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 relative">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="border-b border-gray-100 pb-3 mb-5 pr-8">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">
                  Proposal Generation Engine
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-1">
                  Draft New Billboard Commercial Quotation
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Combine multi-site inventory, print and installation line items, and dynamic discount structures.
                </p>
              </div>

              <div className="space-y-5 text-xs">
                {/* Section 1: Client & Campaign */}
                <div className="space-y-3">
                  <h3 className="font-semibold uppercase text-indigo-600 tracking-wider flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5" />
                    Client &amp; Campaign Overview
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-gray-700 block mb-1">Select Client Account *</label>
                      <select
                        value={newQuoteClientId}
                        onChange={(e) => {
                          setNewQuoteClientId(e.target.value);
                          const cl = availableClients.find((c) => c.id === e.target.value);
                          if (cl) {
                            setNewCampaignName(`${cl.companyName} OOH Flight 2026`);
                            setNewBrandName(cl.dbaName || cl.companyName);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:outline-hidden"
                      >
                        {availableClients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.companyName} ({c.accountNumber})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-medium text-gray-700 block mb-1">Campaign Title *</label>
                      <input
                        type="text"
                        value={newCampaignName}
                        onChange={(e) => setNewCampaignName(e.target.value)}
                        placeholder="e.g. Q4 Brand Expansion"
                        className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Scheduled Billboard Items */}
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold uppercase text-indigo-600 tracking-wider flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Billboard Structures ({formItems.length})
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddFormItem}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Site</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formItems.map((item, idx) => {
                      const billboard = availableBillboards.find((b) => b.id === item.billboardId);

                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-100 space-y-3 relative"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900 text-xs">
                              Structure Line #{idx + 1}
                            </span>
                            {formItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveFormItem(idx)}
                                className="text-gray-400 hover:text-rose-600 p-1"
                                title="Remove line item"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-1">
                              <label className="text-[11px] font-medium text-gray-500 block mb-1">
                                Billboard Asset
                              </label>
                              <select
                                value={item.billboardId}
                                onChange={(e) => {
                                  const updated = [...formItems];
                                  updated[idx].billboardId = e.target.value;
                                  setFormItems(updated);
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-900 focus:outline-hidden"
                              >
                                {availableBillboards.map((b) => (
                                  <option key={b.id} value={b.id}>
                                    {b.code} — {b.location.city} (${b.monthlyRate.toLocaleString()}/mo)
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[11px] font-medium text-gray-500 block mb-1">
                                Flight Start Date
                              </label>
                              <input
                                type="date"
                                value={item.startDate}
                                onChange={(e) => {
                                  const updated = [...formItems];
                                  updated[idx].startDate = e.target.value;
                                  setFormItems(updated);
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-900 focus:outline-hidden"
                              />
                            </div>

                            <div>
                              <label className="text-[11px] font-medium text-gray-500 block mb-1">
                                Flight End Date
                              </label>
                              <input
                                type="date"
                                value={item.endDate}
                                onChange={(e) => {
                                  const updated = [...formItems];
                                  updated[idx].endDate = e.target.value;
                                  setFormItems(updated);
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-900 focus:outline-hidden"
                              />
                            </div>
                          </div>

                          {/* Checkbox Options */}
                          <div className="flex flex-wrap items-center gap-4 text-[11px] pt-1 border-t border-gray-200/60">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.includeProduction}
                                onChange={(e) => {
                                  const updated = [...formItems];
                                  updated[idx].includeProduction = e.target.checked;
                                  setFormItems(updated);
                                }}
                                className="rounded border-gray-300 text-indigo-600"
                              />
                              <span>
                                Vinyl Printing (+${billboard?.productionCost.toLocaleString() || 0})
                              </span>
                            </label>

                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.includeInstallation}
                                onChange={(e) => {
                                  const updated = [...formItems];
                                  updated[idx].includeInstallation = e.target.checked;
                                  setFormItems(updated);
                                }}
                                className="rounded border-gray-300 text-indigo-600"
                              />
                              <span>
                                Rigging &amp; Install (+${billboard?.installationCost.toLocaleString() || 0})
                              </span>
                            </label>

                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.includeArtworkDesign}
                                onChange={(e) => {
                                  const updated = [...formItems];
                                  updated[idx].includeArtworkDesign = e.target.checked;
                                  setFormItems(updated);
                                }}
                                className="rounded border-gray-300 text-indigo-600"
                              />
                              <span>Graphic Design Studio (+\\$950)</span>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 3: Commercial Discounts & Terms */}
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <h3 className="font-semibold uppercase text-indigo-600 tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    Commercial Discount &amp; Terms
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-medium text-gray-700 block mb-1">Discount Type</label>
                      <select
                        value={newDiscountType}
                        onChange={(e) =>
                          setNewDiscountType(e.target.value as 'PERCENTAGE' | 'FIXED' | 'NONE')
                        }
                        className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-xs text-gray-900 focus:outline-hidden"
                      >
                        <option value="NONE">No Discount</option>
                        <option value="PERCENTAGE">Percentage (%)</option>
                        <option value="FIXED">Fixed Dollar Amount ($)</option>
                      </select>
                    </div>

                    {newDiscountType !== 'NONE' && (
                      <>
                        <div>
                          <label className="font-medium text-gray-700 block mb-1">
                            Discount Value ({newDiscountType === 'PERCENTAGE' ? '%' : '$'})
                          </label>
                          <input
                            type="number"
                            value={newDiscountValue}
                            onChange={(e) => setNewDiscountValue(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-xs text-gray-900 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="font-medium text-gray-700 block mb-1">Discount Reason</label>
                          <input
                            type="text"
                            value={newDiscountReason}
                            onChange={(e) => setNewDiscountReason(e.target.value)}
                            placeholder="e.g. Multi-site volume package"
                            className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-xs text-gray-900 focus:outline-hidden"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-medium text-gray-700 block mb-1">Tax Rate (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newTaxRate}
                        onChange={(e) => setNewTaxRate(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-xs text-gray-900 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-gray-700 block mb-1">Quote Validity (Days)</label>
                      <input
                        type="number"
                        value={newValidityDays}
                        onChange={(e) => setNewValidityDays(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-xs text-gray-900 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-gray-700 block mb-1">Payment Schedule</label>
                      <input
                        type="text"
                        value={newPaymentTerms}
                        onChange={(e) => setNewPaymentTerms(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-xs text-gray-900 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Real-Time Financial Total Banner */}
                <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/80 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Gross Total:</span>
                    <span className="font-bold text-gray-900">${formGrossTotal.toLocaleString()}</span>
                  </div>
                  {formDiscountAmount > 0 && (
                    <div className="flex justify-between items-center text-emerald-700 text-xs">
                      <span>Discount ({newDiscountReason || 'Special'}):</span>
                      <span className="font-bold">-${formDiscountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Tax ({newTaxRate}%):</span>
                    <span className="font-semibold text-gray-900">${formTaxAmount.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-200/60 pt-2 flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-900">Total Quotation Value:</span>
                    <span className="text-xl font-black text-gray-900">${formFinalTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreateSubmit('DRAFT')}
                    className="px-4 py-2 rounded-lg text-xs font-semibold border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-all shadow-xs"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreateSubmit('SENT')}
                    className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <span>Generate &amp; Issue to Client</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 6. MODAL: DECLINE / FEEDBACK DIALOG */}
        {/* ======================================================== */}
        {clientFeedbackModalTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white border border-gray-100 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">
                  Record Client Feedback / Decline
                </h3>
                <p className="text-xs text-gray-500 font-mono">
                  {clientFeedbackModalTarget.quotationNumber} — {clientFeedbackModalTarget.clientCompanyName}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Reason / Client Feedback Notes
                </label>
                <textarea
                  rows={3}
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="e.g. Requested additional 5% discount or alternate corridor dates..."
                  className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-xs text-gray-900 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setClientFeedbackModalTarget(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmitFeedback('REJECTED')}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-xs"
                >
                  Mark Declined
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 7. PRINTABLE / EXPORTABLE BRANDED PDF VIEW */}
        {/* ======================================================== */}
        {printableQuotation && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/80 backdrop-blur-xs p-4 sm:p-8 flex justify-center print:p-0 print:bg-white print:static">
            <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl p-8 sm:p-12 text-gray-900 relative print:shadow-none print:p-0 print:max-w-none">
              {/* Close Button (Hidden on Print) */}
              <button
                onClick={() => setPrintableQuotation(null)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 print:hidden"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Action Toolbar (Hidden on Print) */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-8 print:hidden">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700">
                    PDF Document Preview
                  </span>
                  <span className="text-xs text-gray-500">
                    Click &apos;Print / Save PDF&apos; to export clean client proposal
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-xs flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / Save PDF</span>
                  </button>
                </div>
              </div>

              {/* Official Proposal Document Canvas */}
              <div className="space-y-8">
                {/* Letterhead Header */}
                <div className="flex items-start justify-between border-b-2 border-indigo-600 pb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-base">
                        A
                      </div>
                      <span className="text-xl font-black tracking-tight text-gray-900">
                        Adversoft<span className="text-indigo-600">.</span>
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Adversoft Outdoor Advertising Management System
                    </p>
                    <p className="text-[11px] text-gray-400">
                      450 Lexington Avenue, Suite 2400, New York, NY 10017 • +1 (800) 555-OOH-ADS
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block">
                      Commercial Proposal
                    </span>
                    <h2 className="text-2xl font-black text-gray-900 font-mono mt-0.5">
                      {printableQuotation.quotationNumber}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Date Issued: <strong className="text-gray-900">{printableQuotation.issuedDate}</strong>
                    </p>
                    <p className="text-xs text-rose-600 font-semibold">
                      Valid Until: {printableQuotation.expiryDate}
                    </p>
                  </div>
                </div>

                {/* Prepared For / Prepared By Cards */}
                <div className="grid grid-cols-2 gap-6 text-xs">
                  <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-100">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                      Prepared For (Advertiser)
                    </span>
                    <div className="font-bold text-gray-900 text-sm">{printableQuotation.clientCompanyName}</div>
                    <div className="text-gray-600">{printableQuotation.clientContactName}</div>
                    <div className="text-gray-500">{printableQuotation.clientEmail} • {printableQuotation.clientPhone}</div>
                    <div className="text-gray-400 mt-1">
                      {printableQuotation.billingAddress}, {printableQuotation.city}, {printableQuotation.state} {printableQuotation.zipCode}
                    </div>
                    {printableQuotation.taxId && (
                      <div className="text-[11px] text-gray-400 mt-1 font-mono">Tax ID: {printableQuotation.taxId}</div>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-100">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                      Campaign Specifications
                    </span>
                    <div className="font-bold text-gray-900 text-sm">{printableQuotation.campaignName}</div>
                    <div className="text-gray-600">Brand: {printableQuotation.brandName}</div>
                    <div className="text-gray-500 mt-1">
                      Account Manager: <strong className="text-gray-900">{printableQuotation.preparedBy}</strong>
                    </div>
                    <div className="text-gray-500">
                      Payment Schedule: <strong className="text-gray-900">{printableQuotation.paymentTerms}</strong>
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Schedule of Outdoor Billboard Structures
                  </h3>
                  <table className="w-full text-left text-xs border border-gray-100 rounded-xl overflow-hidden">
                    <thead className="bg-gray-100 text-gray-600 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Site Code</th>
                        <th className="py-2.5 px-3">Billboard Name &amp; Corridor</th>
                        <th className="py-2.5 px-3">Flight Period</th>
                        <th className="py-2.5 px-3">Dimensions</th>
                        <th className="py-2.5 px-3 text-right">Rental Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {printableQuotation.items.map((i) => (
                        <tr key={i.id}>
                          <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">{i.billboardCode}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-gray-900 block">{i.billboardName}</span>
                            <span className="text-gray-500 text-[11px]">{i.billboardCorridor}, {i.billboardCity}</span>
                          </td>
                          <td className="py-2.5 px-3 text-gray-700">
                            {i.startDate} to {i.endDate} ({i.durationDays}d)
                          </td>
                          <td className="py-2.5 px-3 text-gray-700">{i.dimensions}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                            ${i.rentalAmount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary Block */}
                <div className="flex justify-end text-xs">
                  <div className="w-72 space-y-1.5 p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Gross Space Rental:</span>
                      <span className="font-bold text-gray-900">${printableQuotation.rentalSubtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Production &amp; Printing:</span>
                      <span className="font-bold text-gray-900">${printableQuotation.productionSubtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Rigging &amp; Installation:</span>
                      <span className="font-bold text-gray-900">${printableQuotation.installationSubtotal.toLocaleString()}</span>
                    </div>
                    {printableQuotation.artworkSubtotal > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Artwork &amp; Design:</span>
                        <span className="font-bold text-gray-900">${printableQuotation.artworkSubtotal.toLocaleString()}</span>
                      </div>
                    )}
                    {printableQuotation.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold border-t border-gray-200/60 pt-1">
                        <span>Discount ({printableQuotation.discountReason || 'Incentive'}):</span>
                        <span>-${printableQuotation.discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-500 border-t border-gray-200/60 pt-1">
                      <span>Sales Tax ({(printableQuotation.taxRate * 100).toFixed(2)}%):</span>
                      <span className="font-bold text-gray-900">${printableQuotation.taxAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-base font-black text-gray-900 border-t-2 border-indigo-600 pt-2">
                      <span>Total Amount:</span>
                      <span>${printableQuotation.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="text-[11px] text-gray-500 space-y-1 border-t border-gray-100 pt-4">
                  <h4 className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                    Terms &amp; Acceptance Conditions
                  </h4>
                  <p>
                    1. Space is conditionally reserved upon receipt of signed quotation or official agency PO.
                  </p>
                  <p>
                    2. Payment Terms: {printableQuotation.paymentTerms}.
                  </p>
                  <p>
                    3. Proof-of-posting certified timestamp photos delivered within 48 hours of flight illumination.
                  </p>
                </div>

                {/* Signature Acceptance Block */}
                <div className="pt-6 border-t border-gray-200 grid grid-cols-2 gap-8 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-8">
                      Authorized Client Signatory Acceptance
                    </span>
                    <div className="border-b border-gray-400 pb-1 flex justify-between">
                      <span className="text-gray-400">Signature:</span>
                      <span className="font-mono text-gray-600">{printableQuotation.approvedBy || ''}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-400 pt-1">
                      <span>Printed Name: {printableQuotation.clientContactName}</span>
                      <span>Date: {printableQuotation.approvedAt || '____ / ____ / 2026'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-8">
                      Adversoft Outdoor Advertising LLC
                    </span>
                    <div className="border-b border-gray-400 pb-1 flex justify-between">
                      <span className="text-gray-400">Signature:</span>
                      <span className="font-mono text-indigo-700 font-bold">Marcus Brody</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-400 pt-1">
                      <span>Title: Senior Vice President of OOH Media</span>
                      <span>Date: {printableQuotation.issuedDate}</span>
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
