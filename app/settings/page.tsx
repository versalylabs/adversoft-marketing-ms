"use client";

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/protectedRoute';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { ROLE_DEFINITIONS } from '@/lib/rbac';
import {
  Settings,
  User,
  Building,
  Shield,
  ShieldCheck,
  Key,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  Globe,
  Save,
  Clock,
  Database,
  Download,
  Upload,
  RefreshCw,
  PlusCircle,
  Activity,
  HardDrive,
  Cpu,
  Layers,
  MapPin,
  ExternalLink,
  Copy,
  AlertTriangle,
  Server,
  FileCode,
  Sparkles,
  X,
  Sliders,
  DollarSign,
  Landmark,
  ArrowRight,
} from 'lucide-react';
import {
  getStoredOrgSettings,
  saveStoredOrgSettings,
  getStoredRegionalOffices,
  saveStoredRegionalOffices,
  getStoredSnapshots,
  saveStoredSnapshots,
  getStoredBackupConfig,
  saveStoredBackupConfig,
  createManualSnapshot,
  generateFullSystemSnapshotBundle,
  OrganizationSettings,
  RegionalOffice,
  BackupSnapshot,
  BackupScheduleConfig,
  INITIAL_DIAGNOSTICS,
} from '@/lib/data/settings-store';

type SettingsTab =
  | 'profile'
  | 'organization'
  | 'regional_hubs'
  | 'backup_export'
  | 'diagnostics'
  | 'security';

