import { NextResponse } from 'next/server';
import {
  getAllSchedules,
  getBillboardSchedule,
  checkScheduleConflict,
  createFlightHold,
  FlightScheduleSlot,
} from '@/lib/data/pricing-store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const billboardId = searchParams.get('billboardId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  // If specific billboard requested
  if (billboardId) {
    const slots = getBillboardSchedule(billboardId);

    // If date range provided, run conflict check
    let conflictResult = null;
    if (startDate && endDate) {
      conflictResult = checkScheduleConflict(billboardId, startDate, endDate);
    }

    return NextResponse.json({
      billboardId,
      totalSlots: slots.length,
      schedule: slots,
      conflictCheck: conflictResult,
    });
  }

  // Return all active schedules
  const all = getAllSchedules();
  return NextResponse.json({
    total: all.length,
    schedules: all,
  });
}

export async function POST(request: Request) {
  try {
    const body: Omit<FlightScheduleSlot, 'id'> = await request.json();

    if (!body.billboardId || !body.startDate || !body.endDate || !body.clientName) {
      return NextResponse.json(
        { error: 'Missing required reservation fields (billboardId, startDate, endDate, clientName)' },
        { status: 400 }
      );
    }

    const result = createFlightHold(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, hasConflict: true },
        { status: 409 } // 409 Conflict
      );
    }

    return NextResponse.json(
      {
        message: 'Flight slot hold created successfully',
        slot: result.slot,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
