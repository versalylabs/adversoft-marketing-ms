"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Sparkles, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export function OccupancyChart() {
  const stats = [
    { label: 'Occupied', count: 94, pct: 75.8, color: 'bg-indigo-600', textColor: 'text-indigo-600', badge: 'default' as const },
    { label: 'Available', count: 18, pct: 14.5, color: 'bg-emerald-500', textColor: 'text-emerald-600', badge: 'success' as const },
    { label: 'Reserved (Holds)', count: 8, pct: 6.5, color: 'bg-amber-500', textColor: 'text-amber-600', badge: 'warning' as const },
    { label: 'Under Maintenance', count: 4, pct: 3.2, color: 'bg-rose-500', textColor: 'text-rose-600', badge: 'destructive' as const },
  ];

  const total = 124;
  const occupancyRate = 75.8;

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-gray-900">
                Inventory Occupancy & Fleet Health
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time structure status across 124 outdoor advertising faces
              </CardDescription>
            </div>
          </div>
          <Link href="/billboards">
            <span className="text-xs font-semibold text-indigo-600 hover:underline">
              Manage Inventory →
            </span>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-6 flex-1 flex flex-col justify-between">
        {/* Occupancy Rate Callout */}
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-3xl font-extrabold tracking-tight text-gray-900">
              {occupancyRate}%
            </span>
            <span className="ml-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              +4.2% vs target
            </span>
          </div>
          <p className="text-xs text-gray-500">
            <span className="font-semibold text-gray-900">94</span> of <span className="font-semibold text-gray-900">{total}</span> faces generating revenue
          </p>
        </div>

        {/* Stacked Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden flex shadow-inner">
            {stats.map((s) => (
              <div
                key={s.label}
                style={{ width: `${s.pct}%` }}
                className={`${s.color} transition-all duration-500 hover:opacity-90 relative group cursor-pointer`}
                title={`${s.label}: ${s.count} (${s.pct}%)`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[11px] text-gray-400 font-mono">
            <span>0%</span>
            <span>50% Target</span>
            <span>100% Capacity</span>
          </div>
        </div>

        {/* Status Breakdown Legend & Counts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 space-y-1"
            >
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${s.color}`} />
                <span className="text-[11px] font-medium text-gray-600 truncate">{s.label}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold text-gray-900">{s.count}</span>
                <span className={`text-[11px] font-semibold ${s.textColor}`}>{s.pct}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Format Distribution Highlights */}
        <div className="rounded-xl bg-indigo-50/60 border border-indigo-100/80 p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
            <span className="text-indigo-900 font-medium">
              32 Digital LED Screens active (average 8.2 slots sold per screen)
            </span>
          </div>
          <Badge variant="default" className="text-[10px] whitespace-nowrap">
            92% Digital Yield
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
