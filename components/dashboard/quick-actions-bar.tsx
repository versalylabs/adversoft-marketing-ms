"use client";

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import {
  CalendarDays,
  FileSpreadsheet,
  Users,
  Palette,
  Wrench,
  AlertTriangle,
  Receipt,
  Plus,
} from 'lucide-react';

export function QuickActionsBar() {
  const { canAccess, hasPermission } = useAuth();

  const actions = [
    {
      title: 'New Booking',
      desc: 'Reserve billboard space',
      href: '/bookings',
      icon: CalendarDays,
      color: 'bg-indigo-50 text-indigo-600',
      allowed: canAccess('/bookings'),
    },
    {
      title: 'Create Quote',
      desc: 'Build pricing proposal',
      href: '/quotations',
      icon: FileSpreadsheet,
      color: 'bg-violet-50 text-violet-600',
      allowed: canAccess('/quotations'),
    },
    {
      title: 'Add Client / Lead',
      desc: 'Register advertiser brief',
      href: '/crm',
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
      allowed: canAccess('/crm'),
    },
    {
      title: 'Review Artwork',
      desc: 'Sign off creative proofs',
      href: '/artwork',
      icon: Palette,
      color: 'bg-amber-50 text-amber-600',
      allowed: canAccess('/artwork'),
    },
    {
      title: 'Mounting Crew',
      desc: 'Dispatch field riggers',
      href: '/installations',
      icon: Wrench,
      color: 'bg-emerald-50 text-emerald-600',
      allowed: canAccess('/installations'),
    },
    {
      title: 'Maintenance Issue',
      desc: 'Report damage or repair',
      href: '/maintenance',
      icon: AlertTriangle,
      color: 'bg-rose-50 text-rose-600',
      allowed: canAccess('/maintenance'),
    },
  ];

  const visibleActions = actions.filter((a) => a.allowed);
  if (visibleActions.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {visibleActions.map((act) => {
        const Icon = act.icon;
        return (
          <Link key={act.title} href={act.href}>
            <div className="flex flex-col p-3 rounded-xl border border-gray-200/80 bg-white hover:border-indigo-300 hover:shadow-sm hover:bg-indigo-50/20 transition-all cursor-pointer group">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${act.color} mb-2.5 transition-transform group-hover:scale-105`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-gray-900 leading-tight">
                {act.title}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                {act.desc}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
