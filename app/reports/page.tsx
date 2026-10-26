"use client";

import { useState, useMemo, useEffect } from 'react';
import ProtectedRoute from '@/components/protectedRoute';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import {
  getExecutiveAnalytics,
  ReportDocument,
  TimeRangeFilter,
  CorridorYieldMetric,
  FormatYieldMetric,
  ClientLtvMetric,
} from '@/lib/data/reports-store';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  Printer,
  FileText,
  Eye,
  RefreshCw,
  Zap,
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Maximize2,
  SlidersHorizontal,
  X,
  PieChart,
  Target,
  ArrowUpRight,
  Plus,
} from 'lucide-react';

type AnalyticsTab = 'corridors' | 'formats' | 'clients' | 'dossiers';

export default function ReportsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('YTD');
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('corridors');

  // Modals
  const [selectedReportToPrint, setSelectedReportToPrint] = useState<ReportDocument | null>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [customReportTitle, setCustomReportTitle] = useState('Executive Mid-Quarter Media Yield Audit');
  const [customReportCategory, setCustomReportCategory] = useState<ReportDocument['category']>('EXECUTIVE_BRIEFING');
  const [customReportPeriod, setCustomReportPeriod] = useState('Q4 2026 Executive Review');
  const [customReportSummary, setCustomReportSummary] = useState(
    'Real-time operational and commercial yield telemetry indicates 79.2% occupancy with premium CPM performance across high-traffic transit corridors.'
  );

  // Analytics data
  const [analytics, setAnalytics] = useState(() => getExecutiveAnalytics(timeRange));

  useEffect(() => {
    setAnalytics(getExecutiveAnalytics(timeRange));
  }, [timeRange]);

  const handleRefresh = () => {
    setAnalytics(getExecutiveAnalytics(timeRange));
    toast.success('Analytics Refreshed', 'Real-time telemetry and revenue metrics updated.');
  };

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();

    const newDoc: ReportDocument = {
      id: `rpt_${Date.now()}`,
      reportNumber: `RPT-2026-${Date.now().toString().slice(-4)}`,
      title: customReportTitle,
      category: customReportCategory,
      period: customReportPeriod,
      generatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      generatedBy: user ? `${user.name} (${user.role})` : 'Senior Analytics Director',
      summary: customReportSummary,
      highlights: [
        `Portfolio occupancy confirmed at ${analytics.occupancyPercent}% across active commercial faces.`,
        `Average yield per face reached $${analytics.averageMonthlyYieldPerFace.toLocaleString()}/mo.`,
        `Illumination SLA maintained at ${analytics.operationalSla.illuminationSla}% reliability.`,
        'All physical vinyl riggings verified with zero delivery delays.',
      ],
    };

    analytics.reports.unshift(newDoc);
    setAnalytics({ ...analytics });
    setIsGenerateModalOpen(false);
    setSelectedReportToPrint(newDoc);
    toast.success('Executive Report Generated', `Report ${newDoc.reportNumber} compiled and added to library.`);
  };

  return (
    <ProtectedRoute requiredPermission="reports:read">
      <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                Executive Analytics
              </span>
              <span className="text-xs text-gray-500">• Executive BI & Portfolio Telemetry</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-indigo-600" />
              Executive Reporting & Intelligence
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Portfolio occupancy rates, site yield per face, corridor revenue attribution, client LTV, and operational SLA telemetry.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Time Range Selector */}
            <div className="bg-white border border-gray-200 rounded-lg p-1 flex items-center text-xs shadow-2xs">
              {(['MTD', 'QTD', 'YTD', 'ALL'] as TimeRangeFilter[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeRange(period)}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                    timeRange === period
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {period === 'ALL' ? 'Trailing 12M' : period}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Generate Briefing Dossier
            </button>
          </div>
        </div>

        {/* Executive KPI Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Portfolio Occupancy</span>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Target className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-emerald-600">{analytics.occupancyPercent}%</span>
              <p className="text-xs text-gray-500 mt-1">
                {analytics.bookedFaces} booked of {analytics.totalFaces} total faces
              </p>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Average Yield / Face</span>
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-gray-900">
                ${analytics.averageMonthlyYieldPerFace.toLocaleString()}
              </span>
              <p className="text-xs text-gray-500 mt-1">Average monthly rate per structure</p>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Gross Billed AR</span>
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-gray-900">
                ${analytics.totalBilled.toLocaleString()}
              </span>
              <p className="text-xs text-gray-500 mt-1">
                ${analytics.totalCollected.toLocaleString()} cleared cash inflow
              </p>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Illumination SLA</span>
              <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <Zap className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-purple-700">
                {analytics.operationalSla.illuminationSla}%
              </span>
              <p className="text-xs text-gray-500 mt-1">
                {analytics.operationalSla.mttrHours}h MTTR incident recovery
              </p>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Delivered Impressions</span>
              <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-sky-700">
                {(analytics.totalImpressions / 1000000).toFixed(1)}M
              </span>
              <p className="text-xs text-gray-500 mt-1">Verified vehicular & pedestrian flow</p>
            </div>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-gray-200 space-x-2 sm:space-x-4">
          <button
            onClick={() => setActiveTab('corridors')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'corridors'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Corridors & Route Yield</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] bg-gray-100 text-gray-700">
              {analytics.corridorYields.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('formats')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'formats'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Format & Inventory Mix</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] bg-gray-100 text-gray-700">
              {analytics.formatYields.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('clients')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'clients'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Advertiser LTV & Revenue</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] bg-gray-100 text-gray-700">
              {analytics.clientLtvs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('dossiers')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'dossiers'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Executive Briefing Library</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] bg-gray-100 text-gray-700">
              {analytics.reports.length}
            </span>
          </button>
        </div>

        {/* -------------------------------------------------------------
            TAB 1: CORRIDORS & ROUTE YIELD
        -------------------------------------------------------------- */}
        {activeTab === 'corridors' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                  Corridor Yield & Regional Density Breakdown
                </h2>
                <p className="text-xs text-gray-500">
                  Revenue contribution, average yield per face, daily vehicular flow, and cost per thousand (CPM) across major arteries.
                </p>
              </div>

              <button
                onClick={handleRefresh}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-white border border-gray-200 transition-colors"
                title="Refresh Metrics"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <Card className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Corridor & Metro</th>
                      <th className="py-3 px-4">Active Faces</th>
                      <th className="py-3 px-4">Occupancy Rate</th>
                      <th className="py-3 px-4">Monthly Revenue</th>
                      <th className="py-3 px-4">Yield / Face</th>
                      <th className="py-3 px-4">Daily Traffic Count</th>
                      <th className="py-3 px-4 text-right">Avg CPM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {analytics.corridorYields.map((c, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900">{c.corridorName}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {c.city} Metro Area
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-xs font-semibold text-gray-700">
                          {c.totalFaces} Structures ({c.occupiedFaces} Booked)
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="w-32 space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-gray-700">
                              <span>{c.occupancyPercent}%</span>
                            </div>
                            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  c.occupancyPercent >= 80 ? 'bg-emerald-500' : 'bg-indigo-500'
                                }`}
                                style={{ width: `${c.occupancyPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          ${c.monthlyRevenue.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-xs font-semibold text-indigo-700">
                          ${c.yieldPerFace.toLocaleString()}/mo
                        </td>

                        <td className="py-3.5 px-4 text-xs text-gray-600 font-medium">
                          {c.dailyTrafficCount.toLocaleString()} vehicles/day
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-900">
                          ${c.averageCpm.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 2: FORMAT & INVENTORY MIX
        -------------------------------------------------------------- */}
        {activeTab === 'formats' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                Format Yield & Structure Category Breakdown
              </h2>
              <p className="text-xs text-gray-500">
                Performance differentiation between High-Resolution Digital LEDs, Static Bulletins, Wallscapes, and Highway Unipoles.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analytics.formatYields.map((fmt) => (
                <Card
                  key={fmt.type}
                  className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            fmt.isDigital ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {fmt.isDigital ? 'DIGITAL LED NETWORK' : 'PRINTED VINYL'}
                        </span>
                        <h3 className="text-base font-bold text-gray-900 mt-2">{fmt.typeName}</h3>
                      </div>
                      <span className="text-lg font-black text-gray-900">
                        ${fmt.totalRevenue.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-gray-50/75 border border-gray-100 space-y-2 text-xs">
                      <div className="flex justify-between text-gray-600">
                        <span>Total Available Faces:</span>
                        <strong className="text-gray-900">{fmt.totalFaces} Units</strong>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Occupancy Rate:</span>
                        <strong className="text-emerald-700">{fmt.occupancyPercent}%</strong>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Average Monthly Rate:</span>
                        <strong className="text-indigo-700">${fmt.averageRate.toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${fmt.occupancyPercent}%` }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 3: ADVERTISER LTV & SECTOR ATTRIBUTION
        -------------------------------------------------------------- */}
        {activeTab === 'clients' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Advertiser Lifetime Value (LTV) & Client Portfolio
              </h2>
              <p className="text-xs text-gray-500">
                Top corporate accounts ranked by total cumulative contract billing, settlement reliability, and active advertising campaigns.
              </p>
            </div>

            <Card className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Client Company</th>
                      <th className="py-3 px-4">Industry Sector</th>
                      <th className="py-3 px-4">Account Tier</th>
                      <th className="py-3 px-4">Cumulative Billed (LTV)</th>
                      <th className="py-3 px-4">Total Paid</th>
                      <th className="py-3 px-4">Open Balance</th>
                      <th className="py-3 px-4 text-right">Campaigns</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {analytics.clientLtvs.map((cli) => (
                      <tr key={cli.clientId} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900">{cli.clientName}</div>
                          <div className="text-xs text-gray-400 font-mono mt-0.5">{cli.accountNumber}</div>
                        </td>

                        <td className="py-3.5 px-4 text-xs font-medium text-gray-600">
                          {cli.industry}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              cli.contractTier === 'ENTERPRISE'
                                ? 'bg-purple-50 text-purple-700'
                                : cli.contractTier === 'STRATEGIC'
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {cli.contractTier}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          ${cli.totalBilled.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-xs font-semibold text-emerald-700">
                          ${cli.totalPaid.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-xs font-bold">
                          <span className={cli.outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                            ${cli.outstandingBalance.toLocaleString()}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-medium text-gray-700 text-xs">
                          {cli.campaignCount} Flights ({cli.activeFlights} Live)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 4: EXECUTIVE BRIEFING LIBRARY & PDF EXPORTS
        -------------------------------------------------------------- */}
        {activeTab === 'dossiers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Executive Dossiers & Audit Briefings
                </h2>
                <p className="text-xs text-gray-500">
                  Certified analytical briefings ready for board review, client performance audits, or printable PDF export.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analytics.reports.map((doc) => (
                <Card
                  key={doc.id}
                  className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                          {doc.category}
                        </span>
                        <h3 className="text-base font-bold text-gray-900 mt-2">{doc.title}</h3>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">
                          {doc.reportNumber} • {doc.period}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed">{doc.summary}</p>

                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                        Key Strategic Highlights:
                      </span>
                      <ul className="space-y-1">
                        {doc.highlights.map((h, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-400">Author: {doc.generatedBy}</span>
                    <button
                      onClick={() => setSelectedReportToPrint(doc)}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      View & Print PDF Dossier
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            MODAL: PRINTABLE EXECUTIVE BRIEFING DOSSIER
        -------------------------------------------------------------- */}
        {selectedReportToPrint && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-gray-100 space-y-6 print:p-0 print:border-none print:shadow-none">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 print:hidden">
                <Badge className="bg-indigo-50 text-indigo-700">Official Executive Dossier</Badge>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    Print / Save as PDF
                  </button>
                  <button
                    onClick={() => setSelectedReportToPrint(null)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Dossier Content */}
              <div className="space-y-6 text-gray-900 font-sans">
                <div className="flex justify-between items-start border-b border-gray-200 pb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl font-black tracking-tight text-gray-900">ADVERSOFT</span>
                      <span className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
                        OUTDOOR MEDIA
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Business Intelligence & Executive Telemetry Division</p>
                    <p className="text-xs text-gray-500">100 Broadway, 24th Floor, New York, NY 10005</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-bold text-gray-900">EXECUTIVE BRIEFING REPORT</h2>
                    <p className="text-xs font-mono font-bold text-indigo-600 mt-0.5">
                      {selectedReportToPrint.reportNumber}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{selectedReportToPrint.period}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedReportToPrint.title}</h3>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    {selectedReportToPrint.summary}
                  </p>
                </div>

                {/* Key Metrics Snapshot Grid */}
                <div className="grid grid-cols-4 gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">Occupancy Rate</span>
                    <strong className="text-base text-gray-900">{analytics.occupancyPercent}%</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">Average Yield</span>
                    <strong className="text-base text-gray-900">
                      ${analytics.averageMonthlyYieldPerFace.toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">Gross Billing</span>
                    <strong className="text-base text-gray-900">
                      ${analytics.totalBilled.toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">Illumination SLA</span>
                    <strong className="text-base text-emerald-700">
                      {analytics.operationalSla.illuminationSla}%
                    </strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-gray-800 uppercase tracking-wide text-xs">
                    Strategic Observations & Directives:
                  </h4>
                  <ul className="space-y-2">
                    {selectedReportToPrint.highlights.map((h, i) => (
                      <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 border-t border-gray-200 flex justify-between items-center text-xs text-gray-400">
                  <span>Certified by {selectedReportToPrint.generatedBy}</span>
                  <span>Confidential • Prepared for Adversoft Executive Leadership</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            MODAL: COMPILE CUSTOM EXECUTIVE REPORT
        -------------------------------------------------------------- */}
        {isGenerateModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Compile Custom Executive Report</h3>
                    <p className="text-xs text-gray-500">
                      Generate an on-demand analytical audit with live commercial telemetry.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateReport} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Report Title *</label>
                  <input
                    type="text"
                    value={customReportTitle}
                    onChange={(e) => setCustomReportTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                    <select
                      value={customReportCategory}
                      onChange={(e) => setCustomReportCategory(e.target.value as ReportDocument['category'])}
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none"
                    >
                      <option value="EXECUTIVE_BRIEFING">Executive Briefing</option>
                      <option value="OCCUPANCY_YIELD">Occupancy & Yield</option>
                      <option value="CORRIDOR_PERFORMANCE">Corridor Audit</option>
                      <option value="CLIENT_LTV">Client LTV</option>
                      <option value="OPERATIONS_SLA">Operations & SLA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Period</label>
                    <input
                      type="text"
                      value={customReportPeriod}
                      onChange={(e) => setCustomReportPeriod(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Executive Summary & Takeaways *
                  </label>
                  <textarea
                    rows={4}
                    value={customReportSummary}
                    onChange={(e) => setCustomReportSummary(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsGenerateModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm"
                  >
                    Generate Dossier
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
