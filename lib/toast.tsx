"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'default' | 'success' | 'destructive' | 'warning' | 'info';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextProps {
  toasts: Toast[];
  toast: {
    (options: Omit<Toast, 'id'>): void;
    success: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
    warning: (title: string, description?: string) => void;
    info: (title: string, description?: string) => void;
  };
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toastOptions: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = toastOptions.duration ?? 5000;
    
    setToasts((prev) => [...prev, { ...toastOptions, id }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toastMethods = Object.assign(
    (options: Omit<Toast, 'id'>) => addToast(options),
    {
      success: (title: string, description?: string) =>
        addToast({ title, description, type: 'success' }),
      error: (title: string, description?: string) =>
        addToast({ title, description, type: 'destructive' }),
      warning: (title: string, description?: string) =>
        addToast({ title, description, type: 'warning' }),
      info: (title: string, description?: string) =>
        addToast({ title, description, type: 'info' }),
    }
  );

  return (
    <ToastContext.Provider value={{ toasts, toast: toastMethods, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div 
        aria-live="assertive"
        className="fixed bottom-4 right-4 z-50 flex flex-col space-y-3 max-w-md w-full pointer-events-none p-2 sm:p-0"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg backdrop-blur transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
              item.type === 'destructive'
                ? 'bg-rose-50/95 border-rose-200 text-rose-900'
                : item.type === 'success'
                ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900'
                : item.type === 'warning'
                ? 'bg-amber-50/95 border-amber-200 text-amber-900'
                : item.type === 'info'
                ? 'bg-blue-50/95 border-blue-200 text-blue-900'
                : 'bg-white/95 border-gray-200 text-gray-900'
            }`}
          >
            <div className="flex-shrink-0 pt-0.5">
              {item.type === 'destructive' && (
                <AlertCircle className="h-5 w-5 text-rose-600" />
              )}
              {item.type === 'success' && (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              )}
              {item.type === 'warning' && (
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              )}
              {item.type === 'info' && (
                <Info className="h-5 w-5 text-blue-600" />
              )}
              {(!item.type || item.type === 'default') && (
                <Info className="h-5 w-5 text-indigo-600" />
              )}
            </div>

            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-semibold tracking-tight leading-none">
                {item.title}
              </h4>
              {item.description && (
                <p className="text-xs opacity-90 leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>

            <button
              onClick={() => removeToast(item.id)}
              className="flex-shrink-0 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 hover:bg-black/5"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}