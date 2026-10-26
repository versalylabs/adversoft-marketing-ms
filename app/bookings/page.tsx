'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/protectedRoute';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import {
  INITIAL_BILLBOARDS,
  BillboardItem,
  BillboardStatus,
  BillboardType,
} from '@/lib/data/billboards-store';
import {
  INITIAL_CLIENTS,
  ClientAccount,
} from '@/lib/data/crm-store';
import {
  calculateFlightPrice,
  checkScheduleConflict,
  PriceCalculationResult,
} from '@/lib/data/pricing-store';
import {
  INITIAL_BOOKINGS,
  BookingRecord,
  BookingStatus,
  getBookings,
  createBooking,
  updateBookingStatus,
  extendBooking,
  cancelBooking,
  renewBooking,
  getBookingMetrics,
} from '@/lib/data/bookings-store';
import {
  getTenantBillboards,
  getTenantClients,
  getTenantBookings,
  saveTenantBookings,
} from '@/lib/tenant-store';
import {
  CalendarDays,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  DollarSign,
  ChevronRight,
  ArrowRight,
  RotateCcw,
  Calendar,
  Layers,
  Building2,
  MapPin,
  Car,
  Tag,
  SlidersHorizontal,
  X,
  FileText,
  Lock,
  Sparkles,
  Grid,
  List,
  ShieldCheck,
  TrendingUp,
  History,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; bg: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
  ACTIVE: {
    label: 'Active Flight',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    icon: CheckCircle2,
  },
  CONFIRMED: {
    label: 'Confirmed',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    icon: ShieldCheck,
  },
  RESERVED: {
    label: 'Reserved Hold',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    icon: Clock,
  },
  PENDING_REVIEW: {
    label: 'Pending Review',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    icon: AlertCircle,
  },
  DRAFT: {
    label: 'Draft',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    icon: FileText,
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    icon: Check,
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    icon: XCircle,
  },
  EXPIRED: {
    label: 'Expired',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    icon: Clock,
  },
};

