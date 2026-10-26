/**
 * Adversoft Marketing Management System
 * Production Acceptance & System Smoke Suite Test Runner
 */

const BASE_URL = process.env.TEST_URL || 'http://127.0.0.1:3005';

const PAGE_ROUTES = [
  { path: '/', label: 'Dashboard & Executive Command Center', moduleCode: 'MOD-04' },
  { path: '/architecture', label: 'Database Schema & Entity Models', moduleCode: 'MOD-02' },
  { path: '/team', label: 'Authentication & Role-Based Access Control', moduleCode: 'MOD-03' },
  { path: '/crm', label: 'CRM & Enterprise Client Accounts', moduleCode: 'MOD-05' },
  { path: '/billboards', label: 'Billboard Inventory Management', moduleCode: 'MOD-06' },
  { path: '/map', label: 'Interactive Map & Geographic Corridors', moduleCode: 'MOD-07' },
  { path: '/pricing', label: 'Rate Cards, Dynamic Pricing & Availability', moduleCode: 'MOD-08' },
  { path: '/bookings', label: 'Booking & Hold Reservation Engine', moduleCode: 'MOD-09' },
  { path: '/quotations', label: 'Quotation Builder & PDF Proposals', moduleCode: 'MOD-10' },
  { path: '/contracts', label: 'Contract Management & E-Signatures', moduleCode: 'MOD-11' },
  { path: '/campaigns', label: 'Campaign Execution & Deliverables', moduleCode: 'MOD-12' },
  { path: '/artwork', label: 'Artwork & Approval Proof Workflow', moduleCode: 'MOD-13' },
  { path: '/installations', label: 'Field Rigging & POP Photos', moduleCode: 'MOD-14' },
  { path: '/maintenance', label: 'Maintenance & Structural Safety Audits', moduleCode: 'MOD-15' },
  { path: '/invoices', label: 'Invoicing & Automated Billing Dispatch', moduleCode: 'MOD-16' },
  { path: '/payments', label: 'Payment Ledger & Aging Receivables', moduleCode: 'MOD-16' },
  { path: '/portal', label: 'Client Self-Service Portal & Approvals', moduleCode: 'MOD-17' },
  { path: '/marketplace', label: 'Public Billboard Marketplace & Cart', moduleCode: 'MOD-18' },
  { path: '/notifications', label: 'Notifications & Automation Engine', moduleCode: 'MOD-19' },
  { path: '/reports', label: 'Executive Reporting & BI Analytics', moduleCode: 'MOD-20' },
  { path: '/audit', label: 'Global Search & System Audit Trail', moduleCode: 'MOD-21' },
  { path: '/settings', label: 'Settings, Multi-Tenancy & Data Backups', moduleCode: 'MOD-22' },
];

const API_ENDPOINTS = [
  { path: '/api/reports?timeRange=YTD', label: 'Reporting & Yield Analytics API', moduleCode: 'MOD-20' },
  { path: '/api/audit?severity=ALL', label: 'Cryptographic Audit Trail API', moduleCode: 'MOD-21' },
  { path: '/api/search?q=times', label: 'Global Omni-Search Indexer API', moduleCode: 'MOD-21' },
  { path: '/api/settings', label: 'Settings & Regional Multi-Tenancy API', moduleCode: 'MOD-22' },
  { path: '/api/settings/backup', label: 'Full System Snapshot Download API', moduleCode: 'MOD-22' },
];

async function runTest(item, isApi = false) {
  const url = `${BASE_URL}${item.path}`;
  const start = Date.now();
  try {
    const res = await fetch(url, { method: 'GET', headers: { Accept: isApi ? 'application/json' : 'text/html' } });
    const duration = Date.now() - start;
    const ok = res.status >= 200 && res.status < 400;

    let payloadSummary = '';
    if (isApi && ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        if (json.success !== undefined) payloadSummary = `(success: ${json.success})`;
        if (json.count !== undefined) payloadSummary += ` (${json.count} hits)`;
        if (json.total !== undefined) payloadSummary += ` (${json.total} records)`;
      } else {
        payloadSummary = `(stream: ${res.headers.get('content-disposition') || 'binary'})`;
      }
    }

    return {
      ...item,
      status: res.status,
      ok,
      duration,
      payloadSummary,
    };
  } catch (err) {
    return {
      ...item,
      status: 'ERR',
      ok: false,
      duration: Date.now() - start,
      error: err.message,
    };
  }
}

async function runSuite() {
  console.log('\n======================================================================');
  console.log(' ADVERSOFT MARKETING MANAGEMENT SYSTEM — PRODUCTION SMOKE SUITE');
  console.log(` Target Server: ${BASE_URL}`);
  console.log(` Timestamp:     ${new Date().toISOString()}`);
  console.log('======================================================================\n');

  console.log('--- 1. APPLICATION PAGE ROUTE VERIFICATION (22 Core Modules) ---');
  const pageResults = [];
  for (const page of PAGE_ROUTES) {
    const result = await runTest(page, false);
    pageResults.push(result);
    const icon = result.ok ? '✓ PASS' : '✗ FAIL';
    console.log(`  [${icon}] ${result.status} | ${result.moduleCode.padEnd(8)} | ${result.path.padEnd(16)} | ${result.duration}ms | ${result.label}`);
  }

  console.log('\n--- 2. CORE REST API ENDPOINTS VERIFICATION ---');
  const apiResults = [];
  for (const api of API_ENDPOINTS) {
    const result = await runTest(api, true);
    apiResults.push(result);
    const icon = result.ok ? '✓ PASS' : '✗ FAIL';
    console.log(`  [${icon}] ${result.status} | ${result.moduleCode.padEnd(8)} | ${result.path.padEnd(30)} | ${result.duration}ms | ${result.label} ${result.payloadSummary}`);
  }

  const all = [...pageResults, ...apiResults];
  const passed = all.filter((r) => r.ok).length;
  const failed = all.filter((r) => !r.ok).length;
  const avgLatency = Math.round(all.reduce((acc, r) => acc + r.duration, 0) / all.length);

  console.log('\n======================================================================');
  console.log(' FINAL SMOKE SUITE EXECUTION SUMMARY');
  console.log('======================================================================');
  console.log(` Total Checks Executed:  ${all.length}`);
  console.log(` Successful (HTTP 200):  ${passed}`);
  console.log(` Failed:                 ${failed}`);
  console.log(` Average Response Time:  ${avgLatency} ms`);
  console.log(` System Verdict:         ${failed === 0 ? '✓ PRODUCTION READY (100% PASS)' : '✗ FAILED'}`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite();
