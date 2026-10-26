"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import {
  History,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Info,
  Search,
  Filter,
  Download,
  ExternalLink,
  Copy,
  CheckCircle2,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  PlusCircle,
  Eye,
  FileCode,
  RefreshCw,
  X,
  Clock,
  Layers,
  MapPin,
  Users as UsersIcon,
  Receipt,
  FileText,
  Wrench,
  Palette,
  Terminal,
} from 'lucide-react';
import {
  getStoredAuditLogs,
  logAuditEvent,
  getAuditStats,
  exportAuditLogsJson,
  exportAuditLogsCsv,
  AuditLogEntry,
  AuditSeverity,
  AuditEntityType,
  AuditStats,
} from '@/lib/data/audit-search-store';

export default function AuditLogsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<AuditStats>({
    totalEvents: 0,
    criticalCount: 0,
    warningCount: 0,
    noticeCount: 0,
    infoCount: 0,
    uniqueActorsCount: 0,
    last24hCount: 0,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<AuditSeverity | 'ALL'>('ALL');
  const [entityFilter, setEntityFilter] = useState<AuditEntityType | 'ALL'>('ALL');

  // Modals
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  // New simulated event form state
  const [simAction, setSimAction] = useState('RATE_OVERRIDDEN');
  const [simEntity, setSimEntity] = useState<AuditEntityType>('BILLBOARD');
  const [simEntityId, setSimEntityId] = useState('BB-103');
  const [simEntityTitle, setSimEntityTitle] = useState('Silicon Valley Tech Express (BB-103)');
  const [simSeverity, setSimSeverity] = useState<AuditSeverity>('WARNING');
  const [simDescription, setSimDescription] = useState('Overrode peak digital spot CPM rate due to high seasonal demand.');
  const [simOldVal, setSimOldVal] = useState('$19,500/mo');
  const [simNewVal, setSimNewVal] = useState('$22,000/mo');

  const refreshData = () => {
    const list = getStoredAuditLogs();
    setLogs(list);
    setStats(getAuditStats());
  };

  useEffect(() => {
    refreshData();
    const handleUpdate = () => refreshData();
    window.addEventListener('adversoft_audit_logged', handleUpdate);
    return () => window.removeEventListener('adversoft_audit_logged', handleUpdate);
  }, []);

  // Filtered log items
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (severityFilter !== 'ALL' && log.severity !== severityFilter) {
        return false;
      }
      if (entityFilter !== 'ALL' && log.entityType !== entityFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          log.id.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          log.actionLabel.toLowerCase().includes(q) ||
          log.actor.name.toLowerCase().includes(q) ||
          log.actor.email.toLowerCase().includes(q) ||
          log.actor.ipAddress.toLowerCase().includes(q) ||
          log.entityId.toLowerCase().includes(q) ||
          log.entityTitle.toLowerCase().includes(q) ||
          log.description.toLowerCase().includes(q) ||
          log.hash.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [logs, severityFilter, entityFilter, searchQuery]);

  const handleExportJson = () => {
    const jsonStr = exportAuditLogsJson(filteredLogs);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adversoft-audit-logs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Audit Log Exported', `Exported ${filteredLogs.length} audit records in JSON format.`);
  };

  const handleExportCsv = () => {
    const csvStr = exportAuditLogsCsv(filteredLogs);
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adversoft-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Spreadsheet Exported', `Exported ${filteredLogs.length} audit records in CSV format.`);
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
    toast.info('Hash Copied', 'Cryptographic SHA-256 verification hash copied to clipboard.');
  };

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const actor = {
      id: user?.id || 'usr_super',
      name: user?.name || 'Alex Vance',
      email: user?.email || 'alex@adversoft.com',
      role: user?.role || 'Super Admin',
      avatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      ipAddress: '198.51.100.24',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Adversoft-Admin/2.4',
    };

    const diff =
      simOldVal && simNewVal
        ? [
            {
              field: 'value',
              label: 'Adjusted Configuration',
              oldValue: simOldVal,
              newValue: simNewVal,
            },
          ]
        : undefined;

    logAuditEvent({
      actor,
      action: simAction,
      actionLabel: simAction.replace(/_/g, ' '),
      entityType: simEntity,
      entityId: simEntityId,
      entityTitle: simEntityTitle,
      routeLink: getEntityRoute(simEntity),
      severity: simSeverity,
      description: simDescription,
      diff,
      metadata: { simulatedVia: 'Audit Control Panel', timestamp: new Date().toISOString() },
    });

    setShowSimulateModal(false);
    refreshData();
    toast.success('Audit Event Logged', `Recorded ${simAction} on ${simEntityId} in immutable audit trail.`);
  };

  const getEntityRoute = (type: AuditEntityType) => {
    switch (type) {
      case 'BILLBOARD':
        return '/billboards';
      case 'CAMPAIGN':
        return '/campaigns';
      case 'CLIENT':
        return '/crm';
      case 'CONTRACT':
        return '/contracts';
      case 'INVOICE':
      case 'PAYMENT':
        return '/invoices';
      case 'WORK_ORDER':
        return '/installations';
      case 'ARTWORK':
        return '/artwork';
      case 'USER_ROLE':
        return '/team';
      default:
        return '/settings';
    }
  };

  const getSeverityBadge = (sev: AuditSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
            <ShieldAlert className="h-3 w-3 text-rose-600" />
            CRITICAL
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
            <AlertTriangle className="h-3 w-3 text-amber-600" />
            WARNING
          </span>
        );
      case 'NOTICE':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
            <Info className="h-3 w-3 text-blue-600" />
            NOTICE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-700 border border-gray-200">
            <ShieldCheck className="h-3 w-3 text-gray-500" />
            INFO
          </span>
        );
    }
  };

  const getEntityIcon = (type: AuditEntityType) => {
    switch (type) {
      case 'BILLBOARD':
        return <MapPin className="h-4 w-4 text-indigo-600" />;
      case 'CAMPAIGN':
        return <Layers className="h-4 w-4 text-emerald-600" />;
      case 'CLIENT':
        return <UsersIcon className="h-4 w-4 text-purple-600" />;
      case 'CONTRACT':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'INVOICE':
      case 'PAYMENT':
        return <Receipt className="h-4 w-4 text-amber-600" />;
      case 'WORK_ORDER':
        return <Wrench className="h-4 w-4 text-orange-600" />;
      case 'ARTWORK':
        return <Palette className="h-4 w-4 text-pink-600" />;
      case 'USER_ROLE':
        return <User className="h-4 w-4 text-violet-600" />;
      default:
        return <Terminal className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-xs">
              <History className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  System Audit & Activity Logs
                </h1>
                <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 border border-indigo-200">
                  Event Ledger
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                  <Lock className="h-3 w-3" />
                  SOC-2 Immutable
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Centralized cryptographic event ledger tracking user role elevations, rate overrides, contracts, and operational dispatches.
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowSimulateModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/80 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-xs"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Record Test Event</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-gray-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
          >
            <FileCode className="h-3.5 w-3.5 text-gray-500" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium uppercase tracking-wider">Total Audit Trail</span>
            <History className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{stats.totalEvents}</span>
            <span className="text-xs text-emerald-600 font-medium">Recorded</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-500">SOC-2 immutable chain</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium uppercase tracking-wider">Critical Alerts</span>
            <ShieldAlert className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{stats.criticalCount}</span>
            <span className="text-xs text-rose-600 font-medium">Sec Review</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-500">Privilege & circuit faults</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium uppercase tracking-wider">System Warnings</span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{stats.warningCount}</span>
            <span className="text-xs text-amber-600 font-medium">Rate / IP</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-500">Financial & network changes</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium uppercase tracking-wider">Active Actors</span>
            <User className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{stats.uniqueActorsCount}</span>
            <span className="text-xs text-purple-600 font-medium">Identities</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-500">Staff & system daemons</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium uppercase tracking-wider">Last 24 Hours</span>
            <Clock className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{stats.last24hCount}</span>
            <span className="text-xs text-emerald-600 font-medium">Events</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-500">Real-time velocity</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by actor, action code, entity title, IP, or hash..."
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50/70 pl-9 pr-8 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Severity Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 hidden lg:inline font-medium">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="WARNING">Warning</option>
              <option value="NOTICE">Notice</option>
              <option value="INFO">Info</option>
            </select>
          </div>

          {/* Entity Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 hidden lg:inline font-medium">Entity:</span>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value as any)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Entities</option>
              <option value="BILLBOARD">Billboards</option>
              <option value="CAMPAIGN">Campaigns</option>
              <option value="CLIENT">Clients</option>
              <option value="CONTRACT">Contracts</option>
              <option value="INVOICE">Invoices</option>
              <option value="PAYMENT">Payments</option>
              <option value="WORK_ORDER">Work Orders</option>
              <option value="ARTWORK">Artwork Approvals</option>
              <option value="USER_ROLE">User Roles & Security</option>
              <option value="SYSTEM">System & Webhooks</option>
            </select>
          </div>

          {(severityFilter !== 'ALL' || entityFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSeverityFilter('ALL');
                setEntityFilter('ALL');
                setSearchQuery('');
              }}
              className="h-9 px-3 rounded-lg border border-gray-200 bg-gray-50 text-xs font-medium text-gray-600 hover:bg-gray-100"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Audit Log Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50/70 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
              Audit Event Ledger
            </span>
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-200">
              {filteredLogs.length} Records
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Telemetry Connected</span>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center">
            <History className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm font-semibold text-gray-900">No audit events match your filter</p>
            <p className="mt-1 text-xs text-gray-500">
              Adjust your search keywords or reset the severity and entity dropdowns.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50/50 text-[11px] font-medium uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3">Timestamp / Actor</th>
                  <th className="px-4 py-3">Action & Entity</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Audit Summary</th>
                  <th className="px-4 py-3 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-normal text-gray-700">
                {filteredLogs.map((log) => {
                  const dateObj = new Date(log.timestamp);
                  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const formattedDate = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50/80 transition-colors group"
                    >
                      {/* Timestamp & Actor */}
                      <td className="px-4 py-3.5 align-top">
                        <div className="flex items-start gap-2.5">
                          <img
                            src={log.actor.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                            alt={log.actor.name}
                            className="h-8 w-8 rounded-full border border-gray-200 object-cover shrink-0 mt-0.5"
                          />
                          <div>
                            <div className="font-semibold text-gray-900 text-xs">
                              {log.actor.name}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              {log.actor.role} • {log.actor.ipAddress}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              {formattedDate} at {formattedTime}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Action & Entity */}
                      <td className="px-4 py-3.5 align-top">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gray-100 border border-gray-200">
                            {getEntityIcon(log.entityType)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {log.actionLabel}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {log.routeLink ? (
                                <Link
                                  href={log.routeLink}
                                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-0.5"
                                >
                                  <span>{log.entityTitle}</span>
                                  <ExternalLink className="h-2.5 w-2.5 inline" />
                                </Link>
                              ) : (
                                <span className="text-[11px] text-gray-600">{log.entityTitle}</span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-gray-400">
                              {log.action}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Severity */}
                      <td className="px-4 py-3.5 align-top">
                        {getSeverityBadge(log.severity)}
                      </td>

                      {/* Description & Diff preview */}
                      <td className="px-4 py-3.5 align-top max-w-md">
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {log.description}
                        </p>
                        {log.diff && log.diff.length > 0 && (
                          <div className="mt-1.5 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 border border-amber-200">
                              <Sparkles className="h-2.5 w-2.5" />
                              {log.diff.length} Field Modification{log.diff.length > 1 ? 's' : ''}
                            </span>
                            <span className="text-[11px] text-gray-500">
                              {log.diff[0].label}: <span className="line-through text-rose-600">{log.diff[0].oldValue}</span> → <span className="font-semibold text-emerald-700">{log.diff[0].newValue}</span>
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Actions & Verification */}
                      <td className="px-4 py-3.5 align-top text-right whitespace-nowrap">
                        <div className="flex flex-col items-end gap-1.5">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-xs"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Inspect Diff</span>
                          </button>
                          <span
                            title={log.hash}
                            className="text-[10px] font-mono text-gray-400 hover:text-gray-600 cursor-pointer flex items-center gap-1"
                            onClick={() => handleCopyHash(log.hash)}
                          >
                            <Lock className="h-2.5 w-2.5 text-emerald-600" />
                            {log.hash.substring(0, 16)}...
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Diff & Verification Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
          <div
            className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50/70">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Audit Event Inspection #{selectedLog.id}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Cryptographically signed immutable event record
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs sm:text-sm">
              {/* Event Metadata Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3.5">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-gray-400">Action Code</span>
                  <p className="font-mono font-semibold text-gray-800 text-xs mt-0.5">{selectedLog.action}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-gray-400">Severity</span>
                  <div className="mt-0.5">{getSeverityBadge(selectedLog.severity)}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-gray-400">Entity Type</span>
                  <p className="font-semibold text-gray-800 text-xs mt-0.5">{selectedLog.entityType}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-gray-400">Timestamp (UTC)</span>
                  <p className="font-mono text-gray-800 text-[11px] mt-0.5">
                    {new Date(selectedLog.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
                  </p>
                </div>
              </div>

              {/* Actor Details */}
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Authenticated Actor & Origin
                </h4>
                <div className="flex items-center gap-3">
                  <img
                    src={selectedLog.actor.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={selectedLog.actor.name}
                    className="h-10 w-10 rounded-full border border-gray-200 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900">{selectedLog.actor.name}</p>
                    <p className="text-xs text-gray-500">{selectedLog.actor.email} • {selectedLog.actor.role}</p>
                    <p className="text-[11px] font-mono text-gray-400 mt-0.5">
                      IP: {selectedLog.actor.ipAddress} {selectedLog.actor.userAgent && `• ${selectedLog.actor.userAgent}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description & Target Entity */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Target Entity & Event Description
                </h4>
                <div className="rounded-xl border border-gray-200 bg-white p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">{selectedLog.entityTitle}</span>
                    <span className="font-mono text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      ID: {selectedLog.entityId}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{selectedLog.description}</p>
                  {selectedLog.routeLink && (
                    <div className="pt-1">
                      <Link
                        href={selectedLog.routeLink}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        <span>Jump to Module ({selectedLog.routeLink})</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Field Diff Section */}
              {selectedLog.diff && selectedLog.diff.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    State Change Diff (Before vs. After)
                  </h4>
                  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-gray-200 bg-gray-50 text-[11px] text-gray-500 font-medium">
                        <tr>
                          <th className="px-3.5 py-2">Parameter / Field</th>
                          <th className="px-3.5 py-2">Prior Value</th>
                          <th className="px-3.5 py-2">Modified Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-mono">
                        {selectedLog.diff.map((d, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="px-3.5 py-2.5 font-sans font-medium text-gray-800">
                              {d.label}
                              <span className="block text-[10px] text-gray-400 font-mono">{d.field}</span>
                            </td>
                            <td className="px-3.5 py-2.5 text-rose-600 bg-rose-50/40">
                              <span className="line-through">{String(d.oldValue)}</span>
                            </td>
                            <td className="px-3.5 py-2.5 text-emerald-700 bg-emerald-50/40 font-semibold">
                              {String(d.newValue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Cryptographic Hash Verification */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-600 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-emerald-600" />
                    Cryptographic Integrity Signature
                  </span>
                  <button
                    onClick={() => handleCopyHash(selectedLog.hash)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    {copiedHash ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedHash ? 'Copied' : 'Copy Signature'}</span>
                  </button>
                </div>
                <p className="font-mono text-[11px] text-gray-700 break-all bg-white p-2 rounded-lg border border-gray-200">
                  {selectedLog.hash}
                </p>
                <p className="text-[10px] text-gray-500">
                  Certified immutable via continuous forward ledger hashing. Tampering invalidates the signature chain.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Simulated Event Modal */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50/70">
              <div className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-bold text-gray-900">
                  Record Administrative Audit Event
                </h3>
              </div>
              <button
                onClick={() => setShowSimulateModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSimulateSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Action Code
                </label>
                <select
                  value={simAction}
                  onChange={(e) => setSimAction(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                >
                  <option value="RATE_OVERRIDDEN">RATE_OVERRIDDEN (Pricing Base Rate Modified)</option>
                  <option value="ROLE_ELEVATED">ROLE_ELEVATED (RBAC Permission Elevation)</option>
                  <option value="CONTRACT_SIGNED">CONTRACT_SIGNED (Master Agreement Sign-off)</option>
                  <option value="PROOF_APPROVED">PROOF_APPROVED (Creative Artwork Approved)</option>
                  <option value="SAFETY_INSPECTION_LOGGED">SAFETY_INSPECTION_LOGGED (Catwalk Structural Sign-off)</option>
                  <option value="IP_WHITELIST_MODIFIED">IP_WHITELIST_MODIFIED (Security Firewall CIDR)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Entity Type
                  </label>
                  <select
                    value={simEntity}
                    onChange={(e) => setSimEntity(e.target.value as any)}
                    className="w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="BILLBOARD">BILLBOARD</option>
                    <option value="CAMPAIGN">CAMPAIGN</option>
                    <option value="CLIENT">CLIENT</option>
                    <option value="CONTRACT">CONTRACT</option>
                    <option value="INVOICE">INVOICE</option>
                    <option value="WORK_ORDER">WORK_ORDER</option>
                    <option value="ARTWORK">ARTWORK</option>
                    <option value="USER_ROLE">USER_ROLE</option>
                    <option value="SECURITY">SECURITY</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Severity
                  </label>
                  <select
                    value={simSeverity}
                    onChange={(e) => setSimSeverity(e.target.value as any)}
                    className="w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="INFO">INFO</option>
                    <option value="NOTICE">NOTICE</option>
                    <option value="WARNING">WARNING</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Entity ID
                  </label>
                  <input
                    type="text"
                    value={simEntityId}
                    onChange={(e) => setSimEntityId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Entity Title
                  </label>
                  <input
                    type="text"
                    value={simEntityTitle}
                    onChange={(e) => setSimEntityTitle(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Description / Justification
                </label>
                <textarea
                  rows={2}
                  value={simDescription}
                  onChange={(e) => setSimDescription(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Prior State (Old Value)
                  </label>
                  <input
                    type="text"
                    value={simOldVal}
                    onChange={(e) => setSimOldVal(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    New State (Modified Value)
                  </label>
                  <input
                    type="text"
                    value={simNewVal}
                    onChange={(e) => setSimNewVal(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Commit to Audit Trail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
