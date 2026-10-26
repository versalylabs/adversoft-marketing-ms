"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/protectedRoute';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { getTenantSummaryMetrics } from '@/lib/tenant-store';
import { OccupancyChart } from '@/components/dashboard/occupancy-chart';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { CampaignsTracker } from '@/components/dashboard/campaigns-tracker';
import { OperationsQueue } from '@/components/dashboard/operations-queue';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { QuickActionsBar } from '@/components/dashboard/quick-actions-bar';
import SystemAcceptanceModal from '@/components/system-acceptance-modal';
import {
  MapPin,
  Layers,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Sparkles,
  AlertTriangle,
  Building,
  ShieldCheck,
  Database,
  Users,
  Award,
  Plus,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, tenant } = useAuth();
  const { toast } = useToast();
  const [showAcceptanceModal, setShowAcceptanceModal] = useState(false);
  const [metrics, setMetrics] = useState({
    totalBillboards: 124,
    occupiedCount: 94,
    availableCount: 18,
    reservedCount: 8,
    maintenanceCount: 4,
    occupancyRate: 76,
    activeCampaigns: 18,
    pendingApprovals: 5,
    totalRevenue: 84500,
  });

  const refreshMetrics = useCallback(() => {
    if (tenant?.isDemo) {
      setMetrics({
        totalBillboards: 124,
        occupiedCount: 94,
        availableCount: 18,
        reservedCount: 8,
        maintenanceCount: 4,
        occupancyRate: 76,
        activeCampaigns: 18,
        pendingApprovals: 5,
        totalRevenue: 84500,
      });
    } else {
      const summary = getTenantSummaryMetrics(tenant?.id);
      setMetrics(summary);
    }
  }, [tenant]);

  useEffect(() => {
    refreshMetrics();

    const handleUpdate = () => refreshMetrics();
    window.addEventListener('adversoft_tenant_changed', handleUpdate);
    window.addEventListener('adversoft_billboards_updated', handleUpdate);
    window.addEventListener('adversoft_campaigns_updated', handleUpdate);
    window.addEventListener('adversoft_invoices_updated', handleUpdate);

    return () => {
      window.removeEventListener('adversoft_tenant_changed', handleUpdate);
      window.removeEventListener('adversoft_billboards_updated', handleUpdate);
      window.removeEventListener('adversoft_campaigns_updated', handleUpdate);
      window.removeEventListener('adversoft_invoices_updated', handleUpdate);
    };
  }, [refreshMetrics]);

  return (
    <ProtectedRoute>
      <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
        {/* Executive Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/10">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur text-indigo-200">
                <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
                <span>Enterprise Outdoor Media Platform • Operational</span>
              </div>
              <Badge variant="outline" className="text-white border-white/30 text-[10px] bg-white/5">
                {user?.organizationName || 'Apex Outdoor Media'}
              </Badge>
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-white">
              Operational Command Center
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200 max-w-xl">
              Connected overview for <span className="font-semibold text-white">{user?.name}</span> ({user?.role}). Manage inventory, flights, sign-offs, and revenue.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setShowAcceptanceModal(true)}
              size="sm"
              className="bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs gap-1.5 shadow-md"
            >
              <Award className="h-4 w-4 text-indigo-600" />
              <span>System Verification & Health</span>
            </Button>
            <Link href="/team">
              <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white text-xs gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Team & RBAC</span>
              </Button>
            </Link>
            <Link href="/architecture">
              <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white text-xs gap-1.5">
                <Database className="h-3.5 w-3.5" />
                <span>Architecture</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Clean Workspace Onboarding Banner (Shown when in empty custom tenant) */}
        {!tenant?.isDemo && metrics.totalBillboards === 0 && (
          <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-white to-violet-50/90 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-in fade-in">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                  Clean Slate Active
                </span>
                <span className="text-xs font-semibold text-gray-500">
                  {tenant?.name} &bull; Isolated Multi-Tenant Workspace
                </span>
              </div>
              <h3 className="text-base font-bold text-gray-900">
                Welcome to your fresh advertising workspace!
              </h3>
              <p className="text-xs text-gray-600 max-w-2xl">
                This organization is running completely from scratch with zero demo data. Register your real billboard faces, add your advertising clients, and build live campaign proposals.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/billboards">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-xs gap-1.5 font-semibold">
                  <Plus className="h-4 w-4" />
                  <span>Add First Billboard</span>
                </Button>
              </Link>
              <Link href="/crm">
                <Button size="sm" variant="outline" className="text-xs gap-1.5 font-semibold">
                  <Users className="h-4 w-4" />
                  <span>Add Client</span>
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Executive KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Billboards */}
          <Link href="/billboards">
            <Card className="p-5 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Total Billboard Inventory</p>
                  <p className="mt-1 text-2xl font-extrabold text-gray-900">{metrics.totalBillboards}</p>
                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                      {metrics.occupiedCount} Occupied
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {metrics.availableCount} Available
                    </span>
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                      {metrics.reservedCount} Holds
                    </span>
                  </div>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <MapPin className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </Link>

          {/* Active Campaigns */}
          <Link href="/campaigns">
            <Card className="p-5 hover:border-violet-300 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Active Brand Campaigns</p>
                  <p className="mt-1 text-2xl font-extrabold text-gray-900">{metrics.activeCampaigns}</p>
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-violet-700 font-medium">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{metrics.activeCampaigns > 0 ? `${metrics.activeCampaigns} active flights` : '0 active flights'}</span>
                  </div>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <Layers className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </Link>

          {/* Pending Approvals */}
          <Link href="/artwork">
            <Card className="p-5 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Pending Approvals</p>
                  <p className="mt-1 text-2xl font-extrabold text-gray-900">{metrics.pendingApprovals}</p>
                  <div className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-700 font-medium">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>{metrics.pendingApprovals > 0 ? `${metrics.pendingApprovals} proofs awaiting sign-off` : 'All proofs up to date'}</span>
                  </div>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </Link>

          {/* Monthly Revenue */}
          <Link href="/invoices">
            <Card className="p-5 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Total Settlement Revenue</p>
                  <p className="mt-1 text-2xl font-extrabold text-gray-900">
                    {tenant?.currencySymbol || '$'}{metrics.totalRevenue.toLocaleString()}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    <span>{metrics.totalRevenue > 0 ? 'Settled through receipts' : 'Clean financial ledger'}</span>
                  </div>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Quick Operations Launchpad */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Operations Launchpad
          </p>
          <QuickActionsBar />
        </div>

        {/* Primary Visual Intelligence: Occupancy & Revenue Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OccupancyChart />
          <RevenueChart />
        </div>

        {/* Operational Flow: Campaign Tracker & Priority Operations Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CampaignsTracker />
          <OperationsQueue />
        </div>

        {/* Real-time Lifecycle Audit Stream */}
        <ActivityFeed />

        {/* Master System Directory & Health Verification Modal */}
        <SystemAcceptanceModal
          isOpen={showAcceptanceModal}
          onClose={() => setShowAcceptanceModal(false)}
        />
      </div>
    </ProtectedRoute>
  );
}