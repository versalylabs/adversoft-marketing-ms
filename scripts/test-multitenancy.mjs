/**
 * Adversoft Multi-Tenancy Engine Verification Suite
 * Tests:
 * 1. Demo tenant vs Clean tenant data partitioning
 * 2. Zero demo data guarantee for custom tenants
 * 3. Cross-tenant isolation (changes in Tenant B do not bleed into Tenant A)
 * 4. Tenant registration and storage key generation
 */

import {
  DEMO_TENANT,
  getTenantStorageKey,
  isDemoTenant,
} from '../lib/tenant.ts';

// Mock localStorage for Node environment testing
const store = new Map();
global.window = {
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
};
global.localStorage = {
  getItem: (k) => store.get(k) || null,
  setItem: (k, v) => store.set(k, v),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

async function runTests() {
  console.log('======================================================================');
  console.log(' ADVERSOFT MULTI-TENANCY & ZERO DEMO DATA ENGINE TEST');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  [✓ PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [✗ FAIL] ${testName}`);
      failed++;
    }
  }

  // Test 1: Storage Key Partitioning
  const demoKey = getTenantStorageKey('adversoft_billboards_v1', DEMO_TENANT.id);
  const customTid = 'org_skyline_media';
  const customKey = getTenantStorageKey('adversoft_billboards_v1', customTid);

  assert(demoKey === 'adversoft_billboards_v1', 'Demo tenant uses root baseline storage key');
  assert(customKey === 'adversoft_billboards_v1_tenant_org_skyline_media', 'Custom tenant uses isolated partition key');
  assert(isDemoTenant(DEMO_TENANT.id) === true, 'DEMO_TENANT is identified as demo');
  assert(isDemoTenant(customTid) === false, 'Custom tenant is identified as non-demo');

  // Test 2: Dynamic tenant-store module verification
  const tenantStore = await import('../lib/tenant-store.ts');

  // Demo tenant should have populated demo data
  const demoBillboards = tenantStore.getTenantBillboards(DEMO_TENANT.id);
  assert(demoBillboards.length > 0, `Demo tenant has ${demoBillboards.length} initial billboards`);

  const demoClients = tenantStore.getTenantClients(DEMO_TENANT.id);
  assert(demoClients.length > 0, `Demo tenant has ${demoClients.length} initial clients`);

  const demoBookings = tenantStore.getTenantBookings(DEMO_TENANT.id);
  assert(demoBookings.length > 0, `Demo tenant has ${demoBookings.length} initial bookings`);

  // Custom tenant MUST have ZERO demo data across all entities
  const customBillboards = tenantStore.getTenantBillboards(customTid);
  assert(customBillboards.length === 0, 'Custom tenant starts with exactly 0 billboards');

  const customClients = tenantStore.getTenantClients(customTid);
  assert(customClients.length === 0, 'Custom tenant starts with exactly 0 clients');

  const customBookings = tenantStore.getTenantBookings(customTid);
  assert(customBookings.length === 0, 'Custom tenant starts with exactly 0 bookings');

  const customCampaigns = tenantStore.getTenantCampaigns(customTid);
  assert(customCampaigns.length === 0, 'Custom tenant starts with exactly 0 campaigns');

  const customQuotations = tenantStore.getTenantQuotations(customTid);
  assert(customQuotations.length === 0, 'Custom tenant starts with exactly 0 quotations');

  const customContracts = tenantStore.getTenantContracts(customTid);
  assert(customContracts.length === 0, 'Custom tenant starts with exactly 0 contracts');

  const customInvoices = tenantStore.getTenantInvoices(customTid);
  assert(customInvoices.length === 0, 'Custom tenant starts with exactly 0 invoices');

  const customArtworks = tenantStore.getTenantArtworks(customTid);
  assert(customArtworks.length === 0, 'Custom tenant starts with exactly 0 artworks');

  const customWorkOrders = tenantStore.getTenantWorkOrders(customTid);
  assert(customWorkOrders.length === 0, 'Custom tenant starts with exactly 0 work orders');

  const customMaintenance = tenantStore.getTenantMaintenance(customTid);
  assert(customMaintenance.length === 0, 'Custom tenant starts with exactly 0 maintenance records');

  // Test 3: Data Isolation & Write Partitioning
  const newBillboard = {
    id: 'bb_skyline_101',
    code: 'SKY-001',
    name: 'Skyline Midtown SuperLED',
    type: 'DIGITAL_LED',
    status: 'AVAILABLE',
    location: { city: 'Atlanta', address: 'Peachtree St', latitude: 33.749, longitude: -84.388 },
    dimensions: "48' x 14'",
    dailyImpressions: 120000,
    monthlyRate: 9500,
    weeklyRate: 2600,
    photos: [],
  };

  tenantStore.saveTenantBillboards([newBillboard], customTid);

  const reloadedCustom = tenantStore.getTenantBillboards(customTid);
  assert(reloadedCustom.length === 1 && reloadedCustom[0].code === 'SKY-001', 'Custom tenant persists its new billboard asset');

  const reloadedDemo = tenantStore.getTenantBillboards(DEMO_TENANT.id);
  assert(
    reloadedDemo.find((b) => b.code === 'SKY-001') === undefined,
    'Demo tenant is completely isolated and does NOT contain custom tenant records'
  );

  // Test 4: Summary Metrics for Clean Workspace
  const cleanMetrics = tenantStore.getTenantSummaryMetrics(customTid);
  assert(cleanMetrics.totalBillboards === 1, 'Clean workspace metrics reflect live isolated count (1 billboard)');
  assert(cleanMetrics.activeCampaigns === 0, 'Clean workspace has 0 active campaigns');
  assert(cleanMetrics.totalRevenue === 0, 'Clean workspace has $0 revenue');

  console.log('\n======================================================================');
  console.log(` SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
