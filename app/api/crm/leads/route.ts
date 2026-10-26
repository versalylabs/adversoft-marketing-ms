import { NextResponse } from 'next/server';
import { INITIAL_LEADS, SalesLead } from '@/lib/data/crm-store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stage = searchParams.get('stage');

  let results = [...INITIAL_LEADS];

  if (stage && stage !== 'ALL') {
    results = results.filter((l) => l.stage === stage);
  }

  return NextResponse.json({
    total: results.length,
    pipelineValue: results.reduce((acc, l) => acc + l.estimatedValue, 0),
    leads: results,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newLead: SalesLead = {
      id: `lead_${Date.now()}`,
      leadNumber: `LEAD-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: body.title,
      companyName: body.companyName,
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone || '',
      source: body.source || 'WEBSITE',
      stage: body.stage || 'NEW',
      estimatedValue: Number(body.estimatedValue) || 25000,
      targetFlightStart: body.targetFlightStart || '2026-11-01',
      targetFlightEnd: body.targetFlightEnd || '2026-12-31',
      preferredLocations: body.preferredLocations || 'Metro Area',
      assignedRep: body.assignedRep || 'Marcus Brody',
      notes: body.notes || '',
      createdAt: 'Just now',
    };

    return NextResponse.json(
      { success: true, lead: newLead },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to create lead' },
      { status: 400 }
    );
  }
}
