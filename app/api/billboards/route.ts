import { NextResponse } from 'next/server';
import {
  getBillboards,
  createBillboard,
  getInventoryMetrics,
  BillboardItem,
} from '@/lib/data/billboards-store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;
  const type = searchParams.get('type') || undefined;
  const city = searchParams.get('city') || undefined;
  const search = searchParams.get('q') || searchParams.get('search') || undefined;
  const digitalParam = searchParams.get('isDigital');
  const isDigital = digitalParam !== null ? digitalParam === 'true' : undefined;

  const billboards = getBillboards({
    status,
    type,
    city,
    isDigital,
    search,
  });

  const metrics = getInventoryMetrics();

  return NextResponse.json({
    total: billboards.length,
    metrics,
    billboards,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.code || !body.name || !body.type || !body.location?.city) {
      return NextResponse.json(
        { error: 'Missing required billboard fields (code, name, type, city)' },
        { status: 400 }
      );
    }

    const created = createBillboard(body);

    return NextResponse.json(
      {
        message: 'Billboard created successfully',
        billboard: created,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
