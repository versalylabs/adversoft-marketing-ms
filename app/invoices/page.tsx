"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/protectedRoute';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import {
  InvoiceRecord,
  InvoiceStatus,
  AgingCategory,
  PaymentMethod,
  InvoiceLineItem,
  getStoredInvoices,
  saveStoredInvoices,
  getStoredPayments,
  createInvoice,
  recordPayment,
  getFinancialMetrics,
} from '@/lib/data/invoices-store';
import { INITIAL_CLIENTS } from '@/lib/data/crm-store';
import { getStoredCampaigns } from '@/lib/data/campaigns-store';
import { getStoredContracts } from '@/lib/data/contracts-store';
import {
  getTenantInvoices,
  saveTenantInvoices,
  getTenantClients,
  getTenantCampaigns,
  getTenantContracts,
} from '@/lib/tenant-store';
import {
  DollarSign,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  FileText,
  CreditCard,
  Building,
  ArrowRight,
  Printer,
  Eye,
  RefreshCw,
  Sparkles,
  ChevronRight,
  X,
  Send,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Percent,
  Check,
  Briefcase,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; bg: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
  DRAFT: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock },
  ISSUED: { label: 'Issued / Pending', bg: 'bg-blue-50', text: 'text-blue-700', icon: Clock },
  PARTIALLY_PAID: { label: 'Partially Paid', bg: 'bg-amber-50', text: 'text-amber-700', icon: AlertTriangle },
  PAID: { label: 'Fully Paid', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 },
  OVERDUE: { label: 'Past Due / Overdue', bg: 'bg-rose-50', text: 'text-rose-700', icon: AlertTriangle },
  VOID: { label: 'Void / Canceled', bg: 'bg-gray-100', text: 'text-gray-500', icon: X },
};

const AGING_CONFIG: Record<
  AgingCategory,
  { label: string; badge: string }
> = {
  CURRENT: { label: 'Current (On Time)', badge: 'bg-emerald-50 text-emerald-700' },
  OVERDUE_1_30: { label: '1 - 30 Days Past Due', badge: 'bg-amber-50 text-amber-700 font-medium' },
  OVERDUE_31_60: { label: '31 - 60 Days Past Due', badge: 'bg-orange-50 text-orange-700 font-semibold' },
  OVERDUE_61_90: { label: '61 - 90 Days Past Due', badge: 'bg-rose-50 text-rose-700 font-semibold' },
  OVERDUE_90_PLUS: { label: '90+ Days Critical Overdue', badge: 'bg-rose-100 text-rose-800 font-bold' },
};

