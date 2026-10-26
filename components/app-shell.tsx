"use client";

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/sidebar';
import Header from '@/components/header';
import { NavProvider } from '@/lib/nav-context';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login';

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
        {children}
      </div>
    );
  }

  if (pathname.startsWith('/marketplace')) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900 font-sans">
        {children}
      </div>
    );
  }

  return (
    <NavProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* Responsive Sidebar */}
        <Sidebar />

        {/* Main Application Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </NavProvider>
  );
}
