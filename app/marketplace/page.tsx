"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdversoftLogoIcon } from '@/components/logo';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import {
  BillboardItem,
  BillboardType,
  INITIAL_BILLBOARDS,
} from '@/lib/data/billboards-store';
import {
  getMarketplaceBillboards,
  getMarketplaceMetrics,
  getStoredShortlist,
  toggleStoredShortlist,
  submitMarketplaceBookingRequest,
  MarketplaceFilterState,
  MarketplaceBookingRequest,
} from '@/lib/data/marketplace-store';
import {
  Search,
  MapPin,
  Calendar,
  DollarSign,
  Eye,
  SlidersHorizontal,
  Compass,
  Zap,
  CheckCircle2,
  X,
  Heart,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  Clock,
  Printer,
  Wrench,
  Palette,
  FileText,
  Map as MapIcon,
  Grid,
  Filter,
  Info,
} from 'lucide-react';

const TYPE_DISPLAY_NAMES: Record<BillboardType, string> = {
  STATIC_BULLETIN: 'Static Bulletin',
  DIGITAL_LED: 'Digital LED Screen',
  WALLSCAPE: 'Iconic Wallscape',
  UNIPOLE: 'High-Rise Unipole',
  GANTRY: 'Highway Gantry',
  BRIDGE_PANEL: 'Bridge Overpass Panel',
  TRANSIT_SHELTER: 'Transit Shelter',
  SPECTACULAR: 'Custom Spectacular',
};

