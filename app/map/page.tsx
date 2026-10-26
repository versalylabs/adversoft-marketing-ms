'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Map,
  MapPin,
  Layers,
  Search,
  Filter,
  Eye,
  Clock,
  Wrench,
  CheckCircle2,
  XCircle,
  Car,
  Compass,
  DollarSign,
  Maximize2,
  Tv,
  ExternalLink,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Navigation,
  Sliders,
  List,
  Sparkles,
  X,
  Target,
  ChevronDown,
  Building2,
  Grid,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  BillboardStatus,
  { label: string; bg: string; text: string; dot: string; hex: string }
> = {
  AVAILABLE: {
    label: 'Available',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    hex: '#10b981',
  },
  OCCUPIED: {
    label: 'Occupied',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    dot: 'bg-indigo-600',
    hex: '#4f46e5',
  },
  RESERVED: {
    label: 'Reserved',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    hex: '#f59e0b',
  },
  MAINTENANCE: {
    label: 'Maintenance',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
    hex: '#f43f5e',
  },
  INACTIVE: {
    label: 'Inactive',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
    hex: '#94a3b8',
  },
};

const CITY_HUBS = [
  { name: 'All United States', lat: 37.0902, lng: -95.7129, zoom: 4 },
  { name: 'New York Metro', lat: 40.758, lng: -73.9855, zoom: 11 },
  { name: 'Los Angeles Corridor', lat: 34.0983, lng: -118.3845, zoom: 11 },
  { name: 'Miami & South Beach', lat: 25.7617, lng: -80.1918, zoom: 11 },
  { name: 'San Francisco Bay Area', lat: 37.3695, lng: -121.9082, zoom: 11 },
  { name: 'Chicago Loop & Mag Mile', lat: 41.8935, lng: -87.6243, zoom: 11 },
  { name: 'Dallas-Fort Worth', lat: 32.7981, lng: -96.8229, zoom: 11 },
];

