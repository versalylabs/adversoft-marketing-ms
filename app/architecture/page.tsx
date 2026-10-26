"use client";

import { useState } from 'react';
import ProtectedRoute from '@/components/protectedRoute';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DATABASE_MODELS, ModelSchema } from '@/lib/data/schema-metadata';
import { BILLBOARDS, CLIENTS, BOOKINGS, CAMPAIGNS, INVOICES } from '@/lib/data/mock-db';
import {
  Database,
  Table,
  Layers,
  ArrowRight,
  CheckCircle2,
  Key,
  Link as LinkIcon,
  Server,
  Code2,
  Sparkles,
} from 'lucide-react';

export default function ArchitecturePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedModel, setSelectedModel] = useState<ModelSchema>(DATABASE_MODELS[0]);
  const [activeTab, setActiveTab] = useState<'schema' | 'lifecycle' | 'entities'>('schema');

  const categories = ['All', 'Core', 'CRM', 'Inventory', 'Commercial', 'Operations', 'Creative', 'Field', 'Finance', 'System'];

  const filteredModels = selectedCategory === 'All'
    ? DATABASE_MODELS
    : DATABASE_MODELS.filter((m) => m.category === selectedCategory);

  return (
    <ProtectedRoute>
      <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                    Database & Architecture
                  </h1>
                  <Badge variant="default" className="text-xs">
                    PostgreSQL Cluster
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  PostgreSQL Relational Schema & Outdoor Advertising Entity Lifecycle
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a href="/api/health" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Server className="h-3.5 w-3.5 text-emerald-600" />
                <span>API Health Check</span>
              </Button>
            </a>
            <a href="/api/schema" target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="gap-1.5 text-xs">
                <Code2 className="h-3.5 w-3.5" />
                <span>JSON Schema Spec</span>
              </Button>
            </a>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 space-x-4">
          <button
            onClick={() => setActiveTab('schema')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'schema'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Relational Models ({DATABASE_MODELS.length})
          </button>
          <button
            onClick={() => setActiveTab('lifecycle')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'lifecycle'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Lifecycle Architecture & ERD
          </button>
          <button
            onClick={() => setActiveTab('entities')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'entities'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Live Database Records Preview
          </button>
        </div>

        {/* Tab 1: Relational Models & Schema Inspector */}
        {activeTab === 'schema' && (
          <div className="space-y-6">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Models Sidebar */}
              <div className="space-y-2 lg:max-h-[680px] overflow-y-auto pr-1">
                {filteredModels.map((model) => {
                  const isSelected = selectedModel.name === model.name;
                  return (
                    <div
                      key={model.name}
                      onClick={() => setSelectedModel(model)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/90 border-indigo-300 shadow-xs'
                          : 'bg-white border-gray-200/80 hover:border-gray-300 hover:bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Table className={`h-4 w-4 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`} />
                        <div>
                          <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-indigo-950' : 'text-gray-900'}`}>
                            {model.name}
                          </p>
                          <p className="text-[11px] text-gray-500 leading-tight">
                            {model.fields.length} attributes &bull; {model.relationsTo.length} relations
                          </p>
                        </div>
                      </div>
                      <Badge variant={isSelected ? 'default' : 'secondary'} className="text-[10px]">
                        {model.category}
                      </Badge>
                    </div>
                  );
                })}
              </div>

              {/* Selected Model Details & Field Inspector */}
              <Card className="lg:col-span-2 shadow-sm">
                <CardHeader className="border-b border-gray-100 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Table className="h-5 w-5 text-indigo-600" />
                      <CardTitle className="text-lg font-bold text-gray-900">
                        {selectedModel.name}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        table: &quot;{selectedModel.name.toLowerCase()}s&quot;
                      </Badge>
                    </div>
                    <Badge variant="default" className="text-xs">
                      {selectedModel.category}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-gray-600 pt-1">
                    {selectedModel.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-4 space-y-6">
                  {/* Fields Table */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                      Schema Attributes ({selectedModel.fields.length})
                    </h4>
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                          <tr>
                            <th className="px-3 py-2 font-semibold">Field</th>
                            <th className="px-3 py-2 font-semibold">PostgreSQL Type</th>
                            <th className="px-3 py-2 font-semibold">Constraints</th>
                            <th className="px-3 py-2 font-semibold">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedModel.fields.map((field) => (
                            <tr key={field.name} className="hover:bg-gray-50/50">
                              <td className="px-3 py-2 font-mono font-medium text-indigo-900">
                                {field.name}
                              </td>
                              <td className="px-3 py-2 font-mono text-gray-600">
                                {field.type}
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex gap-1">
                                  {field.isId && (
                                    <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                                      <Key className="h-2.5 w-2.5" /> PK
                                    </span>
                                  )}
                                  {field.isUnique && (
                                    <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-800">
                                      UNIQUE
                                    </span>
                                  )}
                                  {field.isRelation && (
                                    <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                                      <LinkIcon className="h-2.5 w-2.5" /> FK → {field.relationModel}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-gray-500">
                                {field.description}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Connected Foreign Relations */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                      Connected Relational Entities ({selectedModel.relationsTo.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedModel.relationsTo.map((rel) => (
                        <div
                          key={rel}
                          onClick={() => {
                            const target = DATABASE_MODELS.find((m) => m.name === rel);
                            if (target) setSelectedModel(target);
                          }}
                          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50/80 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700 transition-colors cursor-pointer"
                        >
                          <LinkIcon className="h-3 w-3 text-indigo-600" />
                          <span>{rel}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Tab 2: Lifecycle Architecture & Flow */}
        {activeTab === 'lifecycle' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-base font-bold text-gray-900 mb-1">
                Complete Outdoor Advertising Lifecycle Flow
              </h3>
              <p className="text-xs text-gray-500 mb-6">
                How data transitions through relational stages in Adversoft.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-7 gap-2 text-center text-xs">
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-1">
                  <Badge variant="outline" className="bg-white">Stage 1</Badge>
                  <p className="font-bold text-blue-900 mt-1">Client & Lead</p>
                  <p className="text-[11px] text-blue-700">Account setup & brief creation</p>
                </div>

                <div className="flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-gray-400 hidden md:block" />
                </div>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-1">
                  <Badge variant="outline" className="bg-white">Stage 2</Badge>
                  <p className="font-bold text-indigo-900 mt-1">Billboard & Rate</p>
                  <p className="text-[11px] text-indigo-700">Location & availability check</p>
                </div>

                <div className="flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-gray-400 hidden md:block" />
                </div>

                <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4 space-y-1">
                  <Badge variant="outline" className="bg-white">Stage 3</Badge>
                  <p className="font-bold text-violet-900 mt-1">Quote & Booking</p>
                  <p className="text-[11px] text-violet-700">Hold reservation & contract</p>
                </div>

                <div className="flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-gray-400 hidden md:block" />
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-1">
                  <Badge variant="outline" className="bg-white">Stage 4</Badge>
                  <p className="font-bold text-emerald-900 mt-1">Mount & Invoice</p>
                  <p className="text-[11px] text-emerald-700">Proof of posting & settlement</p>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <CardTitle className="text-sm font-bold text-gray-900 mb-2">
                  Double-Booking Prevention Logic
                </CardTitle>
                <p className="text-xs text-gray-600 leading-relaxed">
                  In PostgreSQL, booking overlapping is prevented using composite indexes and range overlap constraints:
                </p>
                <div className="mt-3 rounded-lg bg-gray-900 p-3 text-[11px] font-mono text-emerald-400">
                  {`SELECT COUNT(*) FROM "BookingItem"
WHERE "billboardId" = $1
  AND ("startDate" <= $3 AND "endDate" >= $2)
  AND "status" IN ('RESERVED', 'CONFIRMED', 'ACTIVE');`}
                </div>
              </Card>

              <Card className="p-6">
                <CardTitle className="text-sm font-bold text-gray-900 mb-2">
                  Audit Logging Architecture
                </CardTitle>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Every mutation (approval, quote acceptance, installation dispatch, invoice payment) writes to an immutable `ActivityLog` record linked to the responsible user and entity ID.
                </p>
                <div className="mt-3 rounded-lg bg-gray-900 p-3 text-[11px] font-mono text-indigo-300">
                  {`model ActivityLog {
  id          String   @id @default(cuid())
  userId      String?
  action      ActivityAction
  entityType  String
  entityId    String
  description String
  createdAt   DateTime @default(now())
}`}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Tab 3: Live Records Preview */}
        {activeTab === 'entities' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="p-4">
                <p className="text-xs text-gray-500 font-medium">Billboards in DB</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{BILLBOARDS.length}</p>
                <p className="text-[11px] text-emerald-600 mt-1">All statuses seeded</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-gray-500 font-medium">Active Clients</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{CLIENTS.length}</p>
                <p className="text-[11px] text-indigo-600 mt-1">Multi-industry profiles</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-gray-500 font-medium">Bookings</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{BOOKINGS.length}</p>
                <p className="text-[11px] text-violet-600 mt-1">Hold & active flights</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-gray-500 font-medium">Invoiced Receivables</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">${INVOICES.reduce((acc, i) => acc + i.totalAmount, 0).toLocaleString()}</p>
                <p className="text-[11px] text-emerald-600 mt-1">Settled & pending balance</p>
              </Card>
            </div>

            {/* Billboards Data Table */}
            <Card>
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-sm font-bold text-gray-900">
                  Sample Seeded Billboard Structures
                </CardTitle>
                <CardDescription className="text-xs">
                  Physical outdoor inventory mapped with spatial and traffic telemetry
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Code</th>
                        <th className="px-3 py-2 font-semibold">Name & Location</th>
                        <th className="px-3 py-2 font-semibold">Type</th>
                        <th className="px-3 py-2 font-semibold">Status</th>
                        <th className="px-3 py-2 font-semibold">Dimensions</th>
                        <th className="px-3 py-2 font-semibold">Monthly Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {BILLBOARDS.map((b) => (
                        <tr key={b.id} className="hover:bg-gray-50/50">
                          <td className="px-3 py-2 font-mono font-bold text-indigo-700">{b.code}</td>
                          <td className="px-3 py-2">
                            <p className="font-semibold text-gray-900">{b.name}</p>
                            <p className="text-[11px] text-gray-500">{b.location.address}, {b.location.city}</p>
                          </td>
                          <td className="px-3 py-2 text-gray-600">{b.type.replace('_', ' ')}</td>
                          <td className="px-3 py-2">
                            <Badge
                              variant={
                                b.status === 'AVAILABLE'
                                  ? 'success'
                                  : b.status === 'OCCUPIED'
                                  ? 'default'
                                  : b.status === 'RESERVED'
                                  ? 'warning'
                                  : 'destructive'
                              }
                              className="text-[10px]"
                            >
                              {b.status}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-gray-600">{b.widthFeet}&apos; &times; {b.heightFeet}&apos; ({b.squareFeet} sq ft)</td>
                          <td className="px-3 py-2 font-semibold text-gray-900">${b.monthlyRate.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
