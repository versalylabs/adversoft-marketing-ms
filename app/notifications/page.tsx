"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/protectedRoute';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import {
  NotificationItem,
  NotificationCategory,
  NotificationPriority,
  AutomationRule,
  TransactionalEmailLog,
  getStoredNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  dispatchNotification,
  getStoredAutomationRules,
  toggleAutomationRule,
  triggerAutomationRuleExecution,
  getStoredTransactionalEmails,
  getNotificationMetrics,
} from '@/lib/data/notifications-store';
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  Mail,
  Zap,
  Sparkles,
  Search,
  Filter,
  Check,
  Trash2,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Send,
  Eye,
  RefreshCw,
  SlidersHorizontal,
  X,
  FileText,
  Calendar,
  Layers,
  Wrench,
  Palette,
  CheckSquare,
} from 'lucide-react';

const CATEGORY_CONFIG: Record<
  NotificationCategory,
  { label: string; icon: React.ComponentType<{ className?: string }>; bg: string; text: string }
> = {
  BOOKING: { label: 'Bookings', icon: Calendar, bg: 'bg-blue-50', text: 'text-blue-700' },
  ARTWORK: { label: 'Artwork & Proofs', icon: Palette, bg: 'bg-purple-50', text: 'text-purple-700' },
  INSTALLATION: { label: 'Field Rigging', icon: Wrench, bg: 'bg-indigo-50', text: 'text-indigo-700' },
  MAINTENANCE: { label: 'Maintenance', icon: AlertTriangle, bg: 'bg-amber-50', text: 'text-amber-700' },
  INVOICE: { label: 'Billing & AR', icon: Receipt, bg: 'bg-emerald-50', text: 'text-emerald-700' },
  CONTRACT: { label: 'Legal Agreements', icon: FileText, bg: 'bg-sky-50', text: 'text-sky-700' },
  SYSTEM: { label: 'System & Engine', icon: Zap, bg: 'bg-gray-100', text: 'text-gray-700' },
};

const PRIORITY_BADGES: Record<NotificationPriority, string> = {
  URGENT: 'bg-rose-50 text-rose-700 border-rose-200 font-bold animate-pulse',
  HIGH: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold',
  MEDIUM: 'bg-blue-50 text-blue-700 border-blue-200 font-medium',
  LOW: 'bg-gray-50 text-gray-600 border-gray-200',
};

type ViewTab = 'inbox' | 'automation' | 'emails';

