"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useNav } from '@/lib/nav-context';
import { useToast } from '@/lib/toast';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Menu,
  Search,
  Bell,
  LogOut,
  Building,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import {
  getStoredNotifications,
  markAsRead,
  markAllAsRead,
  NotificationItem,
} from '@/lib/data/notifications-store';
import GlobalSearchDialog from '@/components/global-search-dialog';
import OrganizationSwitcher from '@/components/organization-switcher';
import { AdversoftLogoIcon } from '@/components/logo';

export default function Header() {
  const { user, logout } = useAuth();
  const { toggleMobile } = useNav();
  const { toast } = useToast();
  const router = useRouter();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    setNotifications(getStoredNotifications());
    const handleUpdate = () => {
      setNotifications(getStoredNotifications());
    };
    window.addEventListener('adversoft_notifications_updated', handleUpdate);
    return () => window.removeEventListener('adversoft_notifications_updated', handleUpdate);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleLogout = () => {
    logout();
    toast.info('Signed out', 'You have been logged out of your session.');
    router.push('/login');
  };

  const handleQuickNotificationTest = () => {
    toast.success(
      'System Alert',
      'Operational Notifications & Automation Engine is active.'
    );
  };

  const handleMarkAllRead = () => {
    const updated = markAllAsRead();
    setNotifications(updated);
  };

  const handleNotificationClick = (n: NotificationItem) => {
    markAsRead(n.id);
    setNotifications(getStoredNotifications());
    setShowNotifications(false);
    if (n.actionUrl) {
      router.push(n.actionUrl);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white/95 px-4 sm:px-6 backdrop-blur">
      {/* Left: Mobile Toggle & Global Search */}
      <div className="flex items-center gap-3 md:gap-4 flex-1 max-w-xl">
        {/* Mobile menu trigger */}
        <button
          onClick={toggleMobile}
          className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100"
          aria-label="Open mobile menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile / Compact Logo Icon */}
        <Link href="/" className="flex md:hidden items-center shrink-0">
          <AdversoftLogoIcon size={32} />
        </Link>

        {/* Global Search Bar Trigger */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="group relative flex h-9 w-full items-center rounded-lg border border-gray-200 bg-gray-50/70 pl-9 pr-12 text-left text-sm text-gray-500 hover:border-indigo-300 hover:bg-white transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-hover:text-indigo-600 transition-colors" />
          <span className="truncate text-xs sm:text-sm">Search billboards, clients, campaigns...</span>
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-400 group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Actions, Notifications, & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Multi-Tenant Organization Switcher */}
        <OrganizationSwitcher />

        {/* Notification Test Trigger */}
        <button
          onClick={handleQuickNotificationTest}
          title="Test Toast Notification"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/80 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Test Alert</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-88 max-w-sm rounded-2xl border border-gray-100 bg-white p-4 shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-gray-900">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto text-xs">
                {notifications.slice(0, 5).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      !n.isRead
                        ? 'bg-indigo-50/40 border-indigo-100 hover:bg-indigo-50/70'
                        : 'bg-gray-50/60 border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-semibold ${!n.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                        {n.title}
                      </p>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold shrink-0 ${
                          n.priority === 'URGENT'
                            ? 'bg-rose-100 text-rose-700'
                            : n.priority === 'HIGH'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {n.priority}
                      </span>
                    </div>
                    <p className="text-gray-500 text-[11px] mt-1 line-clamp-2">{n.message}</p>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-100 text-[10px] text-gray-400">
                      <span>{n.timeAgo || n.createdAt}</span>
                      {n.actionLabel && (
                        <span className="text-indigo-600 font-semibold flex items-center gap-0.5">
                          {n.actionLabel}
                          <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                <Link
                  href="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  View Notification Center →
                </Link>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100 transition-colors"
            >
              <Avatar
                src={user.avatar}
                alt={user.name}
                fallback={user.name}
                className="h-8 w-8 ring-1 ring-gray-200"
              />
              <div className="hidden text-left md:block">
                <p className="text-xs font-semibold text-gray-900 leading-tight">
                  {user.name}
                </p>
                <p className="text-[11px] text-gray-500 leading-tight">
                  {user.role}
                </p>
              </div>
              <ChevronDown className="hidden h-3.5 w-3.5 text-gray-400 md:block" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
                <div className="border-b border-gray-100 px-3 py-2">
                  <p className="text-xs font-semibold text-gray-900">{user.name}</p>
                  <p className="text-[11px] text-gray-500">{user.email}</p>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
                    <Building className="h-3 w-3" />
                    <span>{user.organizationName || 'Adversoft Media'}</span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      router.push('/settings');
                    }}
                    className="flex w-full items-center px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    Account Settings
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      router.push('/portal');
                    }}
                    className="flex w-full items-center px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    Client Portal View
                  </button>
                </div>

                <div className="border-t border-gray-100 pt-1">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-md font-medium"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => router.push('/login')}
            className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Sign In
          </button>
        )}
      </div>

      {/* Omni-Search Global Command Palette */}
      <GlobalSearchDialog isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}