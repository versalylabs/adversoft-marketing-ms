import { NextResponse } from 'next/server';
import {
  getStoredInvoices,
  createInvoice,
  getFinancialMetrics,
  InvoiceStatus,
  AgingCategory,
  CreateInvoiceInput,
} from '@/lib/data/invoices-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as InvoiceStatus | 'ALL' | null;
    const aging = searchParams.get('aging') as AgingCategory | 'ALL' | null;
    const clientId = searchParams.get('clientId');
    const search = searchParams.get('search');

    let invoices = getStoredInvoices();

    if (status && status !== 'ALL') {
      invoices = invoices.filter((i) => i.status === status);
    }
    if (aging && aging !== 'ALL') {
      invoices = invoices.filter((i) => i.agingCategory === aging);
    }
    if (clientId && clientId !== 'ALL') {
      invoices = invoices.filter((i) => i.clientId === clientId);
    }
    if (search) {
      const q = search.toLowerCase();
      invoices = invoices.filter(
        (i) =>
          i.invoiceNumber.toLowerCase().includes(q) ||
          i.clientCompanyName.toLowerCase().includes(q) ||
          (i.campaignName && i.campaignName.toLowerCase().includes(q)) ||
          (i.contractNumber && i.contractNumber.toLowerCase().includes(q))
      );
    }

    const metrics = getFinancialMetrics();

    return NextResponse.json({
      success: true,
      invoices,
      metrics,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve invoices.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: CreateInvoiceInput = await request.json();

    if (!body.clientId) {
      return NextResponse.json(
        { success: false, error: 'Client account is required.' },
        { status: 400 }
      );
    }
    if (!body.dueDate) {
      return NextResponse.json(
        { success: false, error: 'Due date is required.' },
        { status: 400 }
      );
    }
    if (!body.lineItems || body.lineItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one line item charge is required.' },
        { status: 400 }
      );
    }

    const result = createInvoice(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      invoice: result.invoice,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create invoice.' },
      { status: 500 }
    );
  }
}
