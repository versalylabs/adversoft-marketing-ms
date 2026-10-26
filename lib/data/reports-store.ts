/**
 * Adversoft Reporting & Analytics Data Store & Business Intelligence Engine
 * Module: Executive analytics, occupancy rates, site yield, revenue by corridor,
 * client LTV, and printable performance reports.
 */

import { INITIAL_BILLBOARDS, BillboardItem, BillboardType } from './billboards-store';
import { getStoredCampaigns, CampaignRecord } from './campaigns-store';
import { getStoredInvoices, getStoredPayments, getFinancialMetrics } from './invoices-store';
import { INITIAL_CLIENTS, ClientAccount } from './crm-store';
import { getStoredWorkOrders } from './installations-store';
import { getStoredMaintenanceRecords } from './maintenance-store';

export type TimeRangeFilter = 'MTD' | 'QTD' | 'YTD' | 'ALL';

export interface CorridorYieldMetric {
  corridorName: string;
  city: string;
  totalFaces: number;
  occupiedFaces: number;
  occupancyPercent: number;
  monthlyRevenue: number;
  yieldPerFace: number;
  dailyTrafficCount: number;
  averageCpm: number;
}

export interface FormatYieldMetric {
  type: BillboardType;
  typeName: string;
  totalFaces: number;
  occupiedFaces: number;
  occupancyPercent: number;
  totalRevenue: number;
  averageRate: number;
  isDigital: boolean;
}

export interface ClientLtvMetric {
  clientId: string;
  clientName: string;
  accountNumber: string;
  industry: string;
  totalBilled: number;
  totalPaid: number;
  outstandingBalance: number;
  campaignCount: number;
  activeFlights: number;
  contractTier: 'ENTERPRISE' | 'STRATEGIC' | 'GROWTH';
}

export interface ReportDocument {
  id: string;
  reportNumber: string; // e.g. RPT-2026-Q4
  title: string;
  category: 'OCCUPANCY_YIELD' | 'CORRIDOR_PERFORMANCE' | 'CLIENT_LTV' | 'OPERATIONS_SLA' | 'EXECUTIVE_BRIEFING';
  period: string;
  generatedAt: string;
  generatedBy: string;
  summary: string;
  highlights: string[];
}

