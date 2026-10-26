"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, DEMO_USERS } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdversoftLogoIcon } from '@/components/logo';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Lock,
  Mail,
  Building2,
  UserPlus,
  LogIn,
  Globe2,
  CheckCircle2,
} from 'lucide-react';

export default function LoginPage() {
  const { login, registerWorkspace } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Sign In Form State
  const [email, setEmail] = useState('admin@adversoft.com');
  const [password, setPassword] = useState('••••••••••••');
  const [loading, setLoading] = useState(false);

  // Sign Up / New Organization Workspace State
  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      login(DEMO_USERS.admin);
      setLoading(false);
      toast.success('Welcome back', 'Signed in as Alex Vance (Apex Outdoor Media Group).');
      router.push('/');
    }, 500);
  };

  const handleQuickDemoLogin = (userKey: keyof typeof DEMO_USERS) => {
    const selected = DEMO_USERS[userKey];
    login(selected);
    toast.success('Demo Account Activated', `Signed in as ${selected.name} (${selected.role}).`);
    router.push('/');
  };

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationName.trim() || !workEmail.trim() || !fullName.trim()) {
      toast.error('Missing required fields', 'Please complete all required fields.');
      return;
    }

    setCreatingWorkspace(true);

    setTimeout(() => {
      try {
        const { tenant, user } = registerWorkspace({
          fullName: fullName.trim(),
          organizationName: organizationName.trim(),
          email: workEmail.trim(),
          currency,
          plan: 'Enterprise',
        });

        setCreatingWorkspace(false);
        toast.success(
          'Workspace Created Successfully!',
          `Welcome ${user.name}! Your organization "${tenant.name}" is active from scratch with zero demo data.`
        );
        router.push('/');
      } catch (err: any) {
        setCreatingWorkspace(false);
        toast.error('Workspace creation failed', err?.message || 'Unexpected error.');
      }
    }, 600);
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <AdversoftLogoIcon size={52} className="drop-shadow-md" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Adversoft Outdoor Media
          </h1>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Multi-Tenant Out-of-Home & Digital Signage Management Platform
          </p>
        </div>

        {/* Auth Mode Toggle Pills */}
        <div className="flex rounded-xl bg-gray-100 p-1 border border-gray-200">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
              mode === 'signin'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
              mode === 'signup'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Create Account / Workspace</span>
          </button>
        </div>

        {/* Card Body */}
        {mode === 'signin' ? (
          <Card className="shadow-lg border-gray-200/80">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-lg font-semibold">Sign in to your account</CardTitle>
              <CardDescription className="text-xs">
                Enter your credentials or choose a preloaded 1-click persona.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700">Password</label>
                    <a href="#" className="text-xs text-indigo-600 hover:underline">
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Authenticating...' : 'Sign In'}
                </Button>
              </form>

              {/* Quick Demo Switcher */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Quick Demo Accounts (Apex Outdoor Media)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('admin')}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/70 p-2 text-left hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                  >
                    <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-gray-900 leading-none">Super Admin</p>
                      <p className="text-[10px] text-gray-500">Alex Vance</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('sales')}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/70 p-2 text-left hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                  >
                    <UserCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-gray-900 leading-none">Sales</p>
                      <p className="text-[10px] text-gray-500">Marcus Brody</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('ops')}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/70 p-2 text-left hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                  >
                    <UserCheck className="h-4 w-4 text-amber-600 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-gray-900 leading-none">Operations</p>
                      <p className="text-[10px] text-gray-500">Elena Rostova</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('client')}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/70 p-2 text-left hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                  >
                    <UserCheck className="h-4 w-4 text-blue-600 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-gray-900 leading-none">Client Portal</p>
                      <p className="text-[10px] text-gray-500">David Sterling</p>
                    </div>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg border-indigo-200/80">
            <CardHeader className="space-y-1 pb-4 bg-gradient-to-r from-indigo-50/70 to-violet-50/70 border-b border-gray-100 rounded-t-xl">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Register New Organization
                </CardTitle>
                <Badge variant="default" className="text-[10px] bg-emerald-600">
                  Clean Slate (0 Demo Data)
                </Badge>
              </div>
              <CardDescription className="text-xs text-gray-600">
                Create a completely fresh workspace with isolated storage. Your platform will be blank and ready to register your actual billboard inventory and clients from scratch.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-5">
              <form onSubmit={handleCreateWorkspace} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Full Name</label>
                  <Input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Sarah Connor"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Organization / Company Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      required
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder="e.g. Skyline Outdoor Media Ltd"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Work Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                      required
                      value={workEmail}
                      onChange={(e) => setWorkEmail(e.target.value)}
                      placeholder="s.connor@skyline.com"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Password</label>
                    <Input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Operating Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full text-xs rounded-lg border border-gray-200 bg-white py-2 px-3 text-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD ($)</option>
                      <option value="AUD">AUD ($)</option>
                    </select>
                  </div>
                </div>

                {/* Multitenancy Assurance Box */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 space-y-1.5 text-xs text-emerald-900">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Isolated Clean Workspace Guarantee</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    This account will start with <strong>zero preloaded billboards, zero clients, and zero mock campaigns</strong>. All records you add will be private and exclusive to your organization.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={creatingWorkspace}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 gap-1.5 font-semibold"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{creatingWorkspace ? 'Provisioning Workspace...' : 'Create Workspace & Launch'}</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-gray-500">
          Adversoft Outdoor Advertising Management Platform &bull; Multi-Tenant Enterprise
        </p>
      </div>
    </div>
  );
}
