"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useNav } from '@/lib/nav-context';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserRole } from '@/lib/rbac';
import { AdversoftLogoIcon } from '@/components/logo';
import {
  LayoutDashboard,
  Users,
  MapPin,
  CalendarDays,
  Layers,
  Palette,
  Wrench,
  ShieldAlert,
  FileSpreadsheet,
  FileText,
  Receipt,
  CreditCard,
  BarChart3,
  Globe2,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Database,
  ShieldCheck,
  Map,
  Calculator,
  Bell,
  History,
} from 'lucide-react';

interface NavSection {
  title?: string;
  items: {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Operations',
    items: [
      { title: 'Dashboard', href: '/', icon: LayoutDashboard },
      { title: 'CRM & Clients', href: '/crm', icon: Users },
      { title: 'Billboards', href: '/billboards', icon: MapPin },
      { title: 'Interactive Map', href: '/map', icon: Map },
      { title: 'Bookings', href: '/bookings', icon: CalendarDays },
      { title: 'Marketplace', href: '/marketplace', icon: Globe2, badge: 'Public' },
      { title: 'Campaigns', href: '/campaigns', icon: Layers },
    ],
  },
  {
    title: 'Field & Creative',
    items: [
      { title: 'Artwork & Approvals', href: '/artwork', icon: Palette },
      { title: 'Installations', href: '/installations', icon: Wrench },
      { title: 'Maintenance', href: '/maintenance', icon: ShieldAlert },
    ],
  },
  {
    title: 'Finance & Sales',
    items: [
      { title: 'Pricing & Availability', href: '/pricing', icon: Calculator },
      { title: 'Quotations', href: '/quotations', icon: FileSpreadsheet },
      { title: 'Contracts', href: '/contracts', icon: FileText },
      { title: 'Invoices', href: '/invoices', icon: Receipt },
      { title: 'Payments', href: '/payments', icon: CreditCard },
    ],
  },
  {
    title: 'Management & Access',
    items: [
      { title: 'Team & RBAC', href: '/team', icon: ShieldCheck },
      { title: 'Architecture & DB', href: '/architecture', icon: Database },
      { title: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
      { title: 'Audit Activity Logs', href: '/audit', icon: History },
      { title: 'Client Portal', href: '/portal', icon: Globe2, badge: 'Portal' },
      { title: 'Notifications', href: '/notifications', icon: Bell },
      { title: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

const ALL_ROLES: UserRole[] = [
  'Super Admin',
  'Admin',
  'Sales Manager',
  'Sales Agent',
  'Campaign Manager',
  'Operations Manager',
  'Finance',
  'Technician',
  'Client',
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, tenant, switchRole, canAccess } = useAuth();
  const { mobileOpen, setMobileOpen, collapsed, toggleCollapsed } = useNav();

  const handleLinkClick = () => {
    if (mobileOpen) setMobileOpen(false);
  };

  const navContent = (
    <div className="flex h-full flex-col bg-white">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
        <Link
          href="/"
          onClick={handleLinkClick}
          className="flex items-center gap-2.5 overflow-hidden transition-opacity hover:opacity-90 min-w-0"
        >
          <AdversoftLogoIcon size={36} className="shrink-0 drop-shadow-xs" />
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold tracking-tight text-gray-900 leading-tight truncate">
                {tenant?.name || 'Adversoft'}
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-indigo-600 truncate">
                {tenant?.isDemo ? 'Demo Workspace' : 'Clean Workspace'}
              </span>
            </div>
          )}
        </Link>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={toggleCollapsed}
          className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Role-Aware Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_SECTIONS.map((section, idx) => {
          // Filter items based on active role permissions
          const visibleItems = section.items.filter((item) => canAccess(item.href));
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              {!collapsed && section.title && (
                <h3 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  {section.title}
                </h3>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleLinkClick}
                      title={collapsed ? item.title : undefined}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      } ${collapsed ? 'justify-center px-2' : ''}`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'
                        }`}
                      />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                      {!collapsed && item.badge && (
                        <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* User & Role Card Footer */}
      <div className="border-t border-gray-200 p-3 bg-gray-50/60">
        {user ? (
          <div className="space-y-2">
            <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
              <Avatar
                src={user.avatar}
                alt={user.name}
                fallback={user.name}
                className="h-9 w-9 shrink-0 ring-1 ring-gray-200"
              />
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-gray-900 leading-tight">
                    {user.name}
                  </p>
                  <p className="truncate text-[11px] text-gray-500">{user.email}</p>
                  <Badge variant="default" className="mt-1 text-[10px] px-1.5 py-0">
                    {user.role}
                  </Badge>
                </div>
              )}
            </div>

            {/* Quick Demo Persona Switcher - All 9 Roles */}
            {!collapsed && (
              <div className="pt-2 border-t border-gray-200/70">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Active Role (RBAC Demo)
                </label>
                <select
                  value={user.role}
                  onChange={(e) => switchRole(e.target.value as UserRole)}
                  className="w-full text-xs rounded-md border border-gray-200 bg-white py-1 px-2 text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            onClick={handleLinkClick}
            className="flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Sign In
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-gray-200 transition-all duration-200 shrink-0 ${
          collapsed ? 'w-18' : 'w-64'
        }`}
      >
        {navContent}
      </aside>

      {/* Mobile Sidebar Overlay & Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white shadow-2xl">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}