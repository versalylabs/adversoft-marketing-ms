"use client";

import { useState } from 'react';
import ProtectedRoute from '@/components/protectedRoute';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { INITIAL_USERS, UserProfile } from '@/lib/data/users-store';
import { UserRole, ROLE_DEFINITIONS, Permission } from '@/lib/rbac';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Key,
  Check,
  X,
  Search,
  LogIn,
  Mail,
  Phone,
  Building,
  Lock,
} from 'lucide-react';

export default function TeamManagementPage() {
  const { user: currentUser, switchUser, switchRole } = useAuth();
  const { toast } = useToast();

  const [usersList, setUsersList] = useState<UserProfile[]>(INITIAL_USERS);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'directory' | 'matrix'>('directory');
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);

  // Invite Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Sales Agent');
  const [newUserTitle, setNewUserTitle] = useState('');

  const rolesList: UserRole[] = [
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

  const filteredUsers = usersList.filter((u) => {
    const matchesRole = selectedRoleFilter === 'All' || u.role === selectedRoleFilter;
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const handleSwitchUser = (user: UserProfile) => {
    switchUser(user.id);
    toast.success('Persona Switched', `Logged in as ${user.name} (${user.role}).`);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      title: newUserTitle || `${newUserRole} at Apex Outdoor`,
      phone: '+1 (555) 019-9900',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      organizationId: 'org_apex',
      organizationName: 'Apex Outdoor Media Group',
      isActive: true,
      lastLogin: 'Never',
      joinedDate: 'Just now',
    };

    setUsersList((prev) => [newUser, ...prev]);
    setShowInviteModal(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserTitle('');

    toast.success('Invitation Sent', `${newUserName} has been invited with ${newUserRole} permissions.`);
  };

  return (
    <ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Sales Manager', 'Operations Manager']}>
      <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  User Management & RBAC
                </h1>
                <Badge variant="default" className="text-xs">
                  Access Control
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Role-based access control, organization memberships, and permission matrices.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowInviteModal(true)}
              size="sm"
              className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Invite Team Member</span>
            </Button>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex border-b border-gray-200 space-x-4">
          <button
            onClick={() => setActiveTab('directory')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'directory'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Team Directory ({usersList.length})
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'matrix'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Role Permissions Matrix (9 Roles)
          </button>
        </div>

        {/* Tab 1: Team Directory */}
        {activeTab === 'directory' && (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search team members by name, email, or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 text-xs text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Role Filter Chips */}
              <div className="flex flex-wrap gap-1">
                {['All', ...rolesList].map((role) => (
                  <button
                    key={role}
                    onClick={() => setSelectedRoleFilter(role)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      selectedRoleFilter === role
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Table Card */}
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold">User Profile</th>
                      <th className="px-4 py-3 font-semibold">Role & Organization</th>
                      <th className="px-4 py-3 font-semibold">Contact</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Last Active</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((u) => {
                      const isCurrent = currentUser?.id === u.id;
                      const roleDef = ROLE_DEFINITIONS[u.role];

                      return (
                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                          {/* User Name & Title */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar
                                src={u.avatar}
                                alt={u.name}
                                fallback={u.name}
                                className="h-9 w-9 shrink-0 ring-1 ring-gray-200"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-gray-900 leading-tight">
                                    {u.name}
                                  </p>
                                  {isCurrent && (
                                    <span className="rounded-full bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0 font-semibold">
                                      You
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-gray-500">{u.title}</p>
                              </div>
                            </div>
                          </td>

                          {/* Role & Org */}
                          <td className="px-4 py-3">
                            <div className="space-y-0.5">
                              <Badge variant={roleDef?.badgeVariant || 'default'} className="text-[10px] py-0 font-semibold">
                                {u.role}
                              </Badge>
                              <p className="text-[11px] text-gray-500 flex items-center gap-1">
                                <Building className="h-3 w-3 text-gray-400" />
                                <span>{u.organizationName}</span>
                              </p>
                            </div>
                          </td>

                          {/* Contact Details */}
                          <td className="px-4 py-3 text-gray-600">
                            <p className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span>{u.email}</span>
                            </p>
                            <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span>{u.phone}</span>
                            </p>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          </td>

                          {/* Last Active */}
                          <td className="px-4 py-3 text-gray-500 text-[11px]">
                            {u.lastLogin}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            {isCurrent ? (
                              <span className="text-[11px] font-semibold text-emerald-600">
                                Active Session
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSwitchUser(u)}
                                className="gap-1 text-xs h-7 px-2.5 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200"
                              >
                                <LogIn className="h-3 w-3" />
                                <span>Switch Persona</span>
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Tab 2: Full RBAC Permissions Matrix */}
        {activeTab === 'matrix' && (
          <Card>
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-bold text-gray-900">
                Granular Role-Based Permissions Matrix
              </CardTitle>
              <CardDescription className="text-xs">
                Formal capability assignment per role across all 15 outdoor advertising domains.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 font-bold w-48">Capability</th>
                      {rolesList.map((role) => (
                        <th key={role} className="px-2 py-2 font-semibold text-center text-[10px] whitespace-nowrap">
                          {role}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                    {[
                      { cap: 'dashboard:view', label: 'View Dashboard' },
                      { cap: 'organization:manage', label: 'Manage Workspace & Settings' },
                      { cap: 'users:manage', label: 'Manage Users & Roles' },
                      { cap: 'crm:manage', label: 'Create/Edit Clients & Leads' },
                      { cap: 'inventory:manage', label: 'Create/Edit Billboards & Rates' },
                      { cap: 'bookings:create', label: 'Create Billboard Bookings' },
                      { cap: 'quotations:manage', label: 'Generate Quotations & PDFs' },
                      { cap: 'contracts:manage', label: 'Manage Contracts & E-Sign' },
                      { cap: 'campaigns:manage', label: 'Create & Direct Campaigns' },
                      { cap: 'artwork:approve', label: 'Approve/Reject Artwork' },
                      { cap: 'installations:manage', label: 'Dispatch Field Crews' },
                      { cap: 'installations:verify', label: 'Submit Proof of Posting' },
                      { cap: 'maintenance:manage', label: 'Work Orders & Repairs' },
                      { cap: 'invoices:manage', label: 'Generate Invoices' },
                      { cap: 'payments:record', label: 'Record Received Payments' },
                      { cap: 'reports:read', label: 'View Financial & Yield Analytics' },
                      { cap: 'portal:access', label: 'Access Client Self-Service' },
                    ].map((row) => (
                      <tr key={row.cap} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2 font-sans font-medium text-gray-900">
                          {row.label}
                          <span className="block text-[10px] text-gray-400 font-mono">{row.cap}</span>
                        </td>
                        {rolesList.map((role) => {
                          const hasIt = ROLE_DEFINITIONS[role].permissions.includes(row.cap as Permission);
                          return (
                            <td key={role} className="px-2 py-2 text-center">
                              {hasIt ? (
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                  <Check className="h-3 w-3 stroke-[3]" />
                                </span>
                              ) : (
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-gray-300">
                                  <X className="h-3 w-3" />
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal: Invite Team Member */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs transition-opacity"
              onClick={() => setShowInviteModal(false)}
            />
            <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-gray-900">Invite Team Member</h3>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jessica Williams"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full h-9 rounded-lg border border-gray-300 px-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="jessica@adversoft.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full h-9 rounded-lg border border-gray-300 px-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Job Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior OOH Account Executive"
                    value={newUserTitle}
                    onChange={(e) => setNewUserTitle(e.target.value)}
                    className="w-full h-9 rounded-lg border border-gray-300 px-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Select Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full h-9 rounded-lg border border-gray-300 px-2 text-xs bg-white text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  >
                    {rolesList.map((r) => (
                      <option key={r} value={r}>
                        {r} — {ROLE_DEFINITIONS[r].description.slice(0, 45)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-3 border-t flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInviteModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="bg-indigo-600 text-white hover:bg-indigo-700">
                    Send Invitation
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