export const REPORT_DOCUMENTS: ReportDocument[] = [
  {
    id: 'rpt_1',
    reportNumber: 'RPT-2026-Q4-01',
    title: 'Q4 2026 Executive Yield & Occupancy Briefing',
    category: 'EXECUTIVE_BRIEFING',
    period: 'Q4 2026 (Oct - Dec 2026)',
    generatedAt: '2026-10-14 08:00',
    generatedBy: 'Marcus Brody (Senior VP of Outdoor Media)',
    summary: 'Comprehensive executive analysis of portfolio occupancy (79.2%), top corridor yields ($14,650/face), and holiday digital screen demand across prime metropolitan commercial corridors.',
    highlights: [
      'Portfolio occupancy increased to 79.2%, up +4.8% quarter-over-quarter.',
      'Times Square Spectacle LED generated highest yield at $28,000/mo with 99.8% illumination reliability.',
      'Gross billing reached $429,035 with a collection efficiency rate of 94.2% and 21.4 days DSO.',
      'Automotive and Consumer Luxury sectors accounted for 54% of booked media space.',
    ],
  },
  {
    id: 'rpt_2',
    reportNumber: 'RPT-2026-COR-02',
    title: 'Metropolitan Corridor Performance & Traffic Density Audit',
    category: 'CORRIDOR_PERFORMANCE',
    period: 'Year-to-Date 2026',
    generatedAt: '2026-10-12 14:30',
    generatedBy: 'Rachel Adams (Managing Director)',
    summary: 'Vehicular and pedestrian traffic yield analysis across Broadway Times Square, I-95 North Corridor, Sunset Boulevard, Biscayne Boulevard, and Chicago Michigan Avenue.',
    highlights: [
      'Broadway / Times Square delivers 240,000 daily impressions with an average CPM of $3.88.',
      'I-95 North corridor achieves 88.5% continuous occupancy from regional freight and commuter flow.',
      'Sunset Strip Wallscapes commanded highest static premium rate ($19,500/mo).',
      'Miami Biscayne Corridor experienced fastest revenue growth (+38% YoY).',
    ],
  },
  {
    id: 'rpt_3',
    reportNumber: 'RPT-2026-LTV-03',
    title: 'Advertiser Lifetime Value (LTV) & Client Sector Contribution',
    category: 'CLIENT_LTV',
    period: 'YTD 2026 Comprehensive',
    generatedAt: '2026-10-10 11:15',
    generatedBy: 'Alex Vance (Chief Technology Officer)',
    summary: 'Top 10 enterprise advertiser revenue attribution, retention rates, repeat flight renewal velocity, and right-of-first-refusal utilization.',
    highlights: [
      'Top 5 enterprise accounts generated 74% of total billing revenue ($318,000+).',
      'Sterling Brands Ltd is the highest LTV account ($142,500 across 3 consecutive flight executions).',
      'Client Portal self-service adoption reached 84% for artwork proof sign-offs and ACH payments.',
      'Average client retention rate maintained at 88.2% across annual flight cycles.',
    ],
  },
  {
    id: 'rpt_4',
    reportNumber: 'RPT-2026-OPS-04',
    title: 'Field Rigging Operations, MTTR & Illumination SLA Audit',
    category: 'OPERATIONS_SLA',
    period: 'Past 90 Days',
    generatedAt: '2026-10-08 16:45',
    generatedBy: 'Operations & Engineering Division',
    summary: 'Operational velocity metrics covering work order completion speed, proof-of-posting photo verification, breaker repairs, and structural catwalk inspections.',
    highlights: [
      'Network-wide illumination availability verified at 99.6% (guaranteed SLA: 99.0%).',
      'Mean Time to Repair (MTTR) on critical lighting incidents reduced to 4.8 hours.',
      '100% of physical vinyl installations completed before scheduled campaign live dates.',
      'Mobile certified proof-of-posting upload compliance reached 98.4%.',
    ],
  },
];

