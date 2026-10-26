/**
 * Adversoft Billboard Inventory Store
 * Core data store for Production — Billboard Inventory Management.
 * Includes complete physical, electrical, traffic, financial, and booking relations.
 */

export type BillboardType =
  | 'STATIC_BULLETIN'
  | 'DIGITAL_LED'
  | 'WALLSCAPE'
  | 'UNIPOLE'
  | 'GANTRY'
  | 'BRIDGE_PANEL'
  | 'TRANSIT_SHELTER'
  | 'SPECTACULAR';

export type BillboardOrientation =
  | 'NORTH'
  | 'SOUTH'
  | 'EAST'
  | 'WEST'
  | 'NORTHEAST'
  | 'NORTHWEST'
  | 'SOUTHEAST'
  | 'SOUTHWEST'
  | 'PARALLEL'
  | 'PERPENDICULAR';

export type IlluminationType =
  | 'FRONTLIT_HALOGEN'
  | 'FRONTLIT_LED'
  | 'BACKLIT'
  | 'DIGITAL_SCREEN'
  | 'SOLAR_POWERED'
  | 'UNLIT';

export type BillboardStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'OCCUPIED'
  | 'MAINTENANCE'
  | 'INACTIVE';

export interface BillboardLocation {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  corridorName: string;
  metroArea: string;
  latitude: number;
  longitude: number;
  dailyTrafficCount: number; // DEC: Daily Effective Circulation
  averageSpeedMph: number;
}

export interface BillboardMaintenanceLog {
  id: string;
  date: string;
  type: 'INSPECTION' | 'REPAIR' | 'BULB_REPLACEMENT' | 'VINYL_REMOVAL' | 'STRUCTURAL';
  technician: string;
  status: 'RESOLVED' | 'PENDING' | 'SCHEDULED';
  notes: string;
}

export interface BillboardItem {
  id: string;
  code: string;
  name: string;
  type: BillboardType;
  orientation: BillboardOrientation;
  illumination: IlluminationType;
  status: BillboardStatus;

  // Physical Dimensions
  widthFeet: number;
  heightFeet: number;
  squareFeet: number;
  faceCount: number;
  structureHeightFeet: number;

  // Digital Specifics
  isDigital: boolean;
  digitalSlots?: number;
  slotDurationSeconds?: number;
  pixelResolution?: string;

  // Pricing & Commercials
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  productionCost: number;
  installationCost: number;
  minBookingDays: number;

  // Operational & Marketing
  photos: string[];
  specSheetUrl?: string;
  description: string;
  isMarketplaceListed: boolean;
  currentAdvertiser?: string;
  currentCampaign?: string;
  currentBookingEnd?: string;

  // Location
  location: BillboardLocation;

  // Maintenance & History
  maintenanceLogs: BillboardMaintenanceLog[];
  lastInspectedAt: string;
  createdAt: string;
  updatedAt: string;
}

