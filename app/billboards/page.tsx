'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/protectedRoute';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { getTenantBillboards, saveTenantBillboards } from '@/lib/tenant-store';
import {
  INITIAL_BILLBOARDS,
  BillboardItem,
  BillboardStatus,
  BillboardType,
  BillboardOrientation,
  IlluminationType,
} from '@/lib/data/billboards-store';
import {
  Layers,
  Map,
  Search,
  Filter,
  Plus,
  MapPin,
  Eye,
  SlidersHorizontal,
  Clock,
  Car,
  DollarSign,
  Tv,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Maximize2,
  Compass,
  Zap,
  Tag,
  Wrench,
  Grid,
  List,
  X,
  FileText,
  Calendar,
  Building2,
  TrendingUp,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  BillboardStatus,
  { label: string; bg: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
  AVAILABLE: {
    label: 'Available',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    icon: CheckCircle2,
  },
  OCCUPIED: {
    label: 'Occupied',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    icon: Eye,
  },
  RESERVED: {
    label: 'Reserved',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    icon: Clock,
  },
  MAINTENANCE: {
    label: 'Maintenance',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    icon: Wrench,
  },
  INACTIVE: {
    label: 'Inactive',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    icon: XCircle,
  },
};

const TYPE_LABELS: Record<BillboardType, string> = {
  STATIC_BULLETIN: 'Static Bulletin',
  DIGITAL_LED: 'Digital LED',
  WALLSCAPE: 'Wallscape',
  UNIPOLE: 'Unipole Bulletin',
  GANTRY: 'Overhead Gantry',
  BRIDGE_PANEL: 'Bridge Panel',
  TRANSIT_SHELTER: 'Transit Shelter',
  SPECTACULAR: 'Custom Spectacular',
};

export default function BillboardsPage() {
  const { user, tenant } = useAuth();
  const { toast } = useToast();

  const [billboards, setBillboards] = useState<BillboardItem[]>(() => getTenantBillboards(tenant?.id));

  useEffect(() => {
    setBillboards(getTenantBillboards(tenant?.id));

    const handleUpdate = () => {
      setBillboards(getTenantBillboards(tenant?.id));
    };

    window.addEventListener('adversoft_billboards_updated', handleUpdate);
    window.addEventListener('adversoft_tenant_changed', handleUpdate);

    return () => {
      window.removeEventListener('adversoft_billboards_updated', handleUpdate);
      window.removeEventListener('adversoft_tenant_changed', handleUpdate);
    };
  }, [tenant]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals state
  const [inspectBillboard, setInspectBillboard] = useState<BillboardItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [statusChangeTarget, setStatusChangeTarget] = useState<BillboardItem | null>(null);
  const [newStatusValue, setNewStatusValue] = useState<BillboardStatus>('AVAILABLE');
  const [statusNotes, setStatusNotes] = useState('');

  // New Billboard Form State
  const [newForm, setNewForm] = useState({
    code: '',
    name: '',
    type: 'STATIC_BULLETIN' as BillboardType,
    orientation: 'NORTH' as BillboardOrientation,
    illumination: 'FRONTLIT_LED' as IlluminationType,
    widthFeet: 48,
    heightFeet: 14,
    structureHeightFeet: 60,
    faceCount: 1,
    isDigital: false,
    digitalSlots: 8,
    slotDurationSeconds: 8,
    dailyRate: 400,
    weeklyRate: 2500,
    monthlyRate: 9000,
    productionCost: 1200,
    installationCost: 750,
    minBookingDays: 14,
    address: '',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    corridorName: '',
    latitude: 40.7128,
    longitude: -74.006,
    dailyTrafficCount: 85000,
    averageSpeedMph: 45,
    description: '',
    photoUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop&q=80',
    isMarketplaceListed: true,
  });

  // Calculate live metrics
  const metrics = useMemo(() => {
    const total = billboards.length;
    const available = billboards.filter((b) => b.status === 'AVAILABLE').length;
    const occupied = billboards.filter((b) => b.status === 'OCCUPIED').length;
    const reserved = billboards.filter((b) => b.status === 'RESERVED').length;
    const maintenance = billboards.filter((b) => b.status === 'MAINTENANCE').length;
    const digitalCount = billboards.filter((b) => b.isDigital).length;
    const staticCount = total - digitalCount;
    const totalMonthlyRev = billboards.reduce((acc, b) => acc + b.monthlyRate, 0);
    const totalCirculation = billboards.reduce((acc, b) => acc + b.location.dailyTrafficCount, 0);
    const occupancyRate = total > 0 ? Math.round(((occupied + reserved) / total) * 100) : 0;

    return {
      total,
      available,
      occupied,
      reserved,
      maintenance,
      digitalCount,
      staticCount,
      totalMonthlyRev,
      totalCirculation,
      occupancyRate,
    };
  }, [billboards]);

  // Unique cities for filter
  const cityOptions = useMemo(() => {
    const set = new Set(billboards.map((b) => b.location.city));
    return Array.from(set).sort();
  }, [billboards]);

  // Filtered billboard list
  const filteredBillboards = useMemo(() => {
    return billboards.filter((b) => {
      if (selectedStatus !== 'ALL' && b.status !== selectedStatus) return false;
      if (selectedType !== 'ALL' && b.type !== selectedType) return false;
      if (selectedCity !== 'ALL' && b.location.city !== selectedCity) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = b.code.toLowerCase().includes(q);
        const matchName = b.name.toLowerCase().includes(q);
        const matchCity = b.location.city.toLowerCase().includes(q);
        const matchCorridor = b.location.corridorName.toLowerCase().includes(q);
        const matchAdvertiser = b.currentAdvertiser?.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchCity && !matchCorridor && !matchAdvertiser) {
          return false;
        }
      }
      return true;
    });
  }, [billboards, selectedStatus, selectedType, selectedCity, searchQuery]);

  // Handle status update
  const handleApplyStatusChange = () => {
    if (!statusChangeTarget) return;

    const updated = billboards.map((b) => {
      if (b.id === statusChangeTarget.id) {
        const updatedLogs = [...b.maintenanceLogs];
        if (statusNotes.trim()) {
          updatedLogs.unshift({
            id: `m_${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            type: newStatusValue === 'MAINTENANCE' ? 'REPAIR' : 'INSPECTION',
            technician: user?.name || 'Operations Lead',
            status: newStatusValue === 'MAINTENANCE' ? 'PENDING' : 'RESOLVED',
            notes: `Status changed to ${newStatusValue}: ${statusNotes}`,
          });
        }
        return {
          ...b,
          status: newStatusValue,
          maintenanceLogs: updatedLogs,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      }
      return b;
    });

    setBillboards(updated);
    saveTenantBillboards(updated, tenant?.id);

    // If modal is inspecting this item, update it too
    if (inspectBillboard && inspectBillboard.id === statusChangeTarget.id) {
      setInspectBillboard((prev) => (prev ? { ...prev, status: newStatusValue } : null));
    }

    toast({
      title: 'Status Updated',
      description: `${statusChangeTarget.code} is now marked as ${newStatusValue}.`,
      type: 'success',
    });

    setStatusChangeTarget(null);
    setStatusNotes('');
  };

  // Handle create billboard
  const handleCreateBillboard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.code || !newForm.name || !newForm.address) {
      toast({
        title: 'Validation Error',
        description: 'Please complete all required fields.',
        type: 'destructive',
      });
      return;
    }

    const sqft = newForm.widthFeet * newForm.heightFeet;
    const now = new Date().toISOString().split('T')[0];

    const created: BillboardItem = {
      id: `bb_${Date.now()}`,
      code: newForm.code.toUpperCase(),
      name: newForm.name,
      type: newForm.type,
      orientation: newForm.orientation,
      illumination: newForm.illumination,
      status: 'AVAILABLE',
      widthFeet: Number(newForm.widthFeet),
      heightFeet: Number(newForm.heightFeet),
      squareFeet: sqft,
      structureHeightFeet: Number(newForm.structureHeightFeet),
      faceCount: Number(newForm.faceCount),
      isDigital: newForm.isDigital,
      digitalSlots: newForm.isDigital ? Number(newForm.digitalSlots) : undefined,
      slotDurationSeconds: newForm.isDigital ? Number(newForm.slotDurationSeconds) : undefined,
      dailyRate: Number(newForm.dailyRate),
      weeklyRate: Number(newForm.weeklyRate),
      monthlyRate: Number(newForm.monthlyRate),
      productionCost: Number(newForm.productionCost),
      installationCost: Number(newForm.installationCost),
      minBookingDays: Number(newForm.minBookingDays),
      photos: [newForm.photoUrl],
      description: newForm.description || `Premium ${newForm.type} advertising display in ${newForm.city}.`,
      isMarketplaceListed: newForm.isMarketplaceListed,
      location: {
        id: `loc_${Date.now()}`,
        address: newForm.address,
        city: newForm.city,
        state: newForm.state,
        zipCode: newForm.zipCode,
        country: 'USA',
        corridorName: newForm.corridorName || `${newForm.city} Metro Transit Arterial`,
        metroArea: `${newForm.city} Metro`,
        latitude: Number(newForm.latitude),
        longitude: Number(newForm.longitude),
        dailyTrafficCount: Number(newForm.dailyTrafficCount),
        averageSpeedMph: Number(newForm.averageSpeedMph),
      },
      maintenanceLogs: [
        {
          id: `m_${Date.now()}`,
          date: now,
          type: 'INSPECTION',
          technician: user?.name || 'David Miller',
          status: 'RESOLVED',
          notes: 'Initial commissioning inspection and safety certification completed.',
        },
      ],
      lastInspectedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const updated = [created, ...billboards];
    setBillboards(updated);
    saveTenantBillboards(updated, tenant?.id);
    setIsAddModalOpen(false);

    toast({
      title: 'Structure Registered',
      description: `Billboard ${created.code} successfully added to inventory.`,
      type: 'success',
    });

    // Reset form
    setNewForm({
      code: '',
      name: '',
      type: 'STATIC_BULLETIN',
      orientation: 'NORTH',
      illumination: 'FRONTLIT_LED',
      widthFeet: 48,
      heightFeet: 14,
      structureHeightFeet: 60,
      faceCount: 1,
      isDigital: false,
      digitalSlots: 8,
      slotDurationSeconds: 8,
      dailyRate: 400,
      weeklyRate: 2500,
      monthlyRate: 9000,
      productionCost: 1200,
      installationCost: 750,
      minBookingDays: 14,
      address: '',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      corridorName: '',
      latitude: 40.7128,
      longitude: -74.006,
      dailyTrafficCount: 85000,
      averageSpeedMph: 45,
      description: '',
      photoUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop&q=80',
      isMarketplaceListed: true,
    });
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6 pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase bg-indigo-50 text-indigo-700">
                Inventory Catalog
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                Physical & Digital Assets
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Billboard Inventory Management
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Comprehensive catalog of advertising structures, technical specifications, GPS locations, and live availability.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/map"
              className="px-3.5 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg text-sm flex items-center gap-2 transition-all shadow-sm"
            >
              <Map className="w-4 h-4 text-indigo-600" />
              <span>Interactive Map</span>
            </Link>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm flex items-center gap-2 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Billboard
            </button>
          </div>
        </div>

        {/* Inventory Summary Metric Cards - Clean Dashboard Style */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Card 1: Total Structures */}
          <Card className="p-4 border-gray-100 shadow-sm bg-white hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Total Inventory</span>
              <Layers className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-extrabold text-gray-900">{metrics.total}</div>
            <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-2">
              <span className="text-indigo-600 font-semibold">{metrics.digitalCount} Digital</span>
              <span>•</span>
              <span>{metrics.staticCount} Static</span>
            </div>
          </Card>

          {/* Card 2: Available Right Now */}
          <Card className="p-4 border-gray-100 shadow-sm bg-white hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Ready for Booking</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-600">{metrics.available}</div>
            <div className="text-[11px] text-gray-400 mt-1">
              {Math.round((metrics.available / metrics.total) * 100)}% available capacity
            </div>
          </Card>

          {/* Card 3: Occupancy Rate */}
          <Card className="p-4 border-gray-100 shadow-sm bg-white hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Occupancy Rate</span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-extrabold text-gray-900">{metrics.occupancyRate}%</div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${metrics.occupancyRate}%` }}
              />
            </div>
          </Card>

          {/* Card 4: Monthly Revenue Capacity */}
          <Card className="p-4 border-gray-100 shadow-sm bg-white hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Portfolio Asset Value</span>
              <DollarSign className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-amber-600">
              ${(metrics.totalMonthlyRev / 1000).toFixed(1)}k
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Monthly capacity ($/mo)</div>
          </Card>

          {/* Card 5: Daily Traffic Circulation */}
          <Card className="p-4 border-gray-100 shadow-sm bg-white hover:shadow-md transition-shadow col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Total Traffic (DEC)</span>
              <Car className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-extrabold text-gray-900">
              {(metrics.totalCirculation / 1000).toFixed(0)}k
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Daily vehicle & pedestrian count</div>
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
                placeholder="Search billboard code, name, corridor, city, or advertiser..."
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
              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-700 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              >
                <option value="ALL">All Structure Types</option>
                <option value="STATIC_BULLETIN">Static Bulletin</option>
                <option value="DIGITAL_LED">Digital LED</option>
                <option value="WALLSCAPE">Wallscape</option>
                <option value="UNIPOLE">Unipole Bulletin</option>
                <option value="GANTRY">Overhead Gantry</option>
                <option value="TRANSIT_SHELTER">Transit Shelter</option>
                <option value="SPECTACULAR">Spectacular</option>
              </select>

              {/* City Filter */}
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-700 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              >
                <option value="ALL">All Metro Markets</option>
                {cityOptions.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  title="Card Grid View"
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === 'grid'
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
                <Link
                  href="/map"
                  title="Interactive Map View"
                  className="p-1.5 rounded-md transition-all text-gray-500 hover:text-indigo-600 hover:bg-white"
                >
                  <Map className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto border-t border-gray-100 pt-3">
            <span className="text-xs text-gray-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Status:
            </span>
            {(['ALL', 'AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'] as const).map((st) => {
              const count =
                st === 'ALL'
                  ? billboards.length
                  : billboards.filter((b) => b.status === st).length;
              const isActive = selectedStatus === st;

              return (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'
                  }`}
                >
                  <span>{st === 'ALL' ? 'All' : STATUS_CONFIG[st].label}</span>
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

        {/* Inventory Results Area */}
        {billboards.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-gray-100 shadow-sm space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
              <MapPin className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900">No Billboards in this Workspace</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Your organization ({tenant?.name}) is currently running with a clean slate (0 demo data). Click below to register your first static bulletin, digital LED, or unipole.
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Register Your First Billboard</span>
            </button>
          </div>
        ) : filteredBillboards.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-gray-100 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 mx-auto flex items-center justify-center text-gray-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">No Billboards Found</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              No billboard structures match your active search terms and filter criteria.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedStatus('ALL');
                setSelectedType('ALL');
                setSelectedCity('ALL');
              }}
              className="px-4 py-1.5 text-xs font-medium text-primary hover:underline"
            >
              Reset All Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBillboards.map((b) => {
              const statusCfg = STATUS_CONFIG[b.status];
              const StatusIcon = statusCfg.icon;

              return (
                <Card
                  key={b.id}
                  className="group rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 overflow-hidden flex flex-col"
                >
                  {/* Image & Badges Container */}
                  <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                    <img
                      src={b.photos[0]}
                      alt={b.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Status Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm ${statusCfg.bg} ${statusCfg.text}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Tech & Digital Tag */}
                    <div className="absolute top-2.5 right-2.5">
                      {b.isDigital ? (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-600 text-white shadow-sm flex items-center gap-1">
                          <Tv className="w-3 h-3" />
                          DIGITAL LED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/90 text-gray-800 shadow-sm">
                          {b.faceCount} {b.faceCount > 1 ? 'Faces' : 'Face'}
                        </span>
                      )}
                    </div>

                    {/* Code & Dimensions on Image Bottom */}
                    <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-white drop-shadow-sm px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs">
                        {b.code}
                      </span>
                      <span className="text-white drop-shadow-sm font-medium">
                        {b.widthFeet}&apos; x {b.heightFeet}&apos; ({b.squareFeet} sq ft)
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      {/* Name & Type */}
                      <div className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider mb-0.5">
                        {TYPE_LABELS[b.type]}
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {b.name}
                      </h3>

                      {/* Location & Corridor */}
                      <div className="flex items-start gap-1.5 mt-2 text-xs text-gray-500">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400 mt-0.5" />
                        <span className="line-clamp-1">
                          {b.location.corridorName}, {b.location.city}
                        </span>
                      </div>

                      {/* Key Indicators */}
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100 text-xs">
                        <div>
                          <span className="text-gray-400 text-[10px] block">Daily Traffic (DEC)</span>
                          <span className="font-semibold text-gray-800 flex items-center gap-1">
                            <Car className="w-3 h-3 text-gray-400" />
                            {b.location.dailyTrafficCount.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 text-[10px] block">Orientation</span>
                          <span className="font-semibold text-gray-800 flex items-center gap-1">
                            <Compass className="w-3 h-3 text-gray-400" />
                            {b.orientation} Facing
                          </span>
                        </div>
                      </div>

                      {/* Occupant notice if occupied */}
                      {b.status === 'OCCUPIED' && b.currentAdvertiser && (
                        <div className="mt-2.5 p-2 rounded-lg bg-indigo-50 text-[11px]">
                          <span className="text-gray-500">Advertiser:</span>{' '}
                          <span className="font-semibold text-indigo-700">{b.currentAdvertiser}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer: Price & Actions */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <div className="text-base font-extrabold text-gray-900">
                          ${b.monthlyRate.toLocaleString()}
                          <span className="text-xs font-normal text-gray-400">/mo</span>
                        </div>
                        <div className="text-[10px] text-gray-400">
                          ${b.dailyRate}/day • min {b.minBookingDays}d
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setStatusChangeTarget(b);
                            setNewStatusValue(b.status);
                          }}
                          title="Change Status"
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-all"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setInspectBillboard(b)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-all flex items-center gap-1"
                        >
                          <span>Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Dense Table View - Clean White Card */
          <Card className="border-gray-100 shadow-sm bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Structure</th>
                    <th className="py-3 px-3 font-semibold">Type & Orientation</th>
                    <th className="py-3 px-3 font-semibold">Location & Corridor</th>
                    <th className="py-3 px-3 font-semibold">Dimensions</th>
                    <th className="py-3 px-3 font-semibold">Daily Traffic</th>
                    <th className="py-3 px-3 font-semibold">Rate Card</th>
                    <th className="py-3 px-3 font-semibold">Status</th>
                    <th className="py-3 px-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBillboards.map((b) => {
                    const statusCfg = STATUS_CONFIG[b.status];
                    const StatusIcon = statusCfg.icon;

                    return (
                      <tr key={b.id} className="hover:bg-gray-50/80 transition-colors">
                        {/* Structure thumbnail & name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-9 rounded-md bg-gray-100 overflow-hidden shrink-0 border border-gray-200/50">
                              <img
                                src={b.photos[0]}
                                alt={b.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <span className="font-mono text-xs font-bold text-indigo-600 mr-1.5">
                                {b.code}
                              </span>
                              <div className="font-semibold text-gray-900 text-xs line-clamp-1">
                                {b.name}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Type & Tech */}
                        <td className="py-3 px-3 text-xs">
                          <div className="font-semibold text-gray-900">{TYPE_LABELS[b.type]}</div>
                          <div className="text-gray-400 text-[11px] flex items-center gap-1">
                            <Compass className="w-3 h-3" />
                            {b.orientation}
                            {b.isDigital && (
                              <span className="text-indigo-600 font-bold ml-1">• Digital</span>
                            )}
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3 px-3 text-xs">
                          <div className="font-medium text-gray-900">{b.location.city}, {b.location.state}</div>
                          <div className="text-gray-400 text-[11px] line-clamp-1">
                            {b.location.corridorName}
                          </div>
                        </td>

                        {/* Dimensions */}
                        <td className="py-3 px-3 text-xs">
                          <div className="font-medium text-gray-900">
                            {b.widthFeet}&apos; x {b.heightFeet}&apos;
                          </div>
                          <div className="text-gray-400 text-[11px]">
                            {b.squareFeet} sq ft
                          </div>
                        </td>

                        {/* Daily Traffic */}
                        <td className="py-3 px-3 text-xs">
                          <div className="font-medium text-gray-900">
                            {b.location.dailyTrafficCount.toLocaleString()}
                          </div>
                          <div className="text-gray-400 text-[11px]">DEC / day</div>
                        </td>

                        {/* Rate */}
                        <td className="py-3 px-3 text-xs">
                          <div className="font-bold text-gray-900">
                            ${b.monthlyRate.toLocaleString()}
                            <span className="font-normal text-gray-400 text-[11px]">/mo</span>
                          </div>
                          <div className="text-gray-400 text-[11px]">
                            ${b.dailyRate}/d
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-xs">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-xs ${statusCfg.bg} ${statusCfg.text}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusCfg.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setStatusChangeTarget(b);
                                setNewStatusValue(b.status);
                              }}
                              title="Update Status"
                              className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-all"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setInspectBillboard(b)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-all"
                            >
                              Inspect
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ======================================================== */}
        {/* MODAL 1: 360° BILLBOARD DETAIL INSPECTION DRAWER */}
        {/* ======================================================== */}
        {inspectBillboard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white border border-gray-100 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
              <button
                onClick={() => setInspectBillboard(null)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4 pr-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                      {inspectBillboard.code}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-xs ${STATUS_CONFIG[inspectBillboard.status].bg} ${STATUS_CONFIG[inspectBillboard.status].text}`}
                    >
                      {STATUS_CONFIG[inspectBillboard.status].label}
                    </span>
                    {inspectBillboard.isMarketplaceListed && (
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Marketplace Listed
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {inspectBillboard.name}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {TYPE_LABELS[inspectBillboard.type]} • {inspectBillboard.location.city}, {inspectBillboard.location.state}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setStatusChangeTarget(inspectBillboard);
                      setNewStatusValue(inspectBillboard.status);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Change Status
                  </button>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
                {/* Left 2 Cols: Images & Specs */}
                <div className="md:col-span-2 space-y-5">
                  {/* Photo Gallery */}
                  <div className="space-y-2">
                    <div className="h-64 w-full rounded-xl bg-secondary/40 overflow-hidden relative">
                      <img
                        src={inspectBillboard.photos[0]}
                        alt={inspectBillboard.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded bg-black/70 backdrop-blur-xs text-[11px] text-white flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        Primary High-Res Shot
                      </div>
                    </div>
                    {inspectBillboard.photos.length > 1 && (
                      <div className="flex gap-2">
                        {inspectBillboard.photos.map((p, idx) => (
                          <div
                            key={idx}
                            className="w-20 h-14 rounded-lg overflow-hidden border border-gray-200"
                          >
                            <img src={p} alt="Thumbnail" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-1.5">
                      Overview & Positioning
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed bg-gray-50/70 p-3.5 rounded-xl border border-gray-100">
                      {inspectBillboard.description}
                    </p>
                  </div>

                  {/* Physical & Technical Specs Table */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-indigo-600" />
                      Engineering & Display Specifications
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-gray-50/70 border border-gray-100">
                        <span className="text-[11px] text-gray-500 block">Dimensions (W x H)</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {inspectBillboard.widthFeet}&apos; x {inspectBillboard.heightFeet}&apos;
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50/70 border border-gray-100">
                        <span className="text-[11px] text-gray-500 block">Surface Area</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {inspectBillboard.squareFeet} sq ft
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50/70 border border-gray-100">
                        <span className="text-[11px] text-gray-500 block">Structure Height</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {inspectBillboard.structureHeightFeet} ft above ground
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50/70 border border-gray-100">
                        <span className="text-[11px] text-gray-500 block">Orientation</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {inspectBillboard.orientation}
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50/70 border border-gray-100">
                        <span className="text-[11px] text-gray-500 block">Illumination</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {inspectBillboard.illumination.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50/70 border border-gray-100">
                        <span className="text-[11px] text-gray-500 block">Display Technology</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {inspectBillboard.isDigital ? 'Digital High-Nits LED' : 'Printed Heavy Vinyl'}
                        </span>
                      </div>
                      {inspectBillboard.isDigital && (
                        <>
                          <div className="p-3 rounded-lg bg-gray-50/70 border border-gray-100">
                            <span className="text-[11px] text-gray-500 block">Shared Slots</span>
                            <span className="text-sm font-semibold text-indigo-600">
                              {inspectBillboard.digitalSlots} Advertisers
                            </span>
                          </div>
                          <div className="p-3 rounded-lg bg-gray-50/70 border border-gray-100">
                            <span className="text-[11px] text-gray-500 block">Slot Duration</span>
                            <span className="text-sm font-semibold text-indigo-600">
                              {inspectBillboard.slotDurationSeconds} seconds / rotation
                            </span>
                          </div>
                          <div className="p-3 rounded-lg bg-gray-50/70 border border-gray-100">
                            <span className="text-[11px] text-gray-500 block">Resolution Spec</span>
                            <span className="text-sm font-semibold text-gray-900">
                              {inspectBillboard.pixelResolution || '1080p Full HD'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Maintenance & Inspection Logs */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-2 flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                      Structural Maintenance & Safety Records
                    </h4>
                    <div className="space-y-2">
                      {inspectBillboard.maintenanceLogs.map((log) => (
                        <div
                          key={log.id}
                          className="p-3 rounded-lg bg-gray-50/70 border border-gray-100 text-xs flex items-start justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">{log.type}</span>
                              <span className="text-gray-400">• {log.date}</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  log.status === 'RESOLVED'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                {log.status}
                              </span>
                            </div>
                            <p className="text-gray-600 mt-1">{log.notes}</p>
                          </div>
                          <span className="text-[11px] text-gray-400 shrink-0">
                            {log.technician}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right 1 Col: Financials & Location GPS */}
                <div className="space-y-5">
                  {/* Financial Rate Card */}
                  <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-100 space-y-3">
                    <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                      Commercial Rate Card
                    </h4>
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Monthly Rate:</span>
                        <span className="text-base font-bold text-gray-900">
                          ${inspectBillboard.monthlyRate.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Weekly Rate:</span>
                        <span className="font-semibold text-gray-900">
                          ${inspectBillboard.weeklyRate.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Daily Pro-rated:</span>
                        <span className="font-semibold text-gray-900">
                          ${inspectBillboard.dailyRate.toLocaleString()}
                        </span>
                      </div>
                      <div className="border-t border-gray-200/60 pt-2 flex justify-between items-center text-xs">
                        <span className="text-gray-500">Vinyl Production:</span>
                        <span className="font-semibold text-gray-900">
                          ${inspectBillboard.productionCost.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Rigging & Installation:</span>
                        <span className="font-semibold text-gray-900">
                          ${inspectBillboard.installationCost.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Min Flight Duration:</span>
                        <span className="font-semibold text-indigo-600">
                          {inspectBillboard.minBookingDays} days
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Location & GPS Intelligence */}
                  <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-100 space-y-3">
                    <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                      Location & Traffic Intelligence
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-gray-400 block text-[11px]">Street Address:</span>
                        <span className="font-medium text-gray-900">{inspectBillboard.location.address}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[11px]">Corridor / Highway:</span>
                        <span className="font-medium text-gray-900">{inspectBillboard.location.corridorName}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <span className="text-gray-400 block text-[11px]">Daily Traffic:</span>
                          <span className="font-bold text-indigo-600">
                            {inspectBillboard.location.dailyTrafficCount.toLocaleString()} DEC
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[11px]">Avg Flow Speed:</span>
                          <span className="font-semibold text-gray-900">
                            {inspectBillboard.location.averageSpeedMph} MPH
                          </span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-gray-200/60">
                        <span className="text-gray-400 block text-[11px]">GPS Coordinates:</span>
                        <span className="font-mono text-[11px] text-gray-700">
                          {inspectBillboard.location.latitude.toFixed(4)},{' '}
                          {inspectBillboard.location.longitude.toFixed(4)}
                        </span>
                        <a
                          href={`https://www.google.com/maps?q=${inspectBillboard.location.latitude},${inspectBillboard.location.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-[11px] text-indigo-600 font-medium hover:underline"
                        >
                          <span>Open in Google Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Current Booking status if occupied */}
                  {inspectBillboard.status === 'OCCUPIED' && (
                    <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-100 space-y-2">
                      <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                        Active Flight
                      </div>
                      <div className="text-sm font-bold text-gray-900">
                        {inspectBillboard.currentAdvertiser}
                      </div>
                      <div className="text-xs text-gray-500">
                        Campaign: <span className="text-gray-900 font-medium">{inspectBillboard.currentCampaign}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Flight End: <span className="text-gray-900 font-medium">{inspectBillboard.currentBookingEnd}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL 2: CHANGE STATUS MODAL */}
        {/* ======================================================== */}
        {statusChangeTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white border border-gray-100 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Update Billboard Status
                  </h3>
                  <p className="text-xs text-gray-500 font-mono">
                    {statusChangeTarget.code} — {statusChangeTarget.name}
                  </p>
                </div>
                <button
                  onClick={() => setStatusChangeTarget(null)}
                  className="p-1 rounded-md text-gray-400 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    Select New Status
                  </label>
                  <select
                    value={newStatusValue}
                    onChange={(e) => setNewStatusValue(e.target.value as BillboardStatus)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="AVAILABLE">AVAILABLE (Ready for new campaign booking)</option>
                    <option value="OCCUPIED">OCCUPIED (Active advertiser displayed)</option>
                    <option value="RESERVED">RESERVED (Holds or approved quotation pending)</option>
                    <option value="MAINTENANCE">MAINTENANCE (Repair / illumination inspection)</option>
                    <option value="INACTIVE">INACTIVE (Decommissioned or permitted hold)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    Change Reason / Operational Notes
                  </label>
                  <textarea
                    rows={3}
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    placeholder="e.g. Completed scheduled LED module calibration..."
                    className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => setStatusChangeTarget(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyStatusChange}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-xs"
                >
                  Apply Status Change
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL 3: REGISTER NEW BILLBOARD */}
        {/* ======================================================== */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white border border-gray-100 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="border-b border-gray-100 pb-3 mb-5 pr-8">
                <h2 className="text-lg font-bold text-gray-900">
                  Register New Billboard Structure
                </h2>
                <p className="text-xs text-gray-500">
                  Add a new advertising asset into the Adversoft portfolio with physical specs, GPS coordinates, and rate card.
                </p>
              </div>

              <form onSubmit={handleCreateBillboard} className="space-y-5">
                {/* Section 1: Structure Info */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase text-indigo-600 tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    Structure Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Billboard Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={newForm.code}
                        onChange={(e) => setNewForm({ ...newForm, code: e.target.value })}
                        placeholder="e.g. BB-109"
                        className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Structure Display Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newForm.name}
                        onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                        placeholder="e.g. Broadway & 50th Street Digital Crown"
                        className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Structure Type
                      </label>
                      <select
                        value={newForm.type}
                        onChange={(e) =>
                          setNewForm({
                            ...newForm,
                            type: e.target.value as BillboardType,
                            isDigital: e.target.value === 'DIGITAL_LED',
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-xs text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                      >
                        <option value="STATIC_BULLETIN">Static Bulletin</option>
                        <option value="DIGITAL_LED">Digital LED</option>
                        <option value="WALLSCAPE">Wallscape</option>
                        <option value="UNIPOLE">Unipole Bulletin</option>
                        <option value="GANTRY">Overhead Gantry</option>
                        <option value="TRANSIT_SHELTER">Transit Shelter</option>
                        <option value="SPECTACULAR">Spectacular</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Orientation
                      </label>
                      <select
                        value={newForm.orientation}
                        onChange={(e) =>
                          setNewForm({ ...newForm, orientation: e.target.value as BillboardOrientation })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-xs text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                      >
                        <option value="NORTH">North Facing</option>
                        <option value="SOUTH">South Facing</option>
                        <option value="EAST">East Facing</option>
                        <option value="WEST">West Facing</option>
                        <option value="NORTHEAST">North-East</option>
                        <option value="NORTHWEST">North-West</option>
                        <option value="SOUTHEAST">South-East</option>
                        <option value="SOUTHWEST">South-West</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Illumination
                      </label>
                      <select
                        value={newForm.illumination}
                        onChange={(e) =>
                          setNewForm({ ...newForm, illumination: e.target.value as IlluminationType })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-xs text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                      >
                        <option value="FRONTLIT_LED">Frontlit LED</option>
                        <option value="DIGITAL_SCREEN">Digital Screen</option>
                        <option value="BACKLIT">Backlit</option>
                        <option value="SOLAR_POWERED">Solar Powered LED</option>
                        <option value="FRONTLIT_HALOGEN">Frontlit Halogen</option>
                        <option value="UNLIT">Unlit</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Dimensions & Tech */}
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <h3 className="text-xs font-semibold uppercase text-indigo-600 tracking-wider flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5" />
                    Physical Dimensions & Tech
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Width (ft)
                      </label>
                      <input
                        type="number"
                        value={newForm.widthFeet}
                        onChange={(e) => setNewForm({ ...newForm, widthFeet: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Height (ft)
                      </label>
                      <input
                        type="number"
                        value={newForm.heightFeet}
                        onChange={(e) => setNewForm({ ...newForm, heightFeet: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Structure Height
                      </label>
                      <input
                        type="number"
                        value={newForm.structureHeightFeet}
                        onChange={(e) => setNewForm({ ...newForm, structureHeightFeet: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Face Count
                      </label>
                      <input
                        type="number"
                        value={newForm.faceCount}
                        onChange={(e) => setNewForm({ ...newForm, faceCount: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Commercial Rates */}
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <h3 className="text-xs font-semibold uppercase text-indigo-600 tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    Commercial Rate Card
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Monthly Rate ($) *
                      </label>
                      <input
                        type="number"
                        required
                        value={newForm.monthlyRate}
                        onChange={(e) => setNewForm({ ...newForm, monthlyRate: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Weekly Rate ($)
                      </label>
                      <input
                        type="number"
                        value={newForm.weeklyRate}
                        onChange={(e) => setNewForm({ ...newForm, weeklyRate: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Daily Rate ($)
                      </label>
                      <input
                        type="number"
                        value={newForm.dailyRate}
                        onChange={(e) => setNewForm({ ...newForm, dailyRate: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Production Cost ($)
                      </label>
                      <input
                        type="number"
                        value={newForm.productionCost}
                        onChange={(e) => setNewForm({ ...newForm, productionCost: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Installation Cost ($)
                      </label>
                      <input
                        type="number"
                        value={newForm.installationCost}
                        onChange={(e) => setNewForm({ ...newForm, installationCost: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Min Flight (Days)
                      </label>
                      <input
                        type="number"
                        value={newForm.minBookingDays}
                        onChange={(e) => setNewForm({ ...newForm, minBookingDays: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Location & Traffic */}
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <h3 className="text-xs font-semibold uppercase text-indigo-600 tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    Location & Traffic Circulation
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={newForm.address}
                        onChange={(e) => setNewForm({ ...newForm, address: e.target.value })}
                        placeholder="e.g. 500 Seventh Avenue"
                        className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={newForm.city}
                        onChange={(e) => setNewForm({ ...newForm, city: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Corridor Name
                      </label>
                      <input
                        type="text"
                        value={newForm.corridorName}
                        onChange={(e) => setNewForm({ ...newForm, corridorName: e.target.value })}
                        placeholder="e.g. Garment District Plaza"
                        className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-xs text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Daily Traffic (DEC)
                      </label>
                      <input
                        type="number"
                        value={newForm.dailyTrafficCount}
                        onChange={(e) => setNewForm({ ...newForm, dailyTrafficCount: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-xs text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={newForm.latitude}
                        onChange={(e) => setNewForm({ ...newForm, latitude: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-xs text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={newForm.longitude}
                        onChange={(e) => setNewForm({ ...newForm, longitude: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-xs text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 5: Photo URL */}
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <h3 className="text-xs font-semibold uppercase text-indigo-600 tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    Photography & Listing
                  </h3>
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">
                      High-Resolution Photo URL
                    </label>
                    <input
                      type="url"
                      value={newForm.photoUrl}
                      onChange={(e) => setNewForm({ ...newForm, photoUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-gray-50/70 border border-gray-200 text-xs text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="mktCheck"
                      checked={newForm.isMarketplaceListed}
                      onChange={(e) => setNewForm({ ...newForm, isMarketplaceListed: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="mktCheck" className="text-xs text-gray-700 cursor-pointer">
                      List this billboard on public marketplace catalog
                    </label>
                  </div>
                </div>

                {/* Submit buttons */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-xs"
                  >
                    Create Billboard
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
