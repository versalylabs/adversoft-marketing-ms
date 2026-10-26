"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ACTIVITY_LOGS } from '@/lib/data/mock-db';
import {
  Activity,
  CheckCircle2,
  DollarSign,
  Truck,
  Bookmark,
  Sparkles,
} from 'lucide-react';

export function ActivityFeed() {
  const [filter, setFilter] = useState<string>('ALL');

  const filteredLogs = filter === 'ALL'
    ? ACTIVITY_LOGS
    : ACTIVITY_LOGS.filter((l) => l.entityType === filter);

  return (
    <Card>
      <CardHeader className="pb-3 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-gray-900">
                Recent Operations Activity
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time event stream across the outdoor advertising lifecycle
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {['ALL', 'ARTWORK', 'INVOICE', 'INSTALLATION', 'BOOKING'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-2 py-1 rounded-md font-semibold text-[11px] transition-colors ${
                  filter === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 divide-y divide-gray-100">
        {filteredLogs.map((log) => (
          <div key={log.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                log.action === 'APPROVED'
                  ? 'bg-emerald-50 text-emerald-600'
                  : log.action === 'PAYMENT_RECORDED'
                  ? 'bg-indigo-50 text-indigo-600'
                  : log.action === 'DISPATCHED'
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-blue-50 text-blue-600'
              }`}
            >
              {log.action === 'APPROVED' && <CheckCircle2 className="h-4 w-4" />}
              {log.action === 'PAYMENT_RECORDED' && <DollarSign className="h-4 w-4" />}
              {log.action === 'DISPATCHED' && <Truck className="h-4 w-4" />}
              {log.action === 'CREATED' && <Bookmark className="h-4 w-4" />}
            </div>

            <div className="flex-1 space-y-0.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-mono py-0 font-bold">
                    {log.entityCode}
                  </Badge>
                  <p className="text-xs font-bold text-gray-900 leading-tight">
                    {log.action.replace('_', ' ')}
                  </p>
                </div>
                <span className="text-[10px] font-medium text-gray-400">
                  {log.timestamp}
                </span>
              </div>

              <p className="text-[11px] text-gray-600 leading-relaxed">
                {log.description}
              </p>

              <p className="text-[10px] text-indigo-600 font-medium">
                Initiated by: {log.userName}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