// Calculate distance in miles using Haversine formula
function calculateDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export default function InteractiveMapPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [billboards] = useState<BillboardItem[]>(INITIAL_BILLBOARDS);
  const [selectedCity, setSelectedCity] = useState<string>('All United States');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBillboard, setActiveBillboard] = useState<BillboardItem | null>(billboards[0]);
  const [inspectModalBillboard, setInspectModalBillboard] = useState<BillboardItem | null>(null);

  // Map viewport states
  const [zoomLevel, setZoomLevel] = useState<number>(4);
  const [centerCoords, setCenterCoords] = useState<{ lat: number; lng: number }>({
    lat: 37.0902,
    lng: -95.7129,
  });

  // Radius discovery mode
  const [radiusDiscoveryActive, setRadiusDiscoveryActive] = useState(false);
  const [discoveryRadiusMiles, setDiscoveryRadiusMiles] = useState(30);
  const [selectedHubLandmark, setSelectedHubLandmark] = useState<string>('Times Square Bowtie Plaza');

  // Split view toggle
  const [sidebarListOpen, setSidebarListOpen] = useState(true);

  // Map theme
  const [mapTheme, setMapTheme] = useState<'dark-matrix' | 'satellite' | 'street-night'>('dark-matrix');

  // Handle City Preset change
  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName);
    const hub = CITY_HUBS.find((h) => h.name === cityName);
    if (hub) {
      setCenterCoords({ lat: hub.lat, lng: hub.lng });
      setZoomLevel(hub.zoom);
    }
  };

  // Center on a specific billboard
  const handleFocusBillboard = (b: BillboardItem) => {
    setActiveBillboard(b);
    setCenterCoords({ lat: b.location.latitude, lng: b.location.longitude });
    setZoomLevel(13);
  };

  // Filtered billboards based on search, status, type, and optional radius
  const filteredBillboards = useMemo(() => {
    return billboards.filter((b) => {
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      if (typeFilter !== 'ALL' && b.type !== typeFilter) return false;

      // City Hub matching if not "All United States" and not in radius mode
      if (selectedCity !== 'All United States' && !radiusDiscoveryActive) {
        const cityKey = selectedCity.split(' ')[0].toLowerCase();
        if (!b.location.city.toLowerCase().includes(cityKey)) return false;
      }

      // Radius discovery filter
      if (radiusDiscoveryActive && activeBillboard) {
        const dist = calculateDistanceMiles(
          activeBillboard.location.latitude,
          activeBillboard.location.longitude,
          b.location.latitude,
          b.location.longitude
        );
        if (dist > discoveryRadiusMiles) return false;
      }

      // Text search
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = b.code.toLowerCase().includes(q);
        const matchName = b.name.toLowerCase().includes(q);
        const matchCity = b.location.city.toLowerCase().includes(q);
        const matchCorridor = b.location.corridorName.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchCity && !matchCorridor) return false;
      }

      return true;
    });
  }, [
    billboards,
    statusFilter,
    typeFilter,
    selectedCity,
    radiusDiscoveryActive,
    activeBillboard,
    discoveryRadiusMiles,
    searchQuery,
  ]);

  // Compute map SVG projected positions
  // US Bounding Box: Lat 24 to 50, Lng -125 to -66
  const mapSvgBounds = {
    minLat: 24.0,
    maxLat: 49.5,
    minLng: -125.0,
    maxLng: -66.5,
  };

  // Transform lat/lng to SVG percentage (0% to 100%)
  const projectCoords = (lat: number, lng: number) => {
    // If zoomed into a metro, project relative to current centerCoords & zoomLevel
    if (zoomLevel > 6) {
      // Localized box around centerCoords
      const latSpan = 18 / zoomLevel;
      const lngSpan = 28 / zoomLevel;
      const x = ((lng - (centerCoords.lng - lngSpan / 2)) / lngSpan) * 100;
      const y = (((centerCoords.lat + latSpan / 2) - lat) / latSpan) * 100;
      return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
    }

    // Full US National Overview projection
    const x = ((lng - mapSvgBounds.minLng) / (mapSvgBounds.maxLng - mapSvgBounds.minLng)) * 100;
    const y = ((mapSvgBounds.maxLat - lat) / (mapSvgBounds.maxLat - mapSvgBounds.minLat)) * 100;
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  return (
    <ProtectedRoute>
      <div className="space-y-4 pb-10 flex flex-col h-[calc(100vh-6rem)]">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase bg-indigo-50 text-indigo-700">
                Geospatial Intelligence
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Map className="w-3.5 h-3.5 text-indigo-600" />
                Geospatial Asset Intelligence
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              Interactive Billboard Map
            </h1>
          </div>

          {/* Quick Actions & Navigation to Inventory */}
          <div className="flex items-center gap-2">
            <Link
              href="/billboards"
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-medium text-gray-700 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Catalog View</span>
            </Link>

            <button
              onClick={() => setSidebarListOpen(!sidebarListOpen)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 ${
                sidebarListOpen
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>{sidebarListOpen ? 'Hide Feed' : 'Show Feed'}</span>
            </button>
          </div>
        </div>

        {/* Geospatial Control & Filter Ribbon - Clean White Card */}
        <Card className="p-3.5 border-gray-100 shadow-sm bg-white space-y-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[220px] flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search billboard ID, corridor, address..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-gray-50/70 border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* City Hub Quick-Fly Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Target className="w-3 h-3 text-primary" />
                Metro Hub:
              </span>
              <select
                value={selectedCity}
                onChange={(e) => handleCitySelect(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-700 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              >
                {CITY_HUBS.map((hub) => (
                  <option key={hub.name} value={hub.name}>
                    {hub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Structure Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-700 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            >
              <option value="ALL">All Structure Types</option>
              <option value="DIGITAL_LED">Digital LED</option>
              <option value="STATIC_BULLETIN">Static Bulletin</option>
              <option value="WALLSCAPE">Wallscape</option>
              <option value="UNIPOLE">Unipole Bulletin</option>
              <option value="GANTRY">Overhead Gantry</option>
              <option value="TRANSIT_SHELTER">Transit Shelter</option>
              <option value="SPECTACULAR">Spectacular</option>
            </select>

            {/* Proximity / Radius Discovery Toggle */}
            <button
              onClick={() => {
                const nextState = !radiusDiscoveryActive;
                setRadiusDiscoveryActive(nextState);
                if (nextState && activeBillboard) {
                  toast({
                    title: 'Radius Discovery Active',
                    description: `Showing structures within ${discoveryRadiusMiles} miles of ${activeBillboard.name}.`,
                    type: 'info',
                  });
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                radiusDiscoveryActive
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:text-gray-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Radius Discovery</span>
              {radiusDiscoveryActive && (
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                  {discoveryRadiusMiles}mi
                </span>
              )}
            </button>

            {/* Status Pills */}
            <div className="flex items-center gap-1">
              {(['ALL', 'AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'] as const).map((st) => {
                const isActive = statusFilter === st;
                return (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {st === 'ALL' ? 'All' : STATUS_CONFIG[st].label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Radius Discovery Sub-bar if Active */}
          {radiusDiscoveryActive && activeBillboard && (
            <div className="flex items-center justify-between gap-4 pt-2.5 border-t border-gray-100 text-xs bg-indigo-50/60 -mx-3.5 -mb-3.5 p-3 rounded-b-xl">
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                <span className="text-gray-500">Radius Center:</span>
                <span className="font-semibold text-gray-900">{activeBillboard.name}</span>
                <span className="text-gray-500">
                  ({activeBillboard.location.city}, {activeBillboard.location.corridorName})
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-600 font-mono">
                  Radius: <strong className="text-indigo-600">{discoveryRadiusMiles} mi</strong>
                </span>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={discoveryRadiusMiles}
                  onChange={(e) => setDiscoveryRadiusMiles(Number(e.target.value))}
                  className="w-32 accent-indigo-600 cursor-pointer"
                />
                <button
                  onClick={() => setRadiusDiscoveryActive(false)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Main Geospatial Workspace: Map Canvas + Feed Sidebar */}
        <div className="flex-1 flex gap-3.5 min-h-0 relative overflow-hidden">
          {/* ======================================================== */}
          {/* MAP CANVAS VIEWPORT */}
          {/* ======================================================== */}
          <div className="flex-1 rounded-2xl bg-[#090d16] border border-gray-800/80 shadow-inner relative overflow-hidden flex flex-col">
            {/* Interactive Vector / Cartographic Canvas */}
            <div className="relative w-full h-full overflow-hidden select-none">
              {/* Map Background Grid & Major Highway Corridors */}
              <svg className="w-full h-full absolute inset-0 pointer-events-none opacity-40">
                <defs>
                  <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.05)"
                      strokeWidth="1"
                    />
                  </pattern>
                  {/* Concentric radar circle if radius discovery is active */}
                  <radialGradient id="radarPulse" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                    <stop offset="80%" stopColor="#6366f1" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#mapGrid)" />

                {/* Continental Highway Artery Curves */}
                <path
                  d="M 120 180 Q 250 220 480 320 T 780 260"
                  fill="none"
                  stroke="rgba(56, 189, 248, 0.15)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <path
                  d="M 680 80 Q 720 250 740 450"
                  fill="none"
                  stroke="rgba(168, 85, 247, 0.15)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <path
                  d="M 160 80 Q 180 280 210 420"
                  fill="none"
                  stroke="rgba(56, 189, 248, 0.15)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              </svg>

              {/* Map Floating Header Info */}
              <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-xs font-mono text-white/90 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    Lat: {centerCoords.lat.toFixed(3)}, Lng: {centerCoords.lng.toFixed(3)}
                  </span>
                  <span className="text-white/40">|</span>
                  <span>Zoom: {zoomLevel}x</span>
                  <span className="text-white/40">|</span>
                  <span className="text-primary font-semibold">
                    {filteredBillboards.length} structures shown
                  </span>
                </div>
              </div>

              {/* Map Navigation Controls (+ / - / Reset) */}
              <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(16, z + 2))}
                  title="Zoom In"
                  className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-all shadow-md"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(3, z - 2))}
                  title="Zoom Out"
                  className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-all shadow-md"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    handleCitySelect('All United States');
                    setRadiusDiscoveryActive(false);
                  }}
                  title="Reset to Continental US"
                  className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-all shadow-md"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Radius Discovery Ring Overlay */}
              {radiusDiscoveryActive && activeBillboard && (
                <div
                  className="absolute pointer-events-none rounded-full border border-indigo-400/40 bg-indigo-500/10 -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
                  style={{
                    left: `${projectCoords(activeBillboard.location.latitude, activeBillboard.location.longitude).x}%`,
                    top: `${projectCoords(activeBillboard.location.latitude, activeBillboard.location.longitude).y}%`,
                    width: `${discoveryRadiusMiles * (zoomLevel > 6 ? 12 : 3)}px`,
                    height: `${discoveryRadiusMiles * (zoomLevel > 6 ? 12 : 3)}px`,
                  }}
                />
              )}

              {/* Billboard Map Markers */}
              {filteredBillboards.map((b) => {
                const pos = projectCoords(b.location.latitude, b.location.longitude);
                const isSelected = activeBillboard?.id === b.id;
                const statusCfg = STATUS_CONFIG[b.status];

                return (
                  <div
                    key={b.id}
                    onClick={() => setActiveBillboard(b)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group transition-transform duration-200"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  >
                    {/* Animated Pulse Ring if Selected or Available */}
                    {(isSelected || b.status === 'AVAILABLE') && (
                      <span
                        className="absolute inset-0 rounded-full animate-ping opacity-60"
                        style={{ backgroundColor: statusCfg.hex }}
                      />
                    )}

                    {/* Marker Pin Head */}
                    <div
                      className={`relative flex items-center justify-center transition-all ${
                        isSelected
                          ? 'scale-125 ring-3 ring-white shadow-xl shadow-black'
                          : 'group-hover:scale-115'
                      }`}
                    >
                      <div
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono text-white shadow-md flex items-center gap-1 border border-white/20"
                        style={{ backgroundColor: statusCfg.hex }}
                      >
                        {b.isDigital ? <Tv className="w-2.5 h-2.5" /> : <MapPin className="w-2.5 h-2.5" />}
                        <span>{b.code}</span>
                      </div>
                    </div>

                    {/* Marker Tooltip on Hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30 pointer-events-none">
                      <div className="px-2.5 py-1.5 rounded-lg bg-black/90 backdrop-blur-md border border-white/20 text-white shadow-xl whitespace-nowrap text-left space-y-0.5">
                        <div className="text-[11px] font-bold">{b.name}</div>
                        <div className="text-[10px] text-white/70">
                          {b.location.city} • ${b.monthlyRate.toLocaleString()}/mo
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Selected Billboard Active Interactive Popup Card */}
              {activeBillboard && (
                <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-30 animate-in slide-in-from-bottom-3 duration-300">
                  <div className="rounded-xl bg-white/95 backdrop-blur-md border border-gray-100 p-4 shadow-2xl space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-14 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                          <img
                            src={activeBillboard.photos[0]}
                            alt={activeBillboard.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-indigo-600">
                              {activeBillboard.code}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_CONFIG[activeBillboard.status].bg} ${STATUS_CONFIG[activeBillboard.status].text}`}
                            >
                              {STATUS_CONFIG[activeBillboard.status].label}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-gray-900 line-clamp-1 mt-0.5">
                            {activeBillboard.name}
                          </h4>
                          <p className="text-[11px] text-gray-500 line-clamp-1">
                            {activeBillboard.location.corridorName}, {activeBillboard.location.city}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveBillboard(null)}
                        className="text-gray-400 hover:text-gray-700 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Stats Ribbon inside card */}
                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-gray-100 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Rate</span>
                        <span className="font-bold text-foreground">
                          ${activeBillboard.monthlyRate.toLocaleString()}
                          <span className="font-normal text-[10px] text-muted-foreground">/mo</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Daily DEC</span>
                        <span className="font-semibold text-indigo-400">
                          {activeBillboard.location.dailyTrafficCount.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Dimensions</span>
                        <span className="font-medium text-foreground">
                          {activeBillboard.widthFeet}&apos; x {activeBillboard.heightFeet}&apos;
                        </span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <a
                        href={`https://www.google.com/maps?q=${activeBillboard.location.latitude},${activeBillboard.location.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                      >
                        <span>Google Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        onClick={() => setInspectModalBillboard(activeBillboard)}
                        className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium flex items-center gap-1 transition-all shadow-xs"
                      >
                        <span>360° Specs</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* SIDEBAR LIST & NEARBY DISCOVERY FEED */}
          {/* ======================================================== */}
          {sidebarListOpen && (
            <Card className="w-80 sm:w-96 rounded-2xl bg-white border border-gray-100 shadow-md flex flex-col shrink-0 overflow-hidden animate-in slide-in-from-right-4 duration-200">
              {/* Feed Header */}
              <div className="p-3.5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    Billboard Discovery Feed
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {filteredBillboards.length} structures matching geospatial filters
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[11px] font-mono font-semibold text-gray-600">
                  {selectedCity.split(' ')[0]}
                </span>
              </div>

              {/* Scrollable Billboard Cards List */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100 p-2 space-y-2">
                {filteredBillboards.map((b) => {
                  const isSelected = activeBillboard?.id === b.id;
                  const statusCfg = STATUS_CONFIG[b.status];

                  return (
                    <div
                      key={b.id}
                      onClick={() => handleFocusBillboard(b)}
                      className={`p-3 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-indigo-50/60 border-indigo-600 shadow-xs'
                          : 'bg-white hover:bg-gray-50 border-gray-100'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-14 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 relative border border-gray-200/50">
                          <img
                            src={b.photos[0]}
                            alt={b.name}
                            className="w-full h-full object-cover"
                          />
                          {b.isDigital && (
                            <span className="absolute bottom-0 right-0 px-1 py-0.2 rounded-tl bg-indigo-600 text-[8px] font-bold text-white">
                              LED
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="font-mono text-xs font-bold text-indigo-600">
                              {b.code}
                            </span>
                            <span
                              className={`px-2 py-0.2 rounded-full text-[10px] font-semibold ${statusCfg.bg} ${statusCfg.text}`}
                            >
                              {statusCfg.label}
                            </span>
                          </div>

                          <h4 className="text-xs font-semibold text-gray-900 line-clamp-1">
                            {b.name}
                          </h4>

                          <div className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                            {b.location.corridorName}, {b.location.city}
                          </div>

                          <div className="flex items-center justify-between text-xs mt-2 pt-1.5 border-t border-gray-100">
                            <span className="font-bold text-gray-900">
                              ${b.monthlyRate.toLocaleString()}
                              <span className="text-[10px] font-normal text-gray-400">/mo</span>
                            </span>
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                              <Car className="w-3 h-3" />
                              {(b.location.dailyTrafficCount / 1000).toFixed(0)}k DEC
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* 360° Billboard Detail Modal (if opened from Map Popup) */}
        {inspectModalBillboard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white border border-gray-100 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
              <button
                onClick={() => setInspectModalBillboard(null)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="border-b border-gray-100 pb-4 pr-10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    {inspectModalBillboard.code}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-xs ${STATUS_CONFIG[inspectModalBillboard.status].bg} ${STATUS_CONFIG[inspectModalBillboard.status].text}`}
                  >
                    {STATUS_CONFIG[inspectModalBillboard.status].label}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {inspectModalBillboard.name}
                </h2>
                <p className="text-xs text-gray-500">
                  {inspectModalBillboard.location.corridorName} • {inspectModalBillboard.location.address},{' '}
                  {inspectModalBillboard.location.city}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
                <div className="space-y-4">
                  <div className="h-52 rounded-xl bg-gray-100 overflow-hidden">
                    <img
                      src={inspectModalBillboard.photos[0]}
                      alt={inspectModalBillboard.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {inspectModalBillboard.description}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-gray-50 space-y-2 text-xs">
                    <span className="text-[11px] font-semibold uppercase text-indigo-600 tracking-wider block">
                      Physical Specs & Rates
                    </span>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Dimensions:</span>
                      <span className="font-semibold text-gray-900">
                        {inspectModalBillboard.widthFeet}&apos; x {inspectModalBillboard.heightFeet}&apos; (
                        {inspectModalBillboard.squareFeet} sq ft)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Illumination:</span>
                      <span className="font-semibold text-gray-900">
                        {inspectModalBillboard.illumination.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Monthly Rate:</span>
                      <span className="font-bold text-gray-900">
                        ${inspectModalBillboard.monthlyRate.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Daily Circulation (DEC):</span>
                      <span className="font-bold text-indigo-600">
                        {inspectModalBillboard.location.dailyTrafficCount.toLocaleString()} vehicles/day
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-gray-50 space-y-2 text-xs">
                    <span className="text-[11px] font-semibold uppercase text-indigo-600 tracking-wider block">
                      Geospatial Data
                    </span>
                    <div className="font-mono text-[11px] text-gray-500">
                      Coordinates: {inspectModalBillboard.location.latitude.toFixed(4)},{' '}
                      {inspectModalBillboard.location.longitude.toFixed(4)}
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${inspectModalBillboard.location.latitude},${inspectModalBillboard.location.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-semibold hover:underline pt-1"
                    >
                      <span>Open Live GPS in Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
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