export default function BookingsPage() {
  const { user, tenant } = useAuth();
  const { toast } = useToast();

  const [billboards, setBillboards] = useState<BillboardItem[]>(() => getTenantBillboards(tenant?.id));
  const [clients, setClients] = useState<ClientAccount[]>(() => getTenantClients(tenant?.id));
  const [bookings, setBookings] = useState<BookingRecord[]>(() => getTenantBookings(tenant?.id));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [clientFilter, setClientFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  useEffect(() => {
    setBillboards(getTenantBillboards(tenant?.id));
    setClients(getTenantClients(tenant?.id));
    setBookings(getTenantBookings(tenant?.id));

    const handleUpdate = () => {
      setBillboards(getTenantBillboards(tenant?.id));
      setClients(getTenantClients(tenant?.id));
      setBookings(getTenantBookings(tenant?.id));
    };

    window.addEventListener('adversoft_billboards_updated', handleUpdate);
    window.addEventListener('adversoft_crm_clients_updated', handleUpdate);
    window.addEventListener('adversoft_bookings_updated', handleUpdate);
    window.addEventListener('adversoft_tenant_changed', handleUpdate);
    return () => {
      window.removeEventListener('adversoft_billboards_updated', handleUpdate);
      window.removeEventListener('adversoft_crm_clients_updated', handleUpdate);
      window.removeEventListener('adversoft_bookings_updated', handleUpdate);
      window.removeEventListener('adversoft_tenant_changed', handleUpdate);
    };
  }, [tenant]);

  // Modals
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);

  // Extend & Cancel Inputs
  const [newExtendEndDate, setNewExtendEndDate] = useState('');
  const [extendNotes, setExtendNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  // Renewal Inputs
  const [renewStartDate, setRenewStartDate] = useState('');
  const [renewEndDate, setRenewEndDate] = useState('');

  // Guided Wizard State (5 Steps)
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [wizardClientId, setWizardClientId] = useState('');
  const [wizardCampaignName, setWizardCampaignName] = useState('');
  const [wizardBrandName, setWizardBrandName] = useState('');
  const [wizardBillboardId, setWizardBillboardId] = useState('');
  const [wizardStartDate, setWizardStartDate] = useState('2026-11-01');
  const [wizardEndDate, setWizardEndDate] = useState('2026-11-28');
  const [wizardIncludeProduction, setWizardIncludeProduction] = useState(true);
  const [wizardIncludeInstallation, setWizardIncludeInstallation] = useState(true);
  const [wizardIncludeArtworkDesign, setWizardIncludeArtworkDesign] = useState(false);
  const [wizardIncludeProofOfPosting, setWizardIncludeProofOfPosting] = useState(true);
  const [wizardApplyAgencyDiscount, setWizardApplyAgencyDiscount] = useState(false);
  const [wizardPromoCode, setWizardPromoCode] = useState('');
  const [wizardNotes, setWizardNotes] = useState('');
  const [wizardInitialStatus, setWizardInitialStatus] = useState<BookingStatus>('CONFIRMED');

  useEffect(() => {
    if (!wizardClientId && clients.length > 0) {
      setWizardClientId(clients[0].id);
    }
  }, [clients, wizardClientId]);

  useEffect(() => {
    if (!wizardBillboardId && billboards.length > 0) {
      setWizardBillboardId(billboards[0].id);
    }
  }, [billboards, wizardBillboardId]);

  // Metrics
  const metrics = useMemo(() => {
    return getBookingMetrics();
  }, [bookings]);

  // Selected client & billboard in wizard
  const wizardClient = useMemo(() => {
    return clients.find((c) => c.id === wizardClientId) || clients[0] || null;
  }, [clients, wizardClientId]);

  const wizardBillboard = useMemo(() => {
    return billboards.find((b) => b.id === wizardBillboardId) || billboards[0] || null;
  }, [billboards, wizardBillboardId]);

  // Wizard Pricing Calculation
  const wizardCalculation: PriceCalculationResult | null = useMemo(() => {
    if (!wizardBillboardId) return null;
    return calculateFlightPrice({
      billboardId: wizardBillboardId,
      startDate: wizardStartDate,
      endDate: wizardEndDate,
      includeProduction: wizardIncludeProduction,
      includeInstallation: wizardIncludeInstallation,
      includeArtworkDesign: wizardIncludeArtworkDesign,
      includeProofOfPosting: wizardIncludeProofOfPosting,
      applyAgencyDiscount: wizardApplyAgencyDiscount,
      promoCode: wizardPromoCode,
    });
  }, [
    wizardBillboardId,
    wizardStartDate,
    wizardEndDate,
    wizardIncludeProduction,
    wizardIncludeInstallation,
    wizardIncludeArtworkDesign,
    wizardIncludeProofOfPosting,
    wizardApplyAgencyDiscount,
    wizardPromoCode,
  ]);

  // Wizard Conflict Check
  const wizardConflict = useMemo(() => {
    if (!wizardBillboardId) return { hasConflict: false, conflictingSlots: [], nextAvailableDate: undefined };
    return checkScheduleConflict(wizardBillboardId, wizardStartDate, wizardEndDate);
  }, [wizardBillboardId, wizardStartDate, wizardEndDate]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      if (clientFilter !== 'ALL' && b.clientId !== clientFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchNum = b.bookingNumber.toLowerCase().includes(q);
        const matchClient = b.clientName.toLowerCase().includes(q);
        const matchCampaign = b.campaignName.toLowerCase().includes(q);
        const matchCode = b.billboardCode.toLowerCase().includes(q);
        const matchName = b.billboardName.toLowerCase().includes(q);
        const matchCity = b.billboardCity.toLowerCase().includes(q);
        if (!matchNum && !matchClient && !matchCampaign && !matchCode && !matchName && !matchCity) {
          return false;
        }
      }
      return true;
    });
  }, [bookings, statusFilter, clientFilter, searchQuery]);

  // Handle Wizard Submit
  const handleCreateBookingFromWizard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wizardCampaignName) {
      toast({
        title: 'Campaign Name Required',
        description: 'Please provide a campaign title for this booking.',
        type: 'destructive',
      });
      return;
    }

    const res = createBooking({
      clientId: wizardClientId,
      campaignName: wizardCampaignName,
      brandName: wizardBrandName || wizardClient.dbaName,
      billboardId: wizardBillboardId,
      startDate: wizardStartDate,
      endDate: wizardEndDate,
      includeProduction: wizardIncludeProduction,
      includeInstallation: wizardIncludeInstallation,
      includeArtworkDesign: wizardIncludeArtworkDesign,
      includeProofOfPosting: wizardIncludeProofOfPosting,
      applyAgencyDiscount: wizardApplyAgencyDiscount,
      promoCode: wizardPromoCode,
      notes: wizardNotes,
      authorName: user?.name || 'Sales Agent',
      initialStatus: wizardInitialStatus,
    });

    if (!res.success || !res.booking) {
      toast({
        title: 'Booking Creation Blocked',
        description: res.error,
        type: 'destructive',
      });
      return;
    }

    const updated = [res.booking, ...bookings];
    setBookings(updated);
    saveTenantBookings(updated, tenant?.id);
    setIsWizardOpen(false);
    setWizardStep(1);
    setWizardCampaignName('');
    setWizardNotes('');

    toast({
      title: 'Booking Created Successfully!',
      description: `${res.booking.bookingNumber} established for ${res.booking.clientName}. Total value: $${res.booking.totalAmount.toLocaleString()}`,
      type: 'success',
    });
  };

  // Handle Extend Booking
  const handleExtendBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !newExtendEndDate) return;

    const res = extendBooking(selectedBooking.id, newExtendEndDate, user?.name || 'Agent', extendNotes);
    if (!res.success || !res.booking) {
      toast({
        title: 'Extension Conflict',
        description: res.error,
        type: 'destructive',
      });
      return;
    }

    const updated = bookings.map((b) => (b.id === res.booking!.id ? res.booking! : b));
    setBookings(updated);
    saveTenantBookings(updated, tenant?.id);
    setSelectedBooking(res.booking);
    setIsExtendModalOpen(false);
    setNewExtendEndDate('');
    setExtendNotes('');

    toast({
      title: 'Flight Extended!',
      description: `Flight extended to ${res.booking.endDate}. New total: $${res.booking.totalAmount.toLocaleString()}`,
      type: 'success',
    });
  };

  // Handle Cancel Booking
  const handleCancelBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !cancelReason) return;

    const res = cancelBooking(selectedBooking.id, cancelReason, user?.name || 'Agent');
    if (!res.success || !res.booking) {
      toast({
        title: 'Error',
        description: res.error,
        type: 'destructive',
      });
      return;
    }

    const updated = bookings.map((b) => (b.id === res.booking!.id ? res.booking! : b));
    setBookings(updated);
    saveTenantBookings(updated, tenant?.id);
    setSelectedBooking(res.booking);
    setIsCancelModalOpen(false);
    setCancelReason('');

    toast({
      title: 'Booking Cancelled',
      description: `Booking ${res.booking.bookingNumber} marked cancelled. Inventory slot released.`,
      type: 'warning',
    });
  };

  // Handle Renew Booking
  const handleRenewBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !renewStartDate || !renewEndDate) return;

    const res = renewBooking(selectedBooking.id, renewStartDate, renewEndDate, user?.name || 'Agent');
    if (!res.success || !res.newBooking) {
      toast({
        title: 'Renewal Collision',
        description: res.error,
        type: 'destructive',
      });
      return;
    }

    const updated = [res.newBooking, ...bookings];
    setBookings(updated);
    saveTenantBookings(updated, tenant?.id);
    setIsRenewModalOpen(false);
    setSelectedBooking(res.newBooking);
    setRenewStartDate('');
    setRenewEndDate('');

    toast({
      title: 'Renewal Confirmed!',
      description: `New booking ${res.newBooking.bookingNumber} created for renewal flight.`,
      type: 'success',
    });
  };

  // Handle Status Update
  const handleQuickStatusChange = (bookingId: string, newStatus: BookingStatus) => {
    const updatedRecord = updateBookingStatus(bookingId, newStatus, user?.name || 'Agent', `Status manually transitioned to ${newStatus}`);
    if (updatedRecord) {
      const updated = bookings.map((b) => (b.id === updatedRecord.id ? updatedRecord : b));
      setBookings(updated);
      saveTenantBookings(updated, tenant?.id);
      if (selectedBooking && selectedBooking.id === updatedRecord.id) {
        setSelectedBooking(updatedRecord);
      }
      toast({
        title: 'Status Updated',
        description: `${updatedRecord.bookingNumber} is now ${newStatus}.`,
        type: 'info',
      });
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6 pb-12 animate-in fade-in duration-300">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase bg-indigo-50 text-indigo-700">
                Commercial Operations
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
                Commercial Booking Lifecycle
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Booking Management System
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Select Client → Select Billboard → Check Availability → Calculate Yield → Confirm Flights, Extensions & Renewals.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/pricing"
              className="px-3.5 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-xs flex items-center gap-2 transition-all shadow-sm"
            >
              <DollarSign className="w-4 h-4 text-amber-500" />
              <span>Yield Pricing</span>
            </Link>

            <button
              onClick={() => {
                setWizardStep(1);
                setIsWizardOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs flex items-center gap-2 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Booking Wizard</span>
            </button>
          </div>
        </div>

        {/* Metric Cards Summary - Dashboard Clean Style */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Card 1: Active Flights */}
          <Card className="p-4 border-gray-100 shadow-sm bg-white hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Active on Street</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-600">{metrics.active}</div>
            <div className="text-[11px] text-gray-400 mt-1">Live active display flights</div>
          </Card>

          {/* Card 2: Confirmed Bookings */}
          <Card className="p-4 border-gray-100 shadow-sm bg-white hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Confirmed Upcoming</span>
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-extrabold text-indigo-600">{metrics.confirmed}</div>
            <div className="text-[11px] text-gray-400 mt-1">Locked contract flights</div>
          </Card>

          {/* Card 3: Reserved Holds */}
          <Card className="p-4 border-gray-100 shadow-sm bg-white hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Reserved Holds</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-amber-600">{metrics.reserved}</div>
            <div className="text-[11px] text-gray-400 mt-1">5-day expiration holds</div>
          </Card>

          {/* Card 4: Pending Review */}
          <Card className="p-4 border-gray-100 shadow-sm bg-white hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Pending Review</span>
              <AlertCircle className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-extrabold text-purple-600">{metrics.pending}</div>
            <div className="text-[11px] text-gray-400 mt-1">Awaiting credit approval</div>
          </Card>

          {/* Card 5: Contracted Pipeline Value */}
          <Card className="p-4 border-gray-100 shadow-sm bg-white hover:shadow-md transition-shadow col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Contracted Value</span>
              <DollarSign className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-extrabold text-gray-900">
              ${(metrics.totalContractValue / 1000).toFixed(0)}k
            </div>
            <div className="text-[11px] text-indigo-600 mt-1">Active booking revenue</div>
          </Card>
        </div>

        {/* Filter and View Bar - Clean White Card */}
        <Card className="p-4 border-gray-100 shadow-sm bg-white space-y-3.5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search booking #, client, campaign, billboard..."
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Filters & View Switcher */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Client Filter */}
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-700 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              >
                <option value="ALL">All Client Accounts</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('cards')}
                  title="Card View"
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === 'cards'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  title="Dense Table View"
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === 'table'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto border-t border-gray-100 pt-3">
            <span className="text-xs text-gray-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Status:
            </span>
            {(['ALL', 'ACTIVE', 'CONFIRMED', 'RESERVED', 'PENDING_REVIEW', 'COMPLETED', 'CANCELLED'] as const).map((st) => {
              const count =
                st === 'ALL'
                  ? bookings.length
                  : bookings.filter((b) => b.status === st).length;
              const isActive = statusFilter === st;

              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'
                  }`}
                >
                  <span>{st === 'ALL' ? 'All Bookings' : STATUS_CONFIG[st].label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-white/20 text-white' : 'bg-white text-gray-500 shadow-xs'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Results View: Cards vs Table */}
        {bookings.length === 0 ? (
          <Card className="p-12 text-center border-gray-100 bg-white space-y-3">
            <CalendarDays className="w-10 h-10 text-indigo-400 mx-auto" />
            <h3 className="text-base font-semibold text-gray-900">No Bookings in this Workspace Yet</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Your clean workspace starts fresh with zero booking reservations. Launch your first billboard campaign flight now.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setIsWizardOpen(true)}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm"
              >
                + Create First Booking
              </button>
            </div>
          </Card>
        ) : filteredBookings.length === 0 ? (
          <Card className="p-12 text-center border-gray-100 bg-white space-y-3">
            <CalendarDays className="w-8 h-8 text-gray-400 mx-auto" />
            <h3 className="text-base font-semibold text-gray-900">No Bookings Found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              No booking records match your active search terms or filter criteria.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setClientFilter('ALL');
              }}
              className="px-4 py-1.5 text-xs font-semibold text-indigo-600 hover:underline"
            >
              Clear Filters
            </button>
          </Card>
        ) : viewMode === 'cards' ? (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBookings.map((b) => {
              const statusCfg = STATUS_CONFIG[b.status];
              const StatusIcon = statusCfg.icon;

              return (
                <Card
                  key={b.id}
                  className="border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between overflow-hidden bg-white"
                >
                  {/* Top Bar with Thumbnail & Badges */}
                  <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-start gap-3">
                    <div className="w-16 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200/60">
                      <img
                        src={b.billboardThumbnail}
                        alt={b.billboardName}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-mono text-xs font-bold text-indigo-600">
                          {b.bookingNumber}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${statusCfg.bg} ${statusCfg.text}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusCfg.label}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-gray-900 line-clamp-1">
                        {b.campaignName}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {b.clientName}
                      </p>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3 flex-1 text-xs">
                    {/* Structure Info */}
                    <div className="p-2.5 rounded-lg bg-gray-50 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-gray-900 text-xs block">
                          {b.billboardCode} — {b.billboardName}
                        </span>
                        <span className="text-[11px] text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {b.billboardCity} • {b.billboardCorridor}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                        {b.billboardType.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Flight Dates & Duration */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-gray-400 block">Flight Term</span>
                        <span className="font-semibold text-gray-900 font-mono">
                          {b.startDate}
                        </span>
                        <span className="text-gray-400 text-[10px] block">to {b.endDate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block">Duration</span>
                        <span className="font-bold text-gray-900">
                          {b.durationDays} Days ({b.durationWeeks}w)
                        </span>
                        {b.holdExpiresAt && b.status === 'RESERVED' && (
                          <span className="text-[10px] text-amber-600 font-medium block">
                            Hold Exp: {b.holdExpiresAt}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Services Included */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {b.includeProduction && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-700">
                          Vinyl Print
                        </span>
                      )}
                      {b.includeInstallation && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-700">
                          Rigging & Mount
                        </span>
                      )}
                      {b.includeArtworkDesign && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-700">
                          Creative Design
                        </span>
                      )}
                      {b.includeProofOfPosting && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-700">
                          POP Certified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <div>
                      <div className="text-base font-extrabold text-gray-900 font-mono">
                        ${b.totalAmount.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        Base: ${b.baseAmount.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center gap-1 transition-all"
                      >
                        <span>Inspect</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <Card className="border-gray-100 shadow-sm bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Booking #</th>
                    <th className="py-3 px-3 font-semibold">Client & Campaign</th>
                    <th className="py-3 px-3 font-semibold">Billboard Asset</th>
                    <th className="py-3 px-3 font-semibold">Flight Interval</th>
                    <th className="py-3 px-3 font-semibold">Duration</th>
                    <th className="py-3 px-3 font-semibold">Total Investment</th>
                    <th className="py-3 px-3 font-semibold">Status</th>
                    <th className="py-3 px-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBookings.map((b) => {
                    const statusCfg = STATUS_CONFIG[b.status];
                    const StatusIcon = statusCfg.icon;

                    return (
                      <tr key={b.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                          {b.bookingNumber}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-gray-900">{b.campaignName}</div>
                          <div className="text-gray-500 text-[11px]">{b.clientName}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-gray-900">{b.billboardCode}</div>
                          <div className="text-gray-400 text-[11px] line-clamp-1">
                            {b.billboardCity} • {b.billboardCorridor}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px]">
                          <div className="text-gray-900">{b.startDate}</div>
                          <div className="text-gray-400">→ {b.endDate}</div>
                        </td>
                        <td className="py-3 px-3 font-medium text-gray-700">
                          {b.durationDays}d ({b.durationWeeks}w)
                        </td>
                        <td className="py-3 px-3 font-bold font-mono text-gray-900">
                          ${b.totalAmount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold ${statusCfg.bg} ${statusCfg.text}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedBooking(b)}
                            className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-all"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ========================================================================= */}
        {/* MODAL 1: 360° BOOKING DETAIL INSPECTION DRAWER */}
        {/* ========================================================================= */}
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative border border-gray-100">
              <button
                onClick={() => setSelectedBooking(null)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="border-b border-gray-100 pb-4 pr-10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    {selectedBooking.bookingNumber}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-xs ${STATUS_CONFIG[selectedBooking.status].bg} ${STATUS_CONFIG[selectedBooking.status].text}`}
                  >
                    {STATUS_CONFIG[selectedBooking.status].label}
                  </span>
                  {selectedBooking.holdExpiresAt && selectedBooking.status === 'RESERVED' && (
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      Hold Expires: {selectedBooking.holdExpiresAt}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedBooking.campaignName}
                </h2>
                <p className="text-xs text-gray-500">
                  Client: <strong className="text-gray-900">{selectedBooking.clientName}</strong> • Brand: {selectedBooking.brandName}
                </p>
              </div>

              {/* Operations Action Bar */}
              <div className="py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {selectedBooking.status === 'RESERVED' && (
                    <button
                      onClick={() => handleQuickStatusChange(selectedBooking.id, 'CONFIRMED')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-all flex items-center gap-1 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Lock & Confirm Booking</span>
                    </button>
                  )}

                  {selectedBooking.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleQuickStatusChange(selectedBooking.id, 'ACTIVE')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-all flex items-center gap-1 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Activate Flight</span>
                    </button>
                  )}

                  {selectedBooking.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleQuickStatusChange(selectedBooking.id, 'COMPLETED')}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-all flex items-center gap-1 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Flight Complete</span>
                    </button>
                  )}

                  {['ACTIVE', 'CONFIRMED', 'RESERVED'].includes(selectedBooking.status) && (
                    <button
                      onClick={() => {
                        setNewExtendEndDate(selectedBooking.endDate);
                        setIsExtendModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-700 transition-all flex items-center gap-1"
                    >
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Extend Flight</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      const nextMonthStart = new Date(selectedBooking.endDate);
                      nextMonthStart.setDate(nextMonthStart.getDate() + 1);
                      const nextMonthEnd = new Date(nextMonthStart);
                      nextMonthEnd.setDate(nextMonthEnd.getDate() + selectedBooking.durationDays);
                      setRenewStartDate(nextMonthStart.toISOString().split('T')[0]);
                      setRenewEndDate(nextMonthEnd.toISOString().split('T')[0]);
                      setIsRenewModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-700 transition-all flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Renew Booking</span>
                  </button>
                </div>

                {selectedBooking.status !== 'CANCELLED' && selectedBooking.status !== 'COMPLETED' && (
                  <button
                    onClick={() => setIsCancelModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-medium transition-all flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel Booking</span>
                  </button>
                )}
              </div>

              {/* Main Content Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
                {/* Left: Structure & Schedule */}
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gray-50 space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block">
                      Billboard Asset & Location
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-14 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                        <img
                          src={selectedBooking.billboardThumbnail}
                          alt={selectedBooking.billboardName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-xs">
                          {selectedBooking.billboardCode} — {selectedBooking.billboardName}
                        </h4>
                        <p className="text-[11px] text-gray-500">
                          {selectedBooking.billboardCity} • {selectedBooking.billboardCorridor}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 space-y-2.5 text-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block">
                      Flight Schedule & Duration
                    </span>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Flight Start Date:</span>
                      <span className="font-semibold text-gray-900 font-mono">{selectedBooking.startDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Flight End Date:</span>
                      <span className="font-semibold text-gray-900 font-mono">{selectedBooking.endDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Continuous Duration:</span>
                      <span className="font-bold text-gray-900">
                        {selectedBooking.durationDays} Days ({selectedBooking.durationWeeks} Weeks)
                      </span>
                    </div>
                  </div>

                  {/* Audit History Stream */}
                  <div className="p-4 rounded-xl bg-gray-50 space-y-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-indigo-600" />
                      Lifecycle Audit History
                    </span>
                    <div className="space-y-2 text-xs">
                      {selectedBooking.history.map((ev) => (
                        <div key={ev.id} className="p-2.5 rounded-lg bg-white border border-gray-100 shadow-xs">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-gray-900">{ev.action}</span>
                            <span className="text-gray-400 text-[10px]">{ev.timestamp}</span>
                          </div>
                          <p className="text-gray-500 text-[11px] mt-0.5">{ev.details}</p>
                          <span className="text-[10px] text-indigo-600 block mt-1">By: {ev.author}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Commercial Yield & Financials */}
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gray-50 space-y-2.5 text-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                      Commercial Fee Breakdown
                    </span>
                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                      <span className="text-gray-500">Base Media Flight Rental:</span>
                      <span className="font-mono font-semibold text-gray-900">
                        ${selectedBooking.baseAmount.toLocaleString()}
                      </span>
                    </div>
                    {selectedBooking.seasonalSurgeAmount > 0 && (
                      <div className="flex justify-between py-1 border-b border-gray-200/60">
                        <span className="text-gray-500">Seasonal Surge Adjustment:</span>
                        <span className="font-mono font-semibold text-amber-600">
                          +${selectedBooking.seasonalSurgeAmount.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {selectedBooking.discountAmount > 0 && (
                      <div className="flex justify-between py-1 border-b border-gray-200/60">
                        <span className="text-gray-500">Duration & Commercial Discounts:</span>
                        <span className="font-mono font-semibold text-emerald-600">
                          -${selectedBooking.discountAmount.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {selectedBooking.productionCost > 0 && (
                      <div className="flex justify-between py-1 border-b border-gray-200/60">
                        <span className="text-gray-500">Vinyl Printing & Fabrication:</span>
                        <span className="font-mono font-semibold text-gray-900">
                          +${selectedBooking.productionCost.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {selectedBooking.installationCost > 0 && (
                      <div className="flex justify-between py-1 border-b border-gray-200/60">
                        <span className="text-gray-500">Rigging & Mounting Services:</span>
                        <span className="font-mono font-semibold text-gray-900">
                          +${selectedBooking.installationCost.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {selectedBooking.creativeCost > 0 && (
                      <div className="flex justify-between py-1 border-b border-gray-200/60">
                        <span className="text-gray-500">Custom Studio Creative Adaptation:</span>
                        <span className="font-mono font-semibold text-gray-900">
                          +${selectedBooking.creativeCost.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                      <span className="text-gray-500">Municipal & State Advertising Tax:</span>
                      <span className="font-mono font-semibold text-gray-900">
                        ${selectedBooking.taxAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 items-center text-sm font-bold">
                      <span className="text-gray-900">Contract Total Amount:</span>
                      <span className="font-mono text-xl text-indigo-600">
                        ${selectedBooking.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {selectedBooking.notes && (
                    <div className="p-3.5 rounded-xl bg-gray-50 text-xs">
                      <span className="text-gray-500 font-semibold uppercase text-[10px] block mb-1">
                        Contract Notes & Terms
                      </span>
                      <p className="text-gray-700 leading-relaxed">{selectedBooking.notes}</p>
                    </div>
                  )}

                  {selectedBooking.cancellationReason && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-xs space-y-1">
                      <span className="text-rose-700 font-bold uppercase text-[10px] block">
                        Cancellation Record
                      </span>
                      <p className="text-rose-600">{selectedBooking.cancellationReason}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 2: 5-STEP GUIDED BOOKING WIZARD */}
        {/* ========================================================================= */}
        {isWizardOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative border border-gray-100">
              <button
                onClick={() => setIsWizardOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Wizard Progress Stepper */}
              <div className="border-b border-gray-100 pb-4 mb-5 pr-8">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 block mb-1">
                  Guided Booking Flow
                </span>
                <h2 className="text-xl font-bold text-gray-900">
                  Create Billboard Booking #{bookings.length + 1}
                </h2>

                <div className="flex items-center gap-2 mt-4">
                  {[
                    { step: 1, label: 'Client' },
                    { step: 2, label: 'Billboard' },
                    { step: 3, label: 'Dates & Collisions' },
                    { step: 4, label: 'Add-ons' },
                    { step: 5, label: 'Review & Confirm' },
                  ].map((s) => (
                    <div key={s.step} className="flex-1 flex items-center gap-2">
                      <div
                        className={`h-2 rounded-full flex-1 transition-all ${
                          wizardStep >= s.step ? 'bg-indigo-600' : 'bg-gray-200'
                        }`}
                      />
                      <span
                        className={`text-[10px] font-semibold hidden sm:inline ${
                          wizardStep === s.step ? 'text-indigo-600' : 'text-gray-400'
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* STEP 1: SELECT CLIENT */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    Step 1: Select Client & Brand Account
                  </h3>
                  <p className="text-xs text-gray-500">
                    Assign this contract booking to an existing enterprise advertiser in the CRM.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">
                        Client Corporate Account *
                      </label>
                      {clients.length === 0 ? (
                        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-2">
                          <p className="font-semibold">No Client Accounts in Workspace</p>
                          <p className="text-[11px] text-amber-700">Before creating a booking, register at least one client account in your CRM directory.</p>
                          <Link
                            href="/crm"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-xs"
                          >
                            <span>Add Client in CRM</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      ) : (
                        <select
                          value={wizardClientId}
                          onChange={(e) => setWizardClientId(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                        >
                          {clients.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.companyName} ({c.industry} • Account: {c.accountNumber})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">
                        Campaign Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={wizardCampaignName}
                        onChange={(e) => setWizardCampaignName(e.target.value)}
                        placeholder="e.g. Q4 Holiday Brand Spotlight"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">
                        Brand / Product Sub-name
                      </label>
                      <input
                        type="text"
                        value={wizardBrandName}
                        onChange={(e) => setWizardBrandName(e.target.value)}
                        placeholder={`e.g. ${wizardClient?.dbaName || 'Brand Division'}`}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button
                      disabled={clients.length === 0}
                      onClick={() => {
                        if (!wizardCampaignName.trim()) {
                          toast({ title: 'Campaign Name Required', type: 'destructive' });
                          return;
                        }
                        setWizardStep(2);
                      }}
                      className={`px-5 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all ${
                        clients.length === 0
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      <span>Proceed to Billboard Selection</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: SELECT BILLBOARD */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    Step 2: Select Billboard Structure
                  </h3>
                  <p className="text-xs text-gray-500">
                    Choose the target advertising asset for this client flight.
                  </p>

                  {billboards.length === 0 ? (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-2">
                      <p className="font-semibold">No Billboards Registered in Workspace</p>
                      <p className="text-[11px] text-amber-700">Before selecting a structure, register your first billboard asset in your inventory directory.</p>
                      <Link
                        href="/billboards"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-xs"
                      >
                        <span>Add Billboard Asset</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                      {billboards.map((b) => (
                        <div
                          key={b.id}
                          onClick={() => setWizardBillboardId(b.id)}
                          className={`p-3 rounded-xl cursor-pointer transition-all flex items-start gap-3 border ${
                            wizardBillboardId === b.id
                              ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="w-14 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                            <img src={b.photos[0] || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80'} alt={b.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0 text-xs">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-mono font-bold text-indigo-600">{b.code}</span>
                              <span className="font-bold text-gray-900">${b.monthlyRate.toLocaleString()}/mo</span>
                            </div>
                            <div className="font-semibold text-gray-900 line-clamp-1">{b.name}</div>
                            <div className="text-[10px] text-gray-500">{b.location.city} • {b.type}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setWizardStep(1)}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100"
                    >
                      Back
                    </button>
                    <button
                      disabled={billboards.length === 0}
                      onClick={() => setWizardStep(3)}
                      className={`px-5 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all ${
                        billboards.length === 0
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      <span>Proceed to Schedule & Conflict Check</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: SCHEDULE DATES & CONFLICT CHECK */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    Step 3: Flight Schedule & Automated Collision Check
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">
                        Flight Start Date
                      </label>
                      <input
                        type="date"
                        value={wizardStartDate}
                        onChange={(e) => setWizardStartDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs font-mono text-gray-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">
                        Flight End Date
                      </label>
                      <input
                        type="date"
                        value={wizardEndDate}
                        onChange={(e) => setWizardEndDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs font-mono text-gray-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>
                  </div>

                  {/* Conflict Result Alert */}
                  {wizardConflict.hasConflict ? (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-rose-700 font-bold uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4" />
                        Double-Booking Collision Detected!
                      </div>
                      <p className="text-rose-600">
                        {wizardBillboard.code} is already booked or held during this period by{' '}
                        <strong>{wizardConflict.conflictingSlots[0]?.clientName}</strong>.
                      </p>
                      {wizardConflict.nextAvailableDate && (
                        <div className="font-mono text-[11px] text-emerald-700 font-semibold">
                          Next open window begins: {wizardConflict.nextAvailableDate}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2 text-xs text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Clean Window: No overlapping bookings detected for {wizardBillboard.code}!</span>
                    </div>
                  )}

                  <div className="flex justify-between pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setWizardStep(2)}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100"
                    >
                      Back
                    </button>
                    <button
                      disabled={wizardConflict.hasConflict}
                      onClick={() => setWizardStep(4)}
                      className={`px-5 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 ${
                        wizardConflict.hasConflict
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                      }`}
                    >
                      <span>Proceed to Add-ons</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: ADD-ONS & SERVICES */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-indigo-600" />
                    Step 4: Production Add-ons & Commercial Allowances
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <label className="p-3 rounded-xl border border-gray-200 hover:border-gray-300 bg-white cursor-pointer flex items-center gap-3">
                      <input
                        type="checkbox"
                        disabled={wizardBillboard?.isDigital}
                        checked={wizardIncludeProduction && !wizardBillboard?.isDigital}
                        onChange={(e) => setWizardIncludeProduction(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600"
                      />
                      <div>
                        <div className="font-semibold text-gray-900">Vinyl Printing & Fabrication</div>
                        <div className="text-[11px] text-gray-500">+${(wizardBillboard?.productionCost || 1200).toLocaleString()}</div>
                      </div>
                    </label>

                    <label className="p-3 rounded-xl border border-gray-200 hover:border-gray-300 bg-white cursor-pointer flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={wizardIncludeInstallation}
                        onChange={(e) => setWizardIncludeInstallation(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600"
                      />
                      <div>
                        <div className="font-semibold text-gray-900">Rigging & Installation / Ingest</div>
                        <div className="text-[11px] text-gray-500">+${(wizardBillboard?.installationCost || 750).toLocaleString()}</div>
                      </div>
                    </label>

                    <label className="p-3 rounded-xl border border-gray-200 hover:border-gray-300 bg-white cursor-pointer flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={wizardIncludeArtworkDesign}
                        onChange={(e) => setWizardIncludeArtworkDesign(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600"
                      />
                      <div>
                        <div className="font-semibold text-gray-900">Custom Studio Creative Adaptation</div>
                        <div className="text-[11px] text-gray-500">+$750 (Graphic design & QA)</div>
                      </div>
                    </label>

                    <label className="p-3 rounded-xl border border-gray-200 hover:border-gray-300 bg-white cursor-pointer flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={wizardIncludeProofOfPosting}
                        onChange={(e) => setWizardIncludeProofOfPosting(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600"
                      />
                      <div>
                        <div className="font-semibold text-gray-900">Certified POP Photo Kit</div>
                        <div className="text-[11px] text-gray-500">+$150 (Geo-stamped photo audit)</div>
                      </div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <label className="p-3 rounded-xl border border-gray-200 hover:border-gray-300 bg-white cursor-pointer flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={wizardApplyAgencyDiscount}
                        onChange={(e) => setWizardApplyAgencyDiscount(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600"
                      />
                      <div className="text-xs">
                        <div className="font-semibold text-gray-900">Accredited 4A Agency Partner</div>
                        <div className="text-[11px] text-gray-500">Apply -15% agency commission</div>
                      </div>
                    </label>

                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">
                        Promo Voucher Code
                      </label>
                      <input
                        type="text"
                        value={wizardPromoCode}
                        onChange={(e) => setWizardPromoCode(e.target.value)}
                        placeholder="e.g. EARLY2026"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-mono uppercase text-gray-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setWizardStep(3)}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setWizardStep(5)}
                      className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs flex items-center gap-1.5 hover:bg-indigo-700 shadow-sm"
                    >
                      <span>Proceed to Final Review</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: REVIEW & CONFIRM */}
              {wizardStep === 5 && wizardCalculation && (
                <form onSubmit={handleCreateBookingFromWizard} className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Step 5: Review Yield Pricing & Confirm Booking
                  </h3>

                  {/* Summary Card */}
                  <div className="p-4 rounded-xl bg-gray-50 space-y-3 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-gray-900 text-sm">{wizardCampaignName}</div>
                        <div className="text-gray-500">{wizardClient?.companyName}</div>
                      </div>
                      <span className="font-mono font-bold text-indigo-600">{wizardBillboard?.code}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-gray-200/60">
                      <div>
                        <span className="text-gray-400 block text-[10px]">Flight Interval:</span>
                        <span className="font-mono font-semibold text-gray-900">
                          {wizardStartDate} → {wizardEndDate}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Calculated Duration:</span>
                        <span className="font-semibold text-gray-900">
                          {wizardCalculation.totalDays} Days ({wizardCalculation.totalWeeks} Weeks)
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm font-bold pt-1">
                      <span className="text-gray-900">Total Contract Value:</span>
                      <span className="font-mono text-xl text-indigo-600">
                        ${wizardCalculation.grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Initial Booking Status
                    </label>
                    <select
                      value={wizardInitialStatus}
                      onChange={(e) => setWizardInitialStatus(e.target.value as BookingStatus)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    >
                      <option value="CONFIRMED">CONFIRMED (Contract signed & locked)</option>
                      <option value="RESERVED">RESERVED (5-day hold period)</option>
                      <option value="PENDING_REVIEW">PENDING REVIEW (Credit check pending)</option>
                      <option value="DRAFT">DRAFT (Sales proposal)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Contract Notes / Billing Memo
                    </label>
                    <textarea
                      rows={2}
                      value={wizardNotes}
                      onChange={(e) => setWizardNotes(e.target.value)}
                      placeholder="Add any specific mounting terms or invoice references..."
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>

                  <div className="flex justify-between pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setWizardStep(4)}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-all shadow-sm"
                    >
                      Confirm & Create Booking
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 3: EXTEND BOOKING */}
        {/* ========================================================================= */}
        {isExtendModalOpen && selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 border border-gray-100">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Extend Flight Term</h3>
                  <p className="text-xs text-gray-500 font-mono">{selectedBooking.bookingNumber}</p>
                </div>
                <button onClick={() => setIsExtendModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleExtendBooking} className="space-y-4">
                <div className="text-xs text-gray-500">
                  Current End Date: <strong className="text-gray-900 font-mono">{selectedBooking.endDate}</strong>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    New Extended End Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={selectedBooking.endDate}
                    value={newExtendEndDate}
                    onChange={(e) => setNewExtendEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-mono text-gray-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Extension Reason / Client Amendment
                  </label>
                  <textarea
                    rows={2}
                    value={extendNotes}
                    onChange={(e) => setExtendNotes(e.target.value)}
                    placeholder="e.g. Client requested 2-week flight extension via Amendment #1."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsExtendModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                  >
                    Confirm Extension
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 4: CANCEL BOOKING */}
        {/* ========================================================================= */}
        {isCancelModalOpen && selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 border border-gray-100">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2 text-rose-600">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="text-base font-bold text-gray-900">Cancel Booking</h3>
                </div>
                <button onClick={() => setIsCancelModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                Cancelling <strong className="text-gray-900">{selectedBooking.bookingNumber}</strong> ({selectedBooking.campaignName}) will release the schedule window and return <strong className="text-gray-900">{selectedBooking.billboardCode}</strong> back to the available inventory pool.
              </p>

              <form onSubmit={handleCancelBooking} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Cancellation Reason *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="e.g. Client media campaign postponed to Q2 2027..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsCancelModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100"
                  >
                    Keep Booking
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-xs font-medium bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
                  >
                    Confirm Cancellation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 5: RENEW BOOKING */}
        {/* ========================================================================= */}
        {isRenewModalOpen && selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 border border-gray-100">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-gray-900">Renew Booking Contract</h3>
                </div>
                <button onClick={() => setIsRenewModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                Create a renewed follow-up flight on <strong className="text-gray-900">{selectedBooking.billboardCode}</strong> for <strong className="text-gray-900">{selectedBooking.clientName}</strong>. Existing vinyl can be reused without extra production fees.
              </p>

              <form onSubmit={handleRenewBooking} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      New Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={renewStartDate}
                      onChange={(e) => setRenewStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-mono text-gray-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      New End Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={renewEndDate}
                      onChange={(e) => setRenewEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-mono text-gray-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsRenewModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                  >
                    Confirm Renewal
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
