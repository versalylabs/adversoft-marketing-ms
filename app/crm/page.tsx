"use client";

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/protectedRoute';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import {
  INITIAL_CLIENTS,
  INITIAL_LEADS,
  ClientAccount,
  SalesLead,
  LeadStage,
  getStoredLeads,
  saveStoredLeads,
} from '@/lib/data/crm-store';
import {
  getTenantClients,
  saveTenantClients,
  getTenantLeads,
  saveTenantLeads,
} from '@/lib/tenant-store';
import {
  Users,
  Building,
  Mail,
  Phone,
  Globe,
  MapPin,
  DollarSign,
  Plus,
  Search,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  FileText,
  MessageSquare,
  Clock,
  Sparkles,
  ExternalLink,
  Kanban,
  Table,
  UserCheck,
  X,
} from 'lucide-react';
import Link from 'next/link';

export default function CRMPage() {
  const { user, tenant } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'clients' | 'pipeline'>('clients');
  const [clients, setClients] = useState<ClientAccount[]>(() => getTenantClients(tenant?.id));
  const [leads, setLeads] = useState<SalesLead[]>(() => getTenantLeads(tenant?.id));
  const [selectedClient, setSelectedClient] = useState<ClientAccount | null>(null);

  useEffect(() => {
    setClients(getTenantClients(tenant?.id));
    setLeads(getTenantLeads(tenant?.id));

    const handleUpdate = () => {
      setClients(getTenantClients(tenant?.id));
      setLeads(getTenantLeads(tenant?.id));
    };

    window.addEventListener('adversoft_crm_clients_updated', handleUpdate);
    window.addEventListener('adversoft_crm_leads_updated', handleUpdate);
    window.addEventListener('adversoft_tenant_changed', handleUpdate);

    return () => {
      window.removeEventListener('adversoft_crm_clients_updated', handleUpdate);
      window.removeEventListener('adversoft_crm_leads_updated', handleUpdate);
      window.removeEventListener('adversoft_tenant_changed', handleUpdate);
    };
  }, [tenant]);

  // Filters & Search
  const [clientSearch, setClientSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');

  // Add Client Form State
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newCreditLimit, setNewCreditLimit] = useState('100000');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');

  // Add Lead Form State
  const [leadTitle, setLeadTitle] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [leadContact, setLeadContact] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadValue, setLeadValue] = useState('45000');
  const [leadLocations, setLeadLocations] = useState('');

  // Pipeline Columns
  const pipelineStages: { stage: LeadStage; label: string; color: string }[] = [
    { stage: 'NEW', label: 'New Inquiries', color: 'border-blue-400 bg-blue-50/40 text-blue-900' },
    { stage: 'CONTACTED', label: 'Contacted', color: 'border-indigo-400 bg-indigo-50/40 text-indigo-900' },
    { stage: 'QUALIFIED', label: 'Qualified Brief', color: 'border-violet-400 bg-violet-50/40 text-violet-900' },
    { stage: 'PROPOSAL_SENT', label: 'Proposal Sent', color: 'border-amber-400 bg-amber-50/40 text-amber-900' },
    { stage: 'WON', label: 'Won / Booked', color: 'border-emerald-400 bg-emerald-50/40 text-emerald-900' },
  ];

  const filteredClients = clients.filter((c) => {
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesSearch =
      c.companyName.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.accountNumber.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.industry.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.city.toLowerCase().includes(clientSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalClientSpend = clients.reduce((acc, c) => acc + c.totalSpend, 0);
  const totalPipelineValue = leads.reduce((acc, l) => acc + (l.stage !== 'LOST' ? l.estimatedValue : 0), 0);

  const handleAddClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName) return;

    const newAccount: ClientAccount = {
      id: `cli_${Date.now()}`,
      accountNumber: `CLI-${Math.floor(1000 + Math.random() * 9000)}`,
      companyName: newCompanyName,
      industry: newIndustry || 'Advertising & Marketing',
      status: 'ACTIVE',
      billingAddress: 'Commercial Plaza Blvd',
      city: newCity || 'New York',
      state: newState || 'NY',
      zipCode: '10001',
      website: `https://${newCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      taxId: 'US-EIN-PENDING',
      creditLimit: Number(newCreditLimit) || 100000,
      totalSpend: 0,
      activeCampaignsCount: 0,
      activeBookingsCount: 0,
      createdAt: 'Just now',
      contacts: newContactName
        ? [
            {
              id: `con_${Date.now()}`,
              name: newContactName,
              title: 'Primary Marketing Contact',
              email: newContactEmail || 'contact@client.com',
              phone: newContactPhone || '+1 (555) 019-0000',
              isPrimary: true,
              isBilling: true,
              portalAccess: true,
            },
          ]
        : [],
      notes: [
        {
          id: `n_${Date.now()}`,
          author: user?.name || 'Sales Rep',
          category: 'General',
          content: 'Account established via CRM Quick Setup.',
          createdAt: 'Just now',
        },
      ],
      documents: [],
    };

    const updated = [newAccount, ...clients];
    setClients(updated);
    saveTenantClients(updated, tenant?.id);
    setShowAddClientModal(false);
    setNewCompanyName('');
    setNewIndustry('');
    setNewContactName('');
    setNewContactEmail('');
    setNewContactPhone('');
    setSelectedClient(newAccount);

    toast.success('Client Created', `${newAccount.companyName} (${newAccount.accountNumber}) added to directory.`);
  };

  const handleAddLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadTitle || !leadCompany) return;

    const newLead: SalesLead = {
      id: `lead_${Date.now()}`,
      leadNumber: `LEAD-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: leadTitle,
      companyName: leadCompany,
      contactName: leadContact || 'Inbound Contact',
      contactEmail: leadEmail || 'info@company.com',
      contactPhone: '+1 (555) 019-4400',
      source: 'WEBSITE',
      stage: 'NEW',
      estimatedValue: Number(leadValue) || 45000,
      targetFlightStart: '2026-11-01',
      targetFlightEnd: '2026-12-31',
      preferredLocations: leadLocations || 'Metropolitan Billboard Corridor',
      assignedRep: user?.name || 'Marcus Brody',
      notes: 'New campaign brief received.',
      createdAt: 'Just now',
    };

    const updated = [newLead, ...leads];
    setLeads(updated);
    saveTenantLeads(updated, tenant?.id);
    setShowAddLeadModal(false);
    setLeadTitle('');
    setLeadCompany('');
    setLeadContact('');
    setLeadEmail('');

    toast.success('Lead Registered', `Inquiry for ${newLead.companyName} ($${newLead.estimatedValue.toLocaleString()}) added to pipeline.`);
  };

  const handleConvertLead = (lead: SalesLead) => {
    // Check if client already exists
    let existing = clients.find((c) => c.companyName.toLowerCase() === lead.companyName.toLowerCase());

    if (!existing) {
      existing = {
        id: `cli_${Date.now()}`,
        accountNumber: `CLI-${Math.floor(1000 + Math.random() * 9000)}`,
        companyName: lead.companyName,
        industry: 'OOH Advertiser',
        status: 'ACTIVE',
        billingAddress: 'Corporate Headquarters',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        website: `https://${lead.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        taxId: 'US-EIN-PENDING',
        creditLimit: lead.estimatedValue * 1.5,
        totalSpend: 0,
        activeCampaignsCount: 0,
        activeBookingsCount: 1,
        createdAt: 'Just now',
        contacts: [
          {
            id: `con_${Date.now()}`,
            name: lead.contactName,
            title: 'Advertising Decision Maker',
            email: lead.contactEmail,
            phone: lead.contactPhone,
            isPrimary: true,
            isBilling: true,
            portalAccess: true,
          },
        ],
        notes: [
          {
            id: `n_${Date.now()}`,
            author: user?.name || 'Sales Team',
            category: 'Proposal',
            content: `Converted from Sales Lead #${lead.leadNumber} (${lead.title}). Estimated flight budget: $${lead.estimatedValue.toLocaleString()}.`,
            createdAt: 'Just now',
          },
        ],
        documents: [],
      };
      const newClients = [existing!, ...clients];
      setClients(newClients);
      saveTenantClients(newClients, tenant?.id);
    }

    // Update lead status to WON
    const updatedLeads = leads.map((l) => (l.id === lead.id ? { ...l, stage: 'WON' as LeadStage } : l));
    setLeads(updatedLeads);
    saveTenantLeads(updatedLeads, tenant?.id);

    toast.success(
      'Lead Converted to Active Client & Booking!',
      `${lead.companyName} is now an Active Client. Space reservation initialized for ${lead.preferredLocations}.`
    );
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !newNoteText.trim()) return;

    const newNote = {
      id: `n_${Date.now()}`,
      author: user?.name || 'Staff User',
      category: 'General' as const,
      content: newNoteText,
      createdAt: 'Just now',
    };

    const updated = {
      ...selectedClient,
      notes: [newNote, ...selectedClient.notes],
    };

    setSelectedClient(updated);
    const updatedClients = clients.map((c) => (c.id === updated.id ? updated : c));
    setClients(updatedClients);
    saveTenantClients(updatedClients, tenant?.id);
    setNewNoteText('');
    toast.success('Note Added', 'Communication log entry saved to client timeline.');
  };

  return (
    <ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Sales Manager', 'Sales Agent', 'Finance']}>
      <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
        {/* Executive Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  CRM & Client Management
                </h1>
                <Badge variant="default" className="text-xs">
                  Enterprise Accounts
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Advertiser accounts, multi-contact management, communications, and sales qualification pipeline.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowAddLeadModal(true)}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>New Lead Inquiry</span>
            </Button>
            <Button
              onClick={() => setShowAddClientModal(true)}
              size="sm"
              className="gap-1.5 text-xs bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add New Client</span>
            </Button>
          </div>
        </div>

        {/* Top-Level Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-xs font-medium text-gray-500">Active Advertisers</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{clients.length}</p>
            <p className="text-[11px] text-indigo-600 mt-1">Multi-market accounts</p>
          </Card>

          <Card className="p-4">
            <p className="text-xs font-medium text-gray-500">Sales Pipeline Value</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">
              ${(totalPipelineValue / 1000).toFixed(0)}k
            </p>
            <p className="text-[11px] text-emerald-600 mt-1">{leads.length} qualified leads in flight</p>
          </Card>

          <Card className="p-4">
            <p className="text-xs font-medium text-gray-500">Lifetime Billings</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">
              ${(totalClientSpend / 1000).toFixed(0)}k
            </p>
            <p className="text-[11px] text-emerald-600 mt-1">Across 3 active flights</p>
          </Card>

          <Card className="p-4">
            <p className="text-xs font-medium text-gray-500">Avg Credit Facility</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">$200k</p>
            <p className="text-[11px] text-gray-500 mt-1">Net 30 terms approved</p>
          </Card>
        </div>

        {/* Main Tab Switcher */}
        <div className="flex border-b border-gray-200 space-x-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('clients')}
            className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
              activeTab === 'clients'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Table className="h-4 w-4" />
            <span>Clients Directory ({clients.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pipeline')}
            className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
              activeTab === 'pipeline'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Kanban className="h-4 w-4" />
            <span>Sales Pipeline Kanban ({leads.length} Deals &bull; ${(totalPipelineValue / 1000).toFixed(0)}k)</span>
          </button>
        </div>

        {/* TAB 1: Clients Directory */}
        {activeTab === 'clients' && (
          <div className="space-y-4">
            {/* Search and Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search clients by company, code, industry, city..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 text-xs text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-wrap gap-1">
                {['ALL', 'ACTIVE', 'PROSPECT', 'LEAD'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      statusFilter === st
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Clients Table */}
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Account / Company</th>
                      <th className="px-4 py-3 font-semibold">Industry</th>
                      <th className="px-4 py-3 font-semibold">Primary Contact</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Credit Limit</th>
                      <th className="px-4 py-3 font-semibold">Total Spend</th>
                      <th className="px-4 py-3 font-semibold text-right">360° Profile</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredClients.map((client) => {
                      const primaryContact = client.contacts.find((c) => c.isPrimary) || client.contacts[0];

                      return (
                        <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="space-y-0.5">
                              <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">
                                {client.accountNumber}
                              </span>
                              <p className="font-bold text-gray-900 leading-tight">
                                {client.companyName}
                              </p>
                              {client.dbaName && (
                                <p className="text-[11px] text-gray-400 italic">dba {client.dbaName}</p>
                              )}
                              <p className="text-[11px] text-gray-500 flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-gray-400" />
                                <span>{client.city}, {client.state}</span>
                              </p>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-gray-600">
                            {client.industry}
                          </td>

                          <td className="px-4 py-3">
                            {primaryContact ? (
                              <div className="space-y-0.5">
                                <p className="font-semibold text-gray-900">{primaryContact.name}</p>
                                <p className="text-[11px] text-gray-500">{primaryContact.title}</p>
                                <p className="text-[10px] text-indigo-600">{primaryContact.email}</p>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">No contact assigned</span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                client.status === 'ACTIVE'
                                  ? 'success'
                                  : client.status === 'PROSPECT'
                                  ? 'warning'
                                  : 'default'
                              }
                              className="text-[10px]"
                            >
                              {client.status}
                            </Badge>
                          </td>

                          <td className="px-4 py-3 font-mono font-medium text-gray-700">
                            ${client.creditLimit.toLocaleString()}
                          </td>

                          <td className="px-4 py-3 font-bold text-gray-900">
                            ${client.totalSpend.toLocaleString()}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedClient(client)}
                              className="gap-1 text-xs h-7 px-2.5 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200"
                            >
                              <span>Inspect 360°</span>
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredClients.length === 0 && (
                  <div className="py-12 text-center">
                    <Users className="mx-auto h-10 w-10 text-gray-300" />
                    <h3 className="mt-3 text-sm font-semibold text-gray-900">
                      {clients.length === 0 ? 'No enterprise clients registered yet' : 'No clients match your filter'}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
                      {clients.length === 0
                        ? 'Your clean workspace starts fresh with zero client records. Register your first corporate client or agency account.'
                        : 'Try adjusting your search criteria or resetting the active status filter.'}
                    </p>
                    {clients.length === 0 && (
                      <div className="mt-4">
                        <Button
                          size="sm"
                          onClick={() => setShowAddClientModal(true)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs font-semibold"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add First Client</span>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: Sales Pipeline Kanban */}
        {activeTab === 'pipeline' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {pipelineStages.map((col) => {
                const stageLeads = leads.filter((l) => l.stage === col.stage);
                const colValue = stageLeads.reduce((acc, l) => acc + l.estimatedValue, 0);

                return (
                  <div key={col.stage} className="space-y-3">
                    {/* Column Header */}
                    <div className={`p-2.5 rounded-xl border ${col.color} flex items-center justify-between`}>
                      <div>
                        <h4 className="font-bold text-xs">{col.label}</h4>
                        <p className="text-[10px] opacity-80">${colValue.toLocaleString()} &bull; {stageLeads.length} deals</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-white">
                        {stageLeads.length}
                      </Badge>
                    </div>

                    {/* Cards Stack */}
                    <div className="space-y-2.5">
                      {stageLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className="rounded-xl border border-gray-200/90 bg-white p-3.5 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all space-y-2"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded">
                              {lead.leadNumber}
                            </span>
                            <span className="text-xs font-bold text-emerald-700">
                              ${lead.estimatedValue.toLocaleString()}
                            </span>
                          </div>

                          <div>
                            <h5 className="font-bold text-xs text-gray-900 leading-snug">
                              {lead.title}
                            </h5>
                            <p className="text-[11px] font-semibold text-gray-700 mt-0.5">
                              {lead.companyName}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              Contact: {lead.contactName} ({lead.contactEmail})
                            </p>
                          </div>

                          <div className="rounded-lg bg-gray-50 p-2 text-[10px] text-gray-600 space-y-0.5 border border-gray-100">
                            <p className="truncate">
                              <span className="font-semibold text-gray-500">Corridor:</span> {lead.preferredLocations}
                            </p>
                            <p>
                              <span className="font-semibold text-gray-500">Target Flight:</span> {lead.targetFlightStart}
                            </p>
                          </div>

                          {/* Quick Actions */}
                          <div className="pt-1 flex items-center justify-between border-t border-gray-100">
                            <span className="text-[10px] text-gray-400 font-medium">
                              Rep: {lead.assignedRep}
                            </span>

                            {lead.stage !== 'WON' ? (
                              <button
                                onClick={() => handleConvertLead(lead)}
                                className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                              >
                                <Sparkles className="h-2.5 w-2.5" />
                                <span>Convert to Client</span>
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Active Booking</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 360° Client Detail Modal Drawer */}
        {selectedClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setSelectedClient(null)}
            />
            <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl z-50 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-bold">
                    {selectedClient.companyName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-gray-900">
                        {selectedClient.companyName}
                      </h3>
                      <Badge variant="success" className="text-[10px]">
                        {selectedClient.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 font-mono">
                      Account #{selectedClient.accountNumber} &bull; {selectedClient.industry}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedClient(null)}
                  className="rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 text-xs">
                {/* Commercial Summary Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3">
                    <p className="text-gray-500 font-medium">Total Spend (LTV)</p>
                    <p className="text-lg font-bold text-gray-900 mt-0.5">
                      ${selectedClient.totalSpend.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3">
                    <p className="text-gray-500 font-medium">Approved Credit Limit</p>
                    <p className="text-lg font-bold text-gray-900 mt-0.5">
                      ${selectedClient.creditLimit.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3">
                    <p className="text-gray-500 font-medium">Active Campaigns</p>
                    <p className="text-lg font-bold text-indigo-600 mt-0.5">
                      {selectedClient.activeCampaignsCount} Flight Active
                    </p>
                  </div>
                </div>

                {/* Contacts List */}
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] text-gray-400">
                    Designated Contacts ({selectedClient.contacts.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedClient.contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="rounded-xl border border-gray-200 p-3 space-y-1.5 bg-white"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-gray-900">{contact.name}</p>
                          {contact.isPrimary && (
                            <Badge variant="default" className="text-[10px] py-0">Primary</Badge>
                          )}
                        </div>
                        <p className="text-gray-500">{contact.title}</p>
                        <div className="pt-1 border-t border-gray-100 text-gray-600 space-y-0.5 text-[11px]">
                          <p className="flex items-center gap-1.5">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span>{contact.email}</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span>{contact.phone}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Communication Notes Feed */}
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] text-gray-400">
                    Communication History & Sales Notes
                  </h4>

                  {/* Add Note Form */}
                  <form onSubmit={handleAddNote} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a call log, meeting summary, or brief update..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="flex-1 h-9 rounded-lg border border-gray-300 px-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <Button type="submit" size="sm" className="bg-indigo-600 text-white hover:bg-indigo-700">
                      Post Note
                    </Button>
                  </form>

                  <div className="space-y-2">
                    {selectedClient.notes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-lg border border-gray-100 bg-gray-50/60 p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{note.author}</span>
                            <Badge variant="outline" className="text-[10px] py-0 bg-white">
                              {note.category}
                            </Badge>
                          </div>
                          <span className="text-gray-400">{note.createdAt}</span>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documents Vault */}
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] text-gray-400">
                    Client Documents & Master Agreements ({selectedClient.documents.length})
                  </h4>
                  {selectedClient.documents.length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedClient.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-indigo-600" />
                            <div>
                              <p className="font-semibold text-gray-900">{doc.title}</p>
                              <p className="text-[10px] text-gray-400">{doc.category} &bull; {doc.fileSize}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-indigo-600 hover:underline cursor-pointer">
                            Download
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">No agreements uploaded yet.</p>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="border-t border-gray-200 px-6 py-3 flex items-center justify-between bg-gray-50/50">
                <Link href="/bookings">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    <span>Reserve Billboard Face</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
                <Button
                  onClick={() => setSelectedClient(null)}
                  size="sm"
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Close Profile
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add New Client */}
        {showAddClientModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs transition-opacity"
              onClick={() => setShowAddClientModal(false)}
            />
            <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-gray-900">Add New Advertiser Account</h3>
                </div>
                <button
                  onClick={() => setShowAddClientModal(false)}
                  className="rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleAddClientSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 col-span-2">
                    <label className="font-semibold text-gray-700">Company Legal Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Paramount Beverage Co"
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      className="w-full h-9 rounded-lg border border-gray-300 px-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Industry / Sector</label>
                    <input
                      type="text"
                      placeholder="e.g. Consumer Goods, Fintech"
                      value={newIndustry}
                      onChange={(e) => setNewIndustry(e.target.value)}
                      className="w-full h-9 rounded-lg border border-gray-300 px-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Credit Limit ($)</label>
                    <input
                      type="number"
                      value={newCreditLimit}
                      onChange={(e) => setNewCreditLimit(e.target.value)}
                      className="w-full h-9 rounded-lg border border-gray-300 px-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">City</label>
                    <input
                      type="text"
                      placeholder="e.g. Chicago"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="w-full h-9 rounded-lg border border-gray-300 px-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">State / Region</label>
                    <input
                      type="text"
                      placeholder="e.g. IL"
                      value={newState}
                      onChange={(e) => setNewState(e.target.value)}
                      className="w-full h-9 rounded-lg border border-gray-300 px-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <p className="font-bold text-gray-800 text-[11px] uppercase tracking-wider">
                    Primary Contact
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 col-span-2">
                      <label className="font-semibold text-gray-700">Contact Person Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Jonathan Pierce"
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        className="w-full h-9 rounded-lg border border-gray-300 px-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-gray-700">Contact Email</label>
                      <input
                        type="email"
                        placeholder="jonathan@paramount.com"
                        value={newContactEmail}
                        onChange={(e) => setNewContactEmail(e.target.value)}
                        className="w-full h-9 rounded-lg border border-gray-300 px-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-gray-700">Phone</label>
                      <input
                        type="tel"
                        placeholder="+1 (555) 019-3322"
                        value={newContactPhone}
                        onChange={(e) => setNewContactPhone(e.target.value)}
                        className="w-full h-9 rounded-lg border border-gray-300 px-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddClientModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="bg-indigo-600 text-white hover:bg-indigo-700">
                    Create Client Account
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: New Lead Inquiry */}
        {showAddLeadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs transition-opacity"
              onClick={() => setShowAddLeadModal(false)}
            />
            <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-gray-900">Register Sales Lead</h3>
                </div>
                <button
                  onClick={() => setShowAddLeadModal(false)}
                  className="rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleAddLeadSubmit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Campaign / Inquiry Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Q4 Brand Launch Flight"
                    value={leadTitle}
                    onChange={(e) => setLeadTitle(e.target.value)}
                    className="w-full h-9 rounded-lg border border-gray-300 px-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Solaris Renewable Energy"
                    value={leadCompany}
                    onChange={(e) => setLeadCompany(e.target.value)}
                    className="w-full h-9 rounded-lg border border-gray-300 px-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Contact Person</label>
                    <input
                      type="text"
                      placeholder="e.g. Megan Fox"
                      value={leadContact}
                      onChange={(e) => setLeadContact(e.target.value)}
                      className="w-full h-9 rounded-lg border border-gray-300 px-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Contact Email</label>
                    <input
                      type="email"
                      placeholder="megan@solaris.com"
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      className="w-full h-9 rounded-lg border border-gray-300 px-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Estimated Budget ($)</label>
                    <input
                      type="number"
                      value={leadValue}
                      onChange={(e) => setLeadValue(e.target.value)}
                      className="w-full h-9 rounded-lg border border-gray-300 px-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Preferred Corridors</label>
                    <input
                      type="text"
                      placeholder="e.g. I-95 North, Downtown"
                      value={leadLocations}
                      onChange={(e) => setLeadLocations(e.target.value)}
                      className="w-full h-9 rounded-lg border border-gray-300 px-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddLeadModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="bg-indigo-600 text-white hover:bg-indigo-700">
                    Add to Pipeline
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
