import { NextResponse } from 'next/server';
import { DATABASE_MODELS } from '@/lib/data/schema-metadata';
import { BILLBOARDS, CLIENTS, BOOKINGS, CAMPAIGNS, INVOICES } from '@/lib/data/mock-db';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    application: 'Adversoft Outdoor Advertising Management Platform',
    currentPhase: {
      phase: 2,
      name: 'Database & Architecture',
      status: 'active',
    },
    database: {
      provider: 'postgresql',
      orm: 'prisma',
      schemaModelsCount: DATABASE_MODELS.length,
      models: DATABASE_MODELS.map((m) => m.name),
    },
    liveEntities: {
      billboards: BILLBOARDS.length,
      clients: CLIENTS.length,
      bookings: BOOKINGS.length,
      campaigns: CAMPAIGNS.length,
      invoices: INVOICES.length,
    },
  });
}
