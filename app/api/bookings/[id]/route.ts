import { NextResponse } from 'next/server';
import {
  getBookingById,
  updateBookingStatus,
  extendBooking,
  cancelBooking,
  renewBooking,
  BookingStatus,
} from '@/lib/data/bookings-store';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const booking = getBookingById(id);

  if (!booking) {
    return NextResponse.json({ error: `Booking '${id}' not found` }, { status: 404 });
  }

  return NextResponse.json({ booking });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 1. Extension action
    if (body.action === 'EXTEND') {
      if (!body.newEndDate) {
        return NextResponse.json({ error: 'newEndDate is required for extension.' }, { status: 400 });
      }
      const extRes = extendBooking(id, body.newEndDate, body.author || 'User', body.notes);
      if (!extRes.success) {
        return NextResponse.json({ error: extRes.error }, { status: 409 });
      }
      return NextResponse.json({ message: 'Booking extended successfully', booking: extRes.booking });
    }

    // 2. Cancellation action
    if (body.action === 'CANCEL') {
      if (!body.reason) {
        return NextResponse.json({ error: 'Cancellation reason is required.' }, { status: 400 });
      }
      const cancelRes = cancelBooking(id, body.reason, body.author || 'User');
      if (!cancelRes.success) {
        return NextResponse.json({ error: cancelRes.error }, { status: 400 });
      }
      return NextResponse.json({ message: 'Booking cancelled successfully', booking: cancelRes.booking });
    }

    // 3. Status transition
    if (body.status) {
      const updated = updateBookingStatus(
        id,
        body.status as BookingStatus,
        body.author || 'User',
        body.notes
      );
      if (!updated) {
        return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
      }
      return NextResponse.json({ message: 'Booking status updated successfully', booking: updated });
    }

    return NextResponse.json({ error: 'Invalid PATCH action specified.' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.action === 'RENEW') {
      if (!body.newStartDate || !body.newEndDate) {
        return NextResponse.json(
          { error: 'newStartDate and newEndDate are required for renewal.' },
          { status: 400 }
        );
      }
      const renewRes = renewBooking(id, body.newStartDate, body.newEndDate, body.author || 'User');
      if (!renewRes.success) {
        return NextResponse.json({ error: renewRes.error }, { status: 409 });
      }
      return NextResponse.json(
        { message: 'Booking renewed successfully', booking: renewRes.newBooking },
        { status: 201 }
      );
    }

    return NextResponse.json({ error: 'Invalid POST action specified.' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
