"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layers, Calendar, ArrowRight, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface CampaignItem {
  id: string;
  code: string;
  name: string;
  client: string;
  brand: string;
  dates: string;
  elapsedPct: number;
  budget: number;
  faces: number;
  status: 'ACTIVE' | 'LAUNCHING_SOON' | 'EXPIRING_SOON';
}

export function CampaignsTracker() {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'LAUNCHING_SOON' | 'EXPIRING_SOON'>('ALL');

  const campaigns: CampaignItem[] = [
    {
      id: 'c1',
      code: 'CMP-2026-001',
      name: 'Autumn Haute Couture Showcase',
      client: 'Sterling Brands Ltd',
      brand: 'Sterling Luxe',
      dates: 'Sep 01 - Nov 30, 2026',
      elapsedPct: 30,
      budget: 95000,
      faces: 2,
      status: 'ACTIVE',
    },
    {
      id: 'c2',
      code: 'CMP-2026-002',
      name: 'NextGen Pro Smartphone Launch',
      client: 'Acme Corporation',
      brand: 'Acme Mobile',
      dates: 'Sep 15 - Dec 15, 2026',
      elapsedPct: 15,
      budget: 45000,
      faces: 4,
      status: 'ACTIVE',
    },
    {
      id: 'c3',
      code: 'CMP-2026-003',
      name: '5G Everywhere Nationwide Push',
      client: 'Horizon Telecom',
      brand: 'Horizon Ultrafast',
      dates: 'Oct 01 - Dec 31, 2026',
      elapsedPct: 0,
      budget: 80000,
      faces: 6,
      status: 'LAUNCHING_SOON',
    },
    {
      id: 'c4',
      code: 'CMP-2026-004',
      name: 'Summer Hydration Wave',
      client: 'Pure Beverage Co',
      brand: 'PureWater',
      dates: 'Jul 01 - Sep 30, 2026',
      elapsedPct: 94,
      budget: 32000,
      faces: 3,
      status: 'EXPIRING_SOON',
    },
  ];

  const filtered = filter === 'ALL'
    ? campaigns
    : campaigns.filter((c) => c.status === filter);

  return (
    <Card>
      <CardHeader className="pb-3 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-gray-900">
                Active Campaigns & Flight Radar
              </CardTitle>
              <CardDescription className="text-xs">
                Monitoring 18 active brand flights, schedules, and deliverables
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors ${
                filter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All (18)
            </button>
            <button
              onClick={() => setFilter('ACTIVE')}
              className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors ${
                filter === 'ACTIVE' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              In Flight (12)
            </button>
            <button
              onClick={() => setFilter('LAUNCHING_SOON')}
              className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors ${
                filter === 'LAUNCHING_SOON' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Upcoming (4)
            </button>
            <button
              onClick={() => setFilter('EXPIRING_SOON')}
              className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors ${
                filter === 'EXPIRING_SOON' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Expiring (2)
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 divide-y divide-gray-100">
        {filtered.map((c) => (
          <div key={c.id} className="py-3 first:pt-0 last:pb-0 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                    {c.code}
                  </span>
                  <span className="text-xs font-bold text-gray-900">{c.name}</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Client: <span className="font-semibold text-gray-700">{c.client}</span> &bull; Brand: {c.brand}
                </p>
              </div>

              <div className="text-right">
                <Badge
                  variant={
                    c.status === 'ACTIVE'
                      ? 'success'
                      : c.status === 'LAUNCHING_SOON'
                      ? 'default'
                      : 'warning'
                  }
                  className="text-[10px]"
                >
                  {c.status.replace('_', ' ')}
                </Badge>
                <p className="text-xs font-bold text-gray-900 mt-0.5">
                  ${c.budget.toLocaleString()} &bull; {c.faces} Faces
                </p>
              </div>
            </div>

            {/* Flight Timeline Progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  {c.dates}
                </span>
                <span className="font-mono font-medium">{c.elapsedPct}% Flight Elapsed</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  style={{ width: `${c.elapsedPct}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${
                    c.status === 'EXPIRING_SOON'
                      ? 'bg-amber-500'
                      : c.status === 'LAUNCHING_SOON'
                      ? 'bg-blue-400'
                      : 'bg-emerald-500'
                  }`}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