export default function InvoicesPage() {
  const { user, tenant } = useAuth();
  const { toast } = useToast();

  const [invoices, setInvoices] = useState<InvoiceRecord[]>(() => getTenantInvoices(tenant?.id));
  const [clients, setClients] = useState(() => getTenantClients(tenant?.id));
  const [campaigns, setCampaigns] = useState(() => getTenantCampaigns(tenant?.id));
  const [contracts, setContracts] = useState(() => getTenantContracts(tenant?.id));
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [invoiceToPay, setInvoiceToPay] = useState<InvoiceRecord | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [invoiceToPrint, setInvoiceToPrint] = useState<InvoiceRecord | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'ALL'>('ALL');
  const [agingFilter, setAgingFilter] = useState<AgingCategory | 'ALL'>('ALL');
  const [clientFilter, setClientFilter] = useState<string>('ALL');

  const loadData = () => {
    setInvoices(getTenantInvoices(tenant?.id));
    setClients(getTenantClients(tenant?.id));
    setCampaigns(getTenantCampaigns(tenant?.id));
    setContracts(getTenantContracts(tenant?.id));
  };

  // Load initial data and listen for updates
  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('adversoft_invoices_updated', handleUpdate);
    window.addEventListener('adversoft_crm_clients_updated', handleUpdate);
    window.addEventListener('adversoft_campaigns_updated', handleUpdate);
    window.addEventListener('adversoft_contracts_updated', handleUpdate);
    window.addEventListener('adversoft_tenant_changed', handleUpdate);
    return () => {
      window.removeEventListener('adversoft_invoices_updated', handleUpdate);
      window.removeEventListener('adversoft_crm_clients_updated', handleUpdate);
      window.removeEventListener('adversoft_campaigns_updated', handleUpdate);
      window.removeEventListener('adversoft_contracts_updated', handleUpdate);
      window.removeEventListener('adversoft_tenant_changed', handleUpdate);
    };
  }, [tenant]);

  const metrics = useMemo(() => getFinancialMetrics(), [invoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;
      if (agingFilter !== 'ALL' && inv.agingCategory !== agingFilter) return false;
      if (clientFilter !== 'ALL' && inv.clientId !== clientFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesNum = inv.invoiceNumber.toLowerCase().includes(q);
        const matchesClient = inv.clientCompanyName.toLowerCase().includes(q);
        const matchesCamp = inv.campaignName ? inv.campaignName.toLowerCase().includes(q) : false;
        const matchesCont = inv.contractNumber ? inv.contractNumber.toLowerCase().includes(q) : false;
        if (!matchesNum && !matchesClient && !matchesCamp && !matchesCont) return false;
      }
      return true;
    });
  }, [invoices, statusFilter, agingFilter, clientFilter, searchQuery]);

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('WIRE_TRANSFER');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  const handleOpenRecordPayment = (inv: InvoiceRecord) => {
    setInvoiceToPay(inv);
    setPaymentAmount(inv.balanceDue);
    setPaymentRef(`WIRE-${Math.floor(100000 + Math.random() * 900000)}`);
    setPaymentNotes('');
    setIsRecordPaymentOpen(true);
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceToPay) return;

    if (paymentAmount <= 0) {
      toast({
        title: 'Invalid Payment Amount',
        description: 'Payment amount must be greater than $0.',
        type: 'destructive',
      });
      return;
    }

    if (paymentAmount > invoiceToPay.balanceDue) {
      toast({
        title: 'Amount Exceeds Balance',
        description: `Payment amount cannot exceed balance due ($${invoiceToPay.balanceDue.toLocaleString()}).`,
        type: 'warning',
      });
      return;
    }

    const res = recordPayment({
      invoiceId: invoiceToPay.id,
      amount: paymentAmount,
      paymentMethod,
      referenceNumber: paymentRef || `TXN-${Date.now().toString().slice(-6)}`,
      notes: paymentNotes,
      receivedBy: user ? `${user.name} (${user.role})` : 'Marcus Brody (Finance)',
    });

    if (res.success && res.invoice) {
      toast({
        title: 'Payment Recorded Successfully',
        description: `Allocated $${paymentAmount.toLocaleString()} to ${res.invoice.invoiceNumber}. Receipt ${res.payment?.receiptNumber} issued.`,
        type: 'success',
      });
      loadData();
      if (selectedInvoice && selectedInvoice.id === res.invoice.id) {
        setSelectedInvoice(res.invoice);
      }
      setIsRecordPaymentOpen(false);
      setInvoiceToPay(null);
    } else {
      toast({
        title: 'Payment Failed',
        description: res.error || 'Failed to record payment.',
        type: 'destructive',
      });
    }
  };

  // Dunning Reminder Trigger
  const handleSendReminder = (inv: InvoiceRecord) => {
    toast({
      title: 'Dunning Reminder Dispatched',
      description: `Formal payment statement & aging notice sent to ${inv.clientCompanyName} (${inv.clientEmail}).`,
      type: 'info',
    });
  };

  // Open Branded PDF Preview
  const handleOpenPrintModal = (inv: InvoiceRecord) => {
    setInvoiceToPrint(inv);
    setIsPrintModalOpen(true);
  };

  return (
    <ProtectedRoute requiredPermission="invoices:read">
      <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                Financial Operations
              </span>
              <span className="text-xs text-gray-500">• GAAP Billing & Aging Ledger</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              <Receipt className="w-8 h-8 text-emerald-600" />
              Invoicing & Billing Engine
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Automated itemized billboard billing, tax computations, multi-channel payment allocation, and aging schedules.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/payments"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 shadow-sm transition-colors"
            >
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Payments Ledger
            </Link>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Generate Invoice
            </button>
          </div>
        </div>

        {/* Financial KPI Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Billed</span>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-gray-900">${metrics.totalBilled.toLocaleString()}</span>
              <p className="text-xs text-gray-500 mt-1">Gross contract & flight charges</p>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Collected</span>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-emerald-600">${metrics.totalCollected.toLocaleString()}</span>
              <p className="text-xs text-gray-500 mt-1">Cleared wire, ACH, and card funds</p>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Outstanding AR</span>
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-gray-900">${metrics.totalOutstanding.toLocaleString()}</span>
              <p className="text-xs text-gray-500 mt-1">Total active accounts receivable</p>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Overdue Balances</span>
              <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-rose-600">${metrics.overdueAmount.toLocaleString()}</span>
              <p className="text-xs text-gray-500 mt-1">{metrics.overdueCount} accounts past due date</p>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Collection Rate</span>
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-indigo-600">{metrics.collectionEfficiencyPercent}%</span>
              <p className="text-xs text-gray-500 mt-1">Avg 21.4 days collection DSO</p>
            </div>
          </Card>
        </div>

        {/* Aging Schedule Quick Bar */}
        <Card className="p-4 bg-white border border-gray-100 shadow-sm rounded-xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Receivables Aging Schedule
              </h2>
              <p className="text-xs text-gray-500">
                Distribution of current vs delinquent invoice balances across billing aging tiers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setAgingFilter('CURRENT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  agingFilter === 'CURRENT'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                Current: ${metrics.agingBuckets.current.toLocaleString()}
              </button>
              <button
                onClick={() => setAgingFilter('OVERDUE_1_30')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  agingFilter === 'OVERDUE_1_30'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                1-30d: ${metrics.agingBuckets.days1_30.toLocaleString()}
              </button>
              <button
                onClick={() => setAgingFilter('OVERDUE_31_60')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  agingFilter === 'OVERDUE_31_60'
                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                31-60d: ${metrics.agingBuckets.days31_60.toLocaleString()}
              </button>
              <button
                onClick={() => setAgingFilter('OVERDUE_61_90')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  agingFilter === 'OVERDUE_61_90'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                61-90d: ${metrics.agingBuckets.days61_90.toLocaleString()}
              </button>
              <button
                onClick={() => setAgingFilter('OVERDUE_90_PLUS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  agingFilter === 'OVERDUE_90_PLUS'
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                90d+: ${metrics.agingBuckets.days90Plus.toLocaleString()}
              </button>
              {agingFilter !== 'ALL' && (
                <button
                  onClick={() => setAgingFilter('ALL')}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  Clear Aging Filter
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* Filter Ribbon & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoice #, client, campaign, or contract..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'ALL')}
              className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ISSUED">Issued / Pending</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Fully Paid</option>
              <option value="OVERDUE">Past Due / Overdue</option>
              <option value="DRAFT">Draft</option>
            </select>

            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="ALL">All Clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>
              Showing <strong className="text-gray-900">{filteredInvoices.length}</strong> of{' '}
              <strong className="text-gray-900">{invoices.length}</strong> invoices
            </span>
            <button
              onClick={loadData}
              title="Refresh ledger"
              className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-white border border-gray-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Master Invoices Data Table */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice & Client</th>
                  <th className="py-3 px-4">Campaign / Contract</th>
                  <th className="py-3 px-4">Issue & Due Dates</th>
                  <th className="py-3 px-4">Subtotal & Tax</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Paid & Balance Due</th>
                  <th className="py-3 px-4">Aging & Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center">
                      <Receipt className="mx-auto h-10 w-10 text-emerald-500 mb-2" />
                      <h4 className="text-sm font-semibold text-gray-900">No Invoices Issued in this Workspace</h4>
                      <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                        Your clean workspace starts fresh with zero invoices. Generate your first billing statement for media flight or production services.
                      </p>
                      <button
                        onClick={() => setIsCreateOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 shadow-sm transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Generate First Invoice</span>
                      </button>
                    </td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Receipt className="w-10 h-10 text-gray-300 mb-3" />
                        <p className="text-gray-600 font-medium">No invoices match your search criteria</p>
                        <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or generate a new invoice.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const statusMeta = STATUS_CONFIG[inv.status];
                    const agingMeta = AGING_CONFIG[inv.agingCategory];
                    const StatusIcon = statusMeta.icon;

                    return (
                      <tr
                        key={inv.id}
                        className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
                        onClick={() => setSelectedInvoice(inv)}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-gray-900 flex items-center gap-2">
                            <span>{inv.invoiceNumber}</span>
                            <span className="text-[11px] font-normal text-gray-400">
                              ({inv.paymentTerms})
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 mt-0.5 font-medium flex items-center gap-1.5">
                            <Building2 className="w-3 h-3 text-gray-400" />
                            {inv.clientCompanyName}
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            Acct #{inv.clientAccountNumber}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {inv.campaignName ? (
                            <div>
                              <div className="text-xs font-semibold text-gray-900 line-clamp-1">
                                {inv.campaignName}
                              </div>
                              <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                                {inv.campaignNumber}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Direct Account Charge</span>
                          )}
                          {inv.contractNumber && (
                            <div className="text-[11px] text-emerald-600 font-mono mt-0.5 flex items-center gap-1">
                              <FileCheck2 className="w-3 h-3" />
                              {inv.contractNumber}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-xs text-gray-900 font-medium">
                            Issued: {inv.issueDate}
                          </div>
                          <div
                            className={`text-xs mt-0.5 ${
                              inv.daysOverdue > 0 ? 'text-rose-600 font-semibold' : 'text-gray-500'
                            }`}
                          >
                            Due: {inv.dueDate}
                          </div>
                          {inv.daysOverdue > 0 && (
                            <div className="text-[10px] text-rose-500 font-semibold">
                              {inv.daysOverdue} days overdue
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-xs text-gray-700">
                            Subtotal: ${inv.subtotal.toLocaleString()}
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            Tax ({inv.taxRatePercent}%): ${inv.taxAmount.toLocaleString()}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900">
                            ${inv.totalAmount.toLocaleString()}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            {inv.lineItems.length} line items
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-xs text-emerald-700 font-medium">
                            Paid: ${inv.amountPaid.toLocaleString()}
                          </div>
                          <div
                            className={`text-xs font-bold mt-0.5 ${
                              inv.balanceDue > 0 ? 'text-gray-900' : 'text-emerald-600'
                            }`}
                          >
                            Due: ${inv.balanceDue.toLocaleString()}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusMeta.bg} ${statusMeta.text}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusMeta.label}
                            </span>
                            {inv.balanceDue > 0 && (
                              <div>
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] ${agingMeta.badge}`}
                                >
                                  {agingMeta.label}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              title="Inspect Details"
                              className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenPrintModal(inv)}
                              title="Print Branded PDF Invoice"
                              className="p-1.5 rounded-md text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            {inv.balanceDue > 0 && (
                              <>
                                <button
                                  onClick={() => handleOpenRecordPayment(inv)}
                                  title="Record Payment"
                                  className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                                >
                                  Pay
                                </button>
                                {inv.daysOverdue > 0 && (
                                  <button
                                    onClick={() => handleSendReminder(inv)}
                                    title="Dispatched Dunning Notice"
                                    className="p-1.5 rounded-md text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </>
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

        {/* Invoice Inspection Drawer */}
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 overflow-hidden bg-black/30 backdrop-blur-xs flex justify-end">
            <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-gray-900">{selectedInvoice.invoiceNumber}</h2>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_CONFIG[selectedInvoice.status].bg
                        } ${STATUS_CONFIG[selectedInvoice.status].text}`}
                      >
                        {STATUS_CONFIG[selectedInvoice.status].label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Issued on {selectedInvoice.issueDate} • Payment Terms: {selectedInvoice.paymentTerms}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenPrintModal(selectedInvoice)}
                    className="p-2 rounded-lg text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                    title="Print PDF Invoice"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Client & Billing Info */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50/75 border border-gray-100 text-xs">
                  <div>
                    <span className="font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                      Billed To Client
                    </span>
                    <p className="font-bold text-gray-900 text-sm">{selectedInvoice.clientCompanyName}</p>
                    <p className="text-gray-600 mt-0.5">Acct: {selectedInvoice.clientAccountNumber}</p>
                    <p className="text-gray-600">{selectedInvoice.clientBillingAddress}</p>
                    <p className="text-gray-600">
                      {selectedInvoice.clientCity}, {selectedInvoice.clientState} {selectedInvoice.clientZipCode}
                    </p>
                    {selectedInvoice.clientTaxId && (
                      <p className="text-gray-500 mt-1 font-mono">Tax ID: {selectedInvoice.clientTaxId}</p>
                    )}
                  </div>

                  <div>
                    <span className="font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                      Payment Schedule & Aging
                    </span>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Issue Date:</span>
                        <span className="font-medium text-gray-900">{selectedInvoice.issueDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Due Date:</span>
                        <span className="font-semibold text-gray-900">{selectedInvoice.dueDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Aging Tier:</span>
                        <span className="font-medium text-gray-700">
                          {AGING_CONFIG[selectedInvoice.agingCategory].label}
                        </span>
                      </div>
                      {selectedInvoice.daysOverdue > 0 && (
                        <div className="flex justify-between text-rose-600 font-semibold">
                          <span>Days Past Due:</span>
                          <span>{selectedInvoice.daysOverdue} days</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Campaign Link */}
                {selectedInvoice.campaignName && (
                  <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-blue-600 font-semibold uppercase tracking-wider block text-[10px]">
                        Associated Advertising Flight
                      </span>
                      <p className="font-bold text-gray-900 text-sm mt-0.5">{selectedInvoice.campaignName}</p>
                      <p className="text-gray-600">
                        Campaign #{selectedInvoice.campaignNumber} • Contract #{selectedInvoice.contractNumber}
                      </p>
                    </div>
                    <Link
                      href="/campaigns"
                      className="px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 font-medium transition-colors"
                    >
                      View Campaign
                    </Link>
                  </div>
                )}

                {/* Itemized Line Items */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Itemized Billing Charges
                  </h3>
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                        <tr>
                          <th className="py-2.5 px-3">Description</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedInvoice.lineItems.map((item) => (
                          <tr key={item.id}>
                            <td className="py-2.5 px-3 text-gray-900 font-medium">{item.description}</td>
                            <td className="py-2.5 px-3 text-gray-500 font-mono text-[11px]">{item.category}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                              ${item.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Financial Summary Box */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-900">${selectedInvoice.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Sales & Municipal Tax ({selectedInvoice.taxRatePercent}%)</span>
                    <span className="font-medium text-gray-900">${selectedInvoice.taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold text-gray-900">
                    <span>Total Invoice Amount</span>
                    <span>${selectedInvoice.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Total Payments Received</span>
                    <span>-${selectedInvoice.amountPaid.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between text-base font-extrabold text-gray-900">
                    <span>Remaining Balance Due</span>
                    <span className={selectedInvoice.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                      ${selectedInvoice.balanceDue.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Bank Remittance Instructions */}
                <div className="p-4 rounded-xl bg-gray-50/75 border border-gray-100 text-xs">
                  <h4 className="font-semibold text-gray-700 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-gray-400" />
                    Direct Bank Remittance Instructions
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-gray-600">
                    <div>
                      <span className="text-gray-400 block text-[10px]">Bank:</span>
                      <span className="font-medium text-gray-900">{selectedInvoice.bankRemittance.bankName}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Account Name:</span>
                      <span className="font-medium text-gray-900">{selectedInvoice.bankRemittance.accountName}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Account Number:</span>
                      <span className="font-mono text-gray-900">{selectedInvoice.bankRemittance.accountNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Routing / ABA:</span>
                      <span className="font-mono text-gray-900">{selectedInvoice.bankRemittance.routingNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">SWIFT / BIC:</span>
                      <span className="font-mono text-gray-900">{selectedInvoice.bankRemittance.swiftBic}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Remittance Notice:</span>
                      <span className="text-emerald-700">{selectedInvoice.bankRemittance.remittanceEmail}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white">
                <button
                  onClick={() => handleSendReminder(selectedInvoice)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-gray-400" />
                  Send Dunning Notice
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenPrintModal(selectedInvoice)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Branded PDF
                  </button>
                  {selectedInvoice.balanceDue > 0 && (
                    <button
                      onClick={() => handleOpenRecordPayment(selectedInvoice)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm transition-colors"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Record Payment (${selectedInvoice.balanceDue.toLocaleString()})
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Record Payment Modal */}
        {isRecordPaymentOpen && invoiceToPay && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Record Client Payment</h3>
                    <p className="text-xs text-gray-500">
                      Allocate incoming funds to {invoiceToPay.invoiceNumber} ({invoiceToPay.clientCompanyName})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsRecordPaymentOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitPayment} className="space-y-4">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-500 block">Total Balance Due</span>
                    <span className="text-base font-bold text-gray-900">
                      ${invoiceToPay.balanceDue.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Previously Paid</span>
                    <span className="text-sm font-semibold text-emerald-600">
                      ${invoiceToPay.amountPaid.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Payment Amount Received ($ USD) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      min={1}
                      max={invoiceToPay.balanceDue}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Partial payments are supported. Outstanding remainder will stay on account.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="WIRE_TRANSFER">Federal Wire Transfer (FedWire / CHIPS)</option>
                    <option value="ACH_DIRECT_DEBIT">ACH Direct Debit (NACHA)</option>
                    <option value="CREDIT_CARD">Corporate Credit Card (Stripe Gateway)</option>
                    <option value="CORPORATE_CHECK">Corporate Check / Lockbox</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Transaction Reference / Trace # *
                  </label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="e.g. FEDWIRE-2026-99214 or CHECK-4491"
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Memo / Notes</label>
                  <textarea
                    rows={2}
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="e.g. Initial 50% contract execution retainer deposit."
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsRecordPaymentOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm"
                  >
                    Confirm & Issue Receipt
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Invoice Modal */}
        {isCreateOpen && (
          <CreateInvoiceModal
            onClose={() => setIsCreateOpen(false)}
            onSuccess={() => {
              loadData();
              setIsCreateOpen(false);
            }}
            clients={clients}
            campaigns={campaigns}
            contracts={contracts}
          />
        )}

        {/* Branded PDF Preview & Print Modal */}
        {isPrintModalOpen && invoiceToPrint && (
          <PrintInvoiceModal
            invoice={invoiceToPrint}
            onClose={() => {
              setIsPrintModalOpen(false);
              setInvoiceToPrint(null);
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

// -------------------------------------------------------------
// Create Invoice Modal Component
// -------------------------------------------------------------
function CreateInvoiceModal({
  onClose,
  onSuccess,
  clients,
  campaigns,
  contracts,
}: {
  onClose: () => void;
  onSuccess: () => void;
  clients: typeof INITIAL_CLIENTS;
  campaigns: ReturnType<typeof getStoredCampaigns>;
  contracts: ReturnType<typeof getStoredContracts>;
}) {
  const { toast } = useToast();

  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [campaignId, setCampaignId] = useState('');
  const [contractId, setContractId] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [taxRatePercent, setTaxRatePercent] = useState(8.875);
  const [notes, setNotes] = useState('Payment due within standard contract terms. Wire remittance preferred.');

  const [lineItems, setLineItems] = useState<
    { description: string; category: InvoiceLineItem['category']; amount: number }[]
  >([
    {
      description: 'Billboard Space Rental — 4-Week Display Flight',
      category: 'MEDIA_RENTAL',
      amount: 45000,
    },
    {
      description: 'Heavy-Duty Vinyl Production & Finishing',
      category: 'PRINT_PRODUCTION',
      amount: 3200,
    },
    {
      description: 'Overnight Rigging & Crane Installation Crew',
      category: 'RIGGING_INSTALLATION',
      amount: 2800,
    },
  ]);

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        description: 'Illumination Electricity & Meter Service Charge',
        category: 'LIGHTING_ELECTRICITY',
        amount: 850,
      },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (
    index: number,
    field: 'description' | 'category' | 'amount',
    val: any
  ) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: val };
    setLineItems(updated);
  };

  const subtotal = useMemo(() => {
    return lineItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  }, [lineItems]);

  const taxAmount = useMemo(() => {
    return Math.round((subtotal * taxRatePercent) / 100);
  }, [subtotal, taxRatePercent]);

  const totalAmount = subtotal + taxAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      toast({ title: 'Error', description: 'Please select a client account.', type: 'destructive' });
      return;
    }

    if (lineItems.length === 0 || subtotal <= 0) {
      toast({ title: 'Error', description: 'At least one line item charge is required.', type: 'destructive' });
      return;
    }

    const res = createInvoice({
      clientId,
      campaignId: campaignId || undefined,
      contractId: contractId || undefined,
      dueDate,
      paymentTerms,
      taxRatePercent,
      notes,
      lineItems: lineItems.map((item) => ({
        description: item.description,
        category: item.category,
        amount: Number(item.amount) || 0,
      })),
    });

    if (res.success && res.invoice) {
      toast({
        title: 'Invoice Generated',
        description: `Created invoice ${res.invoice.invoiceNumber} for $${res.invoice.totalAmount.toLocaleString()}.`,
        type: 'success',
      });
      onSuccess();
    } else {
      toast({
        title: 'Creation Failed',
        description: res.error || 'Failed to create invoice.',
        type: 'destructive',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Generate New Client Invoice</h3>
              <p className="text-xs text-gray-500">
                Itemize media charges, tax calculations, and payment schedule.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Client Account *</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} ({c.accountNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Associated Campaign (Optional)</label>
              <select
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="">None (Account Level Charge)</option>
                {campaigns.map((camp) => (
                  <option key={camp.id} value={camp.id}>
                    {camp.name} ({camp.campaignNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days (Standard)</option>
                <option value="Net 60">Net 60 Days</option>
                <option value="Due on Receipt">Due on Receipt (Pre-flight)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date *</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Line items dynamic list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Itemized Line Items
              </label>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Line Item
              </button>
            </div>

            <div className="space-y-2 border border-gray-100 rounded-xl p-3 bg-gray-50/50">
              {lineItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                    placeholder="Charge description..."
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-900"
                    required
                  />
                  <select
                    value={item.category}
                    onChange={(e) => handleLineItemChange(idx, 'category', e.target.value)}
                    className="w-36 px-2 py-1.5 text-[11px] bg-white border border-gray-200 rounded-lg text-gray-700"
                  >
                    <option value="MEDIA_RENTAL">Media Rental</option>
                    <option value="PRINT_PRODUCTION">Print Production</option>
                    <option value="RIGGING_INSTALLATION">Rigging & Install</option>
                    <option value="LIGHTING_ELECTRICITY">Lighting Electric</option>
                    <option value="DISCOUNT">Discount Credit</option>
                  </select>
                  <div className="relative w-28">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => handleLineItemChange(idx, 'amount', Number(e.target.value))}
                      className="w-full pl-6 pr-2 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 text-right font-medium"
                      required
                    />
                  </div>
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(idx)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 rounded-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tax and Total Calculation Summary */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Charges Subtotal:</span>
              <span className="font-semibold text-gray-900">${subtotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-gray-600">
              <span className="flex items-center gap-1.5">
                Sales & Municipal Tax Rate:
                <input
                  type="number"
                  step="0.001"
                  value={taxRatePercent}
                  onChange={(e) => setTaxRatePercent(Number(e.target.value))}
                  className="w-16 px-1.5 py-0.5 text-xs bg-white border border-gray-200 rounded text-center text-gray-900 font-medium"
                />
                %
              </span>
              <span className="font-semibold text-gray-900">${taxAmount.toLocaleString()}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-extrabold text-gray-900">
              <span>Total Invoice Amount Due:</span>
              <span className="text-emerald-700">${totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Invoice Remittance Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-900"
            />
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm"
            >
              Generate & Issue Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Branded Printable PDF Modal Component
// -------------------------------------------------------------
function PrintInvoiceModal({
  invoice,
  onClose,
}: {
  invoice: InvoiceRecord;
  onClose: () => void;
}) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-gray-100 space-y-8 print:p-0 print:border-none print:shadow-none">
        {/* Actions Bar (hidden in print) */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 print:hidden">
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-50 text-emerald-700">Official Branded Statement</Badge>
            <span className="text-xs text-gray-500">Ready for high-resolution PDF print</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Branded Document Content */}
        <div className="space-y-6 text-gray-900 font-sans">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-gray-200 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-black tracking-tight text-gray-900">ADVERSOFT</span>
                <span className="text-xs font-semibold uppercase tracking-widest text-emerald-600">OUTDOOR MEDIA</span>
              </div>
              <p className="text-xs text-gray-500">Adversoft Outdoor Media LLC</p>
              <p className="text-xs text-gray-500">100 Broadway, 24th Floor, Financial District</p>
              <p className="text-xs text-gray-500">New York, NY 10005 • (212) 555-0199</p>
              <p className="text-xs text-gray-500">Tax ID: US-EIN-13-4829104</p>
            </div>

            <div className="text-right">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">INVOICE</h1>
              <p className="text-sm font-bold text-emerald-700 font-mono mt-0.5">{invoice.invoiceNumber}</p>
              <div className="text-xs text-gray-500 mt-2 space-y-0.5">
                <p>
                  Issue Date: <strong className="text-gray-800">{invoice.issueDate}</strong>
                </p>
                <p>
                  Payment Due: <strong className="text-gray-800">{invoice.dueDate}</strong>
                </p>
                <p>
                  Terms: <strong className="text-gray-800">{invoice.paymentTerms}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Bill To & Flight Metadata */}
          <div className="grid grid-cols-2 gap-8 text-xs">
            <div>
              <h3 className="font-semibold text-gray-500 uppercase tracking-wider text-[11px] mb-1">Billed To</h3>
              <p className="font-bold text-gray-900 text-sm">{invoice.clientCompanyName}</p>
              <p className="text-gray-600 mt-0.5">Account: {invoice.clientAccountNumber}</p>
              <p className="text-gray-600">{invoice.clientBillingAddress}</p>
              <p className="text-gray-600">
                {invoice.clientCity}, {invoice.clientState} {invoice.clientZipCode}
              </p>
              <p className="text-gray-500 mt-1">Tax ID: {invoice.clientTaxId || 'N/A'}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-500 uppercase tracking-wider text-[11px] mb-1">Flight Details</h3>
              <div className="space-y-1">
                {invoice.campaignName && (
                  <p>
                    <span className="text-gray-500">Campaign: </span>
                    <strong className="text-gray-900">{invoice.campaignName}</strong>
                  </p>
                )}
                {invoice.campaignNumber && (
                  <p>
                    <span className="text-gray-500">Campaign Ref: </span>
                    <span className="font-mono text-gray-700">{invoice.campaignNumber}</span>
                  </p>
                )}
                {invoice.contractNumber && (
                  <p>
                    <span className="text-gray-500">Contract Agreement: </span>
                    <span className="font-mono text-gray-700">{invoice.contractNumber}</span>
                  </p>
                )}
                <p>
                  <span className="text-gray-500">Billing Currency: </span>
                  <strong className="text-gray-900">{invoice.currency} (US Dollars)</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Line items table */}
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-y border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoice.lineItems.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 px-3 text-gray-900 font-medium">{item.description}</td>
                      <td className="py-3 px-3 text-gray-500 font-mono text-[11px]">{item.category}</td>
                      <td className="py-3 px-3 text-right font-bold text-gray-900">
                        ${item.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Calculation summary */}
          <div className="flex justify-end pt-2">
            <div className="w-72 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-gray-900">${invoice.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Sales Tax ({invoice.taxRatePercent}%):</span>
                <span className="font-semibold text-gray-900">${invoice.taxAmount.toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900 text-sm">
                <span>Total Amount:</span>
                <span>${invoice.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Amount Paid:</span>
                <span>-${invoice.amountPaid.toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-black text-gray-900 text-base">
                <span>Balance Due:</span>
                <span className={invoice.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                  ${invoice.balanceDue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Bank Wire Remittance box */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/75 text-xs space-y-2">
            <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">
              Remittance & Wire Transfer Details
            </h4>
            <div className="grid grid-cols-2 gap-2 text-gray-600">
              <p>
                Bank: <strong className="text-gray-900">{invoice.bankRemittance.bankName}</strong>
              </p>
              <p>
                Account Name: <strong className="text-gray-900">{invoice.bankRemittance.accountName}</strong>
              </p>
              <p>
                Account #: <strong className="text-gray-900 font-mono">{invoice.bankRemittance.accountNumber}</strong>
              </p>
              <p>
                Routing / ABA: <strong className="text-gray-900 font-mono">{invoice.bankRemittance.routingNumber}</strong>
              </p>
              <p>
                SWIFT: <strong className="text-gray-900 font-mono">{invoice.bankRemittance.swiftBic}</strong>
              </p>
              <p>
                Remittance Email: <strong className="text-emerald-700">{invoice.bankRemittance.remittanceEmail}</strong>
              </p>
            </div>
            <p className="text-[11px] text-gray-500 pt-1 border-t border-gray-200">
              * Please reference invoice number <strong className="text-gray-800">{invoice.invoiceNumber}</strong> in your wire or payment description.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