export const INITIAL_BILLBOARDS: BillboardItem[] = [
  {
    id: 'bb_1',
    code: 'BB-101',
    name: 'Times Square Spectacle LED',
    type: 'DIGITAL_LED',
    orientation: 'SOUTH',
    illumination: 'DIGITAL_SCREEN',
    status: 'OCCUPIED',
    widthFeet: 48,
    heightFeet: 14,
    squareFeet: 672,
    faceCount: 1,
    structureHeightFeet: 65,
    isDigital: true,
    digitalSlots: 8,
    slotDurationSeconds: 10,
    pixelResolution: '3840 x 1120 (4K UHD)',
    dailyRate: 1200,
    weeklyRate: 7500,
    monthlyRate: 28000,
    productionCost: 0,
    installationCost: 350,
    minBookingDays: 7,
    photos: [
      'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=800&auto=format&fit=crop&q=80',
    ],
    description:
      'Premier high-density digital display located at the epicenter of Times Square pedestrian plaza. 360-degree viewing angle with unmissable street-level line of sight.',
    isMarketplaceListed: true,
    currentAdvertiser: 'Sterling Brands Ltd',
    currentCampaign: 'Sterling Luxe Holiday 2026',
    currentBookingEnd: '2026-11-15',
    location: {
      id: 'loc_1',
      address: '1540 Broadway & 45th Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10036',
      country: 'USA',
      corridorName: 'Times Square Bowtie Plaza',
      metroArea: 'New York Metropolitan Area',
      latitude: 40.758,
      longitude: -73.9855,
      dailyTrafficCount: 185000,
      averageSpeedMph: 12,
    },
    maintenanceLogs: [
      {
        id: 'm_1',
        date: '2026-09-15',
        type: 'INSPECTION',
        technician: 'David Miller',
        status: 'RESOLVED',
        notes: 'LED panel calibration check completed. Contrast levels nominal at 9,500 nits.',
      },
    ],
    lastInspectedAt: '2026-09-15',
    createdAt: '2025-11-01',
    updatedAt: '2026-09-20',
  },
  {
    id: 'bb_2',
    code: 'BB-102',
    name: 'I-95 Northbound Highway Unipole',
    type: 'STATIC_BULLETIN',
    orientation: 'NORTH',
    illumination: 'FRONTLIT_LED',
    status: 'OCCUPIED',
    widthFeet: 48,
    heightFeet: 14,
    squareFeet: 672,
    faceCount: 2,
    structureHeightFeet: 85,
    isDigital: false,
    dailyRate: 450,
    weeklyRate: 2800,
    monthlyRate: 9800,
    productionCost: 1400,
    installationCost: 850,
    minBookingDays: 28,
    photos: [
      'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop&q=80',
    ],
    description:
      'High-impact steel unipole bulletin capturing northbound commuter traffic along the heavy Interstate 95 corridor. Excellent 800-foot unobstructed read time.',
    isMarketplaceListed: true,
    currentAdvertiser: 'Acme Corporation',
    currentCampaign: 'Acme Mobile 5G Nationwide',
    currentBookingEnd: '2026-12-31',
    location: {
      id: 'loc_2',
      address: 'Interstate 95 North Exit 42B',
      city: 'Stamford',
      state: 'CT',
      zipCode: '06901',
      country: 'USA',
      corridorName: 'I-95 Gold Coast Arterial',
      metroArea: 'Greater NYC Tri-State',
      latitude: 41.0534,
      longitude: -73.5387,
      dailyTrafficCount: 112000,
      averageSpeedMph: 55,
    },
    maintenanceLogs: [
      {
        id: 'm_2',
        date: '2026-08-20',
        type: 'BULB_REPLACEMENT',
        technician: 'David Miller',
        status: 'RESOLVED',
        notes: 'Replaced bottom right flood fixture with energy-efficient 400W LED head.',
      },
    ],
    lastInspectedAt: '2026-08-20',
    createdAt: '2025-11-12',
    updatedAt: '2026-09-18',
  },
  {
    id: 'bb_3',
    code: 'BB-103',
    name: 'Ocean Parkway Double Gantry Face A',
    type: 'GANTRY',
    orientation: 'EAST',
    illumination: 'FRONTLIT_LED',
    status: 'AVAILABLE',
    widthFeet: 36,
    heightFeet: 12,
    squareFeet: 432,
    faceCount: 2,
    structureHeightFeet: 30,
    isDigital: false,
    dailyRate: 350,
    weeklyRate: 2200,
    monthlyRate: 7500,
    productionCost: 1100,
    installationCost: 750,
    minBookingDays: 14,
    photos: [
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    ],
    description:
      'Overhead overhead gantry structure spanning all 4 eastbound lanes heading directly onto the scenic South Beach causeway. Immediate visibility for tourism and nightlife.',
    isMarketplaceListed: true,
    location: {
      id: 'loc_3',
      address: '742 Ocean Parkway MacArthur Causeway',
      city: 'Miami',
      state: 'FL',
      zipCode: '33139',
      country: 'USA',
      corridorName: 'South Beach Gateway Causeway',
      metroArea: 'Greater Miami & Miami Beach',
      latitude: 25.7617,
      longitude: -80.1918,
      dailyTrafficCount: 78000,
      averageSpeedMph: 45,
    },
    maintenanceLogs: [
      {
        id: 'm_3',
        date: '2026-09-02',
        type: 'INSPECTION',
        technician: 'David Miller',
        status: 'RESOLVED',
        notes: 'Pre-flight wind tension cable inspection passed ahead of autumn season.',
      },
    ],
    lastInspectedAt: '2026-09-02',
    createdAt: '2026-01-15',
    updatedAt: '2026-09-22',
  },
  {
    id: 'bb_4',
    code: 'BB-104',
    name: 'Sunset Strip Horizon Wallscape',
    type: 'WALLSCAPE',
    orientation: 'WEST',
    illumination: 'FRONTLIT_HALOGEN',
    status: 'RESERVED',
    widthFeet: 60,
    heightFeet: 30,
    squareFeet: 1800,
    faceCount: 1,
    structureHeightFeet: 90,
    isDigital: false,
    dailyRate: 950,
    weeklyRate: 6000,
    monthlyRate: 22000,
    productionCost: 3200,
    installationCost: 2100,
    minBookingDays: 28,
    photos: [
      'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=800&auto=format&fit=crop&q=80',
    ],
    description:
      'Monolithic landmark wallscape attached to the Mondrian luxury hotel facade. Targets entertainment industry execs, luxury consumers, and premier nightlife visitors.',
    isMarketplaceListed: true,
    currentAdvertiser: 'Horizon Telecom',
    currentCampaign: 'Horizon 5G Unlimited Sunset',
    currentBookingEnd: '2026-10-31',
    location: {
      id: 'loc_4',
      address: '8800 Sunset Boulevard',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90069',
      country: 'USA',
      corridorName: 'Sunset Strip Entertainment Mile',
      metroArea: 'Greater Los Angeles',
      latitude: 34.0983,
      longitude: -118.3845,
      dailyTrafficCount: 94000,
      averageSpeedMph: 25,
    },
    maintenanceLogs: [
      {
        id: 'm_4',
        date: '2026-07-10',
        type: 'STRUCTURAL',
        technician: 'David Miller',
        status: 'RESOLVED',
        notes: 'Reinforced grommet anchor rings on upper west wall section.',
      },
    ],
    lastInspectedAt: '2026-07-10',
    createdAt: '2026-02-01',
    updatedAt: '2026-09-12',
  },
  {
    id: 'bb_5',
    code: 'BB-105',
    name: 'Airport Expressway Unipole Face B',
    type: 'UNIPOLE',
    orientation: 'SOUTH',
    illumination: 'FRONTLIT_LED',
    status: 'MAINTENANCE',
    widthFeet: 48,
    heightFeet: 14,
    squareFeet: 672,
    faceCount: 2,
    structureHeightFeet: 75,
    isDigital: false,
    dailyRate: 400,
    weeklyRate: 2500,
    monthlyRate: 8900,
    productionCost: 1400,
    installationCost: 850,
    minBookingDays: 14,
    photos: [
      'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80',
    ],
    description:
      'High-traffic arterial unipole facing outbound traffic to Miami International Airport. Currently scheduled for steel frame corrosion treatment.',
    isMarketplaceListed: false,
    location: {
      id: 'loc_5',
      address: 'Airport Expressway SR-112 Mile Marker 4',
      city: 'Miami',
      state: 'FL',
      zipCode: '33142',
      country: 'USA',
      corridorName: 'Airport Expressway Corridor',
      metroArea: 'Greater Miami & Miami Beach',
      latitude: 25.8089,
      longitude: -80.2452,
      dailyTrafficCount: 92000,
      averageSpeedMph: 55,
    },
    maintenanceLogs: [
      {
        id: 'm_5',
        date: '2026-09-24',
        type: 'REPAIR',
        technician: 'David Miller',
        status: 'PENDING',
        notes: 'Scheduled crane inspection for upper safety catwalk bracket vibration.',
      },
    ],
    lastInspectedAt: '2026-09-24',
    createdAt: '2026-02-18',
    updatedAt: '2026-09-24',
  },
  {
    id: 'bb_6',
    code: 'BB-106',
    name: 'Silicon Valley Highway 101 Digital Arch',
    type: 'DIGITAL_LED',
    orientation: 'NORTHEAST',
    illumination: 'DIGITAL_SCREEN',
    status: 'AVAILABLE',
    widthFeet: 56,
    heightFeet: 16,
    squareFeet: 896,
    faceCount: 1,
    structureHeightFeet: 55,
    isDigital: true,
    digitalSlots: 6,
    slotDurationSeconds: 8,
    pixelResolution: '2560 x 720 High-Res LED',
    dailyRate: 850,
    weeklyRate: 5200,
    monthlyRate: 19500,
    productionCost: 0,
    installationCost: 250,
    minBookingDays: 7,
    photos: [
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
    ],
    description:
      'Ultra-crisp 10mm pixel pitch digital screen on US-101 in San Jose. Premier site for tech recruiters, enterprise SaaS giants, and luxury auto debuts.',
    isMarketplaceListed: true,
    location: {
      id: 'loc_6',
      address: '1850 North First Street & US-101',
      city: 'San Jose',
      state: 'CA',
      zipCode: '95112',
      country: 'USA',
      corridorName: 'Silicon Valley Tech Express (US-101)',
      metroArea: 'San Francisco Bay Area',
      latitude: 37.3695,
      longitude: -121.9082,
      dailyTrafficCount: 168000,
      averageSpeedMph: 50,
    },
    maintenanceLogs: [
      {
        id: 'm_6',
        date: '2026-09-18',
        type: 'INSPECTION',
        technician: 'David Miller',
        status: 'RESOLVED',
        notes: 'Automated light sensor diagnostics confirmed 100% operation.',
      },
    ],
    lastInspectedAt: '2026-09-18',
    createdAt: '2026-03-01',
    updatedAt: '2026-09-21',
  },
  {
    id: 'bb_7',
    code: 'BB-107',
    name: 'Magnificent Mile Luxury Transit Shelter',
    type: 'TRANSIT_SHELTER',
    orientation: 'SOUTH',
    illumination: 'BACKLIT',
    status: 'AVAILABLE',
    widthFeet: 6,
    heightFeet: 8,
    squareFeet: 48,
    faceCount: 2,
    structureHeightFeet: 10,
    isDigital: false,
    dailyRate: 180,
    weeklyRate: 1100,
    monthlyRate: 3800,
    productionCost: 350,
    installationCost: 180,
    minBookingDays: 14,
    photos: [
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80',
    ],
    description:
      'Curated street-level backlit shelter panel along Michigan Avenue. Delivers intimate eye-level dwell time to affluent shoppers and executive pedestrians.',
    isMarketplaceListed: true,
    location: {
      id: 'loc_7',
      address: '600 North Michigan Avenue',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60611',
      country: 'USA',
      corridorName: 'Magnificent Mile Retail Corridor',
      metroArea: 'Greater Chicago',
      latitude: 41.8935,
      longitude: -87.6243,
      dailyTrafficCount: 45000,
      averageSpeedMph: 18,
    },
    maintenanceLogs: [
      {
        id: 'm_7',
        date: '2026-09-10',
        type: 'INSPECTION',
        technician: 'David Miller',
        status: 'RESOLVED',
        notes: 'Glass cleaning and backlit edge diffusers polished.',
      },
    ],
    lastInspectedAt: '2026-09-10',
    createdAt: '2026-03-14',
    updatedAt: '2026-09-19',
  },
  {
    id: 'bb_8',
    code: 'BB-108',
    name: 'Downtown Dallas I-35 Stemmons Spectacular',
    type: 'SPECTACULAR',
    orientation: 'NORTHWEST',
    illumination: 'FRONTLIT_LED',
    status: 'AVAILABLE',
    widthFeet: 60,
    heightFeet: 20,
    squareFeet: 1200,
    faceCount: 1,
    structureHeightFeet: 70,
    isDigital: false,
    dailyRate: 650,
    weeklyRate: 4100,
    monthlyRate: 15500,
    productionCost: 2200,
    installationCost: 1400,
    minBookingDays: 28,
    photos: [
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80',
    ],
    description:
      'Giant custom spectacular positioned at the confluence of I-35E Stemmons Freeway and Dallas Market Center. Massive scale with unmatched visibility across 10 highway lanes.',
    isMarketplaceListed: true,
    location: {
      id: 'loc_8',
      address: '2200 Stemmons Freeway',
      city: 'Dallas',
      state: 'TX',
      zipCode: '75207',
      country: 'USA',
      corridorName: 'Stemmons Freeway / Market Center',
      metroArea: 'Dallas-Fort Worth Metroplex',
      latitude: 32.7981,
      longitude: -96.8229,
      dailyTrafficCount: 135000,
      averageSpeedMph: 60,
    },
    maintenanceLogs: [
      {
        id: 'm_8',
        date: '2026-08-30',
        type: 'INSPECTION',
        technician: 'David Miller',
        status: 'RESOLVED',
        notes: 'Annual structural engineering certification renewed.',
      },
    ],
    lastInspectedAt: '2026-08-30',
    createdAt: '2026-04-05',
    updatedAt: '2026-09-15',
  },
];

