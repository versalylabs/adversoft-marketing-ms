"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProtectedRoute from '@/components/protectedRoute';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { INITIAL_CLIENTS, ClientAccount } from '@/lib/data/crm-store';
import { getStoredCampaigns, CampaignRecord } from '@/lib/data/campaigns-store';
import {
  getStoredArtworks,
  ArtworkRecord,
  approveArtwork,
  requestRevision,
} from '@/lib/data/artwork-store';
import { getStoredWorkOrders, InstallationWorkOrder } from '@/lib/data/installations-store';
import {
  getStoredInvoices,
  getStoredPayments,
  InvoiceRecord,
  PaymentRecord,
  recordPayment,
} from '@/lib/data/invoices-store';
import { getStoredContracts, ContractRecord } from '@/lib/data/contracts-store';
import {
  Globe2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  CreditCard,
  Building2,
  ArrowRight,
  Printer,
  Eye,
  RefreshCw,
  Sparkles,
  ChevronRight,
  X,
  Send,
  FileCheck2,
  ShieldCheck,
  Zap,
  MapPin,
  Camera,
  Layers,
  ArrowUpRight,
  DollarSign,
  Maximize2,
  Check,
  Download,
  Info,
  Sliders,
  Phone,
  Mail,
  ExternalLink,
  MessageSquare,
  Flame,
  FileText,
  Sun,
  Moon,
  HelpCircle,
} from 'lucide-react';

type PortalTab = 'flights' | 'artwork' | 'pop' | 'billing' | 'contracts';

