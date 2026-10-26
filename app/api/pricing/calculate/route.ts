import { NextResponse } from 'next/server';
import { calculateFlightPrice, PriceCalculationParams } from '@/lib/data/pricing-store';

export async function POST(request: Request) {
  try {
    const body: PriceCalculationParams = await request.json();

    if (!body.billboardId || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: billboardId, startDate, and endDate are required.' },
        { status: 400 }
      );
    }

    const result = calculateFlightPrice(body);
    if (!result) {
      return NextResponse.json(
        { error: `Billboard with ID '${body.billboardId}' not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      calculation: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown calculation error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
