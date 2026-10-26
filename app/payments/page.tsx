"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/protectedRoute';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import {
  PaymentRecord,
  PaymentMethod,
  PaymentStatus,
  getStoredPayments,
  getFinancialMetrics,
  getStoredInvoices,
} from '@/lib/data/invoices-store';
import { INITIAL_CLIENTS } from '@/lib/data/crm-store';
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  DollarSign,
  Building,
  ArrowRight,
  Printer,
  Eye,
  RefreshCw,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  X,
  FileCheck2,
  ShieldCheck,
  Zap,
} from 'lucide-react';

const METHOD_CONFIG: Record<
  PaymentMethod,
  { label: string; badge: string; icon: React.ComponentType<{ className?: string }> }
> = {
  WIRE_TRANSFER: {
    label: 'FedWire / Bank Transfer',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Building2,
  },
  ACH_DIRECT_DEBIT: {
    label: 'ACH Direct Debit (NACHA)',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: Zap,
  },
  CREDIT_CARD: {
    label: 'Corporate Credit Card',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: CreditCard,
  },
  CORPORATE_CHECK: {
    label: 'Corporate Lockbox Check',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Receipt,
  },
};

const STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; bg: string; text: string }
> = {
  COMPLETED: { label: 'Settled & Cleared', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  PENDING_CLEARANCE: { label: 'Pending Settlement', bg: 'bg-amber-50', text: 'text-amber-700' },
  FAILED: { label: 'Payment Failed', bg: 'bg-rose-50', text: 'text-rose-700' },
  REFUNDED: { label: 'Refunded', bg: 'bg-gray-100', text: 'text-gray-600' },
};

export default function PaymentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'ALL'>('ALL');
  const [clientFilter, setClientFilter] = useState<string>('ALL');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const data = getStoredPayments();
    setPayments(data);
  };

  const metrics = useMemo(() => getFinancialMetrics(), [payments]);
  const clients = INITIAL_CLIENTS;
  const invoices = useMemo(() => getStoredInvoices(), [payments]);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (methodFilter !== 'ALL' && p.paymentMethod !== methodFilter) return false;
      if (clientFilter !== 'ALL' && p.clientId !== clientFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesPayNum = p.paymentNumber.toLowerCase().includes(q);
        const matchesReceipt = p.receiptNumber.toLowerCase().includes(q);
        const matchesInv = p.invoiceNumber.toLowerCase().includes(q);
        const matchesClient = p.clientCompanyName.toLowerCase().includes(q);
        const matchesRef = p.referenceNumber.toLowerCase().includes(q);
        if (!matchesPayNum && !matchesReceipt && !matchesInv && !matchesClient && !matchesRef) {
          return false;
        }
      }
      return true;
    });
  }, [payments, methodFilter, clientFilter, searchQuery]);

  return (
    <ProtectedRoute requiredPermission="payments:record">
      <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                Payment Reconciliation
              </span>
              <span className="text-xs text-gray-500">• Multi-Channel Inflow & Settlement</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-emerald-600" />
              Payments & Reconciliation Ledger
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Multi-channel incoming cash flows, remittance reconciliation, invoice settlement, and payment receipt audit trails.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/invoices"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 shadow-sm transition-colors"
            >
              <Receipt className="w-4 h-4 text-emerald-600" />
              Invoices & Aging
            </Link>
          </div>
        </div>

        {/* Financial Flow KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">MTD Inflow</span>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-emerald-600">${metrics.totalCollected.toLocaleString()}</span>
              <p className="text-xs text-gray-500 mt-1">Total cleared receipts MTD</p>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Cleared Payments</span>
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-gray-900">{payments.length} Transactions</span>
              <p className="text-xs text-gray-500 mt-1">100% reconciled to active invoices</p>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Collection Speed</span>
              <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-purple-700">21.4 Days</span>
              <p className="text-xs text-gray-500 mt-1">Average Days Sales Outstanding (DSO)</p>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Collection Efficiency</span>
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-indigo-600">{metrics.collectionEfficiencyPercent}%</span>
              <p className="text-xs text-gray-500 mt-1">Cash received vs gross billing</p>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search payment #, receipt #, invoice #, client, or trace..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as PaymentMethod | 'ALL')}
              className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="ALL">All Payment Methods</option>
              <option value="WIRE_TRANSFER">FedWire / Bank Transfer</option>
              <option value="ACH_DIRECT_DEBIT">ACH Direct Debit</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="CORPORATE_CHECK">Corporate Check</option>
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
              Showing <strong className="text-gray-900">{filteredPayments.length}</strong> of{' '}
              <strong className="text-gray-900">{payments.length}</strong> payments
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

        {/* Payments Data Table */}
        <Card className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Payment & Receipt #</th>
                  <th className="py-3 px-4">Allocated Invoice</th>
                  <th className="py-3 px-4">Client Company</th>
                  <th className="py-3 px-4">Amount Cleared</th>
                  <th className="py-3 px-4">Payment Channel</th>
                  <th className="py-3 px-4">Reference / Trace #</th>
                  <th className="py-3 px-4">Settlement Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <CreditCard className="w-10 h-10 text-gray-300 mb-3" />
                        <p className="text-gray-600 font-medium">No payments found</p>
                        <p className="text-xs text-gray-400 mt-1">
                          No transactions match the specified search or filter criteria.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => {
                    const methodMeta = METHOD_CONFIG[p.paymentMethod];
                    const statusMeta = STATUS_CONFIG[p.status];
                    const MethodIcon = methodMeta.icon;

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                        onClick={() => setSelectedReceipt(p)}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-gray-900 font-mono flex items-center gap-1.5">
                            <span>{p.paymentNumber}</span>
                          </div>
                          <div className="text-xs text-emerald-700 font-mono mt-0.5 font-medium flex items-center gap-1">
                            <Receipt className="w-3 h-3" />
                            {p.receiptNumber}
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5">{p.paymentDate}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <Link
                            href="/invoices"
                            onClick={(e) => e.stopPropagation()}
                            className="font-mono text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                          >
                            <span>{p.invoiceNumber}</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </Link>
                          <div className="text-[11px] text-gray-500 mt-0.5">Automated Allocation</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                            <Building2 className="w-3 h-3 text-gray-400" />
                            {p.clientCompanyName}
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5">Recorded by {p.receivedBy}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-base font-bold text-emerald-600">
                            ${p.amount.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-gray-400">USD Direct Deposit</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${methodMeta.badge}`}
                          >
                            <MethodIcon className="w-3 h-3" />
                            {methodMeta.label}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-mono text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded border border-gray-200 inline-block">
                            {p.referenceNumber}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusMeta.bg} ${statusMeta.text}`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {statusMeta.label}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedReceipt(p)}
                            title="Inspect & Print Receipt"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:text-emerald-700 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Receipt
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Printable Payment Receipt Modal */}
        {selectedReceipt && (
          <PaymentReceiptModal
            payment={selectedReceipt}
            onClose={() => setSelectedReceipt(null)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

// -------------------------------------------------------------
// Printable Payment Receipt Modal
// -------------------------------------------------------------
function PaymentReceiptModal({
  payment,
  onClose,
}: {
  payment: PaymentRecord;
  onClose: () => void;
}) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-8 shadow-2xl border border-gray-100 space-y-6 print:p-0 print:border-none print:shadow-none">
        {/* Modal Controls */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 print:hidden">
          <Badge className="bg-emerald-50 text-emerald-700">Official Payment Receipt</Badge>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Document */}
        <div className="space-y-6 text-gray-900 font-sans">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-gray-200 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl font-black tracking-tight text-gray-900">ADVERSOFT</span>
                <span className="text-xs font-semibold uppercase tracking-widest text-emerald-600">OUTDOOR MEDIA</span>
              </div>
              <p className="text-xs text-gray-500">Adversoft Outdoor Media LLC</p>
              <p className="text-xs text-gray-500">100 Broadway, 24th Floor, New York, NY 10005</p>
              <p className="text-xs text-gray-500">billing@adversoft.com • (212) 555-0199</p>
            </div>

            <div className="text-right">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">PAYMENT RECEIPT</h2>
              <p className="text-sm font-bold text-emerald-700 font-mono mt-0.5">{payment.receiptNumber}</p>
              <p className="text-xs text-gray-500 mt-1">{payment.paymentDate}</p>
            </div>
          </div>

          {/* Cleared Stamp Banner */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <div>
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                  Transaction Verified & Cleared
                </span>
                <p className="text-xs text-emerald-700">Funds successfully allocated to advertiser account.</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-emerald-700 block">Amount Received</span>
              <span className="text-2xl font-black text-emerald-800">${payment.amount.toLocaleString()}</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs border border-gray-100 rounded-xl p-4 bg-gray-50/50">
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-semibold">Received From</span>
              <p className="font-bold text-gray-900 text-sm mt-0.5">{payment.clientCompanyName}</p>
            </div>

            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-semibold">Applied To Invoice</span>
              <p className="font-mono font-bold text-gray-900 text-sm mt-0.5">{payment.invoiceNumber}</p>
            </div>

            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-semibold">Payment Channel</span>
              <p className="font-medium text-gray-900 mt-0.5">
                {METHOD_CONFIG[payment.paymentMethod].label}
              </p>
            </div>

            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-semibold">Reference / Trace #</span>
              <p className="font-mono text-gray-900 mt-0.5">{payment.referenceNumber}</p>
            </div>

            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-semibold">Payment Internal ID</span>
              <p className="font-mono text-gray-700 mt-0.5">{payment.paymentNumber}</p>
            </div>

            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-semibold">Authorized Finance Officer</span>
              <p className="text-gray-900 mt-0.5">{payment.receivedBy}</p>
            </div>
          </div>

          {payment.notes && (
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs">
              <span className="text-gray-500 font-semibold block text-[10px] uppercase">Notes / Memo:</span>
              <p className="text-gray-700 mt-0.5">{payment.notes}</p>
            </div>
          )}

          {/* Footer note */}
          <div className="pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
            Thank you for partnering with Adversoft Outdoor Media. Keep this receipt for your corporate tax records.
          </div>
        </div>
      </div>
    </div>
  );
}
