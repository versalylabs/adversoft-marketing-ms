import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CHECKS = [
  { path: '/', label: 'Dashboard & Executive Command Center', moduleCode: 'MOD-04', type: 'PAGE' },
  { path: '/architecture', label: 'Database Schema & Entity Models', moduleCode: 'MOD-02', type: 'PAGE' },
  { path: '/team', label: 'Authentication & Role-Based Access Control', moduleCode: 'MOD-03', type: 'PAGE' },
  { path: '/crm', label: 'CRM & Enterprise Client Accounts', moduleCode: 'MOD-05', type: 'PAGE' },
  { path: '/billboards', label: 'Billboard Inventory Management', moduleCode: 'MOD-06', type: 'PAGE' },
  { path: '/map', label: 'Interactive Map & Geographic Corridors', moduleCode: 'MOD-07', type: 'PAGE' },
  { path: '/pricing', label: 'Rate Cards, Dynamic Pricing & Availability', moduleCode: 'MOD-08', type: 'PAGE' },
  { path: '/bookings', label: 'Booking & Hold Reservation Engine', moduleCode: 'MOD-09', type: 'PAGE' },
  { path: '/quotations', label: 'Quotation Builder & PDF Proposals', moduleCode: 'MOD-10', type: 'PAGE' },
  { path: '/contracts', label: 'Contract Management & E-Signatures', moduleCode: 'MOD-11', type: 'PAGE' },
  { path: '/campaigns', label: 'Campaign Execution & Deliverables', moduleCode: 'MOD-12', type: 'PAGE' },
  { path: '/artwork', label: 'Artwork & Approval Proof Workflow', moduleCode: 'MOD-13', type: 'PAGE' },
  { path: '/installations', label: 'Field Rigging & POP Photos', moduleCode: 'MOD-14', type: 'PAGE' },
  { path: '/maintenance', label: 'Maintenance & Structural Safety Audits', moduleCode: 'MOD-15', type: 'PAGE' },
  { path: '/invoices', label: 'Invoicing & Automated Billing Dispatch', moduleCode: 'MOD-16', type: 'PAGE' },
  { path: '/payments', label: 'Payment Ledger & Aging Receivables', moduleCode: 'MOD-16', type: 'PAGE' },
  { path: '/portal', label: 'Client Self-Service Portal & Approvals', moduleCode: 'MOD-17', type: 'PAGE' },
  { path: '/marketplace', label: 'Public Billboard Marketplace & Cart', moduleCode: 'MOD-18', type: 'PAGE' },
  { path: '/notifications', label: 'Notifications & Automation Engine', moduleCode: 'MOD-19', type: 'PAGE' },
  { path: '/reports', label: 'Executive Reporting & BI Analytics', moduleCode: 'MOD-20', type: 'PAGE' },
  { path: '/audit', label: 'Global Search & System Audit Trail', moduleCode: 'MOD-21', type: 'PAGE' },
  { path: '/settings', label: 'Settings, Multi-Tenancy & Data Backups', moduleCode: 'MOD-22', type: 'PAGE' },
  { path: '/api/reports?timeRange=YTD', label: 'Reporting & Yield Analytics API', moduleCode: 'MOD-20', type: 'API' },
  { path: '/api/audit?severity=ALL', label: 'Cryptographic Audit Trail API', moduleCode: 'MOD-21', type: 'API' },
  { path: '/api/search?q=times', label: 'Global Omni-Search Indexer API', moduleCode: 'MOD-21', type: 'API' },
  { path: '/api/settings', label: 'Settings & Regional Multi-Tenancy API', moduleCode: 'MOD-22', type: 'API' },
  { path: '/api/settings/backup', label: 'Full System Snapshot Download API', moduleCode: 'MOD-22', type: 'API' },
];

export async function GET(request: Request) {
  const urlObj = new URL(request.url);
  const origin = `${urlObj.protocol}//${urlObj.host}`;

  const results = [];
  let passedCount = 0;

  for (const item of CHECKS) {
    const targetUrl = `${origin}${item.path}`;
    const start = Date.now();
    try {
      const res = await fetch(targetUrl, { method: 'GET' });
      const duration = Date.now() - start;
      const ok = res.status >= 200 && res.status < 400;
      if (ok) passedCount++;

      results.push({
        ...item,
        status: res.status,
        durationMs: duration,
        passed: ok,
      });
    } catch (err: any) {
      results.push({
        ...item,
        status: 500,
        durationMs: Date.now() - start,
        passed: false,
        error: err.message,
      });
    }
  }

  const allPassed = passedCount === CHECKS.length;

  return NextResponse.json({
    success: true,
    verdict: allPassed ? 'PRODUCTION_READY' : 'DEGRADED',
    totalChecks: CHECKS.length,
    passedCount,
    failedCount: CHECKS.length - passedCount,
    timestamp: new Date().toISOString(),
    results,
  });
}
