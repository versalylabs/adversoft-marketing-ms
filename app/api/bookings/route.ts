import { NextResponse } from 'next/server';
import {
  getBookings,
  createBooking,
  getBookingMetrics,
  CreateBookingInput,
} from '@/lib/data/bookings-store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;
  const clientId = searchParams.get('clientId') || undefined;
  const billboardId = searchParams.get('billboardId') || undefined;
  const search = searchParams.get('search') || searchParams.get('q') || undefined;

  const bookings = getBookings({
    status,
    clientId,
    billboardId,
    search,
  });

  const metrics = getBookingMetrics();

  return NextResponse.json({
    total: bookings.length,
    metrics,
    bookings,
  });
}

export async function POST(request: Request) {
  try {
    const body: CreateBookingInput = await request.json();

    if (!body.clientId || !body.billboardId || !body.startDate || !body.endDate || !body.campaignName) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, billboardId, campaignName, startDate, and endDate are required.' },
        { status: 400 }
      );
    }

    const result = createBooking(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, hasConflict: true },
        { status: 409 } // 409 Conflict
      );
    }

    return NextResponse.json(
      {
        message: 'Booking created successfully',
        booking: result.booking,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
