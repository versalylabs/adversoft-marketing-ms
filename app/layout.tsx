import './styles/globals.css'
import type { Metadata } from 'next'
import { ReactNode } from 'react'
import { AuthProvider } from '@/lib/auth'
import { ToastProvider } from '@/lib/toast'
import AppShell from '@/components/app-shell'
import { siteConfig } from '@/lib/config'

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — Outdoor Advertising Management Platform`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.tagline,
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full bg-gray-50 text-gray-900 font-sans">
        <AuthProvider>
          <ToastProvider>
            <AppShell>
              {children}
            </AppShell>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}