// In-Memory mutable repository for Production
let billboardsStore: BillboardItem[] = [...INITIAL_BILLBOARDS];

export function getBillboards(filters?: {
  status?: string;
  type?: string;
  city?: string;
  isDigital?: boolean;
  search?: string;
}): BillboardItem[] {
  let list = [...billboardsStore];

  if (filters?.status && filters.status !== 'ALL') {
    list = list.filter((b) => b.status === filters.status);
  }
  if (filters?.type && filters.type !== 'ALL') {
    list = list.filter((b) => b.type === filters.type);
  }
  if (filters?.city && filters.city !== 'ALL') {
    list = list.filter(
      (b) => b.location.city.toLowerCase() === filters.city!.toLowerCase()
    );
  }
  if (filters?.isDigital !== undefined) {
    list = list.filter((b) => b.isDigital === filters.isDigital);
  }
  if (filters?.search && filters.search.trim() !== '') {
    const q = filters.search.toLowerCase().trim();
    list = list.filter(
      (b) =>
        b.code.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q) ||
        b.location.city.toLowerCase().includes(q) ||
        b.location.corridorName.toLowerCase().includes(q) ||
        b.location.address.toLowerCase().includes(q)
    );
  }

  return list;
}

export function getBillboardById(id: string): BillboardItem | undefined {
  return billboardsStore.find((b) => b.id === id || b.code === id);
}

