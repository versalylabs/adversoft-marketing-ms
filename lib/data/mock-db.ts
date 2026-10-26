/**
 * Adversoft Seed Database & Relational Data Store
 * Provides connected relational data reflecting the outdoor advertising lifecycle:
 * Client → Booking → Billboard → Campaign → Artwork → Installation → Invoice
 */

export interface LocationRecord {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  corridorName: string;
  latitude: number;
  longitude: number;
  dailyTrafficCount: number;
}

export interface BillboardRecord {
  id: string;
  code: string;
  name: string;
  type: string;
  orientation: string;
  illumination: string;
  status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'MAINTENANCE';
  widthFeet: number;
  heightFeet: number;
  squareFeet: number;
  isDigital: boolean;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  productionCost: number;
  installationCost: number;
  photos: string[];
  locationId: string;
  location: LocationRecord;
}

export interface ClientRecord {
  id: string;
  accountNumber: string;
  companyName: string;
  industry: string;
  status: 'ACTIVE' | 'LEAD' | 'PROSPECT' | 'INACTIVE';
  billingAddress: string;
  city: string;
  state: string;
  primaryContact: {
    name: string;
    email: string;
    phone: string;
  };
  creditLimit: number;
  totalSpend: number;
}

export interface BookingRecord {
  id: string;
  bookingNumber: string;
  clientId: string;
  clientName: string;
  billboardCode: string;
  billboardName: string;
  startDate: string;
  endDate: string;
  status: 'CONFIRMED' | 'RESERVED' | 'PENDING_REVIEW' | 'ACTIVE' | 'COMPLETED';
  totalAmount: number;
}

export interface CampaignRecord {
  id: string;
  campaignCode: string;
  name: string;
  clientId: string;
  clientName: string;
  brandName: string;
  status: 'ACTIVE' | 'SCHEDULED' | 'PLANNING' | 'COMPLETED';
  flightStart: string;
  flightEnd: string;
  budget: number;
  billboardsCount: number;
}

export interface ArtworkRecord {
  id: string;
  artworkCode: string;
  title: string;
  campaignCode: string;
  clientName: string;
  status: 'APPROVED' | 'CLIENT_REVIEW' | 'REVISION_REQUESTED';
  version: number;
  thumbnailUrl: string;
  dimensions: string;
}

export interface InstallationRecord {
  id: string;
  jobNumber: string;
  billboardCode: string;
  campaignName: string;
  status: 'INSTALLED' | 'SCHEDULED' | 'IN_PROGRESS';
  scheduledDate: string;
  installedDate?: string;
  crewLead: string;
  verifiedGps?: string;
  proofPhotoUrl?: string;
}

export interface MaintenanceRecordItem {
  id: string;
  workOrderNumber: string;
  billboardCode: string;
  issueType: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  status: 'REPORTED' | 'SCHEDULED' | 'IN_PROGRESS' | 'RESOLVED';
  technician: string;
  cost: number;
  description: string;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  clientName: string;
  campaignCode: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: 'PAID' | 'SENT' | 'PARTIALLY_PAID' | 'OVERDUE';
}

export interface ActivityLogRecord {
  id: string;
  action: string;
  entityType: string;
  entityCode: string;
  description: string;
  userName: string;
  timestamp: string;
}

// ------------------------------------------
// MOCK DATA STORES
// ------------------------------------------

export const LOCATIONS: LocationRecord[] = [
  {
    id: 'loc_1',
    address: '1024 Grand Avenue & 4th Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    corridorName: 'Times Square South Approach',
    latitude: 40.7580,
    longitude: -73.9855,
    dailyTrafficCount: 145000,
  },
  {
    id: 'loc_2',
    address: 'Interstate 95 North Exit 42B',
    city: 'Stamford',
    state: 'CT',
    zipCode: '06901',
    corridorName: 'I-95 Commuter Artery',
    latitude: 41.0534,
    longitude: -73.5387,
    dailyTrafficCount: 98000,
  },
  {
    id: 'loc_3',
    address: '742 Ocean Parkway',
    city: 'Miami',
    state: 'FL',
    zipCode: '33139',
    corridorName: 'South Beach Tourist Corridor',
    latitude: 25.7617,
    longitude: -80.1918,
    dailyTrafficCount: 65000,
  },
  {
    id: 'loc_4',
    address: '8800 Sunset Boulevard',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90069',
    corridorName: 'Sunset Strip Entertainment Corridor',
    latitude: 34.0983,
    longitude: -118.3845,
    dailyTrafficCount: 82000,
  },
];