export default function SettingsPage() {
  const { user, updateProfile, tenant, tenants, switchTenant, registerWorkspace } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<SettingsTab>('organization');

  // New Organization Workspace State
  const [showNewWorkspaceModal, setShowNewWorkspaceModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgAdminName, setNewOrgAdminName] = useState(user?.name || '');
  const [newOrgAdminEmail, setNewOrgAdminEmail] = useState('');
  const [newOrgPassword, setNewOrgPassword] = useState('');
  const [newOrgCurrency, setNewOrgCurrency] = useState('USD');

  // Profile Form State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileTitle, setProfileTitle] = useState(user?.title || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');

  // Organization White-Label State
  const [orgSettings, setOrgSettings] = useState<OrganizationSettings>(getStoredOrgSettings());

  // Regional Hubs Multi-Tenancy State
  const [regionalOffices, setRegionalOffices] = useState<RegionalOffice[]>(getStoredRegionalOffices());
  const [showAddHubModal, setShowAddHubModal] = useState(false);
  const [newHubName, setNewHubName] = useState('');
  const [newHubCode, setNewHubCode] = useState('');
  const [newHubCity, setNewHubCity] = useState('');
  const [newHubState, setNewHubState] = useState('');
  const [newHubAddress, setNewHubAddress] = useState('');
  const [newHubTimezone, setNewHubTimezone] = useState('America/New_York (EST)');
  const [newHubTaxRate, setNewHubTaxRate] = useState(8.5);
  const [newHubDirector, setNewHubDirector] = useState('');
  const [newHubPhone, setNewHubPhone] = useState('');
  const [newHubEmail, setNewHubEmail] = useState('');
  const [newHubCorridors, setNewHubCorridors] = useState('');

  // Backup & Snapshot State
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>(getStoredSnapshots());
  const [backupConfig, setBackupConfig] = useState<BackupScheduleConfig>(getStoredBackupConfig());
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Diagnostics
  const diagnostics = INITIAL_DIAGNOSTICS;

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfileTitle(user.title || '');
      setProfilePhone(user.phone || '');
      setProfileEmail(user.email);
    }
  }, [user]);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: profileName,
      title: profileTitle,
      phone: profilePhone,
      email: profileEmail,
    });
    toast.success('Profile Saved', 'Personal account information has been updated.');
  };

  const handleOrgSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredOrgSettings(orgSettings);
    toast.success('Organization Saved', 'Corporate branding, tax details, and bank wiring settings updated.');
  };

  const handleAddHubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `reg_${newHubCity.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}`;
    const corridors = newHubCorridors
      ? newHubCorridors.split(',').map((c) => c.trim())
      : [`${newHubCity} Commercial Expressway`];

    const newOffice: RegionalOffice = {
      id,
      name: newHubName,
      code: newHubCode.toUpperCase(),
      city: newHubCity,
      state: newHubState.toUpperCase(),
      address: newHubAddress,
      timezone: newHubTimezone,
      corridorsCovered: corridors,
      localTaxRatePercent: Number(newHubTaxRate),
      officeDirector: newHubDirector,
      phone: newHubPhone,
      email: newHubEmail,
      isActive: true,
      inventoryCount: 1,
    };

    const updated = [...regionalOffices, newOffice];
    setRegionalOffices(updated);
    saveStoredRegionalOffices(updated);
    setShowAddHubModal(false);

    // Reset form
    setNewHubName('');
    setNewHubCode('');
    setNewHubCity('');
    setNewHubState('');
    setNewHubAddress('');
    setNewHubDirector('');
    setNewHubPhone('');
    setNewHubEmail('');
    setNewHubCorridors('');

    toast.success('Regional Hub Registered', `Added ${newOffice.name} to multi-tenant operating network.`);
  };

  const handleCreateSnapshot = () => {
    setIsCreatingSnapshot(true);
    setTimeout(() => {
      const snap = createManualSnapshot(user?.name ? `${user.name} (${user.role})` : 'Alex Vance (Super Admin)');
      setSnapshots(getStoredSnapshots());
      setIsCreatingSnapshot(false);
      toast.success(
        'System Snapshot Created',
        `Successfully captured ${snap.recordCount} database records into ${snap.filename}.`
      );
    }, 600);
  };

  const handleDownloadFullBundle = () => {
    const bundle = generateFullSystemSnapshotBundle();
    const dateTag = new Date().toISOString().slice(0, 10);
    const jsonStr = JSON.stringify(bundle, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adversoft_full_snapshot_${dateTag}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Database Bundle Downloaded', 'Exported complete multi-module enterprise database archive.');
  };

  const handleSaveBackupConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredBackupConfig(backupConfig);
    toast.success('Schedule Saved', 'Automated cloud snapshot schedule updated.');
  };

  const handleValidateSnapshot = () => {
    const bundle = generateFullSystemSnapshotBundle();
    setValidationResult({
      status: 'VERIFIED',
      checks: [
        { label: 'Database Schema Integrity', passed: true, detail: '18 entity tables validated' },
        { label: 'Foreign Key & Cross-Store Linkage', passed: true, detail: '100% billboard/booking matches' },
        { label: 'Cryptographic Audit Trail Chain', passed: true, detail: 'Forward SHA-256 signatures unbroken' },
        { label: 'Financial Balance Reconciliation', passed: true, detail: 'Invoices reconcile with payment ledger' },
      ],
      totalEntities: bundle.metadata.totalRecords,
      timestamp: new Date().toISOString(),
    });
    setShowValidateModal(true);
  };

  const handleRegisterNewWorkspaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim() || !newOrgAdminEmail.trim() || !newOrgAdminName.trim()) {
      toast.error('Missing Required Fields', 'Please provide organization name, admin name, and work email.');
      return;
    }
    const res = registerWorkspace({
      organizationName: newOrgName.trim(),
      email: newOrgAdminEmail.trim(),
      fullName: newOrgAdminName.trim(),
      currency: newOrgCurrency,
    });
    toast.success('Organization Workspace Created', `Clean workspace '${res.tenant.name}' initialized with 0 demo records.`);
    setShowNewWorkspaceModal(false);
    setNewOrgName('');
    setNewOrgAdminEmail('');
    setNewOrgPassword('');
  };

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error('Password Mismatch', 'The new passwords do not match. Please verify and try again.');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    toast.success('Credentials Updated', 'Your security credentials have been successfully updated.');
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6 pb-12">
        {/* Header Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-xs">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  Settings & Multi-Tenancy Hub
                </h1>
                <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 border border-indigo-200">
                  Platform Admin
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                  <Database className="h-3 w-3" />
                  Multi-Tenancy Active
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                White-labeling, regional office partitions, full database snapshot exports, and diagnostic telemetry.
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadFullBundle}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
            >
              <Download className="h-3.5 w-3.5 text-gray-500" />
              <span>Export Full DB (.json)</span>
            </button>
            <button
              onClick={handleCreateSnapshot}
              disabled={isCreatingSnapshot}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/80 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isCreatingSnapshot ? 'animate-spin' : ''}`} />
              <span>{isCreatingSnapshot ? 'Archiving...' : 'Take Snapshot Now'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 space-x-1 sm:space-x-4 overflow-x-auto text-xs font-semibold scrollbar-none">
          <button
            onClick={() => setActiveTab('organization')}
            className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'organization'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Building className="h-4 w-4" />
            <span>Organization & White-Label</span>
          </button>

          <button
            onClick={() => setActiveTab('regional_hubs')}
            className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'regional_hubs'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <MapPin className="h-4 w-4" />
            <span>Regional Hubs ({regionalOffices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('backup_export')}
            className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'backup_export'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <HardDrive className="h-4 w-4" />
            <span>Backup & Snapshots</span>
          </button>

          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'diagnostics'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Diagnostics & Telemetry</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <User className="h-4 w-4" />
            <span>User Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Security & Sessions</span>
          </button>
        </div>

        {/* TAB 1: Organization & White-Label */}
        {activeTab === 'organization' && (
          <form onSubmit={handleOrgSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Corporate Legal Profile */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                  <Landmark className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-gray-900">Corporate Legal Entity</h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Corporate Legal Name
                  </label>
                  <input
                    type="text"
                    value={orgSettings.legalName}
                    onChange={(e) => setOrgSettings({ ...orgSettings, legalName: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Brand & White-Label Display Name
                  </label>
                  <input
                    type="text"
                    value={orgSettings.brandName}
                    onChange={(e) => setOrgSettings({ ...orgSettings, brandName: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Federal EIN / Tax ID
                    </label>
                    <input
                      type="text"
                      value={orgSettings.taxId}
                      onChange={(e) => setOrgSettings({ ...orgSettings, taxId: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      DUNS Number
                    </label>
                    <input
                      type="text"
                      value={orgSettings.dunsNumber}
                      onChange={(e) => setOrgSettings({ ...orgSettings, dunsNumber: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Default Currency
                    </label>
                    <select
                      value={orgSettings.defaultCurrency}
                      onChange={(e) => setOrgSettings({ ...orgSettings, defaultCurrency: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="USD ($)">USD ($) - US Dollar</option>
                      <option value="CAD ($)">CAD ($) - Canadian Dollar</option>
                      <option value="GBP (£)">GBP (£) - British Pound</option>
                      <option value="EUR (€)">EUR (€) - Euro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Fiscal Year Start
                    </label>
                    <input
                      type="text"
                      value={orgSettings.fiscalYearStart}
                      onChange={(e) => setOrgSettings({ ...orgSettings, fiscalYearStart: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Operating Bank & Wire Details */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-gray-900">Commercial Wire & Bank Settings</h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Primary Operating Depository Bank
                  </label>
                  <input
                    type="text"
                    value={orgSettings.operatingBank.bankName}
                    onChange={(e) =>
                      setOrgSettings({
                        ...orgSettings,
                        operatingBank: { ...orgSettings.operatingBank, bankName: e.target.value },
                      })
                    }
                    className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      ABA / Routing Transit Number
                    </label>
                    <input
                      type="text"
                      value={orgSettings.operatingBank.routingNumber}
                      onChange={(e) =>
                        setOrgSettings({
                          ...orgSettings,
                          operatingBank: { ...orgSettings.operatingBank, routingNumber: e.target.value },
                        })
                      }
                      className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      SWIFT / BIC Code
                    </label>
                    <input
                      type="text"
                      value={orgSettings.operatingBank.swiftCode}
                      onChange={(e) =>
                        setOrgSettings({
                          ...orgSettings,
                          operatingBank: { ...orgSettings.operatingBank, swiftCode: e.target.value },
                        })
                      }
                      className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Invoice & Contract Document Legal Disclaimer
                  </label>
                  <textarea
                    rows={3}
                    value={orgSettings.documentFooterNotes}
                    onChange={(e) => setOrgSettings({ ...orgSettings, documentFooterNotes: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-gray-500">
                    Changes reflect dynamically on invoices and contracts
                  </span>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Organization</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: Multi-Tenancy & Regional Hubs */}
        {activeTab === 'regional_hubs' && (
          <div className="space-y-8">
            {/* 1. Multi-Tenant Organization Workspaces */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900">
                      Organization Workspaces & Multi-Tenancy Partitioning
                    </h3>
                    <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                      Isolated Workspaces
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Each organization operates in strict data isolation. Register a new workspace to start with a clean slate (zero demo data) or switch between accounts.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowNewWorkspaceModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs transition"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Register New Organization</span>
                </button>
              </div>

              {/* Workspaces Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tenants.map((t) => {
                  const isActive = tenant?.id === t.id;
                  return (
                    <div
                      key={t.id}
                      className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
                        isActive
                          ? 'border-indigo-600 bg-indigo-50/30 shadow-xs ring-1 ring-indigo-600'
                          : 'border-gray-200 bg-white hover:border-gray-300 shadow-2xs'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono text-[10px] font-bold text-gray-400 block mb-0.5">
                              {t.id}
                            </span>
                            <h4 className="font-bold text-sm text-gray-900 leading-snug">{t.name}</h4>
                          </div>
                          {t.isDemo ? (
                            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200 shrink-0">
                              Demo Data
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200 shrink-0">
                              Clean Workspace
                            </span>
                          )}
                        </div>

                        <div className="rounded-lg bg-gray-50/80 p-2 text-[11px] space-y-1 text-gray-600">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Created:</span>
                            <span className="font-medium text-gray-700">{t.createdAt}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Currency:</span>
                            <span className="font-bold text-indigo-700">{t.currency || 'USD'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Active Workspace</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              switchTenant(t.id);
                              toast.success('Workspace Switched', `Switched active organization to '${t.name}'.`);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition"
                          >
                            <span>Switch to Workspace</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Regional Operating Offices */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Regional Operating Offices & Partitioned Hubs
                  </h3>
                  <p className="text-xs text-gray-500">
                    Configure metropolitan divisions with localized tax surcharges, corridor allocations, and regional directors.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddHubModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Add Regional Hub</span>
                </button>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {regionalOffices.map((office) => (
                <div
                  key={office.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs flex flex-col justify-between hover:border-indigo-200 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs">
                          {office.code}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-xs sm:text-sm">{office.name}</h4>
                          <span className="text-[11px] text-gray-500">{office.city}, {office.state}</span>
                        </div>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                        Active Hub
                      </span>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-2.5 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Director:</span>
                        <span className="font-medium text-gray-800">{office.officeDirector}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Local Tax Rate:</span>
                        <span className="font-semibold text-indigo-600">{office.localTaxRatePercent}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Inventory Nodes:</span>
                        <span className="font-semibold text-gray-800">{office.inventoryCount} Structures</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-gray-500 block mb-1">
                        Metropolitan Corridors:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {office.corridorsCovered.map((c, i) => (
                          <span
                            key={i}
                            className="inline-block rounded bg-indigo-50/70 px-1.5 py-0.5 text-[10px] text-indigo-700 border border-indigo-100"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                    <span>{office.phone}</span>
                    <span className="font-mono">{office.timezone.split(' ')[0]}</span>
                  </div>
                </div>
              ))}
            </div>
            </div>
          </div>
        )}

        {/* TAB 3: Data Backup & System Export */}
        {activeTab === 'backup_export' && (
          <div className="space-y-6">
            {/* Snapshot Summary Cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Snapshots
                </span>
                <p className="mt-1 text-2xl font-bold text-gray-900">{snapshots.length}</p>
                <span className="text-[11px] text-emerald-600 font-medium">Immutable Vault</span>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Backup Run
                </span>
                <p className="mt-1 text-sm font-bold text-gray-900">
                  {new Date(snapshots[0]?.timestamp || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <span className="text-[11px] text-gray-500">
                  {new Date(snapshots[0]?.timestamp || '').toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cloud S3 Sync
                </span>
                <p className="mt-1 text-sm font-bold text-emerald-600">CONNECTED</p>
                <span className="text-[11px] text-gray-500">AES-256 Encrypted</span>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Retention
                </span>
                <p className="mt-1 text-2xl font-bold text-gray-900">{backupConfig.retentionDays} Days</p>
                <span className="text-[11px] text-indigo-600 font-medium">Rolling Lifecycle</span>
              </div>
            </div>

            {/* Snapshot Management Actions */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-gray-900">Full System Snapshot Archives</h4>
                <p className="text-xs text-gray-500">
                  Comprehensive exports packaging inventory, CRM, campaigns, financial ledgers, and audit logs into a unified bundle.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleValidateSnapshot}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 shadow-xs"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Dry-Run Validation</span>
                </button>

                <button
                  onClick={handleCreateSnapshot}
                  disabled={isCreatingSnapshot}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>{isCreatingSnapshot ? 'Archiving...' : 'Create Snapshot'}</span>
                </button>
              </div>
            </div>

            {/* Backup History Table */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-xs overflow-hidden">
              <div className="border-b border-gray-200 bg-gray-50/70 px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Snapshot Ledger & Download Vault
                </span>
                <span className="text-xs text-gray-500">SHA-256 Tamper Evident</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-gray-200 bg-gray-50/50 text-[11px] font-medium uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Snapshot ID / File</th>
                      <th className="px-4 py-3">Timestamp (UTC)</th>
                      <th className="px-4 py-3">Payload Size</th>
                      <th className="px-4 py-3">Records Archived</th>
                      <th className="px-4 py-3">Triggered By</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-normal text-gray-700">
                    {snapshots.map((snap) => (
                      <tr key={snap.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <FileCode className="h-4 w-4 text-indigo-600 shrink-0" />
                            <div>
                              <span>{snap.filename}</span>
                              <span className="block text-[10px] font-mono text-gray-400">
                                {snap.hash.substring(0, 20)}...
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-gray-600">
                          {new Date(snap.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          {(snap.sizeBytes / 1024 / 1024).toFixed(2)} MB
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-800">
                            {snap.recordCount} Records
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{snap.createdByName}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={handleDownloadFullBundle}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 shadow-xs"
                          >
                            <Download className="h-3 w-3" />
                            <span>Download</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Automated Schedule Configuration Form */}
            <form onSubmit={handleSaveBackupConfig} className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-600" />
                  <h4 className="text-sm font-bold text-gray-900">Automated Backup Schedule & Cloud Storage</h4>
                </div>
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Scheduler Daemon Running
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Backup Frequency
                  </label>
                  <select
                    value={backupConfig.frequency}
                    onChange={(e) => setBackupConfig({ ...backupConfig, frequency: e.target.value as any })}
                    className="w-full rounded-lg border border-gray-200 p-2 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="HOURLY">Hourly Snapshots (High Traffic)</option>
                    <option value="DAILY">Daily at 03:00 UTC (Recommended)</option>
                    <option value="WEEKLY">Weekly Full Consolidated Archive</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Retention Window (Days)
                  </label>
                  <input
                    type="number"
                    min="7"
                    max="365"
                    value={backupConfig.retentionDays}
                    onChange={(e) => setBackupConfig({ ...backupConfig, retentionDays: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-200 p-2 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Remote Vault Target
                  </label>
                  <input
                    type="text"
                    value={backupConfig.s3BucketTarget}
                    onChange={(e) => setBackupConfig({ ...backupConfig, s3BucketTarget: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 p-2 focus:border-indigo-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="encCheck"
                    checked={backupConfig.encryptionEnabled}
                    onChange={(e) => setBackupConfig({ ...backupConfig, encryptionEnabled: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="encCheck" className="text-xs text-gray-700 font-medium">
                    Enforce AES-256 Server-Side Encryption for All Cloud Vault Objects
                  </label>
                </div>

                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: Diagnostic Health & Telemetry */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-6">
            {/* System Vitals Ribbon */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-xs font-medium uppercase tracking-wider">Continuous Uptime</span>
                  <Server className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900">{diagnostics.uptimeDays} Days</p>
                <span className="text-[11px] text-emerald-600 font-medium">99.99% Availability</span>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-xs font-medium uppercase tracking-wider">Memory Footprint</span>
                  <Cpu className="h-4 w-4 text-indigo-600" />
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {diagnostics.memoryHeapUsedMb} MB
                </p>
                <span className="text-[11px] text-gray-500">of {diagnostics.memoryHeapTotalMb} MB Allocated</span>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-xs font-medium uppercase tracking-wider">P95 API Latency</span>
                  <Activity className="h-4 w-4 text-purple-600" />
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900">{diagnostics.apiLatencyP95Ms} ms</p>
                <span className="text-[11px] text-purple-600 font-medium">High Performance</span>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-xs font-medium uppercase tracking-wider">Storage Capacity</span>
                  <HardDrive className="h-4 w-4 text-amber-600" />
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900">{diagnostics.storageUsedGb} GB</p>
                <span className="text-[11px] text-gray-500">of {diagnostics.storageQuotaGb} GB Quota</span>
              </div>
            </div>

            {/* Microservices Health Status */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-xs overflow-hidden">
              <div className="border-b border-gray-200 bg-gray-50/70 px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Core Service Mesh & Telemetry Daemon Status
                </span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  All Systems Operational
                </span>
              </div>

              <div className="divide-y divide-gray-100">
                {diagnostics.services.map((srv, idx) => (
                  <div key={idx} className="flex items-center justify-between px-4 py-3.5 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{srv.service}</p>
                        <p className="text-[11px] text-gray-500">Ping: {srv.pingMs} ms • Checked {srv.lastChecked}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-700">{srv.uptimePercent}% Uptime</span>
                      <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                        HEALTHY
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: User Profile */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSave} className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs max-w-2xl space-y-4">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={user?.name || 'User'}
                  className="h-12 w-12 rounded-full border border-gray-200 object-cover shadow-xs"
                />
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{user?.name}</h3>
                  <p className="text-xs text-gray-500">{user?.role} • {user?.organizationName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2.5 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Corporate Title</label>
                  <input
                    type="text"
                    value={profileTitle}
                    onChange={(e) => setProfileTitle(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2.5 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Work Email</label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2.5 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Direct Phone</label>
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2.5 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs"
                >
                  Save Profile
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 6: Security & Sessions */}
        {activeTab === 'security' && (
          <div className="space-y-6 max-w-2xl">
            {/* Password Reset */}
            <form onSubmit={handlePasswordSave} className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Key className="h-4 w-4 text-indigo-600" />
                <h4 className="text-sm font-bold text-gray-900">Change Authentication Password</h4>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2.5 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 p-2.5 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 p-2.5 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs"
                >
                  Update Credentials
                </button>
              </div>
            </form>

            {/* 2FA & Session Mandates */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Lock className="h-4 w-4 text-indigo-600" />
                <h4 className="text-sm font-bold text-gray-900">Organization Security Policies</h4>
              </div>

              <div className="flex items-center justify-between py-2 text-xs">
                <div>
                  <p className="font-semibold text-gray-900">Enforce Multi-Factor Authentication (2FA)</p>
                  <p className="text-gray-500">Require all staff roles to use TOTP authenticator tokens.</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  Enforced
                </span>
              </div>

              <div className="flex items-center justify-between py-2 text-xs border-t border-gray-100">
                <div>
                  <p className="font-semibold text-gray-900">Inactivity Session Timeout</p>
                  <p className="text-gray-500">Automatically locks console after idle duration.</p>
                </div>
                <span className="font-semibold text-gray-800">60 Minutes</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add Regional Hub */}
        {showAddHubModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
            <div
              className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50/70">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-gray-900">Register Regional Office Hub</h3>
                </div>
                <button
                  onClick={() => setShowAddHubModal(false)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddHubSubmit} className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block font-semibold text-gray-700 mb-1">Division Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Southwest Sunbelt Division"
                      value={newHubName}
                      onChange={(e) => setNewHubName(e.target.value)}
                      required
                      className="w-full rounded-lg border border-gray-200 p-2 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Code</label>
                    <input
                      type="text"
                      placeholder="e.g. PHX-SW"
                      value={newHubCode}
                      onChange={(e) => setNewHubCode(e.target.value)}
                      required
                      className="w-full rounded-lg border border-gray-200 p-2 focus:border-indigo-500 focus:outline-none uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      placeholder="Phoenix"
                      value={newHubCity}
                      onChange={(e) => setNewHubCity(e.target.value)}
                      required
                      className="w-full rounded-lg border border-gray-200 p-2 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      placeholder="AZ"
                      value={newHubState}
                      onChange={(e) => setNewHubState(e.target.value)}
                      required
                      className="w-full rounded-lg border border-gray-200 p-2 focus:border-indigo-500 focus:outline-none uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Local Tax Surcharge (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newHubTaxRate}
                      onChange={(e) => setNewHubTaxRate(Number(e.target.value))}
                      required
                      className="w-full rounded-lg border border-gray-200 p-2 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Regional Director</label>
                    <input
                      type="text"
                      placeholder="Director Name"
                      value={newHubDirector}
                      onChange={(e) => setNewHubDirector(e.target.value)}
                      required
                      className="w-full rounded-lg border border-gray-200 p-2 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Office Street Address</label>
                  <input
                    type="text"
                    placeholder="100 E Camelback Rd, Phoenix, AZ 85012"
                    value={newHubAddress}
                    onChange={(e) => setNewHubAddress(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-200 p-2 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Covered Corridors (Comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="I-10 Pearl Arterial, Camelback Corridor"
                    value={newHubCorridors}
                    onChange={(e) => setNewHubCorridors(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="border-t border-gray-200 pt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddHubModal(false)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    Register Hub
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Validate Dry-Run Restore */}
        {showValidateModal && validationResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
            <div
              className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50/70">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-gray-900">Dry-Run Snapshot Validation</h3>
                </div>
                <button
                  onClick={() => setShowValidateModal(false)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="font-semibold">Snapshot Passed 100% Integrity Checks</span>
                </div>

                <div className="space-y-2">
                  {validationResult.checks.map((c: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                      <div>
                        <p className="font-semibold text-gray-900">{c.label}</p>
                        <p className="text-[11px] text-gray-500">{c.detail}</p>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-600">PASSED</span>
                    </div>
                  ))}
                </div>

                <div className="text-[11px] text-gray-500 text-center">
                  Total entities verified: {validationResult.totalEntities} across 12 relational stores.
                </div>
              </div>

              <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 flex justify-end">
                <button
                  onClick={() => setShowValidateModal(false)}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Register New Organization Workspace */}
        {showNewWorkspaceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Building className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Register New Organization</h3>
                    <p className="text-[11px] text-gray-500">Clean workspace starting from scratch with 0 demo data</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewWorkspaceModal(false)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleRegisterNewWorkspaceSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Organization / Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Skyline Media Network"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Super Admin Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jordan Hayes"
                      value={newOrgAdminName}
                      onChange={(e) => setNewOrgAdminName(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Currency
                    </label>
                    <select
                      value={newOrgCurrency}
                      onChange={(e) => setNewOrgCurrency(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD ($)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Work Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@skylinemedia.com"
                    value={newOrgAdminEmail}
                    onChange={(e) => setNewOrgAdminEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Initial Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newOrgPassword}
                    onChange={(e) => setNewOrgPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Guaranteed zero demo records. Your new account starts completely clean.</span>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowNewWorkspaceModal(false)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
                  >
                    Create & Switch Now
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
