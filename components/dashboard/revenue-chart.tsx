"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface MonthData {
  month: string;
  revenue: number;
  occupancy: number;
}

export function RevenueChart() {
  const months: MonthData[] = [
    { month: 'Jan', revenue: 62000, occupancy: 68 },
    { month: 'Feb', revenue: 68500, occupancy: 71 },
    { month: 'Mar', revenue: 74000, occupancy: 73 },
    { month: 'Apr', revenue: 71500, occupancy: 70 },
    { month: 'May', revenue: 79000, occupancy: 74 },
    { month: 'Jun', revenue: 82400, occupancy: 76 },
    { month: 'Jul', revenue: 86000, occupancy: 78 },
    { month: 'Aug', revenue: 81200, occupancy: 75 },
    { month: 'Sep', revenue: 84500, occupancy: 78 },
  ];

  const maxRevenue = 100000;
  const [hoveredMonth, setHoveredMonth] = useState<MonthData | null>(months[months.length - 1]);

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-gray-900">
                Monthly Revenue & Yield Trajectory
              </CardTitle>
              <CardDescription className="text-xs">
                Gross billing performance across billboard rentals, print, & mounting
              </CardDescription>
            </div>
          </div>
          <Link href="/invoices">
            <span className="text-xs font-semibold text-indigo-600 hover:underline">
              Financials →
            </span>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-6 flex-1 flex flex-col justify-between">
        {/* Metric Overview Callouts */}
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-3xl font-extrabold tracking-tight text-gray-900">
              ${hoveredMonth ? (hoveredMonth.revenue).toLocaleString() : '84,500'}
            </span>
            <span className="ml-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />
              +14.2% MoM
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 font-medium">Selected Month</p>
            <p className="text-xs font-bold text-indigo-700">
              {hoveredMonth?.month} 2026 &bull; {hoveredMonth?.occupancy}% Occupancy
            </p>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="pt-4">
          <div className="flex items-end justify-between gap-2 h-44 border-b border-gray-200 pb-2">
            {months.map((m) => {
              const heightPct = Math.round((m.revenue / maxRevenue) * 100);
              const isSelected = hoveredMonth?.month === m.month;

              return (
                <div
                  key={m.month}
                  onMouseEnter={() => setHoveredMonth(m)}
                  className="flex-1 flex flex-col items-center gap-2 group cursor-pointer h-full justify-end"
                >
                  {/* Tooltip on active */}
                  <div
                    className={`text-[10px] font-mono font-semibold transition-opacity duration-200 ${
                      isSelected ? 'opacity-100 text-indigo-600 font-bold' : 'opacity-0 text-gray-400'
                    }`}
                  >
                    ${(m.revenue / 1000).toFixed(0)}k
                  </div>

                  {/* Bar */}
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full max-w-[28px] rounded-t-md transition-all duration-300 ${
                      isSelected
                        ? 'bg-gradient-to-t from-indigo-700 to-indigo-500 shadow-md shadow-indigo-200'
                        : 'bg-indigo-100 hover:bg-indigo-300'
                    }`}
                  />
                  <span
                    className={`text-[11px] font-semibold transition-colors ${
                      isSelected ? 'text-indigo-900 font-bold' : 'text-gray-400'
                    }`}
                  >
                    {m.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Financial Highlights Footer */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 text-xs">
          <div>
            <p className="text-gray-400 font-medium text-[11px]">YTD Gross Billings</p>
            <p className="font-bold text-gray-900">$689,100</p>
          </div>
          <div>
            <p className="text-gray-400 font-medium text-[11px]">Avg Face Yield</p>
            <p className="font-bold text-gray-900">$3,420/mo</p>
          </div>
          <div>
            <p className="text-gray-400 font-medium text-[11px]">Collection Efficiency</p>
            <p className="font-bold text-emerald-600">96.8% Settled</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