export const BILLBOARDS: BillboardRecord[] = [
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
    isDigital: true,
    dailyRate: 1200,
    weeklyRate: 7500,
    monthlyRate: 28000,
    productionCost: 0,
    installationCost: 350,
    photos: ['https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&auto=format&fit=crop&q=80'],
    locationId: 'loc_1',
    location: LOCATIONS[0],
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
    isDigital: false,
    dailyRate: 450,
    weeklyRate: 2800,
    monthlyRate: 9800,
    productionCost: 1400,
    installationCost: 850,
    photos: ['https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&auto=format&fit=crop&q=80'],
    locationId: 'loc_2',
    location: LOCATIONS[1],
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
    isDigital: false,
    dailyRate: 350,
    weeklyRate: 2200,
    monthlyRate: 7500,
    productionCost: 1100,
    installationCost: 750,
    photos: ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80'],
    locationId: 'loc_3',
    location: LOCATIONS[2],
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
    isDigital: false,
    dailyRate: 950,
    weeklyRate: 6000,
    monthlyRate: 22000,
    productionCost: 3200,
    installationCost: 2100,
    photos: ['https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=600&auto=format&fit=crop&q=80'],
    locationId: 'loc_4',
    location: LOCATIONS[3],
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
    isDigital: false,
    dailyRate: 400,
    weeklyRate: 2500,
    monthlyRate: 8900,
    productionCost: 1400,
    installationCost: 850,
    photos: ['https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80'],
    locationId: 'loc_2',
    location: LOCATIONS[1],
  },
];

export const CLIENTS: ClientRecord[] = [
  {
    id: 'cli_1',
    accountNumber: 'CLI-1001',
    companyName: 'Sterling Brands Ltd',
    industry: 'Luxury Fashion & Retail',
    status: 'ACTIVE',
    billingAddress: '450 Lexington Avenue',
    city: 'New York',
    state: 'NY',
    primaryContact: {
      name: 'David Sterling',
      email: 'david@sterlingbrands.com',
      phone: '+1 (212) 555-0142',
    },
    creditLimit: 150000,
    totalSpend: 84200,
  },
  {
    id: 'cli_2',
    accountNumber: 'CLI-1002',
    companyName: 'Acme Corporation',
    industry: 'Consumer Electronics & Hardware',
    status: 'ACTIVE',
    billingAddress: '100 Technology Drive',
    city: 'San Jose',
    state: 'CA',
    primaryContact: {
      name: 'Sarah Jenkins',
      email: 's.jenkins@acmecorp.com',
      phone: '+1 (408) 555-0199',
    },
    creditLimit: 250000,
    totalSpend: 194500,
  },
  {
    id: 'cli_3',
    accountNumber: 'CLI-1003',
    companyName: 'Horizon Telecom',
    industry: 'Telecommunications & 5G',
    status: 'ACTIVE',
    billingAddress: '1200 Telecom Way',
    city: 'Dallas',
    state: 'TX',
    primaryContact: {
      name: 'Michael Chang',
      email: 'mchang@horizontelecom.com',
      phone: '+1 (214) 555-0112',
    },
    creditLimit: 300000,
    totalSpend: 112000,
  },
  {
    id: 'cli_4',
    accountNumber: 'CLI-1004',
    companyName: 'Apex Health Systems',
    industry: 'Healthcare & Regional Clinics',
    status: 'LEAD',
    billingAddress: '88 Medical Center Blvd',
    city: 'Miami',
    state: 'FL',
    primaryContact: {
      name: 'Dr. Evelyn Reed',
      email: 'ereed@apexhealth.org',
      phone: '+1 (305) 555-0177',
    },
    creditLimit: 50000,
    totalSpend: 0,
  },
];

