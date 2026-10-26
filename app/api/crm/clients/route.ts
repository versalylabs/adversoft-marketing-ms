import { NextResponse } from 'next/server';
import { INITIAL_CLIENTS, ClientAccount } from '@/lib/data/crm-store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  let results = [...INITIAL_CLIENTS];

  if (status && status !== 'ALL') {
    results = results.filter((c) => c.status === status);
  }
  if (search) {
    const s = search.toLowerCase();
    results = results.filter(
      (c) =>
        c.companyName.toLowerCase().includes(s) ||
        c.accountNumber.toLowerCase().includes(s) ||
        c.industry.toLowerCase().includes(s)
    );
  }

  return NextResponse.json({
    total: results.length,
    clients: results,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newClient: ClientAccount = {
      id: `cli_${Date.now()}`,
      accountNumber: `CLI-${Math.floor(1000 + Math.random() * 9000)}`,
      companyName: body.companyName,
      industry: body.industry || 'General Advertising',
      status: body.status || 'ACTIVE',
      billingAddress: body.billingAddress || '',
      city: body.city || '',
      state: body.state || '',
      zipCode: body.zipCode || '',
      website: body.website || '',
      taxId: body.taxId || 'US-EIN-PENDING',
      creditLimit: Number(body.creditLimit) || 50000,
      totalSpend: 0,
      activeCampaignsCount: 0,
      activeBookingsCount: 0,
      createdAt: 'Just now',
      contacts: body.contactName
        ? [
            {
              id: `con_${Date.now()}`,
              name: body.contactName,
              title: body.contactTitle || 'Primary Contact',
              email: body.contactEmail || '',
              phone: body.contactPhone || '',
              isPrimary: true,
              isBilling: true,
              portalAccess: true,
            },
          ]
        : [],
      notes: [],
      documents: [],
    };

    return NextResponse.json(
      { success: true, client: newClient },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to create client' },
      { status: 400 }
    );
  }
}
