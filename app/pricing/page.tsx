'use client';

import React, { useState, useMemo } from 'react';
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
  SEASONAL_RULES,
  DISCOUNT_RULES,
  SERVICE_FEES,
  calculateFlightPrice,
  checkScheduleConflict,
  createFlightHold,
  getAllSchedules,
  FlightScheduleSlot,
  PriceCalculationResult,
} from '@/lib/data/pricing-store';
import {
  Calculator,
  Calendar,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  ShieldCheck,
  Percent,
  Layers,
  Sparkles,
  Zap,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Plus,
  Eye,
  Sliders,
  Check,
  X,
  FileText,
  BadgeAlert,
  ChevronRight,
  MapPin,
  ExternalLink,
  Lock,
} from 'lucide-react';

export default function PricingAvailabilityPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'calculator' | 'timeline' | 'conflict' | 'ratecards'>('calculator');

  // Calculator Form State
  const [selectedBillboardId, setSelectedBillboardId] = useState<string>(INITIAL_BILLBOARDS[0].id);
  const [startDate, setStartDate] = useState<string>('2026-11-01');
  const [endDate, setEndDate] = useState<string>('2026-11-28');
  const [includeProduction, setIncludeProduction] = useState<boolean>(true);
  const [includeInstallation, setIncludeInstallation] = useState<boolean>(true);
  const [includeArtworkDesign, setIncludeArtworkDesign] = useState<boolean>(false);
  const [includeProofOfPosting, setIncludeProofOfPosting] = useState<boolean>(true);
  const [applyAgencyDiscount, setApplyAgencyDiscount] = useState<boolean>(false);
  const [promoCode, setPromoCode] = useState<string>('');

  // Hold Modal State
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [holdClientName, setHoldClientName] = useState('');
  const [holdCampaignName, setHoldCampaignName] = useState('');
  const [holdNotes, setHoldNotes] = useState('');

  // Timeline Filter State
  const [timelineMonth, setTimelineMonth] = useState<'2026-10' | '2026-11' | '2026-12' | '2027-01'>('2026-10');
  const [timelineCityFilter, setTimelineCityFilter] = useState<string>('ALL');

  // Conflict Checker Standalone State
  const [conflictCheckBillboardId, setConflictCheckBillboardId] = useState<string>(INITIAL_BILLBOARDS[0].id);
  const [conflictCheckStart, setConflictCheckStart] = useState<string>('2026-10-15');
  const [conflictCheckEnd, setConflictCheckEnd] = useState<string>('2026-11-15');

  // Live Schedules
  const [schedules, setSchedules] = useState<FlightScheduleSlot[]>(getAllSchedules());

  // Current selected billboard for calculator
  const selectedBillboard = useMemo(() => {
    return INITIAL_BILLBOARDS.find((b) => b.id === selectedBillboardId) || INITIAL_BILLBOARDS[0];
  }, [selectedBillboardId]);

  // Live Dynamic Calculation Result
  const calculationResult: PriceCalculationResult | null = useMemo(() => {
    return calculateFlightPrice({
      billboardId: selectedBillboardId,
      startDate,
      endDate,
      includeProduction,
      includeInstallation,
      includeArtworkDesign,
      includeProofOfPosting,
      applyAgencyDiscount,
      promoCode,
    });
  }, [
    selectedBillboardId,
    startDate,
    endDate,
    includeProduction,
    includeInstallation,
    includeArtworkDesign,
    includeProofOfPosting,
    applyAgencyDiscount,
    promoCode,
  ]);

  // Live Standalone Conflict Test
  const standaloneConflictResult = useMemo(() => {
    return checkScheduleConflict(conflictCheckBillboardId, conflictCheckStart, conflictCheckEnd);
  }, [conflictCheckBillboardId, conflictCheckStart, conflictCheckEnd, schedules]);

  // Handle Create Hold
  const handleConfirmHold = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holdClientName || !holdCampaignName) {
      toast({
        title: 'Missing Details',
        description: 'Please provide client name and campaign title.',
        type: 'destructive',
      });
      return;
    }

    const holdSlot = {
      billboardId: selectedBillboard.id,
      billboardCode: selectedBillboard.code,
      billboardName: selectedBillboard.name,
      clientName: holdClientName,
      campaignName: holdCampaignName,
      startDate,
      endDate,
      status: 'RESERVED' as const,
      holdExpiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: holdNotes || `Hold created via Pricing Engine by ${user?.name || 'Agent'}`,
      bookingRef: `HLD-${Date.now().toString().slice(-4)}`,
    };

    const res = createFlightHold(holdSlot);
    if (!res.success) {
      toast({
        title: 'Collision Detected',
        description: res.error,
        type: 'destructive',
      });
      return;
    }

    setSchedules(getAllSchedules());
    setIsHoldModalOpen(false);
    setHoldClientName('');
    setHoldCampaignName('');
    setHoldNotes('');

    toast({
      title: 'Flight Hold Reserved!',
      description: `Reservation confirmed for ${selectedBillboard.code} from ${startDate} to ${endDate}. 5-day expiration hold timer started.`,
      type: 'success',
    });
  };

  // Generate days in chosen timeline month for timeline grid
  const timelineDays = useMemo(() => {
    const [year, month] = timelineMonth.split('-').map(Number);
    const numDays = new Date(year, month, 0).getDate();
    return Array.from({ length: numDays }, (_, i) => {
      const dayNum = i + 1;
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const d = new Date(year, month - 1, dayNum);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' });
      return { dayNum, dateStr, dayName };
    });
  }, [timelineMonth]);

  // Filter billboards for timeline
  const timelineBillboards = useMemo(() => {
    if (timelineCityFilter === 'ALL') return INITIAL_BILLBOARDS;
    return INITIAL_BILLBOARDS.filter((b) => b.location.city.toLowerCase() === timelineCityFilter.toLowerCase());
  }, [timelineCityFilter]);

  return (
    <ProtectedRoute>
      <div className="space-y-6 pb-12 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase bg-indigo-50 text-indigo-700">
                Commercial Rates
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                Commercial Yield & Scheduling Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Pricing & Availability Engine
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Real-time dynamic rate calculations, seasonal multipliers, duration discounts, calendar matrix, and double-booking collision prevention.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/billboards"
              className="px-3.5 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Billboards</span>
            </Link>
            <Link
              href="/map"
              className="px-3.5 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Map View</span>
            </Link>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-gray-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'calculator'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Dynamic Rate Calculator</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'timeline'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Availability Calendar Grid</span>
          </button>

          <button
            onClick={() => setActiveTab('conflict')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'conflict'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Collision & Conflict Detector</span>
          </button>

          <button
            onClick={() => setActiveTab('ratecards')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'ratecards'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span>Seasonal Surges & Discount Rules</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: DYNAMIC RATE CALCULATOR */}
        {/* ========================================================================= */}
        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 Columns: Calculator Configuration Form */}
            <div className="lg:col-span-7 space-y-5">
              <Card className="p-6 border-gray-100 shadow-sm bg-white rounded-2xl space-y-5">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    Flight Configuration & Specifications
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Select a billboard inventory asset and target campaign dates to run automated yield pricing.
                  </p>
                </div>

                {/* Billboard Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700 block">
                    Target Billboard Structure
                  </label>
                  <select
                    value={selectedBillboardId}
                    onChange={(e) => setSelectedBillboardId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium"
                  >
                    {INITIAL_BILLBOARDS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code} — {b.name} ({b.location.city} • ${b.monthlyRate.toLocaleString()}/mo • {b.type})
                      </option>
                    ))}
                  </select>

                  {/* Quick Card of Selected Billboard */}
                  <div className="p-3 rounded-xl bg-gray-50 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-10 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                        <img
                          src={selectedBillboard.photos[0]}
                          alt={selectedBillboard.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {selectedBillboard.name} ({selectedBillboard.widthFeet}&apos; x {selectedBillboard.heightFeet}&apos;)
                        </div>
                        <div className="text-gray-500 text-[11px]">
                          {selectedBillboard.location.corridorName} • DEC: {selectedBillboard.location.dailyTrafficCount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-gray-900 block">
                        ${selectedBillboard.monthlyRate.toLocaleString()}/mo
                      </span>
                      <span className="text-[10px] text-indigo-600 font-semibold">
                        Min Flight: {selectedBillboard.minBookingDays} days
                      </span>
                    </div>
                  </div>
                </div>

                {/* Flight Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Flight Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-mono text-gray-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Flight End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-mono text-gray-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                {/* Duration & Minimum Booking Notice */}
                {calculationResult && (
                  <div className="p-3 rounded-xl bg-gray-50 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span className="text-gray-700">
                        Calculated Duration: <strong className="text-gray-900">{calculationResult.totalDays} Days</strong> ({calculationResult.totalWeeks} Weeks / {calculationResult.totalMonths} Months)
                      </span>
                    </div>

                    <div>
                      {calculationResult.isMinDurationMet ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Meets Minimum ({calculationResult.minDurationDays}d)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Below Min Flight ({calculationResult.minDurationDays}d required)
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Production, Installation & Creative Add-ons */}
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                    Operational Add-ons & Production Services
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Vinyl Printing */}
                    <label
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 bg-white ${
                        includeProduction && !selectedBillboard.isDigital
                          ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${selectedBillboard.isDigital ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="checkbox"
                        disabled={selectedBillboard.isDigital}
                        checked={includeProduction && !selectedBillboard.isDigital}
                        onChange={(e) => setIncludeProduction(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 mt-0.5"
                      />
                      <div className="text-xs">
                        <div className="font-semibold text-gray-900">
                          Vinyl Printing & Finishing
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {selectedBillboard.isDigital
                            ? 'Not required for Digital LED'
                            : `+$${(selectedBillboard.productionCost || 1200).toLocaleString()} (Heavy flex vinyl)`}
                        </div>
                      </div>
                    </label>

                    {/* Installation Rigging */}
                    <label
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 bg-white ${
                        includeInstallation
                          ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={includeInstallation}
                        onChange={(e) => setIncludeInstallation(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 mt-0.5"
                      />
                      <div className="text-xs">
                        <div className="font-semibold text-gray-900">
                          Rigging & Installation / Ingest
                        </div>
                        <div className="text-[11px] text-gray-500">
                          +${(selectedBillboard.installationCost || 750).toLocaleString()} (Certified field crew)
                        </div>
                      </div>
                    </label>

                    {/* Custom Creative Design */}
                    <label
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 bg-white ${
                        includeArtworkDesign
                          ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={includeArtworkDesign}
                        onChange={(e) => setIncludeArtworkDesign(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 mt-0.5"
                      />
                      <div className="text-xs">
                        <div className="font-semibold text-gray-900">
                          OOH Studio Creative Design
                        </div>
                        <div className="text-[11px] text-gray-500">
                          +$750 (4K graphic adaptations & layout)
                        </div>
                      </div>
                    </label>

                    {/* Proof of Posting Photo Kit */}
                    <label
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 bg-white ${
                        includeProofOfPosting
                          ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={includeProofOfPosting}
                        onChange={(e) => setIncludeProofOfPosting(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 mt-0.5"
                      />
                      <div className="text-xs">
                        <div className="font-semibold text-gray-900">
                          Certified POP Verification Kit
                        </div>
                        <div className="text-[11px] text-gray-500">
                          +$150 (Day & night geo-stamped photos)
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Agency Commission & Promo Voucher */}
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                    Discounts & Commercial Allowances
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="p-3 rounded-xl border border-gray-200 hover:border-gray-300 bg-white cursor-pointer flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={applyAgencyDiscount}
                        onChange={(e) => setApplyAgencyDiscount(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600"
                      />
                      <div className="text-xs">
                        <div className="font-semibold text-gray-900">
                          Accredited 4A Agency Partner
                        </div>
                        <div className="text-[11px] text-gray-500">
                          Apply standard 15% agency commission
                        </div>
                      </div>
                    </label>

                    <div className="relative">
                      <label className="text-xs font-semibold text-gray-700 block mb-1">
                        Promo Voucher Code
                      </label>
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="e.g. EARLY2026 (-8%)"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs uppercase font-mono tracking-wider text-gray-900 placeholder:text-gray-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right 5 Columns: Dynamic Itemized Quote & Conflict Notification */}
            <div className="lg:col-span-5 space-y-5">
              {calculationResult && (
                <Card className="p-6 border-gray-100 shadow-sm bg-white rounded-2xl space-y-5 sticky top-20">
                  {/* Conflict Notice if dates collide */}
                  {calculationResult.hasConflict && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        Flight Collision Detected!
                      </div>
                      <p className="text-xs text-rose-600 leading-relaxed">
                        This billboard is already booked or reserved during your requested date window:
                      </p>
                      {calculationResult.conflictDetails?.map((c) => (
                        <div
                          key={c.id}
                          className="p-2.5 rounded-lg bg-white border border-rose-200 text-[11px] text-gray-900"
                        >
                          <div className="font-semibold">{c.campaignName} ({c.clientName})</div>
                          <div className="text-gray-500 text-[10px]">
                            {c.startDate} to {c.endDate} • Status: <strong className="text-rose-600">{c.status}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Header of Quotation */}
                  <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                    <div>
                      <span className="text-[11px] font-bold text-indigo-600 tracking-wider uppercase">
                        Yield Estimate #{selectedBillboard.code}
                      </span>
                      <h3 className="text-base font-bold text-gray-900">
                        {selectedBillboard.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {calculationResult.startDate} → {calculationResult.endDate} ({calculationResult.totalDays} Days)
                      </p>
                    </div>

                    <div className="text-right">
                      {calculationResult.hasConflict ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700">
                          Unavailable
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Ready for Hold
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Itemized Line Items Table */}
                  <div className="space-y-2.5 text-xs">
                    <div className="text-gray-400 text-[11px] font-semibold uppercase tracking-wider">
                      Itemized Breakdown
                    </div>

                    <div className="space-y-2">
                      {calculationResult.lineItems.map((item, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start justify-between py-1 border-b border-gray-100 ${
                            item.amount < 0 ? 'text-emerald-600' : 'text-gray-900'
                          }`}
                        >
                          <div className="pr-4">
                            <span className="font-medium block">{item.label}</span>
                            {item.description && (
                              <span className="text-[10px] text-gray-400 block">
                                {item.description}
                              </span>
                            )}
                          </div>
                          <span className="font-mono font-bold shrink-0">
                            {item.amount < 0 ? `-$${Math.abs(item.amount).toLocaleString()}` : `$${item.amount.toLocaleString()}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals Summary */}
                  <div className="pt-2 border-t border-gray-100 space-y-1.5 text-xs">
                    <div className="flex justify-between text-gray-500">
                      <span>Media & Service Subtotal:</span>
                      <span className="font-mono font-semibold text-gray-900">
                        ${calculationResult.subtotal.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between text-gray-500">
                      <span>Advertising Sales Tax (8.25%):</span>
                      <span className="font-mono font-semibold text-gray-900">
                        ${calculationResult.taxAmount.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100 font-bold">
                      <span className="text-gray-900">Net Investment Total:</span>
                      <span className="text-xl font-mono text-indigo-600 font-extrabold">
                        ${calculationResult.grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Hold Dates or Proceed to Booking */}
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      disabled={calculationResult.hasConflict}
                      onClick={() => setIsHoldModalOpen(true)}
                      className={`w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                        calculationResult.hasConflict
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Reserve Flight Hold (5-Day Lock)</span>
                    </button>

                    <button
                      onClick={() => {
                        toast({
                          title: 'Breakdown Exported',
                          description: `Yield calculation for ${selectedBillboard.code} prepared for Quotation workflow.`,
                          type: 'info',
                        });
                      }}
                      className="w-full py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 text-xs font-semibold transition-all"
                    >
                      Save Calculation to Quotes
                    </button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: AVAILABILITY CALENDAR TIMELINE (GANTT MATRIX) */}
        {/* ========================================================================= */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            {/* Timeline Filter Ribbon */}
            <Card className="p-4 border-gray-100 shadow-sm bg-white flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-indigo-600" />
                  Timeline Month:
                </span>
                <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                  {(['2026-10', '2026-11', '2026-12', '2027-01'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setTimelineMonth(m)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        timelineMonth === m
                          ? 'bg-white text-gray-900 shadow-xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {m === '2026-10' ? 'Oct 2026' : m === '2026-11' ? 'Nov 2026' : m === '2026-12' ? 'Dec 2026' : 'Jan 2027'}
                    </button>
                  ))}
                </div>
              </div>

              {/* City filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Market:</span>
                <select
                  value={timelineCityFilter}
                  onChange={(e) => setTimelineCityFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-700 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                >
                  <option value="ALL">All Metro Markets</option>
                  <option value="New York">New York</option>
                  <option value="Los Angeles">Los Angeles</option>
                  <option value="Miami">Miami</option>
                  <option value="San Jose">San Jose</option>
                  <option value="Chicago">Chicago</option>
                  <option value="Dallas">Dallas</option>
                </select>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-gray-600 font-medium">Occupied Flight</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-gray-600 font-medium">Reserved Hold</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-gray-600 font-medium">Maintenance</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-gray-600 font-medium">Available Window</span>
                </div>
              </div>
            </Card>

            {/* Master Gantt Grid */}
            <Card className="border-gray-100 shadow-sm bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                  {/* Calendar Days Header */}
                  <div className="grid grid-cols-12 bg-gray-50 text-xs font-semibold border-b border-gray-100">
                    <div className="col-span-3 p-3 text-gray-500 uppercase tracking-wider text-[11px]">
                      Structure Inventory
                    </div>
                    <div className="col-span-9 grid" style={{ gridTemplateColumns: `repeat(${timelineDays.length}, minmax(0, 1fr))` }}>
                      {timelineDays.map((d) => (
                        <div
                          key={d.dayNum}
                          className="py-2 text-center border-l border-gray-200/50 text-[10px]"
                        >
                          <span className="text-gray-400 block">{d.dayName}</span>
                          <span className="font-bold text-gray-800">{d.dayNum}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rows for each billboard */}
                  <div className="divide-y divide-gray-100">
                    {timelineBillboards.map((b) => {
                      const billboardSlots = schedules.filter((s) => s.billboardId === b.id);

                      return (
                        <div key={b.id} className="grid grid-cols-12 hover:bg-gray-50/60 transition-colors items-center">
                          {/* Billboard info column */}
                          <div className="col-span-3 p-3">
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono text-xs font-bold text-indigo-600">
                                {b.code}
                              </span>
                              <div className="min-w-0">
                                <h4 className="text-xs font-semibold text-gray-900 line-clamp-1">
                                  {b.name}
                                </h4>
                                <p className="text-[10px] text-gray-500 line-clamp-1">
                                  {b.location.city} • ${b.monthlyRate.toLocaleString()}/mo
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* 30/31 Day Schedule Matrix */}
                          <div
                            className="col-span-9 grid relative py-2.5"
                            style={{ gridTemplateColumns: `repeat(${timelineDays.length}, minmax(0, 1fr))` }}
                          >
                            {timelineDays.map((d) => {
                              // Check if any schedule covers this date
                              const dayDate = new Date(d.dateStr).getTime();
                              const matchedSlot = billboardSlots.find((s) => {
                                const sStart = new Date(s.startDate).getTime();
                                const sEnd = new Date(s.endDate).getTime();
                                return dayDate >= sStart && dayDate <= sEnd;
                              });

                              let cellBg = 'bg-emerald-50 hover:bg-emerald-100 text-transparent';
                              let title = `${d.dateStr} - Available for Booking`;

                              if (matchedSlot) {
                                if (matchedSlot.status === 'OCCUPIED') {
                                  cellBg = 'bg-blue-500 text-white';
                                  title = `Occupied: ${matchedSlot.campaignName} (${matchedSlot.clientName})`;
                                } else if (matchedSlot.status === 'RESERVED') {
                                  cellBg = 'bg-amber-400 text-white';
                                  title = `Hold Reserved: ${matchedSlot.campaignName} (${matchedSlot.clientName})`;
                                } else if (matchedSlot.status === 'MAINTENANCE') {
                                  cellBg = 'bg-rose-500 text-white';
                                  title = `Under Maintenance: ${matchedSlot.campaignName}`;
                                }
                              }

                              return (
                                <div
                                  key={d.dayNum}
                                  title={title}
                                  onClick={() => {
                                    setSelectedBillboardId(b.id);
                                    setStartDate(d.dateStr);
                                    setActiveTab('calculator');
                                  }}
                                  className={`h-7 mx-0.5 rounded-sm cursor-pointer transition-all ${cellBg}`}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CONFLICT & DOUBLE-BOOKING DETECTOR */}
        {/* ========================================================================= */}
        {activeTab === 'conflict' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <Card className="p-6 border-gray-100 shadow-sm bg-white rounded-2xl space-y-5">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  Automated Double-Booking & Collision Engine
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Verify date overlap collisions against the centralized schedule registry before locking in client campaigns.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Select Billboard to Test
                  </label>
                  <select
                    value={conflictCheckBillboardId}
                    onChange={(e) => setConflictCheckBillboardId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  >
                    {INITIAL_BILLBOARDS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code} — {b.name} ({b.location.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Proposed Start Date
                  </label>
                  <input
                    type="date"
                    value={conflictCheckStart}
                    onChange={(e) => setConflictCheckStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-mono text-gray-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Proposed End Date
                  </label>
                  <input
                    type="date"
                    value={conflictCheckEnd}
                    onChange={(e) => setConflictCheckEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-mono text-gray-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      toast({
                        title: 'Collision Engine Executed',
                        description: standaloneConflictResult.hasConflict
                          ? 'Conflict found! See collision alert below.'
                          : 'Clear! Requested flight interval is 100% available.',
                        type: standaloneConflictResult.hasConflict ? 'warning' : 'success',
                      });
                    }}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-all shadow-sm"
                  >
                    Run Collision Check
                  </button>
                </div>
              </div>

              {/* Conflict Result Alert */}
              <div className="pt-2">
                {standaloneConflictResult.hasConflict ? (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 space-y-3">
                    <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4" />
                      Collision Alert: Requested Flight Overlaps Existing Booking!
                    </div>

                    <div className="space-y-2">
                      {standaloneConflictResult.conflictingSlots.map((c) => (
                        <div
                          key={c.id}
                          className="p-3 rounded-lg bg-white border border-rose-200 text-xs text-gray-900"
                        >
                          <div className="font-bold">{c.campaignName}</div>
                          <div className="text-gray-500 text-[11px] mt-0.5">
                            Client: <strong className="text-gray-900">{c.clientName}</strong> • {c.startDate} to {c.endDate}
                          </div>
                          <div className="text-[11px] text-amber-700 font-semibold mt-1">
                            Status: {c.status} {c.holdExpiresAt && `(Hold expires: ${c.holdExpiresAt})`}
                          </div>
                        </div>
                      ))}
                    </div>

                    {standaloneConflictResult.nextAvailableDate && (
                      <div className="p-3 rounded-lg bg-emerald-50 text-xs text-emerald-700 flex items-center justify-between font-medium">
                        <span>Suggested Next Open Window:</span>
                        <strong className="font-mono">{standaloneConflictResult.nextAvailableDate} onwards</strong>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4" />
                      Clean Window: No Overlaps Detected
                    </div>
                    <p className="text-xs text-emerald-600">
                      The selected structure is completely open and free from {conflictCheckStart} to {conflictCheckEnd}.
                    </p>
                    <button
                      onClick={() => {
                        setSelectedBillboardId(conflictCheckBillboardId);
                        setStartDate(conflictCheckStart);
                        setEndDate(conflictCheckEnd);
                        setActiveTab('calculator');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Proceed to Quote Calculator</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: SEASONAL SURGES & DISCOUNT RULES */}
        {/* ========================================================================= */}
        {activeTab === 'ratecards' && (
          <div className="space-y-6">
            {/* Seasonal Rules */}
            <Card className="p-6 border-gray-100 shadow-sm bg-white rounded-2xl space-y-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  Active Seasonal Surges & Demand Multipliers
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Dynamic rate adjustments triggered automatically when campaigns span high-demand calendar seasons.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SEASONAL_RULES.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-4 rounded-xl bg-gray-50 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                        {rule.code}
                      </span>
                      <span className="text-sm font-bold text-amber-600 font-mono">
                        {rule.multiplier}x (+{Math.round((rule.multiplier - 1) * 100)}%)
                      </span>
                    </div>

                    <h4 className="font-bold text-gray-900 text-sm">{rule.name}</h4>
                    <p className="text-gray-500 text-[11px] leading-relaxed">
                      {rule.description}
                    </p>

                    <div className="text-[10px] text-gray-400 pt-2 border-t border-gray-200/60">
                      Window: Months {rule.startMonth}/{rule.startDay} → {rule.endMonth}/{rule.endDay}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Discount Tiers */}
            <Card className="p-6 border-gray-100 shadow-sm bg-white rounded-2xl space-y-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-emerald-600" />
                  Duration Volume Discounts & Agency Allowances
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Standard discounting tiers applied automatically to continuous flight campaigns.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {DISCOUNT_RULES.map((disc) => (
                  <div
                    key={disc.id}
                    className="p-4 rounded-xl bg-gray-50 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-indigo-600">
                        {disc.code}
                      </span>
                      <span className="text-sm font-bold text-emerald-600 font-mono">
                        -{disc.discountPercentage}%
                      </span>
                    </div>

                    <h4 className="font-bold text-gray-900 text-xs">{disc.name}</h4>
                    <p className="text-gray-500 text-[11px] leading-relaxed">
                      {disc.description}
                    </p>

                    {disc.minDurationWeeks && (
                      <div className="text-[10px] text-gray-400 pt-2 border-t border-gray-200/60">
                        Minimum Commitment: <strong className="text-gray-700">{disc.minDurationWeeks} weeks</strong>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Master Inventory Rate Card Reference */}
            <Card className="p-6 border-gray-100 shadow-sm bg-white rounded-2xl space-y-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                  Master Rate Card Matrix
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Base commercial card rates across all 8 outdoor advertising asset structures.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Structure Code</th>
                      <th className="py-2.5 px-3 font-semibold">Type & Market</th>
                      <th className="py-2.5 px-3 font-semibold">Monthly Rate</th>
                      <th className="py-2.5 px-3 font-semibold">Weekly Rate</th>
                      <th className="py-2.5 px-3 font-semibold">Daily Rate</th>
                      <th className="py-2.5 px-3 font-semibold">Vinyl Print</th>
                      <th className="py-2.5 px-3 font-semibold">Installation</th>
                      <th className="py-2.5 px-3 font-semibold">Min Flight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {INITIAL_BILLBOARDS.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">
                          {b.code}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-gray-900">{b.name}</div>
                          <div className="text-gray-400 text-[10px]">
                            {b.location.city} • {b.type}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-gray-900">
                          ${b.monthlyRate.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600">
                          ${b.weeklyRate.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600">
                          ${b.dailyRate.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600">
                          {b.isDigital ? 'N/A (LED)' : `$${(b.productionCost || 1200).toLocaleString()}`}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600">
                          ${(b.installationCost || 750).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-indigo-600">
                          {b.minBookingDays} days
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL: CREATE FLIGHT HOLD */}
        {/* ========================================================================= */}
        {isHoldModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 border border-gray-100">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Reserve Flight Hold
                  </h3>
                  <p className="text-xs text-gray-500 font-mono">
                    {selectedBillboard.code} — {selectedBillboard.name}
                  </p>
                </div>
                <button
                  onClick={() => setIsHoldModalOpen(false)}
                  className="p-1 rounded-md text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Flight Window:</span>
                  <span className="font-semibold text-gray-900 font-mono">
                    {startDate} → {endDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Quotation Total:</span>
                  <span className="font-bold text-indigo-600 font-mono">
                    ${calculationResult?.grandTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-amber-600 pt-1 border-t border-gray-200/60 font-medium">
                  <span>Hold Reservation Expiry:</span>
                  <span>5 Business Days</span>
                </div>
              </div>

              <form onSubmit={handleConfirmHold} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Client / Brand Account *
                  </label>
                  <input
                    type="text"
                    required
                    value={holdClientName}
                    onChange={(e) => setHoldClientName(e.target.value)}
                    placeholder="e.g. Sterling Brands Ltd"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={holdCampaignName}
                    onChange={(e) => setHoldCampaignName(e.target.value)}
                    placeholder="e.g. Q4 Holiday Brand Blitz"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Hold Notes / Internal Memo
                  </label>
                  <textarea
                    rows={2}
                    value={holdNotes}
                    onChange={(e) => setHoldNotes(e.target.value)}
                    placeholder="e.g. Holds granted pending legal review of Master Agreement."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsHoldModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm"
                  >
                    Confirm 5-Day Hold
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