export const BOOKINGS: BookingRecord[] = [
  {
    id: 'bkg_1',
    bookingNumber: 'BKG-2026-001',
    clientId: 'cli_1',
    clientName: 'Sterling Brands Ltd',
    billboardCode: 'BB-101',
    billboardName: 'Times Square Spectacle LED',
    startDate: '2026-09-01',
    endDate: '2026-11-30',
    status: 'ACTIVE',
    totalAmount: 84000,
  },
  {
    id: 'bkg_2',
    bookingNumber: 'BKG-2026-002',
    clientId: 'cli_2',
    clientName: 'Acme Corporation',
    billboardCode: 'BB-102',
    billboardName: 'I-95 Northbound Highway Unipole',
    startDate: '2026-09-15',
    endDate: '2026-12-15',
    status: 'ACTIVE',
    totalAmount: 29400,
  },
  {
    id: 'bkg_3',
    bookingNumber: 'BKG-2026-003',
    clientId: 'cli_3',
    clientName: 'Horizon Telecom',
    billboardCode: 'BB-104',
    billboardName: 'Sunset Strip Horizon Wallscape',
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    status: 'RESERVED',
    totalAmount: 66000,
  },
];

export const CAMPAIGNS: CampaignRecord[] = [
  {
    id: 'cmp_1',
    campaignCode: 'CMP-2026-001',
    name: 'Autumn Haute Couture Showcase',
    clientId: 'cli_1',
    clientName: 'Sterling Brands Ltd',
    brandName: 'Sterling Luxe',
    status: 'ACTIVE',
    flightStart: '2026-09-01',
    flightEnd: '2026-11-30',
    budget: 95000,
    billboardsCount: 1,
  },
  {
    id: 'cmp_2',
    campaignCode: 'CMP-2026-002',
    name: 'NextGen Pro Smartphone Launch',
    clientId: 'cli_2',
    clientName: 'Acme Corporation',
    brandName: 'Acme Mobile',
    status: 'ACTIVE',
    flightStart: '2026-09-15',
    flightEnd: '2026-12-15',
    budget: 45000,
    billboardsCount: 2,
  },
  {
    id: 'cmp_3',
    campaignCode: 'CMP-2026-003',
    name: '5G Everywhere Nationwide Push',
    clientId: 'cli_3',
    clientName: 'Horizon Telecom',
    brandName: 'Horizon Ultrafast',
    status: 'SCHEDULED',
    flightStart: '2026-10-01',
    flightEnd: '2026-12-31',
    budget: 80000,
    billboardsCount: 3,
  },
];

export const ARTWORKS: ArtworkRecord[] = [
  {
    id: 'art_1',
    artworkCode: 'ART-101',
    title: 'Sterling Fall Collection - Digital 4K Master',
    campaignCode: 'CMP-2026-001',
    clientName: 'Sterling Brands Ltd',
    status: 'APPROVED',
    version: 2,
    thumbnailUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&auto=format&fit=crop&q=80',
    dimensions: '3840 x 1120 px',
  },
  {
    id: 'art_2',
    artworkCode: 'ART-102',
    title: 'Acme NextGen Phone - Highway 14x48 Vinyl',
    campaignCode: 'CMP-2026-002',
    clientName: 'Acme Corporation',
    status: 'APPROVED',
    version: 1,
    thumbnailUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&auto=format&fit=crop&q=80',
    dimensions: '14ft x 48ft (300 DPI)',
  },
  {
    id: 'art_3',
    artworkCode: 'ART-103',
    title: 'Horizon 5G Sunset Wallscape Creative',
    campaignCode: 'CMP-2026-003',
    clientName: 'Horizon Telecom',
    status: 'CLIENT_REVIEW',
    version: 3,
    thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300&auto=format&fit=crop&q=80',
    dimensions: '30ft x 60ft (150 DPI)',
  },
];

