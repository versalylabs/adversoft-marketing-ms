"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import {
  Building2,
  ChevronDown,
  Plus,
  Check,
  Sparkles,
  ShieldAlert,
  Globe2,
} from 'lucide-react';

export default function OrganizationSwitcher() {
  const { tenant, tenants, switchTenant } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string, name: string) => {
    if (id === tenant.id) {
      setIsOpen(false);
      return;
    }
    switchTenant(id);
    setIsOpen(false);
    toast.success('Workspace Switched', `Active organization set to "${name}".`);
    router.refresh();
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    router.push('/login');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Switcher Pill Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/80 hover:bg-white hover:border-indigo-300 px-2.5 py-1.5 text-xs font-semibold text-gray-800 transition-all shadow-xs"
        title="Switch Organization Workspace"
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-100 text-indigo-700">
          <Building2 className="h-3 w-3" />
        </div>
        <span className="max-w-[120px] sm:max-w-[170px] truncate">{tenant.name}</span>
        {tenant.isDemo ? (
          <span className="hidden sm:inline-block rounded-full bg-amber-50 px-1.5 py-0.2 text-[9px] font-bold text-amber-700 border border-amber-200">
            Demo
          </span>
        ) : (
          <span className="hidden sm:inline-block rounded-full bg-emerald-50 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700 border border-emerald-200">
            Clean
          </span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
          <div className="border-b border-gray-100 pb-2 mb-2 px-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Select Organization Workspace
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Each workspace maintains completely isolated inventory and client data.
            </p>
          </div>

          <div className="space-y-1 max-h-60 overflow-y-auto">
            {tenants.map((t) => {
              const isCurrent = t.id === tenant.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelect(t.id, t.name)}
                  className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition-colors ${
                    isCurrent
                      ? 'bg-indigo-50/80 text-indigo-900 font-bold border border-indigo-100'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                        t.isDemo ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      <Building2 className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold leading-tight">{t.name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {t.isDemo ? 'Preloaded Demo Data' : 'Clean Workspace (0 Demo Data)'}
                      </p>
                    </div>
                  </div>

                  {isCurrent && <Check className="h-4 w-4 text-indigo-600 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          {/* Footer Action: Create New Workspace */}
          <div className="pt-2 mt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleCreateNew}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-indigo-300 bg-indigo-50/50 p-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Register New Organization</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