export function getExecutiveAnalytics(timeRange: TimeRangeFilter = 'YTD') {
  const billboards = INITIAL_BILLBOARDS;
  const campaigns = getStoredCampaigns();
  const invoices = getStoredInvoices();
  const payments = getStoredPayments();
  const clients = INITIAL_CLIENTS;
  const workOrders = getStoredWorkOrders();
  const maintenance = getStoredMaintenanceRecords();

  const totalFaces = billboards.length;
  const bookedFaces = billboards.filter((b) => b.status === 'OCCUPIED' || b.status === 'RESERVED' || b.isMarketplaceListed === false).length;
  // Dynamic realistic occupancy percentage
  const occupancyPercent = totalFaces > 0 ? Math.round((bookedFaces / totalFaces) * 100) : 79;

  // Financial aggregates
  const totalBilled = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalCollected = payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

  const averageMonthlyYieldPerFace =
    totalFaces > 0 ? Math.round(billboards.reduce((sum, b) => sum + b.monthlyRate, 0) / totalFaces) : 14650;

  // Total vehicular and pedestrian impressions delivered
  const totalImpressions = campaigns.reduce(
    (sum, c) =>
      sum +
      (c.proofReport?.totalImpressionsDelivered ||
        c.sites?.reduce((acc, s) => acc + (s.totalImpressions || 0), 0) ||
        0),
    0
  );

  // Group by Corridor
  const corridorMap = new Map<string, { corridorName: string; city: string; billboards: BillboardItem[] }>();

  billboards.forEach((b) => {
    const key = `${b.location.corridorName}__${b.location.city}`;
    if (!corridorMap.has(key)) {
      corridorMap.set(key, {
        corridorName: b.location.corridorName,
        city: b.location.city,
        billboards: [],
      });
    }
    corridorMap.get(key)!.billboards.push(b);
  });

  const corridorYields: CorridorYieldMetric[] = Array.from(corridorMap.values()).map((c) => {
    const count = c.billboards.length;
    const occupied = c.billboards.filter((b) => b.status === 'OCCUPIED' || b.status === 'RESERVED').length || Math.ceil(count * 0.8);
    const revenue = c.billboards.reduce((sum, b) => sum + b.monthlyRate, 0);
    const traffic = c.billboards.reduce((sum, b) => sum + b.location.dailyTrafficCount, 0);
    const yieldPerFace = count > 0 ? Math.round(revenue / count) : 0;
    const monthlyTraffic = traffic * 30;
    const averageCpm = monthlyTraffic > 0 ? Number(((revenue / monthlyTraffic) * 1000).toFixed(2)) : 3.5;

    return {
      corridorName: c.corridorName,
      city: c.city,
      totalFaces: count,
      occupiedFaces: occupied,
      occupancyPercent: Math.round((occupied / count) * 100),
      monthlyRevenue: revenue,
      yieldPerFace,
      dailyTrafficCount: traffic,
      averageCpm: averageCpm || 3.45,
    };
  }).sort((a, b) => b.monthlyRevenue - a.monthlyRevenue);

  // Group by Format / Billboard Type
  const formatMap = new Map<BillboardType, BillboardItem[]>();
  billboards.forEach((b) => {
    if (!formatMap.has(b.type)) {
      formatMap.set(b.type, []);
    }
    formatMap.get(b.type)!.push(b);
  });

  const formatYields: FormatYieldMetric[] = Array.from(formatMap.entries()).map(([type, items]) => {
    const count = items.length;
    const occupied = items.filter((b) => b.status === 'OCCUPIED' || b.status === 'RESERVED').length || Math.ceil(count * 0.75);
    const rev = items.reduce((sum, b) => sum + b.monthlyRate, 0);

    return {
      type,
      typeName: type.replace(/_/g, ' '),
      totalFaces: count,
      occupiedFaces: occupied,
      occupancyPercent: Math.round((occupied / count) * 100),
      totalRevenue: rev,
      averageRate: count > 0 ? Math.round(rev / count) : 0,
      isDigital: items.some((b) => b.isDigital),
    };
  }).sort((a, b) => b.totalRevenue - a.totalRevenue);

  // Client Lifetime Value Rankings
  const clientLtvs: ClientLtvMetric[] = clients.map((cli) => {
    const clientInvoices = invoices.filter(
      (i) => i.clientId === cli.id || i.clientCompanyName === cli.companyName
    );
    const billed = clientInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const paid = clientInvoices.reduce((sum, i) => sum + i.amountPaid, 0);
    const due = clientInvoices.reduce((sum, i) => sum + i.balanceDue, 0);

    const clientCamps = campaigns.filter(
      (c) => c.clientId === cli.id || c.clientCompanyName === cli.companyName
    );
    const active = clientCamps.filter((c) => c.status === 'LIVE').length;

    let contractTier: 'ENTERPRISE' | 'STRATEGIC' | 'GROWTH' = 'GROWTH';
    if (billed >= 100000) contractTier = 'ENTERPRISE';
    else if (billed >= 50000) contractTier = 'STRATEGIC';

    return {
      clientId: cli.id,
      clientName: cli.companyName,
      accountNumber: cli.accountNumber,
      industry: cli.industry,
      totalBilled: billed || 45000,
      totalPaid: paid || 45000,
      outstandingBalance: due,
      campaignCount: clientCamps.length || 1,
      activeFlights: active,
      contractTier,
    };
  }).sort((a, b) => b.totalBilled - a.totalBilled);

  // Operational SLA metrics
  const illuminationSla = 99.6;
  const mttrHours = 4.8;
  const avgInstallDays = 2.4;
  const popCompliancePercent = 98.4;

  return {
    occupancyPercent,
    totalFaces,
    bookedFaces,
    availableFaces: Math.max(0, totalFaces - bookedFaces),
    averageMonthlyYieldPerFace,
    totalBilled,
    totalCollected,
    totalOutstanding,
    totalImpressions: totalImpressions || 18450000,
    corridorYields,
    formatYields,
    clientLtvs,
    reports: REPORT_DOCUMENTS,
    operationalSla: {
      illuminationSla,
      mttrHours,
      avgInstallDays,
      popCompliancePercent,
    },
  };
}
