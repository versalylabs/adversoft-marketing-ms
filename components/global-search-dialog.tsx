"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  MapPin,
  Layers,
  Users,
  Receipt,
  FileText,
  Wrench,
  Palette,
  History,
  ArrowRight,
  Sparkles,
  CornerDownLeft,
} from 'lucide-react';
import {
  performOmniSearch,
  SearchResultItem,
  SearchCategory,
} from '@/lib/data/audit-search-store';

interface GlobalSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: { id: SearchCategory; label: string; icon: any }[] = [
  { id: 'ALL', label: 'All', icon: Sparkles },
  { id: 'BILLBOARDS', label: 'Billboards', icon: MapPin },
  { id: 'CAMPAIGNS', label: 'Campaigns', icon: Layers },
  { id: 'CLIENTS', label: 'Clients', icon: Users },
  { id: 'INVOICES', label: 'Invoices', icon: Receipt },
  { id: 'CONTRACTS', label: 'Contracts', icon: FileText },
  { id: 'WORK_ORDERS', label: 'Work Orders', icon: Wrench },
  { id: 'ARTWORK', label: 'Creative', icon: Palette },
  { id: 'AUDIT', label: 'Audit Trail', icon: History },
];

export default function GlobalSearchDialog({ isOpen, onClose }: GlobalSearchDialogProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('ALL');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Focus input on dialog open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setResults(performOmniSearch('', category));
      setSelectedIndex(0);
    } else {
      setQuery('');
      setCategory('ALL');
    }
  }, [isOpen]);

  // Execute search whenever query or category changes
  useEffect(() => {
    if (isOpen) {
      const hits = performOmniSearch(query, category);
      setResults(hits);
      setSelectedIndex(0);
    }
  }, [query, category, isOpen]);

  // Keyboard navigation within the modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  const handleSelect = (item: SearchResultItem) => {
    onClose();
    router.push(item.route);
  };

  const getCategoryIcon = (cat: SearchCategory) => {
    switch (cat) {
      case 'BILLBOARDS':
        return <MapPin className="h-4 w-4 text-indigo-600" />;
      case 'CAMPAIGNS':
        return <Layers className="h-4 w-4 text-emerald-600" />;
      case 'CLIENTS':
        return <Users className="h-4 w-4 text-purple-600" />;
      case 'INVOICES':
        return <Receipt className="h-4 w-4 text-amber-600" />;
      case 'CONTRACTS':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'WORK_ORDERS':
        return <Wrench className="h-4 w-4 text-orange-600" />;
      case 'ARTWORK':
        return <Palette className="h-4 w-4 text-pink-600" />;
      case 'AUDIT':
        return <History className="h-4 w-4 text-gray-600" />;
      default:
        return <Sparkles className="h-4 w-4 text-indigo-600" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden flex flex-col transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3.5 bg-white">
          <Search className="h-5 w-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across billboards, clients, campaigns, invoices, contracts... (Type to filter)"
            className="w-full bg-transparent text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
              ESC
            </kbd>
          )}
        </div>

        {/* Category Pills Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2 bg-gray-50/70 border-b border-gray-200 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Icon className={`h-3 w-3 ${active ? 'text-white' : 'text-gray-500'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {results.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm font-medium text-gray-900">No matching records found</p>
              <p className="mt-1 text-xs text-gray-500">
                Try searching by client name, corridor, campaign code, or invoice number.
              </p>
            </div>
          ) : (
            results.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={`${item.category}_${item.id}_${index}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`group flex items-center justify-between rounded-xl px-3.5 py-2.5 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-indigo-50/80 border border-indigo-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-gray-200 shadow-xs">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {item.title}
                        </span>
                        {item.badgeText && (
                          <span
                            className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                              item.badgeColor || 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {item.badgeText}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="hidden sm:inline-block text-[11px] font-medium text-gray-400 group-hover:text-indigo-600 transition-colors">
                      {item.categoryLabel}
                    </span>
                    <ArrowRight
                      className={`h-4 w-4 transition-transform ${
                        isSelected
                          ? 'text-indigo-600 translate-x-0.5'
                          : 'text-gray-300 group-hover:text-gray-500'
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footbar */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-2.5 text-[11px] text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-gray-200 bg-white px-1 py-0.5 text-[10px] font-semibold text-gray-600">
                ↑
              </kbd>
              <kbd className="rounded border border-gray-200 bg-white px-1 py-0.5 text-[10px] font-semibold text-gray-600">
                ↓
              </kbd>{' '}
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-gray-200 bg-white px-1 py-0.5 text-[10px] font-semibold text-gray-600">
                <CornerDownLeft className="inline h-2.5 w-2.5" />
              </kbd>{' '}
              to select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-gray-200 bg-white px-1 py-0.5 text-[10px] font-semibold text-gray-600">
                ESC
              </kbd>{' '}
              to close
            </span>
          </div>

          <div className="text-right">
            <span>
              Showing <span className="font-semibold text-gray-700">{results.length}</span> results
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
