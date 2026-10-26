import { NextResponse } from 'next/server';
import {
  getStoredQuotations,
  updateQuotationStatus,
  approveQuotation,
  createQuotationRevision,
} from '@/lib/data/quotations-store';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const quotes = getStoredQuotations();
    const found = quotes.find((q) => q.id === id || q.quotationNumber === id);

    if (!found) {
      return NextResponse.json({ success: false, error: 'Quotation not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, quotation: found });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve quotation.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, status, feedback, approvedBy, author } = body;

    if (action === 'approve') {
      const res = approveQuotation(id, approvedBy);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        quotation: res.quotation,
        confirmedBooking: res.confirmedBooking,
        message: `Quotation ${res.quotation?.quotationNumber} approved and booking confirmed.`,
      });
    }

    if (action === 'revision') {
      const revRes = createQuotationRevision(id, author);
      if (!revRes.success) {
        return NextResponse.json({ success: false, error: revRes.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        quotation: revRes.quotation,
        message: `Revision ${revRes.quotation?.quotationNumber} created.`,
      });
    }

    if (status) {
      const updateRes = updateQuotationStatus(id, status, { feedback, approvedBy });
      if (!updateRes.success) {
        return NextResponse.json({ success: false, error: updateRes.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        quotation: updateRes.quotation,
        message: `Quotation status updated to ${status}.`,
      });
    }

    return NextResponse.json({ success: false, error: 'No valid action provided.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update quotation.' },
      { status: 500 }
    );
  }
}
