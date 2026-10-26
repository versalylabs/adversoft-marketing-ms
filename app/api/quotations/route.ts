import { NextResponse } from 'next/server';
import {
  getStoredQuotations,
  createQuotation,
  getQuotationMetrics,
} from '@/lib/data/quotations-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    const search = searchParams.get('search');

    let list = getStoredQuotations();

    if (status && status !== 'ALL') {
      list = list.filter((q) => q.status === status);
    }
    if (clientId && clientId !== 'ALL') {
      list = list.filter((q) => q.clientId === clientId);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (item) =>
          item.quotationNumber.toLowerCase().includes(q) ||
          item.clientCompanyName.toLowerCase().includes(q) ||
          item.campaignName.toLowerCase().includes(q)
      );
    }

    const metrics = getQuotationMetrics();

    return NextResponse.json({
      success: true,
      quotations: list,
      metrics,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve quotations.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = createQuotation(body);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      quotation: result.quotation,
      message: `Quotation ${result.quotation?.quotationNumber} generated successfully.`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create quotation.' },
      { status: 500 }
    );
  }
}
