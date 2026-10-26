import { NextResponse } from 'next/server';
import {
  getStoredPayments,
  recordPayment,
  getFinancialMetrics,
  RecordPaymentInput,
  PaymentMethod,
} from '@/lib/data/invoices-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoiceId');
    const clientId = searchParams.get('clientId');
    const method = searchParams.get('method') as PaymentMethod | 'ALL' | null;
    const search = searchParams.get('search');

    let payments = getStoredPayments();

    if (invoiceId && invoiceId !== 'ALL') {
      payments = payments.filter((p) => p.invoiceId === invoiceId || p.invoiceNumber === invoiceId);
    }
    if (clientId && clientId !== 'ALL') {
      payments = payments.filter((p) => p.clientId === clientId);
    }
    if (method && method !== 'ALL') {
      payments = payments.filter((p) => p.paymentMethod === method);
    }
    if (search) {
      const q = search.toLowerCase();
      payments = payments.filter(
        (p) =>
          p.paymentNumber.toLowerCase().includes(q) ||
          p.receiptNumber.toLowerCase().includes(q) ||
          p.invoiceNumber.toLowerCase().includes(q) ||
          p.clientCompanyName.toLowerCase().includes(q) ||
          p.referenceNumber.toLowerCase().includes(q)
      );
    }

    const metrics = getFinancialMetrics();

    return NextResponse.json({
      success: true,
      payments,
      metrics,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve payments.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: RecordPaymentInput = await request.json();

    if (!body.invoiceId) {
      return NextResponse.json(
        { success: false, error: 'Invoice reference is required.' },
        { status: 400 }
      );
    }
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'A valid payment amount greater than $0 is required.' },
        { status: 400 }
      );
    }
    if (!body.paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Payment method is required.' },
        { status: 400 }
      );
    }

    const result = recordPayment(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      payment: result.payment,
      invoice: result.invoice,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to record payment transaction.' },
      { status: 500 }
    );
  }
}