export function createBillboard(item: Omit<BillboardItem, 'id' | 'createdAt' | 'updatedAt' | 'maintenanceLogs' | 'lastInspectedAt'>): BillboardItem {
  const newId = `bb_${Date.now()}`;
  const now = new Date().toISOString().split('T')[0];
  const newBillboard: BillboardItem = {
    ...item,
    id: newId,
    createdAt: now,
    updatedAt: now,
    lastInspectedAt: now,
    maintenanceLogs: [
      {
        id: `m_${Date.now()}`,
        date: now,
        type: 'INSPECTION',
        technician: 'David Miller',
        status: 'RESOLVED',
        notes: 'Initial commissioning inspection and safety certification completed.',
      },
    ],
  };

  billboardsStore.unshift(newBillboard);
  return newBillboard;
}

export function updateBillboard(id: string, updates: Partial<BillboardItem>): BillboardItem | null {
  const index = billboardsStore.findIndex((b) => b.id === id || b.code === id);
  if (index === -1) return null;

  billboardsStore[index] = {
    ...billboardsStore[index],
    ...updates,
    updatedAt: new Date().toISOString().split('T')[0],
  };
  return billboardsStore[index];
}

export function updateBillboardStatus(id: string, status: BillboardStatus, notes?: string): BillboardItem | null {
  const index = billboardsStore.findIndex((b) => b.id === id || b.code === id);
  if (index === -1) return null;

  const current = billboardsStore[index];
  const updatedLogs = [...current.maintenanceLogs];

  if (notes) {
    updatedLogs.unshift({
      id: `m_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: status === 'MAINTENANCE' ? 'REPAIR' : 'INSPECTION',
      technician: 'David Miller',
      status: status === 'MAINTENANCE' ? 'PENDING' : 'RESOLVED',
      notes: `Status changed to ${status}: ${notes}`,
    });
  }

  billboardsStore[index] = {
    ...current,
    status,
    maintenanceLogs: updatedLogs,
    updatedAt: new Date().toISOString().split('T')[0],
  };
  return billboardsStore[index];
}

export function deleteBillboard(id: string): boolean {
  const prevLen = billboardsStore.length;
  billboardsStore = billboardsStore.filter((b) => b.id !== id && b.code !== id);
  return billboardsStore.length < prevLen;
}

export function getInventoryMetrics() {
  const total = billboardsStore.length;
  const available = billboardsStore.filter((b) => b.status === 'AVAILABLE').length;
  const occupied = billboardsStore.filter((b) => b.status === 'OCCUPIED').length;
  const reserved = billboardsStore.filter((b) => b.status === 'RESERVED').length;
  const maintenance = billboardsStore.filter((b) => b.status === 'MAINTENANCE').length;
  const digitalCount = billboardsStore.filter((b) => b.isDigital).length;
  const staticCount = total - digitalCount;
  const totalDailyTraffic = billboardsStore.reduce((acc, b) => acc + (b.location.dailyTrafficCount || 0), 0);
  const monthlyRevenuePotential = billboardsStore.reduce((acc, b) => acc + b.monthlyRate, 0);
  const occupancyRate = total > 0 ? Math.round(((occupied + reserved) / total) * 100) : 0;

  return {
    total,
    available,
    occupied,
    reserved,
    maintenance,
    digitalCount,
    staticCount,
    totalDailyTraffic,
    monthlyRevenuePotential,
    occupancyRate,
  };
}