export default function NotificationsCenterPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<ViewTab>('inbox');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [emails, setEmails] = useState<TransactionalEmailLog[]>([]);

  // Filter state for inbox
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory | 'ALL'>('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | 'ALL'>('ALL');

  // Modals
  const [emailToInspect, setEmailToInspect] = useState<TransactionalEmailLog | null>(null);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [simulateTitle, setSimulateTitle] = useState('Campaign Flight Milestone Reached');
  const [simulateMessage, setSimulateMessage] = useState('Times Square Spectacle LED reached 1,000,000 verified impressions.');
  const [simulateCategory, setSimulateCategory] = useState<NotificationCategory>('BOOKING');
  const [simulatePriority, setSimulatePriority] = useState<NotificationPriority>('HIGH');

  // Load data
  const loadData = () => {
    setNotifications(getStoredNotifications());
    setRules(getStoredAutomationRules());
    setEmails(getStoredTransactionalEmails());
  };

  useEffect(() => {
    loadData();
    const handleNotifUpdate = () => setNotifications(getStoredNotifications());
    const handleRulesUpdate = () => setRules(getStoredAutomationRules());
    const handleEmailsUpdate = () => setEmails(getStoredTransactionalEmails());

    window.addEventListener('adversoft_notifications_updated', handleNotifUpdate);
    window.addEventListener('adversoft_automation_rules_updated', handleRulesUpdate);
    window.addEventListener('adversoft_emails_updated', handleEmailsUpdate);

    return () => {
      window.removeEventListener('adversoft_notifications_updated', handleNotifUpdate);
      window.removeEventListener('adversoft_automation_rules_updated', handleRulesUpdate);
      window.removeEventListener('adversoft_emails_updated', handleEmailsUpdate);
    };
  }, []);

  const metrics = useMemo(() => getNotificationMetrics(), [notifications, rules, emails]);

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (categoryFilter !== 'ALL' && n.category !== categoryFilter) return false;
      if (unreadOnly && n.isRead) return false;
      if (priorityFilter !== 'ALL' && n.priority !== priorityFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = n.title.toLowerCase().includes(q);
        const matchesMsg = n.message.toLowerCase().includes(q);
        const matchesCat = n.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMsg && !matchesCat) return false;
      }
      return true;
    });
  }, [notifications, categoryFilter, unreadOnly, priorityFilter, searchQuery]);

  // Actions
  const handleMarkRead = (id: string) => {
    const updated = markAsRead(id);
    setNotifications(updated);
  };

  const handleMarkAllRead = () => {
    const updated = markAllAsRead();
    setNotifications(updated);
    toast.success('All Notifications Read', 'All alerts have been marked as read.');
  };

  const handleDelete = (id: string) => {
    const updated = deleteNotification(id);
    setNotifications(updated);
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all notifications?')) {
      const updated = clearAllNotifications();
      setNotifications(updated);
      toast.info('Notifications Cleared', 'All notification items have been purged.');
    }
  };

  const handleToggleRule = (ruleId: string, ruleName: string) => {
    const updated = toggleAutomationRule(ruleId);
    setRules(updated);
    const rule = updated.find((r) => r.id === ruleId);
    if (rule?.isEnabled) {
      toast.success('Automation Rule Activated', `"${ruleName}" is now active and monitoring events.`);
    } else {
      toast.info('Automation Rule Disabled', `"${ruleName}" has been paused.`);
    }
  };

  const handleExecuteRuleTrigger = (ruleId: string) => {
    const result = triggerAutomationRuleExecution(ruleId);
    if (result.success) {
      toast.success(
        'Automation Event Executed',
        `Dispatched alert and transactional email for "${result.rule?.name}".`
      );
      loadData();
    }
  };

  const handleCreateCustomAlert = (e: React.FormEvent) => {
    e.preventDefault();
    dispatchNotification({
      title: simulateTitle,
      message: simulateMessage,
      category: simulateCategory,
      priority: simulatePriority,
      actionUrl: '/campaigns',
      actionLabel: 'Inspect Flight Workspace',
    });
    toast.success('Alert Dispatched', 'Real-time notification emitted across the application.');
    setIsSimulateModalOpen(false);
    loadData();
  };

  return (
    <ProtectedRoute requiredPermission="dashboard:view">
      <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                Event Automation
              </span>
              <span className="text-xs text-gray-500">• Event Triggers & Transactional Dispatch</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              <Bell className="w-8 h-8 text-indigo-600" />
              Notifications & Automation Hub
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Centralized alert feed, business rule automations, client transactional email delivery, and dunning workflows.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsSimulateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Emit Custom Alert
            </button>
            {metrics.unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"
              >
                <CheckSquare className="w-4 h-4" />
                Mark All Read ({metrics.unread})
              </button>
            )}
          </div>
        </div>

        {/* Executive KPI Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Unread Alerts</span>
              <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                <Bell className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-gray-900">{metrics.unread} Pending</span>
              <p className="text-xs text-gray-500 mt-1">{metrics.total} total recorded alerts</p>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Urgent SLA Alerts</span>
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-amber-600">{metrics.urgentCount} Critical</span>
              <p className="text-xs text-gray-500 mt-1">Requires immediate operator sign-off</p>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Active Automations</span>
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Zap className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-indigo-600">
                {metrics.activeRulesCount} of {metrics.totalRulesCount} Active
              </span>
              <p className="text-xs text-gray-500 mt-1">Event-driven triggers monitoring pipeline</p>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Emails Delivered</span>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Mail className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-emerald-600">{metrics.emailsSent} Sent</span>
              <p className="text-xs text-gray-500 mt-1">100% transactional delivery success</p>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Client Open Rate</span>
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Eye className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-blue-600">{metrics.openRatePercent}%</span>
              <p className="text-xs text-gray-500 mt-1">{metrics.emailsOpened} opened by advertiser contacts</p>
            </div>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-gray-200 space-x-2 sm:space-x-4">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'inbox'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>In-App Alert Feed</span>
            {metrics.unread > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700">
                {metrics.unread}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('automation')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'automation'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Event Automation Triggers</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] bg-gray-100 text-gray-700">
              {rules.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('emails')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'emails'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Transactional Email Ledger</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] bg-gray-100 text-gray-700">
              {emails.length}
            </span>
          </button>
        </div>

        {/* -------------------------------------------------------------
            TAB 1: IN-APP ALERT FEED (INBOX)
        -------------------------------------------------------------- */}
        {activeTab === 'inbox' && (
          <div className="space-y-6">
            {/* Filter Controls Ribbon */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search notifications by title, content, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as NotificationCategory | 'ALL')}
                  className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="ALL">All Categories</option>
                  <option value="INVOICE">Billing & AR</option>
                  <option value="BOOKING">Bookings</option>
                  <option value="ARTWORK">Artwork & Proofs</option>
                  <option value="INSTALLATION">Field Rigging</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="CONTRACT">Contracts</option>
                  <option value="SYSTEM">System</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as NotificationPriority | 'ALL')}
                  className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="URGENT">Urgent SLA</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>

                <button
                  onClick={() => setUnreadOnly(!unreadOnly)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    unreadOnly
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Unread Only
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>
                  Showing <strong className="text-gray-900">{filteredNotifications.length}</strong> of{' '}
                  <strong className="text-gray-900">{notifications.length}</strong>
                </span>
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    title="Clear All Notifications"
                    className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-white border border-gray-200 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={loadData}
                  title="Refresh Notifications"
                  className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-white border border-gray-200 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Notification Cards List */}
            {filteredNotifications.length === 0 ? (
              <Card className="p-12 text-center bg-white border border-gray-100 shadow-sm rounded-xl">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-gray-900">No Notifications Found</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  You are all caught up! No active or matching alerts for the specified filters.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notif) => {
                  const catMeta = CATEGORY_CONFIG[notif.category] || CATEGORY_CONFIG.SYSTEM;
                  const CatIcon = catMeta.icon;

                  return (
                    <Card
                      key={notif.id}
                      className={`p-5 bg-white border rounded-2xl shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        !notif.isRead
                          ? 'border-indigo-100/90 bg-indigo-50/20'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${catMeta.bg} ${catMeta.text}`}
                        >
                          <CatIcon className="w-5 h-5" />
                        </div>

                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3
                              className={`text-sm font-bold ${
                                !notif.isRead ? 'text-gray-900' : 'text-gray-700'
                              }`}
                            >
                              {notif.title}
                            </h3>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md border ${
                                PRIORITY_BADGES[notif.priority]
                              }`}
                            >
                              {notif.priority}
                            </span>
                            <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              {catMeta.label}
                            </span>
                          </div>

                          <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
                            {notif.message}
                          </p>

                          <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {notif.timeAgo || notif.createdAt}
                            </span>
                            {notif.recipientRole && (
                              <span>Target: {notif.recipientRole}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {notif.actionUrl && (
                          <Link
                            href={notif.actionUrl}
                            onClick={() => handleMarkRead(notif.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                          >
                            <span>{notif.actionLabel || 'Inspect'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}

                        {!notif.isRead && (
                          <button
                            onClick={() => handleMarkRead(notif.id)}
                            title="Mark as read"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(notif.id)}
                          title="Delete notification"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 2: EVENT AUTOMATION TRIGGERS & RULES
        -------------------------------------------------------------- */}
        {activeTab === 'automation' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-600" />
                Automated Event Triggers & Business Pipeline Rules
              </h2>
              <p className="text-xs text-gray-500">
                When business state transitions happen (invoice overdue, proof approved, rigging photos verified), these rules automatically trigger in-app alerts and transactional emails.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rules.map((rule) => (
                <Card
                  key={rule.id}
                  className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            rule.isEnabled
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {rule.isEnabled ? 'MONITORING ACTIVE' : 'RULE PAUSED'}
                        </span>
                        <h3 className="text-base font-bold text-gray-900 mt-2">{rule.name}</h3>
                      </div>

                      {/* Custom Toggle Switch */}
                      <button
                        onClick={() => handleToggleRule(rule.id, rule.name)}
                        className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                          rule.isEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                        }`}
                        title={rule.isEnabled ? 'Disable rule' : 'Enable rule'}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            rule.isEnabled ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed">{rule.description}</p>

                    <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-gray-50/75 border border-gray-100 text-xs">
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                          Event Trigger
                        </span>
                        <span className="font-mono text-gray-900 font-medium text-[11px]">
                          {rule.eventTrigger}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                          Delivery Channel
                        </span>
                        <span className="font-semibold text-indigo-700">{rule.channel}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                          Target Recipient
                        </span>
                        <span className="font-medium text-gray-800">{rule.targetRole}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                          Total Executions
                        </span>
                        <span className="font-bold text-emerald-700">
                          {rule.executionCount} Dispatches
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-400">
                      Last Trigger: {rule.lastTriggeredAt || 'Not fired yet'}
                    </span>
                    <button
                      onClick={() => handleExecuteRuleTrigger(rule.id)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Test Fire Trigger
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 3: TRANSACTIONAL EMAIL DISPATCH LEDGER
        -------------------------------------------------------------- */}
        {activeTab === 'emails' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-indigo-600" />
                  Transactional Email Delivery Ledger
                </h2>
                <p className="text-xs text-gray-500">
                  Audit trail of client emails sent by automated triggers (overdue statements, proof notifications, verified POPs, and receipts).
                </p>
              </div>
            </div>

            <Card className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Email ID & Template</th>
                      <th className="py-3 px-4">Recipient</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Sent At</th>
                      <th className="py-3 px-4">Delivery Status</th>
                      <th className="py-3 px-4 text-right">Preview</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {emails.map((eml) => (
                      <tr key={eml.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-gray-900 text-xs">
                            {eml.emailNumber}
                          </div>
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700">
                            {eml.template}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-bold text-gray-900">{eml.recipientName}</div>
                          <div className="text-gray-500 font-mono mt-0.5">{eml.to}</div>
                        </td>

                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-medium text-gray-900 max-w-md line-clamp-1">
                            {eml.subject}
                          </div>
                          <p className="text-gray-500 text-[11px] line-clamp-1 mt-0.5">
                            {eml.bodySnippet}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 text-xs text-gray-600 font-medium whitespace-nowrap">
                          {eml.sentAt}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              eml.status === 'OPENED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {eml.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setEmailToInspect(eml)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Preview Email HTML"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
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
            MODAL: SIMULATE CUSTOM ALERT DISPATCH
        -------------------------------------------------------------- */}
        {isSimulateModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Emit Custom System Alert</h3>
                    <p className="text-xs text-gray-500">
                      Dispatches an automated in-app alert into the notification store.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSimulateModalOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCustomAlert} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Alert Title *
                  </label>
                  <input
                    type="text"
                    value={simulateTitle}
                    onChange={(e) => setSimulateTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                    <select
                      value={simulateCategory}
                      onChange={(e) => setSimulateCategory(e.target.value as NotificationCategory)}
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none"
                    >
                      <option value="BOOKING">Bookings</option>
                      <option value="ARTWORK">Artwork & Proofs</option>
                      <option value="INSTALLATION">Field Rigging</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="INVOICE">Billing & AR</option>
                      <option value="CONTRACT">Legal Contracts</option>
                      <option value="SYSTEM">System Alert</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
                    <select
                      value={simulatePriority}
                      onChange={(e) => setSimulatePriority(e.target.value as NotificationPriority)}
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none"
                    >
                      <option value="URGENT">Urgent SLA</option>
                      <option value="HIGH">High Priority</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Message Description *
                  </label>
                  <textarea
                    rows={3}
                    value={simulateMessage}
                    onChange={(e) => setSimulateMessage(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSimulateModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm"
                  >
                    Emit Real-time Alert
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            MODAL: TRANSACTIONAL EMAIL PREVIEW
        -------------------------------------------------------------- */}
        {emailToInspect && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <Badge className="bg-indigo-50 text-indigo-700 mb-1">
                    {emailToInspect.template}
                  </Badge>
                  <h3 className="text-base font-bold text-gray-900">{emailToInspect.subject}</h3>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    To: {emailToInspect.to} • Sent on {emailToInspect.sentAt}
                  </p>
                </div>
                <button
                  onClick={() => setEmailToInspect(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Render HTML Body in container */}
              <div
                className="p-4 rounded-xl bg-gray-50 border border-gray-100"
                dangerouslySetInnerHTML={{ __html: emailToInspect.bodyHtml }}
              />

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Delivery Status: <strong className="text-emerald-700">{emailToInspect.status}</strong>
                </span>
                <button
                  onClick={() => setEmailToInspect(null)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
