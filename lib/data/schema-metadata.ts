/**
 * Adversoft Schema & Relational Architecture Metadata
 * Formal representation of the PostgreSQL schema and relationships.
 */

export interface ModelField {
  name: string;
  type: string;
  isId?: boolean;
  isUnique?: boolean;
  isOptional?: boolean;
  isRelation?: boolean;
  relationModel?: string;
  description: string;
}

export interface ModelSchema {
  name: string;
  category: 'Core' | 'CRM' | 'Inventory' | 'Commercial' | 'Operations' | 'Creative' | 'Field' | 'Finance' | 'System';
  description: string;
  fields: ModelField[];
  relationsTo: string[];
}

export const DATABASE_MODELS: ModelSchema[] = [
  {
    name: 'Organization',
    category: 'Core',
    description: 'Enterprise workspace tenant managing billboard inventory and operations.',
    relationsTo: ['User', 'Client', 'Billboard', 'Booking', 'Campaign', 'Quotation', 'Contract', 'Invoice', 'MaintenanceRecord'],
    fields: [
      { name: 'id', type: 'String (cuid)', isId: true, description: 'Primary key unique identifier' },
      { name: 'name', type: 'String', description: 'Organization business name' },
      { name: 'slug', type: 'String', isUnique: true, description: 'URL-friendly workspace subdomain identifier' },
      { name: 'currency', type: 'String (USD)', description: 'Base accounting currency' },
      { name: 'taxId', type: 'String?', isOptional: true, description: 'Federal tax / VAT registration ID' },
    ],
  },
  {
    name: 'User',
    category: 'Core',
    description: 'Platform users across management, sales, operations, technicians, and clients.',
    relationsTo: ['Organization', 'Lead', 'Campaign', 'Installation', 'ArtworkVersion', 'ArtworkApproval', 'MaintenanceRecord', 'Notification', 'ActivityLog'],
    fields: [
      { name: 'id', type: 'String (cuid)', isId: true, description: 'Primary key unique identifier' },
      { name: 'email', type: 'String', isUnique: true, description: 'Login and notification email' },
      { name: 'role', type: 'UserRole (Enum)', description: 'Role-based access level (Super Admin, Admin, Sales, Ops, Client, etc.)' },
      { name: 'organizationId', type: 'String?', isRelation: true, relationModel: 'Organization', description: 'Belongs to workspace organization' },
    ],
  },
  {
    name: 'Client',
    category: 'CRM',
    description: 'Advertisers, agencies, and brand accounts purchasing out-of-home advertising.',
    relationsTo: ['Organization', 'ClientContact', 'Lead', 'Booking', 'Campaign', 'Quotation', 'Contract', 'Invoice', 'Payment'],
    fields: [
      { name: 'id', type: 'String (cuid)', isId: true, description: 'Primary key unique identifier' },
      { name: 'accountNumber', type: 'String', isUnique: true, description: 'Human-readable client account code (e.g. CLI-1001)' },
      { name: 'companyName', type: 'String', description: 'Legal or trade company name' },
      { name: 'status', type: 'ClientStatus (Enum)', description: 'Account lifecycle status (Lead, Prospect, Active, Inactive)' },
      { name: 'creditLimit', type: 'Decimal?', isOptional: true, description: 'Approved credit ceiling for booking without advance payment' },
    ],
  },
  {
    name: 'Billboard',
    category: 'Inventory',
    description: 'Physical outdoor structures and digital LED faces available for lease.',
    relationsTo: ['Organization', 'BillboardLocation', 'BookingItem', 'CampaignItem', 'Installation', 'MaintenanceRecord'],
    fields: [
      { name: 'id', type: 'String (cuid)', isId: true, description: 'Primary key unique identifier' },
      { name: 'code', type: 'String', isUnique: true, description: 'Unique billboard asset code (e.g. BB-101)' },
      { name: 'name', type: 'String', description: 'Descriptive name including cross streets or landmarks' },
      { name: 'type', type: 'BillboardType (Enum)', description: 'Physical structure format (Unipole, Digital LED, Gantry, Wallscape)' },
      { name: 'status', type: 'BillboardStatus (Enum)', description: 'Operational status (Available, Reserved, Occupied, Maintenance)' },
      { name: 'dailyRate', type: 'Decimal', description: 'Standard daily card rate' },
      { name: 'monthlyRate', type: 'Decimal', description: 'Standard 4-week / monthly lease rate' },
      { name: 'locationId', type: 'String', isRelation: true, relationModel: 'BillboardLocation', description: 'Foreign key to geographic coordinates and traffic node' },
    ],
  },
  {
    name: 'BillboardLocation',
    category: 'Inventory',
    description: 'Geospatial coordinates, traffic counts, and highway corridors.',
    relationsTo: ['Billboard'],
    fields: [
      { name: 'id', type: 'String (cuid)', isId: true, description: 'Primary key unique identifier' },
      { name: 'latitude', type: 'Decimal (10,7)', description: 'WGS84 GPS latitude for map plotting' },
      { name: 'longitude', type: 'Decimal (10,7)', description: 'WGS84 GPS longitude for map plotting' },
      { name: 'corridorName', type: 'String?', description: 'Key arterial or highway descriptor (e.g. I-95 Northbound)' },
      { name: 'dailyTrafficCount', type: 'Int?', description: 'Daily Effective Circulation (DEC) vehicular traffic count' },
    ],
  },
  {
    name: 'Booking',
    category: 'Commercial',
    description: 'Holds, reservations, and confirmed leases across billboard inventory.',
    relationsTo: ['Organization', 'Client', 'Quotation', 'BookingItem', 'Campaign', 'Contract'],
    fields: [
      { name: 'id', type: 'String (cuid)', isId: true, description: 'Primary key unique identifier' },
      { name: 'bookingNumber', type: 'String', isUnique: true, description: 'Official booking reference (e.g. BKG-2026-001)' },
      { name: 'status', type: 'BookingStatus (Enum)', description: 'Booking lifecycle (Draft, Reserved, Confirmed, Active, Completed)' },
      { name: 'startDate', type: 'DateTime', description: 'Commencement date for advertising display' },
      { name: 'endDate', type: 'DateTime', description: 'Takedown date / end of flight' },
      { name: 'holdExpiresAt', type: 'DateTime?', isOptional: true, description: 'Automated expiration timestamp for unconfirmed holds' },
      { name: 'totalAmount', type: 'Decimal', description: 'Total contracted booking value' },
    ],
  },
  {
    name: 'Quotation',
    category: 'Commercial',
    description: 'Pricing proposals combining billboard rental, printing, and installation charges.',
    relationsTo: ['Organization', 'Client', 'Lead', 'QuotationItem', 'Booking', 'Contract'],
    fields: [
      { name: 'id', type: 'String (cuid)', isId: true, description: 'Primary key unique identifier' },
      { name: 'quotationNumber', type: 'String', isUnique: true, description: 'Unique quote code (e.g. QUO-2026-001)' },
      { name: 'status', type: 'QuotationStatus (Enum)', description: 'Quote review state (Draft, Sent, Accepted, Rejected, Expired)' },
      { name: 'totalAmount', type: 'Decimal', description: 'Grand total after line items, discounts, and taxes' },
    ],
  },
  {
    name: 'Contract',
    category: 'Commercial',
    description: 'Legally binding advertising agreements, term lengths, and payment terms.',
    relationsTo: ['Organization', 'Client', 'Booking', 'Quotation', 'Campaign', 'Invoice'],
    fields: [
      { name: 'id', type: 'String (cuid)', isId: true, description: 'Primary key unique identifier' },
      { name: 'contractNumber', type: 'String', isUnique: true, description: 'Legal agreement ID (e.g. CNT-2026-001)' },
      { name: 'status', type: 'ContractStatus (Enum)', description: 'Contract state (Draft, Pending Signature, Signed, Active)' },
      { name: 'signedAt', type: 'DateTime?', isOptional: true, description: 'Timestamp when agreement was countersigned' },
      { name: 'totalValue', type: 'Decimal', description: 'Total financial liability of the agreement' },
    ],
  },
  {
    name: 'Campaign',
    category: 'Operations',
    description: 'Flight workspaces connecting budget, flight dates, deliverables, and artwork.',
    relationsTo: ['Organization', 'Client', 'Booking', 'Contract', 'User', 'CampaignItem', 'Artwork', 'Installation', 'Invoice'],
    fields: [
      { name: 'id', type: 'String (cuid)', isId: true, description: 'Primary key unique identifier' },
      { name: 'campaignCode', type: 'String', isUnique: true, description: 'Campaign flight code (e.g. CMP-2026-001)' },
      { name: 'name', type: 'String', description: 'Public marketing campaign name' },
      { name: 'status', type: 'CampaignStatus (Enum)', description: 'Campaign state (Planning, Scheduled, Active, Completed)' },
      { name: 'budget', type: 'Decimal', description: 'Allocated campaign budget' },
      { name: 'flightStart', type: 'DateTime', description: 'Official flight start' },
      { name: 'flightEnd', type: 'DateTime', description: 'Official flight end' },
    ],
  },
  {
    name: 'Artwork',
    category: 'Creative',
    description: 'Creative designs and banners assigned to billboard faces.',
    relationsTo: ['Campaign', 'ArtworkVersion', 'Installation'],
    fields: [
      { name: 'id', type: 'String (cuid)', isId: true, description: 'Primary key unique identifier' },
      { name: 'artworkCode', type: 'String', isUnique: true, description: 'Artwork identifier (e.g. ART-101)' },
      { name: 'title', type: 'String', description: 'Creative title and spec descriptor' },
      { name: 'status', type: 'ArtworkStatus (Enum)', description: 'Approval state (Draft, Client Review, Approved, Revision Requested)' },
      { name: 'currentVersion', type: 'Int', description: 'Latest active version number' },
    ],
  },
  {
    name: 'Installation',
    category: 'Field',
    description: 'Work orders for field crews to mount vinyls and submit proof of posting.',
    relationsTo: ['Billboard', 'Campaign', 'Artwork', 'User'],
    fields: [
      { name: 'id', type: 'String (cuid)', isId: true, description: 'Primary key unique identifier' },
      { name: 'jobNumber', type: 'String', isUnique: true, description: 'Field work order ID (e.g. INS-2026-001)' },
      { name: 'status', type: 'InstallationStatus (Enum)', description: 'Mounting state (Scheduled, Crew Assigned, Installed, Verified)' },
      { name: 'scheduledDate', type: 'DateTime', description: 'Target installation window' },
      { name: 'afterPhotos', type: 'String[]', description: 'Certified proof-of-posting photo URLs' },
      { name: 'verificationGps', type: 'String?', isOptional: true, description: 'Field geolocation capture' },
    ],
  },
  {
    name: 'MaintenanceRecord',
    category: 'Field',
    description: 'Structural inspections, vinyl repairs, bulb replacements, and maintenance logs.',
    relationsTo: ['Organization', 'Billboard', 'User'],
    fields: [
      { name: 'id', type: 'String (cuid)', isId: true, description: 'Primary key unique identifier' },
      { name: 'workOrderNumber', type: 'String', isUnique: true, description: 'Maintenance ticket code (e.g. MNT-2026-001)' },
      { name: 'issueType', type: 'MaintenanceIssueType (Enum)', description: 'Type of repair (Vinyl Tear, Lighting, Structural)' },
      { name: 'priority', type: 'MaintenancePriority (Enum)', description: 'Urgency (Low, Medium, High, Emergency)' },
      { name: 'status', type: 'MaintenanceStatus (Enum)', description: 'Resolution status (Reported, In Progress, Resolved)' },
      { name: 'cost', type: 'Decimal?', isOptional: true, description: 'Cost incurred for repair and parts' },
    ],
  },
  {
    name: 'Invoice',
    category: 'Finance',
    description: 'Client invoices, itemized billboard billing, tax calculations, and aging balances.',
    relationsTo: ['Organization', 'Client', 'Campaign', 'Contract', 'InvoiceItem', 'Payment'],
    fields: [
      { name: 'id', type: 'String (cuid)', isId: true, description: 'Primary key unique identifier' },
      { name: 'invoiceNumber', type: 'String', isUnique: true, description: 'Billing document number (e.g. INV-2026-001)' },
      { name: 'status', type: 'InvoiceStatus (Enum)', description: 'Payment state (Draft, Sent, Partially Paid, Paid, Overdue)' },
      { name: 'totalAmount', type: 'Decimal', description: 'Gross invoice balance' },
      { name: 'paidAmount', type: 'Decimal', description: 'Total payments credited' },
      { name: 'balanceDue', type: 'Decimal', description: 'Net outstanding receivables' },
      { name: 'dueDate', type: 'DateTime', description: 'Maturity / due date' },
    ],
  },
  {
    name: 'Payment',
    category: 'Finance',
    description: 'Transaction receipts, bank transfers, credit cards, and invoice settlements.',
    relationsTo: ['Invoice', 'Client'],
    fields: [
      { name: 'id', type: 'String (cuid)', isId: true, description: 'Primary key unique identifier' },
      { name: 'paymentNumber', type: 'String', isUnique: true, description: 'Receipt tracking number (e.g. PAY-2026-001)' },
      { name: 'amount', type: 'Decimal', description: 'Settled amount' },
      { name: 'paymentMethod', type: 'PaymentMethod (Enum)', description: 'Payment channel (Wire, Card, ACH, Check)' },
      { name: 'paymentDate', type: 'DateTime', description: 'Cleared funds date' },
    ],
  },
  {
    name: 'ActivityLog',
    category: 'System',
    description: 'Immutable audit trail capturing all operational actions across the platform.',
    relationsTo: ['User'],
    fields: [
      { name: 'id', type: 'String (cuid)', isId: true, description: 'Primary key unique identifier' },
      { name: 'action', type: 'ActivityAction (Enum)', description: 'Action verb (Created, Approved, Rejected, Paid, etc.)' },
      { name: 'entityType', type: 'String', description: 'Target entity model name (Billboard, Booking, Artwork, Invoice)' },
      { name: 'entityId', type: 'String', description: 'ID of affected record' },
      { name: 'description', type: 'String', description: 'Human-readable summary of the event' },
      { name: 'createdAt', type: 'DateTime', description: 'Timestamp of the action' },
    ],
  },
];