export default function PublicMarketplacePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Metrics
  const metrics = useMemo(() => getMarketplaceMetrics(), []);

  // Filter State
  const [filters, setFilters] = useState<MarketplaceFilterState>({
    searchQuery: '',
    city: 'ALL',
    type: 'ALL',
    availability: 'ALL',
    maxBudget: 35000,
    minTraffic: 0,
    isDigitalOnly: false,
    sortBy: 'POPULAR',
  });

  // Active View Mode
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Shortlist State
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [isShortlistDrawerOpen, setIsShortlistDrawerOpen] = useState(false);

  // Modals
  const [selectedBillboardForInspect, setSelectedBillboardForInspect] = useState<BillboardItem | null>(null);
  const [selectedBillboardForBooking, setSelectedBillboardForBooking] = useState<BillboardItem | null>(null);
  const [bookingSuccessData, setBookingSuccessData] = useState<{
    request: MarketplaceBookingRequest;
    leadNumber: string;
  } | null>(null);

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    companyName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    industry: 'Consumer Brands',
    website: '',
    campaignName: '',
    startDate: '2026-11-01',
    endDate: '2026-11-28',
    requiresPrinting: true,
    requiresInstallation: true,
    requiresArtworkDesign: false,
    hasOwnArtwork: true,
    notes: '',
  });

  // Shortlist Multi-Request Modal
  const [isBatchRfpModalOpen, setIsBatchRfpModalOpen] = useState(false);
  const [batchForm, setBatchForm] = useState({
    companyName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    targetBudget: '$50,000 - $100,000',
    flightDates: 'Q4 2026 / Holiday Flight',
    campaignGoals: '',
  });

  // Load shortlist on mount and listen to events
  useEffect(() => {
    setShortlist(getStoredShortlist());
    const handleShortlistUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<string[]>;
      if (customEvent.detail) setShortlist(customEvent.detail);
    };
    window.addEventListener('adversoft_shortlist_updated', handleShortlistUpdate);
    return () => window.removeEventListener('adversoft_shortlist_updated', handleShortlistUpdate);
  }, []);

  // Filtered Billboards
  const filteredBillboards = useMemo(() => {
    return getMarketplaceBillboards(filters);
  }, [filters]);

  // Shortlisted billboard objects
  const shortlistedBillboards = useMemo(() => {
    return INITIAL_BILLBOARDS.filter((b) => shortlist.includes(b.id));
  }, [shortlist]);

  // Shortlist metrics
  const shortlistTotalRate = useMemo(() => {
    return shortlistedBillboards.reduce((acc, b) => acc + b.monthlyRate, 0);
  }, [shortlistedBillboards]);

  const shortlistTotalTraffic = useMemo(() => {
    return shortlistedBillboards.reduce((acc, b) => acc + b.location.dailyTrafficCount, 0);
  }, [shortlistedBillboards]);

  // Handle Shortlist toggle
  const handleToggleShortlist = (id: string, name: string) => {
    const updated = toggleStoredShortlist(id);
    setShortlist(updated);
    if (updated.includes(id)) {
      toast.success('Added to Shortlist', `${name} added to your inquiry shortlist.`);
    } else {
      toast.info('Removed from Shortlist', `${name} removed from your shortlist.`);
    }
  };

  // Open booking modal with defaults
  const handleOpenBookingModal = (b: BillboardItem) => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() + 14); // 2 weeks ahead
    const end = new Date(start);
    end.setDate(start.getDate() + (b.minBookingDays || 28));

    const startDateStr = start.toISOString().split('T')[0];
    const endDateStr = end.toISOString().split('T')[0];

    setSelectedBillboardForBooking(b);
    setBookingForm((prev) => ({
      ...prev,
      startDate: startDateStr,
      endDate: endDateStr,
      campaignName: `${b.location.city} Brand Campaign 2026`,
      requiresPrinting: !b.isDigital,
      requiresInstallation: true,
    }));
  };

  // Submit Booking Request
  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBillboardForBooking) return;

    if (!bookingForm.companyName || !bookingForm.contactName || !bookingForm.contactEmail || !bookingForm.contactPhone) {
      toast.error('Missing Information', 'Please complete all required contact fields.');
      return;
    }

    try {
      const result = submitMarketplaceBookingRequest({
        billboard: selectedBillboardForBooking,
        companyName: bookingForm.companyName,
        contactName: bookingForm.contactName,
        contactEmail: bookingForm.contactEmail,
        contactPhone: bookingForm.contactPhone,
        industry: bookingForm.industry,
        website: bookingForm.website,
        campaignName: bookingForm.campaignName,
        startDate: bookingForm.startDate,
        endDate: bookingForm.endDate,
        requiresPrinting: bookingForm.requiresPrinting,
        requiresInstallation: bookingForm.requiresInstallation,
        requiresArtworkDesign: bookingForm.requiresArtworkDesign,
        hasOwnArtwork: bookingForm.hasOwnArtwork,
        notes: bookingForm.notes,
      });

      if (result.success) {
        setBookingSuccessData({
          request: result.request,
          leadNumber: result.crmLead.leadNumber,
        });
        setSelectedBillboardForBooking(null);
        toast.success(
          'Booking Request Submitted!',
          `Request #${result.request.requestNumber} logged. An Adversoft account executive will contact you within 2 hours.`
        );
      }
    } catch (err) {
      console.error(err);
      toast.error('Submission Failed', 'An error occurred while transmitting your request.');
    }
  };

  // Submit Multi-Billboard Batch RFP
  const handleBatchRfpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (shortlistedBillboards.length === 0) return;

    // Submit as combined inquiry into the first billboard or create multi-line request
    const primary = shortlistedBillboards[0];
    const notesSummary = `MULTI-SITE NETWORK PROPOSAL REQUEST (${shortlistedBillboards.length} Billboards):
Billboards: ${shortlistedBillboards.map((b) => `${b.code} (${b.location.city})`).join(', ')}
Flight Dates: ${batchForm.flightDates}
Budget Tier: ${batchForm.targetBudget}
Campaign Goals: ${batchForm.campaignGoals || 'Multi-metro brand visibility'}`;

    const result = submitMarketplaceBookingRequest({
      billboard: primary,
      companyName: batchForm.companyName,
      contactName: batchForm.contactName,
      contactEmail: batchForm.contactEmail,
      contactPhone: batchForm.contactPhone,
      campaignName: `Multi-Market Package (${shortlistedBillboards.length} Sites)`,
      startDate: '2026-11-01',
      endDate: '2026-11-28',
      requiresPrinting: true,
      requiresInstallation: true,
      requiresArtworkDesign: false,
      hasOwnArtwork: true,
      notes: notesSummary,
    });

    setIsBatchRfpModalOpen(false);
    setIsShortlistDrawerOpen(false);
    setBookingSuccessData({
      request: result.request,
      leadNumber: result.crmLead.leadNumber,
    });
    toast.success(
      'Multi-Site Proposal Requested!',
      `Package inquiry #${result.request.requestNumber} for ${shortlistedBillboards.length} structures submitted.`
    );
  };

  // Flight duration calculation in Booking Modal
  const calculatedDurationDays = useMemo(() => {
    if (!bookingForm.startDate || !bookingForm.endDate) return 28;
    const s = new Date(bookingForm.startDate);
    const e = new Date(bookingForm.endDate);
    return Math.max(7, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
  }, [bookingForm.startDate, bookingForm.endDate]);

  const calculatedEstimateTotal = useMemo(() => {
    if (!selectedBillboardForBooking) return 0;
    const b = selectedBillboardForBooking;
    let base = 0;
    if (calculatedDurationDays >= 28) {
      base = (b.monthlyRate / 30) * calculatedDurationDays;
    } else {
      const wks = Math.ceil(calculatedDurationDays / 7);
      base = wks * b.weeklyRate;
    }
    const prod = bookingForm.requiresPrinting ? b.productionCost : 0;
    const inst = bookingForm.requiresInstallation ? b.installationCost : 0;
    const design = bookingForm.requiresArtworkDesign ? 950 : 0;
    return Math.round(base + prod + inst + design);
  }, [selectedBillboardForBooking, calculatedDurationDays, bookingForm]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* ======================================================== */}
      {/* 1. STAFF MODE NOTIFICATION BANNER (When User is Logged In) */}
      {/* ======================================================== */}
      {user && (
        <div className="bg-indigo-950 text-white text-xs px-4 py-2 border-b border-indigo-900 flex flex-wrap items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              Staff Mode
            </span>
            <span>
              Logged in as <strong className="text-white">{user.name}</strong> ({user.role}) — You are previewing the Public Discovery Marketplace.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-semibold text-indigo-300 hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>Return to Internal Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. PUBLIC MARKETPLACE NAVBAR */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <Link href="/marketplace" className="flex items-center gap-2.5 group">
              <AdversoftLogoIcon size={36} className="shrink-0 drop-shadow-xs group-hover:scale-105 transition-transform" />
              <div>
                <span className="text-lg font-black tracking-tight text-gray-900 block leading-tight">
                  Adversoft<span className="text-indigo-600">.</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block -mt-0.5">
                  Billboard Marketplace
                </span>
              </div>
            </Link>

            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              Verified OOH Inventory
            </span>
          </div>

          {/* Quick Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-gray-600">
            <a href="#inventory" className="hover:text-indigo-600 transition-colors">
              Browse Inventory
            </a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">
              How Booking Works
            </a>
            <Link href="/map" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
              <span>Interactive Map</span>
            </Link>
            <Link href="/pricing" className="hover:text-indigo-600 transition-colors">
              Rate Calculator
            </Link>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            {/* Shortlist Badge Button */}
            <button
              onClick={() => setIsShortlistDrawerOpen(true)}
              className="relative px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50/80 hover:bg-gray-100 text-xs font-semibold text-gray-700 flex items-center gap-1.5 transition-all"
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  shortlist.length > 0 ? 'fill-rose-500 text-rose-500' : 'text-gray-400'
                }`}
              />
              <span className="hidden sm:inline">Shortlist</span>
              {shortlist.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {shortlist.length}
                </span>
              )}
            </button>

            {/* Inquiries Hotline */}
            <a
              href="tel:+18005556642"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 px-2 py-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>+1 (800) 555-OOH</span>
            </a>

            {/* Portal Login or Back */}
            {user ? (
              <Link
                href="/"
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1"
              >
                <span>Dashboard</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1"
              >
                <span>Staff Login</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 3. HERO DISCOVERY BANNER */}
      {/* ======================================================== */}
      <section className="bg-gradient-to-b from-indigo-50/70 via-white to-gray-50 pt-10 pb-8 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200/80 shadow-xs mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-gray-700">
                Direct Public Discovery Marketplace
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Discover & Reserve High-Impact Outdoor Billboards.
            </h1>
            <p className="mt-3 text-base sm:text-lg text-gray-600 leading-relaxed">
              Explore premium digital LED screens, highway unipoles, and landmark wallscapes across premier commercial corridors. Transparent rates, live availability, and direct-to-CRM booking requests.
            </p>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8">
            <Card className="p-4 bg-white border-gray-100 shadow-sm rounded-xl">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                Listed Structures
              </span>
              <div className="text-2xl font-black text-gray-900 mt-0.5">
                {metrics.totalListed} Prime Faces
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3" />
                100% Adversoft Verified
              </span>
            </Card>

            <Card className="p-4 bg-white border-gray-100 shadow-sm rounded-xl">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                Daily Traffic Reach
              </span>
              <div className="text-2xl font-black text-indigo-600 mt-0.5">
                {(metrics.totalDailyTraffic / 1000).toFixed(0)}k+ DEC
              </div>
              <span className="text-[11px] text-gray-500 font-medium block mt-0.5">
                Vehicular & Pedestrian Views
              </span>
            </Card>

            <Card className="p-4 bg-white border-gray-100 shadow-sm rounded-xl">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                Metro Markets
              </span>
              <div className="text-2xl font-black text-gray-900 mt-0.5">
                {metrics.citiesCovered} Major Hubs
              </div>
              <span className="text-[11px] text-gray-500 font-medium block mt-0.5">
                NYC, LA, CHI, MIA, DFW, SF
              </span>
            </Card>

            <Card className="p-4 bg-white border-gray-100 shadow-sm rounded-xl">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                Immediate Availability
              </span>
              <div className="text-2xl font-black text-emerald-700 mt-0.5">
                {metrics.availableNowCount} Ready to Book
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
                Immediate Flight Scheduling
              </span>
            </Card>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. SMART FILTER & SEARCH BAR */}
      {/* ======================================================== */}
      <section id="inventory" className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          {/* Search Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                placeholder="Search billboard by city, highway (e.g. Stemmons, Kennedy), code (BB-101), or landmark..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-gray-50/80 border border-gray-200 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden transition-all"
              />
              {filters.searchQuery && (
                <button
                  onClick={() => setFilters({ ...filters, searchQuery: '' })}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* City Dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                className="px-3 py-2 rounded-xl bg-gray-50/80 border border-gray-200 text-xs font-semibold text-gray-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
              >
                <option value="ALL">All Metro Cities ({metrics.citiesCovered})</option>
                {metrics.citiesList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* View Switcher */}
              <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200/60">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    viewMode === 'map'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Map</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Filter Pills Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100">
            {/* Structure Type Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mr-1">
                Type:
              </span>
              {[
                { key: 'ALL', label: 'All Structures' },
                { key: 'DIGITAL_LED', label: 'Digital LED' },
                { key: 'STATIC_BULLETIN', label: 'Bulletins' },
                { key: 'WALLSCAPE', label: 'Wallscapes' },
                { key: 'SPECTACULAR', label: 'Spectaculars' },
                { key: 'UNIPOLE', label: 'Unipoles' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setFilters({ ...filters, type: t.key })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    filters.type === t.key
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-gray-100 hover:bg-gray-200/70 text-gray-600'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Availability & Sorting Dropdown */}
            <div className="flex items-center gap-2">
              {/* Availability Filter */}
              <select
                value={filters.availability}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    availability: e.target.value as 'ALL' | 'AVAILABLE_NOW' | 'UPCOMING',
                  })
                }
                className="px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700 focus:outline-hidden"
              >
                <option value="ALL">Any Availability</option>
                <option value="AVAILABLE_NOW">Available Now</option>
                <option value="UPCOMING">Upcoming Flights</option>
              </select>

              {/* Sorting Filter */}
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    sortBy: e.target.value as MarketplaceFilterState['sortBy'],
                  })
                }
                className="px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700 focus:outline-hidden"
              >
                <option value="POPULAR">Most Popular</option>
                <option value="PRICE_ASC">Rate: Low to High</option>
                <option value="PRICE_DESC">Rate: High to Low</option>
                <option value="TRAFFIC_DESC">Highest Daily Traffic</option>
                <option value="SIZE_DESC">Largest Surface Area</option>
              </select>

              {/* Reset Filters button if active */}
              {(filters.city !== 'ALL' ||
                filters.type !== 'ALL' ||
                filters.availability !== 'ALL' ||
                filters.searchQuery) && (
                <button
                  onClick={() =>
                    setFilters({
                      searchQuery: '',
                      city: 'ALL',
                      type: 'ALL',
                      availability: 'ALL',
                      maxBudget: 35000,
                      minTraffic: 0,
                      isDigitalOnly: false,
                      sortBy: 'POPULAR',
                    })
                  }
                  className="px-2 py-1 text-xs text-indigo-600 hover:underline font-semibold"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. MAIN DISCOVERY CONTENT (GRID / MAP) */}
      {/* ======================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header Count */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Verified Outdoor Inventory
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Showing <span className="font-semibold text-gray-900">{filteredBillboards.length}</span> billboard structure{filteredBillboards.length === 1 ? '' : 's'} matching criteria.
            </p>
          </div>

          {/* Multi-site batch RFP CTA when shortlisted */}
          {shortlist.length > 0 && (
            <button
              onClick={() => setIsShortlistDrawerOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-all flex items-center gap-1.5"
            >
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span>{shortlist.length} in Shortlist</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Empty State */}
        {filteredBillboards.length === 0 && (
          <Card className="p-12 text-center bg-white border-gray-100 shadow-sm rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 mx-auto flex items-center justify-center text-gray-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">No Billboard Inventory Found</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
              No outdoor billboard assets currently match your active search terms or filters. Try adjusting your city, structure type, or resetting filters.
            </p>
            <button
              onClick={() =>
                setFilters({
                  searchQuery: '',
                  city: 'ALL',
                  type: 'ALL',
                  availability: 'ALL',
                  maxBudget: 35000,
                  minTraffic: 0,
                  isDigitalOnly: false,
                  sortBy: 'POPULAR',
                })
              }
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-xs"
            >
              Clear All Filters
            </button>
          </Card>
        )}

        {/* ======================================================== */}
        {/* VIEW 1: GRID CARDS VIEW */}
        {/* ======================================================== */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBillboards.map((b) => {
              const isShortlisted = shortlist.includes(b.id);
              const isAvailable = b.status === 'AVAILABLE';

              return (
                <Card
                  key={b.id}
                  className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden flex flex-col group"
                >
                  {/* Image & Badges Container */}
                  <div className="relative h-52 w-full bg-gray-100 overflow-hidden">
                    <img
                      src={b.photos[0]}
                      alt={b.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                    {/* Top Left: Code & Type */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white/95 backdrop-blur-xs text-gray-900 shadow-xs">
                        {b.code}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white">
                        {TYPE_DISPLAY_NAMES[b.type]}
                      </span>
                    </div>

                    {/* Top Right: Shortlist Heart */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleShortlist(b.id, b.name);
                      }}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white text-gray-700 shadow-sm transition-transform active:scale-90"
                      title={isShortlisted ? 'Remove from Shortlist' : 'Add to Shortlist'}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isShortlisted ? 'fill-rose-500 text-rose-500' : 'text-gray-400'
                        }`}
                      />
                    </button>

                    {/* Bottom Ribbon: Status & Illumination */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                      {isAvailable ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-bold text-[11px] shadow-sm flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Available Now
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-semibold text-[11px] shadow-sm">
                          Avail. {b.currentBookingEnd ? `Nov 16, 2026` : 'Upcoming'}
                        </span>
                      )}

                      <span className="text-[10px] font-semibold text-white/90 bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded">
                        {b.isDigital ? 'Digital High-LED' : 'Illuminated Vinyl'}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      {/* Location Ribbon */}
                      <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 mb-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="line-clamp-1">
                          {b.location.city}, {b.location.state} • {b.location.corridorName}
                        </span>
                      </div>

                      {/* Billboard Title */}
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {b.name}
                      </h3>

                      {/* Description Preview */}
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                        {b.description}
                      </p>
                    </div>

                    {/* Technical & Circulation Stats */}
                    <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-gray-100 text-xs">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
                          Daily Reach
                        </span>
                        <span className="font-bold text-gray-900">
                          {b.location.dailyTrafficCount.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-gray-400 block -mt-0.5">DEC</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
                          Dimensions
                        </span>
                        <span className="font-bold text-gray-900">
                          {b.widthFeet}&apos; x {b.heightFeet}&apos;
                        </span>
                        <span className="text-[10px] text-gray-400 block -mt-0.5">
                          {b.squareFeet} sq ft
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
                          Facing
                        </span>
                        <span className="font-bold text-gray-900">
                          {b.orientation}
                        </span>
                        <span className="text-[10px] text-gray-400 block -mt-0.5">
                          Line of sight
                        </span>
                      </div>
                    </div>

                    {/* Commercial Pricing & CTA Footer */}
                    <div className="pt-1 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                          Rate Card
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-black text-gray-900">
                            ${b.monthlyRate.toLocaleString()}
                          </span>
                          <span className="text-xs font-semibold text-gray-400">/mo</span>
                        </div>
                        <span className="text-[11px] text-gray-500 block">
                          ${b.weeklyRate.toLocaleString()}/wk
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedBillboardForInspect(b)}
                          className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200/80 text-gray-700 text-xs font-semibold transition-all"
                        >
                          Specs
                        </button>
                        <button
                          onClick={() => handleOpenBookingModal(b)}
                          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1"
                        >
                          <span>Request</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: INTERACTIVE MAP SPLIT VIEW */}
        {/* ======================================================== */}
        {viewMode === 'map' && (
          <div className="h-[650px] w-full rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row">
            {/* Left sidebar list */}
            <div className="w-full md:w-96 border-r border-gray-100 flex flex-col h-full bg-gray-50/50">
              <div className="p-3.5 border-b border-gray-100 bg-white">
                <span className="text-xs font-bold text-gray-900 block">
                  Marketplace Sites ({filteredBillboards.length})
                </span>
                <span className="text-[11px] text-gray-500">
                  Select any billboard to inspect GPS pins and rates
                </span>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {filteredBillboards.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBillboardForInspect(b)}
                    className="p-3 hover:bg-indigo-50/50 cursor-pointer transition-colors flex items-center gap-3 bg-white"
                  >
                    <div className="w-14 h-11 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                      <img src={b.photos[0]} alt={b.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-indigo-600">{b.code}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700">
                          {b.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-gray-900 truncate">{b.name}</h4>
                      <p className="text-[11px] text-gray-500 truncate">
                        {b.location.city} • ${b.monthlyRate.toLocaleString()}/mo
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Map Canvas Simulation */}
            <div className="flex-1 h-full bg-[#0d1322] relative overflow-hidden flex items-center justify-center p-6 select-none">
              {/* Grid Lines */}
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:24px_24px]" />

              <div className="text-center max-w-md relative z-10 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 mx-auto flex items-center justify-center text-indigo-400">
                  <MapIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Interactive Cartographic View</h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Geospatial billboard locations with highway corridor telemetry. For full zoom controls, live radar feeds, and radius clustering, launch the Interactive Map workspace.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Link
                    href="/map"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <span>Open Fullscreen Interactive Map</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => setViewMode('grid')}
                    className="px-4 py-2 rounded-xl bg-gray-800 text-gray-200 text-xs font-semibold hover:bg-gray-700"
                  >
                    Back to Grid View
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* 6. MODAL: 360° BILLBOARD DETAIL INSPECTION (PUBLIC) */}
      {/* ======================================================== */}
      {selectedBillboardForInspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-gray-100 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
            <button
              onClick={() => setSelectedBillboardForInspect(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="border-b border-gray-100 pb-4 pr-10">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                  {selectedBillboardForInspect.code}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                  {selectedBillboardForInspect.status}
                </span>
                <span className="text-[11px] font-medium text-gray-500">
                  {TYPE_DISPLAY_NAMES[selectedBillboardForInspect.type]}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {selectedBillboardForInspect.name}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                {selectedBillboardForInspect.location.address}, {selectedBillboardForInspect.location.city},{' '}
                {selectedBillboardForInspect.location.state}
              </p>
            </div>

            {/* Modal Body */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
              {/* Left 2 Cols: Photography & Specs */}
              <div className="md:col-span-2 space-y-5">
                {/* Photo High-Res */}
                <div className="h-64 sm:h-80 rounded-xl overflow-hidden bg-gray-100 relative">
                  <img
                    src={selectedBillboardForInspect.photos[0]}
                    alt={selectedBillboardForInspect.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-black/70 backdrop-blur-xs text-[11px] text-white">
                    Verified On-Site High Resolution Photo
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-1.5">
                    Structure Profile & Visibility Angle
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50/70 p-3.5 rounded-xl border border-gray-100">
                    {selectedBillboardForInspect.description}
                  </p>
                </div>

                {/* Technical Grid */}
                <div>
                  <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-indigo-600" />
                    Display Engineering Specifications
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-gray-50/70 border border-gray-100">
                      <span className="text-[11px] text-gray-500 block">Dimensions</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedBillboardForInspect.widthFeet}&apos; x {selectedBillboardForInspect.heightFeet}&apos;
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50/70 border border-gray-100">
                      <span className="text-[11px] text-gray-500 block">Total Area</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedBillboardForInspect.squareFeet} sq ft
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50/70 border border-gray-100">
                      <span className="text-[11px] text-gray-500 block">Orientation</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedBillboardForInspect.orientation} Facing
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50/70 border border-gray-100">
                      <span className="text-[11px] text-gray-500 block">Illumination</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedBillboardForInspect.illumination.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50/70 border border-gray-100">
                      <span className="text-[11px] text-gray-500 block">Structure Height</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedBillboardForInspect.structureHeightFeet} ft above grade
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50/70 border border-gray-100">
                      <span className="text-[11px] text-gray-500 block">Min Booking Flight</span>
                      <span className="text-sm font-semibold text-indigo-600">
                        {selectedBillboardForInspect.minBookingDays} Days
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right 1 Col: Rate Card & Actions */}
              <div className="space-y-4">
                {/* Rate Card Summary */}
                <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-100 space-y-3">
                  <span className="text-xs font-semibold uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                    Commercial Rate Card
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Monthly Flight:</span>
                      <span className="text-base font-bold text-gray-900">
                        ${selectedBillboardForInspect.monthlyRate.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Weekly Flight:</span>
                      <span className="font-semibold text-gray-900">
                        ${selectedBillboardForInspect.weeklyRate.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Daily Pro-rated:</span>
                      <span className="font-semibold text-gray-900">
                        ${selectedBillboardForInspect.dailyRate.toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t border-gray-200/60 pt-2 flex justify-between items-center">
                      <span className="text-gray-500">Vinyl Printing:</span>
                      <span className="font-semibold text-gray-900">
                        ${selectedBillboardForInspect.productionCost.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Rigging & Install:</span>
                      <span className="font-semibold text-gray-900">
                        ${selectedBillboardForInspect.installationCost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Location Telemetry */}
                <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-100 space-y-2.5 text-xs">
                  <span className="text-xs font-semibold uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-indigo-600" />
                    Circulation Profile
                  </span>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Highway Corridor:</span>
                    <span className="font-medium text-gray-900">
                      {selectedBillboardForInspect.location.corridorName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Daily Traffic (DEC):</span>
                    <span className="font-bold text-indigo-600 text-sm">
                      {selectedBillboardForInspect.location.dailyTrafficCount.toLocaleString()} Eyes/Day
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-200/60">
                    <a
                      href={`https://www.google.com/maps?q=${selectedBillboardForInspect.location.latitude},${selectedBillboardForInspect.location.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-600 font-semibold hover:underline"
                    >
                      <span>Open Satellite View in Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Primary CTA Buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => {
                      const target = selectedBillboardForInspect;
                      setSelectedBillboardForInspect(null);
                      handleOpenBookingModal(target);
                    }}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Request Booking for this Site</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      handleToggleShortlist(
                        selectedBillboardForInspect.id,
                        selectedBillboardForInspect.name
                      );
                    }}
                    className="w-full py-2 rounded-xl bg-gray-100 hover:bg-gray-200/80 text-gray-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        shortlist.includes(selectedBillboardForInspect.id)
                          ? 'fill-rose-500 text-rose-500'
                          : 'text-gray-400'
                      }`}
                    />
                    <span>
                      {shortlist.includes(selectedBillboardForInspect.id)
                        ? 'Remove from Shortlist'
                        : 'Add to Shortlist'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. MODAL: INSTANT BOOKING REQUEST (FEEDS TO CRM & BOOKINGS) */}
      {/* ======================================================== */}
      {selectedBillboardForBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-gray-100 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 relative">
            <button
              onClick={() => setSelectedBillboardForBooking(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="border-b border-gray-100 pb-3 mb-5 pr-8">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                  {selectedBillboardForBooking.code}
                </span>
                <span className="text-xs font-semibold text-gray-500">
                  {selectedBillboardForBooking.location.city}, {selectedBillboardForBooking.location.state}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Request Booking Flight: {selectedBillboardForBooking.name}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Submit your flight dates and advertiser details. This creates a high-priority inquiry in our internal CRM and tentative schedule hold.
              </p>
            </div>

            <form onSubmit={handleSubmitBooking} className="space-y-5">
              {/* Section 1: Flight Dates */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase text-indigo-600 tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Flight Schedule & Duration
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">
                      Flight Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={bookingForm.startDate}
                      onChange={(e) => setBookingForm({ ...bookingForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">
                      Flight End Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={bookingForm.endDate}
                      onChange={(e) => setBookingForm({ ...bookingForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
                  <span>
                    Calculated Flight Duration: <strong>{calculatedDurationDays} Days</strong> ({Math.ceil(calculatedDurationDays / 7)} Weeks)
                  </span>
                  <span className="font-semibold text-indigo-700">
                    Min required: {selectedBillboardForBooking.minBookingDays} days
                  </span>
                </div>
              </div>

              {/* Section 2: Advertiser Profile */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <h3 className="text-xs font-semibold uppercase text-indigo-600 tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" />
                  Advertiser / Brand Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">
                      Company / Brand Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={bookingForm.companyName}
                      onChange={(e) => setBookingForm({ ...bookingForm, companyName: e.target.value })}
                      placeholder="e.g. Acme Beverages Inc"
                      className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">
                      Contact Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={bookingForm.contactName}
                      onChange={(e) => setBookingForm({ ...bookingForm, contactName: e.target.value })}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">
                      Corporate Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={bookingForm.contactEmail}
                      onChange={(e) => setBookingForm({ ...bookingForm, contactEmail: e.target.value })}
                      placeholder="sjenkins@brand.com"
                      className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">
                      Direct Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={bookingForm.contactPhone}
                      onChange={(e) => setBookingForm({ ...bookingForm, contactPhone: e.target.value })}
                      placeholder="+1 (555) 019-2834"
                      className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">
                      Industry
                    </label>
                    <input
                      type="text"
                      value={bookingForm.industry}
                      onChange={(e) => setBookingForm({ ...bookingForm, industry: e.target.value })}
                      placeholder="Retail / Luxury / Auto"
                      className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Campaign & Production Options */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <h3 className="text-xs font-semibold uppercase text-indigo-600 tracking-wider flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5" />
                  Production & Installation Add-ons
                </h3>

                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    Campaign Title / Product Initiative
                  </label>
                  <input
                    type="text"
                    value={bookingForm.campaignName}
                    onChange={(e) => setBookingForm({ ...bookingForm, campaignName: e.target.value })}
                    placeholder="e.g. Q4 National Beverage Holiday Launch"
                    className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-2 pt-1 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-gray-100">
                    <input
                      type="checkbox"
                      checked={bookingForm.requiresPrinting}
                      onChange={(e) =>
                        setBookingForm({ ...bookingForm, requiresPrinting: e.target.checked })
                      }
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900">
                        Include Heavyweight Vinyl Printing & Finishing
                      </span>
                      <span className="text-gray-400 block text-[11px]">
                        Certified weather-resistant 14oz UV vinyl (+${selectedBillboardForBooking.productionCost})
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-gray-100">
                    <input
                      type="checkbox"
                      checked={bookingForm.requiresInstallation}
                      onChange={(e) =>
                        setBookingForm({ ...bookingForm, requiresInstallation: e.target.checked })
                      }
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900">
                        Include Professional Rigging & Installation Crew
                      </span>
                      <span className="text-gray-400 block text-[11px]">
                        Certified OOH field technicians & insurance (+${selectedBillboardForBooking.installationCost})
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-gray-100">
                    <input
                      type="checkbox"
                      checked={bookingForm.requiresArtworkDesign}
                      onChange={(e) =>
                        setBookingForm({ ...bookingForm, requiresArtworkDesign: e.target.checked })
                      }
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900">
                        Need Adversoft Creative Graphic Design Studio Support
                      </span>
                      <span className="text-gray-400 block text-[11px]">
                        Custom 3D / OOH high-contrast key visual design (+\\$950)
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Section 4: Dynamic Price Calculation Summary */}
              <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Estimated Total Flight Investment:</span>
                  <span className="text-lg font-black text-gray-900">
                    ${calculatedEstimateTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-gray-400">
                  <span>Includes space rental &amp; selected production services</span>
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                    Official Quotation Guaranteed in 2 Hrs
                  </span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedBillboardForBooking(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-xs flex items-center gap-1.5"
                >
                  <span>Submit Booking Request</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. MODAL: SUCCESS CONFIRMATION (WITH CRM LEAD NUMBER) */}
      {/* ======================================================== */}
      {bookingSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-gray-100 rounded-2xl w-full max-w-lg p-6 sm:p-8 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Booking Request Logged Successfully
              </span>
              <h3 className="text-xl font-bold text-gray-900 mt-2">
                Thank You, {bookingSuccessData.request.contactName}!
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Your outdoor flight reservation has been received and routed into our executive sales pipeline.
              </p>
            </div>

            {/* Tracking Reference Receipt Card */}
            <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-100 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Request Number:</span>
                <span className="font-mono font-bold text-gray-900">
                  {bookingSuccessData.request.requestNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Internal CRM Lead:</span>
                <span className="font-mono font-bold text-indigo-600">
                  #{bookingSuccessData.leadNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Structure Asset:</span>
                <span className="font-medium text-gray-900 truncate">
                  {bookingSuccessData.request.billboardCode} — {bookingSuccessData.request.billboardName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Flight Dates:</span>
                <span className="font-medium text-gray-900">
                  {bookingSuccessData.request.startDate} to {bookingSuccessData.request.endDate}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-200/60 pt-2 font-bold">
                <span className="text-gray-600">Estimated Value:</span>
                <span className="text-base text-gray-900">
                  ${bookingSuccessData.request.totalEstimatedValue.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setBookingSuccessData(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all"
              >
                Browse More Billboards
              </button>
              {user && (
                <Link
                  href="/crm"
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-all"
                >
                  View Lead in CRM Pipeline &rarr;
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 9. SHORTLIST DRAWER (SLIDE OVER) */}
      {/* ======================================================== */}
      {isShortlistDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs">
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white border-l border-gray-100 shadow-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                    <h3 className="text-base font-bold text-gray-900">
                      Saved Shortlist ({shortlistedBillboards.length})
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsShortlistDrawerOpen(false)}
                    className="p-1 rounded-md text-gray-400 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Shortlist Items */}
                <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {shortlistedBillboards.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-xs">
                      No billboards added to your shortlist yet. Click the heart icon on any billboard to save it here.
                    </div>
                  ) : (
                    shortlistedBillboards.map((b) => (
                      <div
                        key={b.id}
                        className="p-3 rounded-xl bg-gray-50/70 border border-gray-100 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="w-14 h-11 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                          <img src={b.photos[0]} alt={b.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-mono text-[10px] font-bold text-indigo-600 block">
                            {b.code}
                          </span>
                          <h4 className="font-bold text-gray-900 truncate">{b.name}</h4>
                          <span className="text-gray-500 text-[11px] block">
                            ${b.monthlyRate.toLocaleString()}/mo • {b.location.city}
                          </span>
                        </div>
                        <button
                          onClick={() => handleToggleShortlist(b.id, b.name)}
                          className="p-1 text-gray-400 hover:text-rose-500"
                          title="Remove from shortlist"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Shortlist Bottom Summary & Batch RFP */}
              {shortlistedBillboards.length > 0 && (
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Combined Monthly Rate:</span>
                      <span className="text-base font-bold text-gray-900">
                        ${shortlistTotalRate.toLocaleString()}/mo
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-gray-400">
                      <span>Total Daily Reach:</span>
                      <span className="font-semibold text-indigo-600">
                        {shortlistTotalTraffic.toLocaleString()} DEC
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsShortlistDrawerOpen(false);
                      setIsBatchRfpModalOpen(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Request Multi-Site Network Proposal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 10. MODAL: MULTI-SITE BATCH RFP */}
      {/* ======================================================== */}
      {isBatchRfpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-gray-100 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
            <button
              onClick={() => setIsBatchRfpModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-gray-100 pb-3 mb-4 pr-8">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">
                Multi-Site Network Package Request
              </span>
              <h2 className="text-lg font-bold text-gray-900 mt-1">
                Request Proposal for {shortlistedBillboards.length} Selected Billboards
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Our outdoor media planners will prepare a combined network quotation with multi-site package discounts.
              </p>
            </div>

            <form onSubmit={handleBatchRfpSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-gray-700 block mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={batchForm.companyName}
                    onChange={(e) => setBatchForm({ ...batchForm, companyName: e.target.value })}
                    placeholder="e.g. Apex Global"
                    className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-xs text-gray-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-medium text-gray-700 block mb-1">Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={batchForm.contactName}
                    onChange={(e) => setBatchForm({ ...batchForm, contactName: e.target.value })}
                    placeholder="e.g. Michael Stone"
                    className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-xs text-gray-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-gray-700 block mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={batchForm.contactEmail}
                    onChange={(e) => setBatchForm({ ...batchForm, contactEmail: e.target.value })}
                    placeholder="mstone@company.com"
                    className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-xs text-gray-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-medium text-gray-700 block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={batchForm.contactPhone}
                    onChange={(e) => setBatchForm({ ...batchForm, contactPhone: e.target.value })}
                    placeholder="+1 (555) 019-3321"
                    className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-xs text-gray-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-gray-700 block mb-1">Estimated Budget Range</label>
                <select
                  value={batchForm.targetBudget}
                  onChange={(e) => setBatchForm({ ...batchForm, targetBudget: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-xs text-gray-900 focus:outline-hidden"
                >
                  <option value="Under $25,000">Under $25,000</option>
                  <option value="$25,000 - $50,000">$25,000 - $50,000</option>
                  <option value="$50,000 - $100,000">$50,000 - $100,000</option>
                  <option value="$100,000+">$100,000+ Enterprise Flight</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-gray-700 block mb-1">Campaign Objectives / Timeline</label>
                <textarea
                  rows={2}
                  value={batchForm.campaignGoals}
                  onChange={(e) => setBatchForm({ ...batchForm, campaignGoals: e.target.value })}
                  placeholder="Describe your target flight duration, key markets, and audience demographic..."
                  className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-xs text-gray-900 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsBatchRfpModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs"
                >
                  Submit Multi-Site RFP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 11. ENTERPRISE FOOTER */}
      {/* ======================================================== */}
      <footer className="mt-auto bg-white border-t border-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="font-black text-gray-900">Adversoft Marketing Management System</span>
            <span>•</span>
            <span>Public Billboard Marketplace</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-indigo-600 transition-colors">
              Internal Portal
            </Link>
            <Link href="/map" className="hover:text-indigo-600 transition-colors">
              Billboard Map
            </Link>
            <Link href="/pricing" className="hover:text-indigo-600 transition-colors">
              Dynamic Pricing Engine
            </Link>
            <Link href="/bookings" className="hover:text-indigo-600 transition-colors">
              Bookings
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