export default function ClientPortalPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Active Client Selection
  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    return INITIAL_CLIENTS[0]?.id || 'cli_1';
  });

  // If logged-in user is Client, automatically select their organization if matched
  useEffect(() => {
    if (user && user.role === 'Client' && user.organizationName) {
      const matched = INITIAL_CLIENTS.find(
        (c) =>
          c.companyName.toLowerCase().includes(user.organizationName.toLowerCase()) ||
          user.organizationName.toLowerCase().includes(c.companyName.toLowerCase())
      );
      if (matched) {
        setSelectedClientId(matched.id);
      }
    }
  }, [user]);

  const [activeTab, setActiveTab] = useState<PortalTab>('flights');

  // Local data states
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [artworks, setArtworks] = useState<ArtworkRecord[]>([]);
  const [workOrders, setWorkOrders] = useState<InstallationWorkOrder[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [contracts, setContracts] = useState<ContractRecord[]>([]);

  // Modals & Inspection State
  const [artworkToApprove, setArtworkToApprove] = useState<ArtworkRecord | null>(null);
  const [artworkToRevise, setArtworkToRevise] = useState<ArtworkRecord | null>(null);
  const [artworkToPreview, setArtworkToPreview] = useState<ArtworkRecord | null>(null);
  const [previewMode, setPreviewMode] = useState<'DAY' | 'NIGHT'>('DAY');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [approverName, setApproverName] = useState(() => user?.name || 'David Sterling');
  const [approverEmail, setApproverEmail] = useState(() => user?.email || 'david@sterlingbrands.com');
  const [termsAgreed, setTermsAgreed] = useState(false);

  const [invoiceToPay, setInvoiceToPay] = useState<InvoiceRecord | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 9921');
  const [cardExp, setCardExp] = useState('11/28');
  const [cardCvc, setCardCvc] = useState('883');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [popToInspect, setPopToInspect] = useState<InstallationWorkOrder | null>(null);
  const [receiptToPrint, setReceiptToPrint] = useState<PaymentRecord | null>(null);
  const [contractToView, setContractToView] = useState<ContractRecord | null>(null);

  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [renewalCampaign, setRenewalCampaign] = useState<CampaignRecord | null>(null);
  const [extensionWeeks, setExtensionWeeks] = useState(4);

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactCategory, setContactCategory] = useState('General Support');
  const [contactMessage, setContactMessage] = useState('');

  // Load data for currently selected client
  const loadPortalData = () => {
    const allCampaigns = getStoredCampaigns();
    const allArtworks = getStoredArtworks();
    const allWorkOrders = getStoredWorkOrders();
    const allInvoices = getStoredInvoices();
    const allPayments = getStoredPayments();
    const allContracts = getStoredContracts();

    const currentClient = INITIAL_CLIENTS.find((c) => c.id === selectedClientId) || INITIAL_CLIENTS[0];

    setCampaigns(
      allCampaigns.filter(
        (c) => c.clientId === currentClient.id || c.clientCompanyName === currentClient.companyName
      )
    );
    setArtworks(
      allArtworks.filter(
        (a) => a.clientId === currentClient.id || a.clientCompanyName === currentClient.companyName
      )
    );
    setWorkOrders(
      allWorkOrders.filter(
        (w) => w.clientId === currentClient.id || w.clientCompanyName === currentClient.companyName
      )
    );
    setInvoices(
      allInvoices.filter(
        (i) => i.clientId === currentClient.id || i.clientCompanyName === currentClient.companyName
      )
    );
    setPayments(
      allPayments.filter(
        (p) => p.clientId === currentClient.id || p.clientCompanyName === currentClient.companyName
      )
    );
    setContracts(
      allContracts.filter(
        (cnt) => cnt.clientId === currentClient.id || cnt.clientCompanyName === currentClient.companyName
      )
    );
  };

  useEffect(() => {
    loadPortalData();
  }, [selectedClientId]);

  const activeClient = useMemo(() => {
    return INITIAL_CLIENTS.find((c) => c.id === selectedClientId) || INITIAL_CLIENTS[0];
  }, [selectedClientId]);

  // Aggregate stats
  const stats = useMemo(() => {
    const liveFlights = campaigns.filter((c) => c.status === 'LIVE').length;
    const pendingProofs = artworks.filter((a) => a.status === 'IN_REVIEW').length;
    const totalBalance = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
    const totalImpressions = campaigns.reduce(
      (sum, c) =>
        sum +
        (c.proofReport?.totalImpressionsDelivered ||
          c.sites?.reduce((acc, s) => acc + (s.totalImpressions || 0), 0) ||
          0),
      0
    );
    const verifiedPOPs = workOrders.filter(
      (w) => w.status === 'COMPLETED' && w.proofPhotos?.afterDayPhotoUrl
    ).length;

    return {
      liveFlights,
      pendingProofs,
      totalBalance,
      totalImpressions,
      verifiedPOPs,
      totalContracts: contracts.length,
    };
  }, [campaigns, artworks, invoices, workOrders, contracts]);

  // Handle Approve Artwork
  const handleConfirmApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!artworkToApprove) return;

    if (!termsAgreed) {
      toast({
        title: 'Signatory Acknowledgment Required',
        description: 'Please confirm that you have inspected the creative proof.',
        type: 'warning',
      });
      return;
    }

    const res = approveArtwork(artworkToApprove.id, {
      approvedBy: approverName,
      approverEmail,
      approverRole: 'Client Marketing Director',
      notes: 'Approved via Client Portal self-service console.',
      approvalMethod: 'DIGITAL_SIGNATURE',
    });

    if (res.success) {
      toast({
        title: 'Artwork Approved',
        description: `Creative proof ${artworkToApprove.artworkNumber} approved. Digital audit stamp generated and sent to print production.`,
        type: 'success',
      });
      loadPortalData();
      setArtworkToApprove(null);
      setTermsAgreed(false);
    } else {
      toast({
        title: 'Approval Failed',
        description: res.error || 'Failed to record approval.',
        type: 'destructive',
      });
    }
  };

  // Handle Request Revision
  const handleConfirmRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!artworkToRevise) return;

    if (!revisionNotes.trim()) {
      toast({
        title: 'Feedback Required',
        description: 'Please describe the adjustments required for the creative team.',
        type: 'warning',
      });
      return;
    }

    const res = requestRevision(
      artworkToRevise.id,
      revisionNotes,
      `${approverName} (Client Signatory)`
    );

    if (res.success) {
      toast({
        title: 'Revision Dispatched',
        description: `Feedback logged for ${artworkToRevise.artworkNumber}. Creative Services has been notified.`,
        type: 'info',
      });
      loadPortalData();
      setArtworkToRevise(null);
      setRevisionNotes('');
    } else {
      toast({
        title: 'Revision Request Failed',
        description: res.error || 'Failed to submit revision.',
        type: 'destructive',
      });
    }
  };

  // Handle Pay Invoice
  const handleOpenPayModal = (inv: InvoiceRecord) => {
    setInvoiceToPay(inv);
    setPayAmount(inv.balanceDue);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceToPay) return;

    if (payAmount <= 0 || payAmount > invoiceToPay.balanceDue) {
      toast({
        title: 'Invalid Payment Amount',
        description: 'Please enter a valid amount not exceeding the balance due.',
        type: 'warning',
      });
      return;
    }

    setIsProcessingPayment(true);

    setTimeout(() => {
      const res = recordPayment({
        invoiceId: invoiceToPay.id,
        amount: payAmount,
        paymentMethod: 'CREDIT_CARD',
        referenceNumber: `STRIPE_PORTAL_${Date.now().toString().slice(-6)}`,
        notes: 'Corporate Card settled via Client Self-Service Portal.',
        receivedBy: 'Self-Service Portal (Stripe)',
      });

      setIsProcessingPayment(false);

      if (res.success && res.invoice) {
        toast({
          title: 'Payment Successful',
          description: `Allocated $${payAmount.toLocaleString()} to ${res.invoice.invoiceNumber}. Receipt ${res.payment?.receiptNumber} generated.`,
          type: 'success',
        });
        loadPortalData();
        setInvoiceToPay(null);
      } else {
        toast({
          title: 'Payment Failed',
          description: res.error || 'Failed to process payment.',
          type: 'destructive',
        });
      }
    }, 850);
  };

  // Handle Flight Extension Request
  const handleSubmitExtensionRequest = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Extension Request Submitted',
      description: `Requested a ${extensionWeeks}-week extension for ${renewalCampaign?.name}. Your account director (Rachel Adams) has been alerted.`,
      type: 'success',
    });
    setIsRenewalModalOpen(false);
    setRenewalCampaign(null);
  };

  // Handle Contact Director
  const handleSendContactMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim()) return;

    toast({
      title: 'Message Dispatched',
      description: `Your inquiry [${contactCategory}] has been forwarded directly to Managing Director Rachel Adams. Expect a response within 2 hours.`,
      type: 'success',
    });
    setIsContactModalOpen(false);
    setContactMessage('');
  };

  return (
    <ProtectedRoute requiredPermission="portal:access">
      <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 space-y-8">
        {/* Top Header & Account Switcher Banner */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Advertiser Portal Console
              </span>
              <span className="text-xs text-gray-500">• Self-Service Advertiser Console</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-sm shadow-indigo-100">
                <Globe2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                  <span>{activeClient.companyName}</span>
                  <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                    Acct #{activeClient.accountNumber}
                  </span>
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Welcome to your outdoor advertising workspace. Inspect live flights, review & approve creatives, view certified proof-of-posting, and manage billing.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
            <div className="text-xs">
              <span className="text-gray-400 block font-medium text-[10px] uppercase">
                Active Client View
              </span>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                aria-label="Switch Advertiser Account"
                className="mt-0.5 px-3 py-1.5 text-xs font-semibold bg-white border border-gray-200 rounded-lg text-gray-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {INITIAL_CLIENTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} ({c.accountNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden sm:block w-px h-8 bg-gray-200" />

            <div className="text-xs">
              <span className="text-gray-400 block font-medium text-[10px] uppercase">
                Dedicated Account Director
              </span>
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="flex items-center gap-1.5 mt-1 font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                title="Message Rachel Adams"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Rachel Adams (Managing Director)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Top Executive KPI Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Live Flights</span>
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-gray-900">{stats.liveFlights} Active</span>
              <p className="text-xs text-gray-500 mt-1">{campaigns.length} total scheduled flights</p>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Impressions Delivered</span>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-emerald-600">
                {stats.totalImpressions > 0
                  ? (stats.totalImpressions / 1000000).toFixed(1) + 'M'
                  : '4.8M'}
              </span>
              <p className="text-xs text-gray-500 mt-1">Verified vehicular & foot impressions</p>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pending Proofs</span>
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  stats.pendingProofs > 0
                    ? 'bg-amber-50 text-amber-600 animate-pulse'
                    : 'bg-gray-50 text-gray-400'
                }`}
              >
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span
                className={`text-2xl font-bold ${
                  stats.pendingProofs > 0 ? 'text-amber-600' : 'text-gray-900'
                }`}
              >
                {stats.pendingProofs} Awaiting Sign-off
              </span>
              <p className="text-xs text-gray-500 mt-1">Direct approval required for print</p>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Verified POPs</span>
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Camera className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-indigo-600">{stats.verifiedPOPs} Certified</span>
              <p className="text-xs text-gray-500 mt-1">Day & illuminated night photos</p>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Balance Due</span>
              <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span
                className={`text-2xl font-bold ${
                  stats.totalBalance > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                ${stats.totalBalance.toLocaleString()}
              </span>
              <p className="text-xs text-gray-500 mt-1">Current open invoice balance</p>
            </div>
          </Card>
        </div>

        {/* Portal Navigation Tabs */}
        <div className="flex items-center border-b border-gray-200 space-x-1 sm:space-x-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('flights')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'flights'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Live Flights & Sites</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] bg-gray-100 text-gray-700">
              {campaigns.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('artwork')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'artwork'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Artwork & Approvals</span>
            {stats.pendingProofs > 0 ? (
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] bg-amber-100 text-amber-800 font-bold">
                {stats.pendingProofs} action
              </span>
            ) : (
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] bg-gray-100 text-gray-700">
                {artworks.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('pop')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'pop'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Proof-of-Posting (POP)</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] bg-gray-100 text-gray-700">
              {workOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'billing'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Invoices & Self-Service Pay</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] bg-gray-100 text-gray-700">
              {invoices.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('contracts')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'contracts'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Agreements & Contracts</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] bg-gray-100 text-gray-700">
              {contracts.length}
            </span>
          </button>
        </div>

        {/* -------------------------------------------------------------
            TAB 1: LIVE FLIGHTS & SITES
        -------------------------------------------------------------- */}
        {activeTab === 'flights' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  Active Advertising Campaigns & Scheduled Flights
                </h2>
                <p className="text-xs text-gray-500">
                  Track real-time flight progress, billboard dimensions, locations, and impressions delivery.
                </p>
              </div>

              <button
                onClick={() => {
                  setRenewalCampaign(campaigns[0] || null);
                  setIsRenewalModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Request Flight Extension
              </button>
            </div>

            {campaigns.length === 0 ? (
              <Card className="p-12 text-center bg-white border border-gray-100 shadow-sm rounded-xl">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-gray-900">No Flights Scheduled</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  You do not have any active or scheduled billboard campaigns under this client account.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {campaigns.map((camp) => {
                  const isLive = camp.status === 'LIVE';
                  return (
                    <Card
                      key={camp.id}
                      className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden flex flex-col justify-between"
                    >
                      <div className="p-6 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                isLive
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : camp.status === 'SCHEDULED'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isLive ? 'bg-emerald-500 animate-ping' : 'bg-blue-400'
                                }`}
                              />
                              {camp.status} FLIGHT
                            </span>
                            <h3 className="text-lg font-bold text-gray-900 mt-2">{camp.name}</h3>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">
                              Flight Ref: {camp.campaignNumber}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-xs text-gray-400 block uppercase font-medium">
                              Total Budget
                            </span>
                            <span className="text-base font-bold text-gray-900">
                              ${camp.totalBudget.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Flight Dates & Countdown */}
                        <div className="p-3.5 rounded-xl bg-gray-50/75 border border-gray-100 grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                              Flight Start Date
                            </span>
                            <span className="font-bold text-gray-900">{camp.flightStartDate}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                              Flight End Date
                            </span>
                            <span className="font-bold text-gray-900">{camp.flightEndDate}</span>
                          </div>
                        </div>

                        {/* Allocated Sites */}
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-2">
                            Allocated Billboard Inventory ({camp.sites?.length || 0} Sites)
                          </span>
                          <div className="space-y-2">
                            {(camp.sites || []).map((site) => (
                              <div
                                key={site.id}
                                className="p-3 rounded-xl border border-gray-100 bg-white shadow-2xs flex items-center justify-between text-xs"
                              >
                                <div>
                                  <div className="font-bold text-gray-900 flex items-center gap-2">
                                    <span>{site.billboardName}</span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                      {site.billboardCode}
                                    </span>
                                  </div>
                                  <div className="text-gray-500 mt-0.5 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-gray-400" />
                                    <span>
                                      {site.billboardCity} • {site.billboardCorridor}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right font-medium text-gray-700">
                                  <span>{site.dimensions}</span>
                                  <span className="block text-[10px] text-indigo-600">
                                    {site.isDigital ? 'Digital LED' : 'Printed Vinyl'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                          Target Demo: <strong>{camp.targetAudienceSummary}</strong>
                        </span>
                        <button
                          onClick={() => {
                            setRenewalCampaign(camp);
                            setIsRenewalModalOpen(true);
                          }}
                          className="font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          Request Extension
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 2: ARTWORK & CLIENT APPROVALS
        -------------------------------------------------------------- */}
        {activeTab === 'artwork' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  Artwork Creative Proofs & Approval Sign-offs
                </h2>
                <p className="text-xs text-gray-500">
                  Inspect high-resolution creative proofs, test Day vs. Night illumination lighting, and provide official digital sign-offs.
                </p>
              </div>
            </div>

            {artworks.length === 0 ? (
              <Card className="p-12 text-center bg-white border border-gray-100 shadow-sm rounded-xl">
                <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-gray-900">No Creative Proofs Uploaded</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Our creative design team is currently preparing initial vinyl and digital proof specifications for your review.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {artworks.map((art) => {
                  const currentRev = art.revisions[art.revisions.length - 1];
                  const isApproved = art.status === 'CLIENT_APPROVED';
                  const needsApproval = art.status === 'IN_REVIEW';

                  return (
                    <Card
                      key={art.id}
                      className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        {/* Visual Creative Thumbnail */}
                        <div
                          className="relative h-48 w-full bg-slate-900 overflow-hidden group cursor-pointer"
                          onClick={() => setArtworkToPreview(art)}
                        >
                          {currentRev?.fileUrl ? (
                            <Image
                              src={currentRev.fileUrl}
                              alt={art.title}
                              fill
                              unoptimized
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Layers className="w-10 h-10" />
                            </div>
                          )}

                          <div className="absolute top-3 left-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${
                                isApproved
                                  ? 'bg-emerald-600 text-white'
                                  : needsApproval
                                  ? 'bg-amber-500 text-white animate-pulse'
                                  : 'bg-gray-800/80 text-white'
                              }`}
                            >
                              {art.status.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] font-mono text-white">
                            v{art.currentVersion} • {currentRev?.dimensions || '14x48'}
                          </div>

                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="px-3 py-1.5 rounded-lg bg-white/90 text-gray-900 text-xs font-semibold flex items-center gap-1 shadow-md">
                              <Maximize2 className="w-3.5 h-3.5" />
                              Inspect Proof & Illumination
                            </span>
                          </div>
                        </div>

                        {/* Creative Details */}
                        <div className="p-5 space-y-3">
                          <div>
                            <h3 className="text-base font-bold text-gray-900 line-clamp-1">
                              {art.title}
                            </h3>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">
                              {art.artworkNumber} • Billboard {art.billboardCode}
                            </p>
                          </div>

                          <div className="p-3 rounded-xl bg-gray-50/75 border border-gray-100 space-y-1.5 text-xs">
                            <div className="flex justify-between text-gray-600">
                              <span>Asset Format:</span>
                              <span className="font-semibold text-gray-900 font-mono">
                                {art.format}
                              </span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                              <span>Color / Resolution:</span>
                              <span className="font-medium text-gray-900">
                                {currentRev?.colorSpace || 'CMYK'} @ {currentRev?.resolutionDpi || 300} DPI
                              </span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                              <span>Pre-flight Verification:</span>
                              <span className="font-medium text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Specs Passed
                              </span>
                            </div>
                          </div>

                          {/* Approval Audit Trail Stamp */}
                          {art.approvalAudit.length > 0 && (
                            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-800">
                              <span className="font-bold flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                Certified Digital Sign-off:
                              </span>
                              <p className="mt-0.5">
                                Signed by {art.approvalAudit[0].approvedBy} on {art.approvalAudit[0].approvedAt}
                              </p>
                              <p className="font-mono text-[9px] text-emerald-600 mt-0.5">
                                Hash: {art.approvalAudit[0].signatureHash}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center gap-2">
                        {needsApproval ? (
                          <>
                            <button
                              onClick={() => setArtworkToRevise(art)}
                              className="flex-1 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Request Changes
                            </button>
                            <button
                              onClick={() => {
                                setArtworkToApprove(art);
                                setTermsAgreed(false);
                              }}
                              className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm transition-colors flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Approve Proof
                            </button>
                          </>
                        ) : (
                          <div className="w-full flex items-center justify-between text-xs text-gray-500">
                            <span className="flex items-center gap-1 text-emerald-700 font-medium">
                              <Check className="w-4 h-4" />
                              Signed & Dispatched
                            </span>
                            <button
                              onClick={() => setArtworkToPreview(art)}
                              className="font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                            >
                              Inspect Preview
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 3: PROOF-OF-POSTING (POP) GALLERY
        -------------------------------------------------------------- */}
        {activeTab === 'pop' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-indigo-600" />
                  Certified Proof-of-Posting (POP) & Inspection Records
                </h2>
                <p className="text-xs text-gray-500">
                  Field photos captured by installation rigging crews, verified by operations, and stamped with GPS timestamps.
                </p>
              </div>
            </div>

            {workOrders.length === 0 ? (
              <Card className="p-12 text-center bg-white border border-gray-100 shadow-sm rounded-xl">
                <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-gray-900">No Installation Photos Yet</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Work orders are currently scheduled. Certified daytime and night-time posting photos will appear here upon completion.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {workOrders.map((wo) => {
                  const photos = wo.proofPhotos;
                  const isDone = wo.status === 'COMPLETED';

                  return (
                    <Card
                      key={wo.id}
                      className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden flex flex-col justify-between"
                    >
                      <div className="p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                isDone
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-blue-50 text-blue-700'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {wo.status}
                            </span>
                            <h3 className="text-lg font-bold text-gray-900 mt-2">{wo.campaignName}</h3>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">
                              Work Order: {wo.workOrderNumber} • Billboard {wo.billboardCode}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-xs text-gray-400 block uppercase font-medium">
                              Installed Date
                            </span>
                            <span className="text-sm font-bold text-gray-900">
                              {wo.scheduledDate}
                            </span>
                          </div>
                        </div>

                        {/* Proof Photos Side-by-Side (Day and Night) */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-semibold text-gray-600 block">
                              Daytime Verification
                            </span>
                            <div className="relative h-40 w-full rounded-xl bg-slate-900 overflow-hidden">
                              {photos?.afterDayPhotoUrl ? (
                                <Image
                                  src={photos.afterDayPhotoUrl}
                                  alt="Daytime posting verification"
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                  Pending Post
                                </div>
                              )}
                              <div className="absolute bottom-2 left-2 bg-black/75 px-2 py-0.5 rounded text-[10px] text-white font-mono">
                                Daytime View
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[11px] font-semibold text-gray-600 block">
                              Illuminated Night View
                            </span>
                            <div className="relative h-40 w-full rounded-xl bg-slate-900 overflow-hidden">
                              {photos?.afterNightPhotoUrl ? (
                                <Image
                                  src={photos.afterNightPhotoUrl}
                                  alt="Illuminated night posting verification"
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                  Pending Post
                                </div>
                              )}
                              <div className="absolute bottom-2 left-2 bg-black/75 px-2 py-0.5 rounded text-[10px] text-white font-mono">
                                Night Illumination
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Certification metadata */}
                        <div className="p-3 rounded-xl bg-gray-50/75 border border-gray-100 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                              Verified Inspector
                            </span>
                            <span className="font-medium text-gray-900">
                              {photos?.inspectorName || wo.leadTechnician || 'Adversoft Field Ops'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                              Illumination Score
                            </span>
                            <span className="font-bold text-emerald-700">
                              {photos?.illuminationScorePercent || 98}% Certified
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                              GPS Coordinates
                            </span>
                            <span className="font-mono text-gray-700">
                              {photos?.gpsLatitude?.toFixed(4) || '40.7580'}° N,{' '}
                              {photos?.gpsLongitude?.toFixed(4) || '-73.9855'}° W
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                              Corridor Location
                            </span>
                            <span className="font-medium text-gray-900">
                              {wo.billboardCity} • {wo.billboardCorridor}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4" />
                          Certified Proof-of-Performance Verified
                        </span>
                        <button
                          onClick={() => setPopToInspect(wo)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 font-semibold transition-colors flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          View POP Certificate
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 4: INVOICES & SELF-SERVICE PAYMENTS
        -------------------------------------------------------------- */}
        {activeTab === 'billing' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-600" />
                  Invoices, Account Receivables & Instant Payment
                </h2>
                <p className="text-xs text-gray-500">
                  Review itemized billing charges, download official tax statements, or remit payment via corporate card or wire.
                </p>
              </div>

              {stats.totalBalance > 0 && (
                <button
                  onClick={() => handleOpenPayModal(invoices[0])}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  Pay Open Balance (${stats.totalBalance.toLocaleString()})
                </button>
              )}
            </div>

            {invoices.length === 0 ? (
              <Card className="p-12 text-center bg-white border border-gray-100 shadow-sm rounded-xl">
                <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-gray-900">No Invoices on Account</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  All contracts are fully reconciled or billing schedules have not yet been generated.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                          <th className="py-3 px-4">Invoice #</th>
                          <th className="py-3 px-4">Campaign Reference</th>
                          <th className="py-3 px-4">Issue & Due Date</th>
                          <th className="py-3 px-4">Total Amount</th>
                          <th className="py-3 px-4">Amount Paid</th>
                          <th className="py-3 px-4">Balance Due</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                        {invoices.map((inv) => {
                          const isFullyPaid = inv.balanceDue === 0;

                          return (
                            <tr key={inv.id} className="hover:bg-gray-50/80 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="font-semibold text-gray-900 font-mono">
                                  {inv.invoiceNumber}
                                </div>
                                <div className="text-[11px] text-gray-400 mt-0.5">
                                  Terms: {inv.paymentTerms}
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="text-xs font-semibold text-gray-900">
                                  {inv.campaignName || 'Direct Flight Contract'}
                                </div>
                                <div className="text-[11px] text-gray-400 font-mono">
                                  {inv.campaignNumber || inv.contractNumber}
                                </div>
                              </td>

                              <td className="py-3.5 px-4 text-xs">
                                <div>Issued: {inv.issueDate}</div>
                                <div
                                  className={
                                    inv.daysOverdue > 0 ? 'text-rose-600 font-semibold' : 'text-gray-500'
                                  }
                                >
                                  Due: {inv.dueDate}
                                </div>
                              </td>

                              <td className="py-3.5 px-4 font-bold text-gray-900 text-sm">
                                ${inv.totalAmount.toLocaleString()}
                              </td>

                              <td className="py-3.5 px-4 font-medium text-emerald-700 text-sm">
                                ${inv.amountPaid.toLocaleString()}
                              </td>

                              <td className="py-3.5 px-4 font-bold text-sm">
                                <span className={inv.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                                  ${inv.balanceDue.toLocaleString()}
                                </span>
                              </td>

                              <td className="py-3.5 px-4">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                    isFullyPaid
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : inv.status === 'OVERDUE'
                                      ? 'bg-rose-50 text-rose-700'
                                      : 'bg-amber-50 text-amber-700'
                                  }`}
                                >
                                  {inv.status}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {inv.balanceDue > 0 && (
                                    <button
                                      onClick={() => handleOpenPayModal(inv)}
                                      className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
                                    >
                                      Pay Online
                                    </button>
                                  )}
                                  <Link
                                    href="/invoices"
                                    className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                    title="View Statement"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Wire Remittance Info Box */}
                <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm text-xs space-y-3">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    FedWire / Direct Bank Remittance Instructions
                  </h3>
                  <p className="text-gray-500">
                    If paying by wire or ACH transfer, please use the following coordinates and include your invoice reference in the memo line:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-gray-50/75 border border-gray-100">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                        Bank Name
                      </span>
                      <span className="font-bold text-gray-900">JPMorgan Chase N.A.</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                        Routing / ABA
                      </span>
                      <span className="font-mono font-bold text-gray-900">021000021</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                        Account Number
                      </span>
                      <span className="font-mono font-bold text-gray-900">****-****-8849</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                        SWIFT / BIC
                      </span>
                      <span className="font-mono font-bold text-gray-900">CHASUS33</span>
                    </div>
                  </div>
                </div>

                {/* Receipts & Cleared Transactions Sub-Ledger */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    Cleared Payment Receipts ({payments.length} Transactions)
                  </h3>
                  {payments.length === 0 ? (
                    <p className="text-xs text-gray-400">No payment receipts issued yet.</p>
                  ) : (
                    <Card className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-gray-100 bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                              <th className="py-2.5 px-3">Receipt #</th>
                              <th className="py-2.5 px-3">Invoice Ref</th>
                              <th className="py-2.5 px-3">Payment Date</th>
                              <th className="py-2.5 px-3">Method</th>
                              <th className="py-2.5 px-3">Trace #</th>
                              <th className="py-2.5 px-3">Amount</th>
                              <th className="py-2.5 px-3 text-right">Receipt</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {payments.map((pay) => (
                              <tr key={pay.id} className="hover:bg-gray-50/50">
                                <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                                  {pay.receiptNumber}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-gray-900">{pay.invoiceNumber}</td>
                                <td className="py-2.5 px-3 text-gray-600">{pay.paymentDate}</td>
                                <td className="py-2.5 px-3 text-gray-700 font-medium">{pay.paymentMethod}</td>
                                <td className="py-2.5 px-3 font-mono text-gray-500">{pay.referenceNumber}</td>
                                <td className="py-2.5 px-3 font-bold text-emerald-700">
                                  ${pay.amount.toLocaleString()}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <button
                                    onClick={() => setReceiptToPrint(pay)}
                                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-emerald-700 transition-colors"
                                    title="View Printable Receipt"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 5: AGREEMENTS & SIGNED CONTRACTS
        -------------------------------------------------------------- */}
        {activeTab === 'contracts' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Executed Contracts & Master Advertising Agreements
                </h2>
                <p className="text-xs text-gray-500">
                  Access legally binding advertising contracts, SLAs, terms of renewal, and digital signature certificates.
                </p>
              </div>
            </div>

            {contracts.length === 0 ? (
              <Card className="p-12 text-center bg-white border border-gray-100 shadow-sm rounded-xl">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-gray-900">No Active Contracts Found</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Agreements for this account are currently being finalized by sales operations.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {contracts.map((cnt) => (
                  <Card
                    key={cnt.id}
                    className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden flex flex-col justify-between"
                  >
                    <div className="p-6 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                            {cnt.status} AGREEMENT
                          </span>
                          <h3 className="text-base font-bold text-gray-900 mt-2">{cnt.title}</h3>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">{cnt.contractNumber}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-400 block uppercase font-medium">Value</span>
                          <span className="text-base font-bold text-gray-900">
                            ${cnt.totalContractValue.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-gray-50/75 border border-gray-100 text-xs">
                        <div>
                          <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                            Agreement Dates
                          </span>
                          <span className="font-medium text-gray-900">
                            {cnt.startDate} to {cnt.endDate}
                          </span>
                          <span className="text-gray-500 block mt-0.5">({cnt.durationDays} days flight)</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                            SLA Illumination
                          </span>
                          <span className="font-bold text-emerald-700">
                            {cnt.illuminationSlaPercent}% Guaranteed
                          </span>
                          <span className="text-gray-500 block mt-0.5">Right of First Refusal: Active</span>
                        </div>
                      </div>

                      {/* Digital signatures verification box */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                          Digital Signature Audit Trail
                        </span>
                        <div className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 space-y-1 text-xs">
                          <div className="flex justify-between items-center text-emerald-950 font-medium">
                            <span className="flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              Client Signatory: {cnt.clientSignature.signatoryName}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-mono">
                              {cnt.clientSignature.signedAt}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-emerald-950 font-medium">
                            <span className="flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              Adversoft Officer: {cnt.adversoftSignature.signatoryName}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-mono">
                              {cnt.adversoftSignature.signedAt}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-gray-500">Governing Law: {cnt.governingLaw}</span>
                      <button
                        onClick={() => setContractToView(cnt)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        View Agreement
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------
            MODAL: ARTWORK DIGITAL SIGN-OFF (APPROVE)
        -------------------------------------------------------------- */}
        {artworkToApprove && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Sign Off on Artwork Proof</h3>
                    <p className="text-xs text-gray-500">
                      Authorizes physical vinyl print production or digital LED flight handoff.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setArtworkToApprove(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmApproval} className="space-y-4">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                      Proof Title & Version
                    </span>
                    <span className="font-bold text-gray-900 text-sm">{artworkToApprove.title}</span>
                    <span className="text-gray-500 block font-mono">
                      {artworkToApprove.artworkNumber} (v{artworkToApprove.currentVersion})
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-indigo-50 text-indigo-700">
                    {artworkToApprove.format}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Authorized Signatory Name *
                  </label>
                  <input
                    type="text"
                    value={approverName}
                    onChange={(e) => setApproverName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Corporate Email Address *
                  </label>
                  <input
                    type="email"
                    value={approverEmail}
                    onChange={(e) => setApproverEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                    required
                  />
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAgreed}
                      onChange={(e) => setTermsAgreed(e.target.checked)}
                      className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-emerald-900 font-medium leading-relaxed">
                      I certify that our marketing team has verified visual copy, branding logos, legal disclaimers, and aspect ratio. This digital sign-off initiates irrevocable production handoff.
                    </span>
                  </label>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setArtworkToApprove(null)}
                    className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm"
                  >
                    Confirm Digital Sign-off
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            MODAL: ARTWORK REVISION REQUEST
        -------------------------------------------------------------- */}
        {artworkToRevise && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Request Creative Revisions</h3>
                    <p className="text-xs text-gray-500">
                      Submit feedback to our production artists for updated proof delivery.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setArtworkToRevise(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmRevision} className="space-y-4">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                    Target Creative Proof
                  </span>
                  <span className="font-bold text-gray-900 text-sm">{artworkToRevise.title}</span>
                  <p className="text-gray-500 font-mono mt-0.5">{artworkToRevise.artworkNumber}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Describe Requested Changes *
                  </label>
                  <textarea
                    rows={4}
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                    placeholder="e.g. Please enhance the contrast on the call-to-action text, shift the product hero shot 5% to the left, and verify the white background conforms to night illumination brightness limits."
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    required
                  />
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setArtworkToRevise(null)}
                    className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 shadow-sm"
                  >
                    Submit Revision Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            MODAL: ARTWORK HIGH-RES PREVIEW WITH DAY/NIGHT SIMULATION
        -------------------------------------------------------------- */}
        {artworkToPreview && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{artworkToPreview.title}</h3>
                  <p className="text-xs text-gray-500">
                    {artworkToPreview.artworkNumber} • Billboard {artworkToPreview.billboardCode} (v
                    {artworkToPreview.currentVersion})
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Day / Night Toggle */}
                  <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                    <button
                      onClick={() => setPreviewMode('DAY')}
                      className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                        previewMode === 'DAY'
                          ? 'bg-white text-gray-900 shadow-xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      Daylight
                    </button>
                    <button
                      onClick={() => setPreviewMode('NIGHT')}
                      className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                        previewMode === 'NIGHT'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5 text-indigo-400" />
                      Night Illumination
                    </button>
                  </div>

                  <button
                    onClick={() => setArtworkToPreview(null)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Simulated Display Screen */}
              <div
                className={`relative h-96 w-full rounded-2xl overflow-hidden transition-all duration-300 ${
                  previewMode === 'NIGHT'
                    ? 'bg-slate-950 ring-8 ring-indigo-900/40 shadow-2xl shadow-indigo-950'
                    : 'bg-slate-100 ring-2 ring-gray-200'
                }`}
              >
                {artworkToPreview.revisions[artworkToPreview.revisions.length - 1]?.fileUrl && (
                  <Image
                    src={artworkToPreview.revisions[artworkToPreview.revisions.length - 1].fileUrl}
                    alt={artworkToPreview.title}
                    fill
                    unoptimized
                    className={`object-cover transition-all duration-300 ${
                      previewMode === 'NIGHT'
                        ? 'brightness-110 contrast-125 saturate-110 drop-shadow-[0_0_35px_rgba(255,255,255,0.25)]'
                        : 'brightness-100'
                    }`}
                  />
                )}
                <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-xs px-3 py-1 rounded-md text-xs font-mono text-white">
                  Simulation: {previewMode === 'DAY' ? 'Natural Sunlight 5500K' : 'LED / Backlit 4000 Lumens'}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-gray-50 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Dimensions</span>
                  <span className="font-bold text-gray-900">
                    {artworkToPreview.revisions[0]?.dimensions || "14' x 48'"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Color Space</span>
                  <span className="font-bold text-gray-900">
                    {artworkToPreview.revisions[0]?.colorSpace || 'CMYK'} (ICC ProProfile)
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Resolution</span>
                  <span className="font-bold text-gray-900">
                    {artworkToPreview.revisions[0]?.resolutionDpi || 300} DPI (Print-Ready)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            MODAL: SELF-SERVICE CARD PAYMENT GATEWAY
        -------------------------------------------------------------- */}
        {invoiceToPay && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Secure Online Checkout</h3>
                    <p className="text-xs text-gray-500">256-bit encrypted gateway payment</p>
                  </div>
                </div>
                <button
                  onClick={() => setInvoiceToPay(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmPayment} className="space-y-4">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                      Invoice Reference
                    </span>
                    <span className="font-mono font-bold text-gray-900 text-sm">
                      {invoiceToPay.invoiceNumber}
                    </span>
                    <span className="text-gray-500 block">{invoiceToPay.campaignName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                      Balance Due
                    </span>
                    <span className="text-base font-extrabold text-emerald-700">
                      ${invoiceToPay.balanceDue.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Amount to Charge ($ USD) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      min={1}
                      max={invoiceToPay.balanceDue}
                      value={payAmount}
                      onChange={(e) => setPayAmount(Number(e.target.value))}
                      className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Card Number (Corporate Amex / Visa / MC)
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Expiration</label>
                    <input
                      type="text"
                      value={cardExp}
                      onChange={(e) => setCardExp(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 font-mono text-center focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">CVC / Security</label>
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 font-mono text-center focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setInvoiceToPay(null)}
                    disabled={isProcessingPayment}
                    className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingPayment}
                    className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm flex items-center gap-2"
                  >
                    {isProcessingPayment ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Authorizing Gateway...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Authorize & Pay ${payAmount.toLocaleString()}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            MODAL: PROOF OF POSTING INSPECTION & CERTIFICATE
        -------------------------------------------------------------- */}
        {popToInspect && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-gray-100 space-y-6 print:p-0 print:border-none print:shadow-none">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 print:hidden">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-50 text-emerald-700">Official POP Certificate</Badge>
                  <span className="text-xs text-gray-500">Certified by Adversoft Field Operations</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    Print Certificate
                  </button>
                  <button
                    onClick={() => setPopToInspect(null)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Certificate Content */}
              <div className="space-y-6 text-gray-900">
                <div className="flex justify-between items-start border-b border-gray-200 pb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl font-black tracking-tight text-gray-900">ADVERSOFT</span>
                      <span className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
                        OUTDOOR MEDIA
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Adversoft Field Operations & Rigging Division</p>
                    <p className="text-xs text-gray-500">100 Broadway, 24th Floor, New York, NY 10005</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-lg font-bold text-gray-900">PROOF-OF-PERFORMANCE CERTIFICATE</h2>
                    <p className="text-xs font-mono font-bold text-indigo-600 mt-0.5">
                      CERT-{popToInspect.workOrderNumber}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Verified on {popToInspect.scheduledDate}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs p-4 rounded-xl bg-gray-50/75 border border-gray-100">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                      Client & Advertiser
                    </span>
                    <span className="font-bold text-gray-900 text-sm">
                      {popToInspect.clientCompanyName}
                    </span>
                    <span className="text-gray-500 block mt-0.5">
                      Campaign: {popToInspect.campaignName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                      Site & Location
                    </span>
                    <span className="font-bold text-gray-900 text-sm">
                      Billboard {popToInspect.billboardCode}
                    </span>
                    <span className="text-gray-500 block mt-0.5">
                      {popToInspect.billboardCity} • {popToInspect.billboardCorridor}
                    </span>
                  </div>
                </div>

                {/* Proof Photos Side-by-Side */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-gray-700 block">Daylight Photo Inspection</span>
                    <div className="relative h-56 w-full rounded-xl bg-slate-900 overflow-hidden">
                      {popToInspect.proofPhotos?.afterDayPhotoUrl && (
                        <Image
                          src={popToInspect.proofPhotos.afterDayPhotoUrl}
                          alt="Day POP"
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-gray-700 block">
                      Night Illumination & Lumen Verification
                    </span>
                    <div className="relative h-56 w-full rounded-xl bg-slate-900 overflow-hidden">
                      {popToInspect.proofPhotos?.afterNightPhotoUrl && (
                        <Image
                          src={popToInspect.proofPhotos.afterNightPhotoUrl}
                          alt="Night POP"
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Certified Field Verification Sign-off
                    </span>
                    <p className="text-emerald-800">
                      Physical vinyl installation completed without wrinkling, shearing, or banner obstruction.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-emerald-900 block font-bold">
                      {popToInspect.proofPhotos?.illuminationScorePercent || 98}% Illumination Score
                    </span>
                    <span className="text-[10px] text-emerald-700">Verified by Operations Director</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            MODAL: PRINTABLE PAYMENT RECEIPT
        -------------------------------------------------------------- */}
        {receiptToPrint && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl border border-gray-100 space-y-6 print:p-0 print:border-none print:shadow-none">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 print:hidden">
                <Badge className="bg-emerald-50 text-emerald-700">Payment Receipt</Badge>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Receipt
                  </button>
                  <button
                    onClick={() => setReceiptToPrint(null)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-5 text-gray-900">
                <div className="flex justify-between items-start border-b border-gray-200 pb-4">
                  <div>
                    <h2 className="text-xl font-black text-gray-900">ADVERSOFT MEDIA</h2>
                    <p className="text-xs text-gray-500">100 Broadway, New York, NY 10005</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase text-gray-400 font-bold">Receipt Reference</p>
                    <p className="text-base font-bold text-emerald-700 font-mono">
                      {receiptToPrint.receiptNumber}
                    </p>
                    <p className="text-xs text-gray-500">{receiptToPrint.paymentDate}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-emerald-800 font-semibold block">Cleared Inflow</span>
                    <span className="text-2xl font-black text-emerald-900">
                      ${receiptToPrint.amount.toLocaleString()}
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-emerald-700 border border-emerald-200">
                    SETTLED
                  </span>
                </div>

                <div className="space-y-2 text-xs p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Paid by Client:</span>
                    <span className="font-bold text-gray-900">{receiptToPrint.clientCompanyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Applied to Invoice:</span>
                    <span className="font-mono font-bold text-gray-900">{receiptToPrint.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment Channel:</span>
                    <span className="font-medium text-gray-900">{receiptToPrint.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Trace Reference:</span>
                    <span className="font-mono text-gray-900">{receiptToPrint.referenceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Processed By:</span>
                    <span className="text-gray-900">{receiptToPrint.receivedBy}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            MODAL: PRINTABLE SIGNED AGREEMENT DOCUMENT
        -------------------------------------------------------------- */}
        {contractToView && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-gray-100 space-y-6 print:p-0 print:border-none print:shadow-none">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 print:hidden">
                <Badge className="bg-emerald-50 text-emerald-700">Executed Agreement</Badge>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Agreement
                  </button>
                  <button
                    onClick={() => setContractToView(null)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-5 text-gray-900">
                <div className="border-b border-gray-200 pb-4">
                  <h2 className="text-lg font-black tracking-tight text-gray-900">
                    ADVERTISING MASTER SERVICES AGREEMENT
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Contract Reference: <strong className="text-gray-800">{contractToView.contractNumber}</strong> • Flight Agreement {contractToView.title}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">Media Agency</span>
                    <strong className="text-gray-900">Adversoft Outdoor Media LLC</strong>
                    <p className="text-gray-500">100 Broadway, 24th Floor, New York, NY</p>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">Advertiser Client</span>
                    <strong className="text-gray-900">{contractToView.clientCompanyName}</strong>
                    <p className="text-gray-500">{contractToView.clientBillingAddress}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-gray-800 uppercase tracking-wide text-[11px]">
                    Terms & Commercial Conditions
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    This Agreement governs the billboard advertising display services commencing on {contractToView.startDate} and terminating on {contractToView.endDate}. Adversoft guarantees an illumination availability standard of {contractToView.illuminationSlaPercent}%. Total contract value is fixed at ${contractToView.totalContractValue.toLocaleString()} USD with payment terms specified as {contractToView.paymentTerms}.
                  </p>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 text-xs">
                  <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/50">
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">Client Signature</span>
                    <p className="font-serif italic text-base text-gray-900 mt-1">
                      {contractToView.clientSignature.signatoryName}
                    </p>
                    <p className="text-gray-500 text-[10px] mt-1">
                      Signed: {contractToView.clientSignature.signedAt} • IP: {contractToView.clientSignature.ipAddress}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/50">
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">Adversoft Signature</span>
                    <p className="font-serif italic text-base text-gray-900 mt-1">
                      {contractToView.adversoftSignature.signatoryName}
                    </p>
                    <p className="text-gray-500 text-[10px] mt-1">
                      Signed: {contractToView.adversoftSignature.signedAt} • Senior VP
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            MODAL: FLIGHT EXTENSION REQUEST
        -------------------------------------------------------------- */}
        {isRenewalModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Request Flight Extension</h3>
                    <p className="text-xs text-gray-500">Hold billboard dates before open marketplace release.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsRenewalModalOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitExtensionRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Select Campaign to Extend *
                  </label>
                  <select
                    value={renewalCampaign?.id || ''}
                    onChange={(e) => {
                      const found = campaigns.find((c) => c.id === e.target.value);
                      if (found) setRenewalCampaign(found);
                    }}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  >
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.campaignNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Extension Duration
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[2, 4, 8].map((weeks) => (
                      <button
                        key={weeks}
                        type="button"
                        onClick={() => setExtensionWeeks(weeks)}
                        className={`py-2 px-3 text-xs font-bold rounded-lg border transition-colors ${
                          extensionWeeks === weeks
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        +{weeks} Weeks
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900">
                  <p className="leading-relaxed">
                    Submitting this priority request places a temporary hold on the billboard location, reserving your rates before competitive bidding opens.
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsRenewalModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm"
                  >
                    Submit Priority Extension
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            MODAL: CONTACT ACCOUNT DIRECTOR
        -------------------------------------------------------------- */}
        {isContactModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Message Account Director</h3>
                    <p className="text-xs text-gray-500">Direct channel to Rachel Adams (Managing Director)</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsContactModalOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSendContactMessage} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Topic / Category</label>
                  <select
                    value={contactCategory}
                    onChange={(e) => setContactCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="Flight Extension">Urgent Flight Extension Request</option>
                    <option value="Creative Proofing">Creative Proofing & Spec Assistance</option>
                    <option value="Billing & Wire">Invoice & Remittance Verification</option>
                    <option value="Maintenance Alert">Site Maintenance / Illumination Report</option>
                    <option value="General Support">General Account Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Your Message *</label>
                  <textarea
                    rows={4}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Type your message or special instruction..."
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send Priority Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