export const INSTALLATIONS: InstallationRecord[] = [
  {
    id: 'ins_1',
    jobNumber: 'INS-2026-001',
    billboardCode: 'BB-102',
    campaignName: 'NextGen Pro Smartphone Launch',
    status: 'INSTALLED',
    scheduledDate: '2026-09-14',
    installedDate: '2026-09-14 11:30 AM',
    crewLead: 'Dan Kowalski (Crew A)',
    verifiedGps: '41.05342° N, 73.53871° W',
    proofPhotoUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'ins_2',
    jobNumber: 'INS-2026-002',
    billboardCode: 'BB-104',
    campaignName: '5G Everywhere Nationwide Push',
    status: 'SCHEDULED',
    scheduledDate: '2026-09-28',
    crewLead: 'Marcus Lee (Rigging Team)',
  },
];

export const MAINTENANCE: MaintenanceRecordItem[] = [
  {
    id: 'mnt_1',
    workOrderNumber: 'MNT-2026-001',
    billboardCode: 'BB-105',
    issueType: 'LIGHTING_OUTAGE',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    technician: 'Carlos Santana',
    cost: 420,
    description: 'South face lower LED floodlight ballast failed. Crew dispatched for fixture swap.',
  },
  {
    id: 'mnt_2',
    workOrderNumber: 'MNT-2026-002',
    billboardCode: 'BB-103',
    issueType: 'ROUTINE_INSPECTION',
    priority: 'LOW',
    status: 'RESOLVED',
    technician: 'Alex Rivera',
    cost: 150,
    description: 'Semi-annual anchor bolt torque test and catwalk safety cable certification completed.',
  },
];

export const INVOICES: InvoiceRecord[] = [
  {
    id: 'inv_1',
    invoiceNumber: 'INV-2026-001',
    clientName: 'Sterling Brands Ltd',
    campaignCode: 'CMP-2026-001',
    issueDate: '2026-09-01',
    dueDate: '2026-10-01',
    totalAmount: 28000,
    paidAmount: 28000,
    balanceDue: 0,
    status: 'PAID',
  },
  {
    id: 'inv_2',
    invoiceNumber: 'INV-2026-002',
    clientName: 'Acme Corporation',
    campaignCode: 'CMP-2026-002',
    issueDate: '2026-09-15',
    dueDate: '2026-10-15',
    totalAmount: 9800,
    paidAmount: 9800,
    balanceDue: 0,
    status: 'PAID',
  },
  {
    id: 'inv_3',
    invoiceNumber: 'INV-2026-003',
    clientName: 'Horizon Telecom',
    campaignCode: 'CMP-2026-003',
    issueDate: '2026-09-20',
    dueDate: '2026-10-20',
    totalAmount: 22000,
    paidAmount: 0,
    balanceDue: 22000,
    status: 'SENT',
  },
];

export const ACTIVITY_LOGS: ActivityLogRecord[] = [
  {
    id: 'act_1',
    action: 'APPROVED',
    entityType: 'ARTWORK',
    entityCode: 'ART-101',
    description: 'David Sterling approved high-res digital creative for Times Square LED',
    userName: 'David Sterling (Client)',
    timestamp: '25 mins ago',
  },
  {
    id: 'act_2',
    action: 'PAYMENT_RECORDED',
    entityType: 'INVOICE',
    entityCode: 'INV-2026-002',
    description: 'Payment of $9,800.00 credited via Wire Transfer from Acme Corp',
    userName: 'Elena Rostova (Operations)',
    timestamp: '2 hours ago',
  },
  {
    id: 'act_3',
    action: 'DISPATCHED',
    entityType: 'INSTALLATION',
    entityCode: 'INS-2026-001',
    description: 'Proof of posting verified for I-95 Unipole (BB-102)',
    userName: 'Dan Kowalski (Crew Lead)',
    timestamp: '5 hours ago',
  },
  {
    id: 'act_4',
    action: 'CREATED',
    entityType: 'BOOKING',
    entityCode: 'BKG-2026-003',
    description: 'Booking reservation confirmed for Horizon Telecom Sunset Wallscape',
    userName: 'Alex Vance (Admin)',
    timestamp: '1 day ago',
  },
];
