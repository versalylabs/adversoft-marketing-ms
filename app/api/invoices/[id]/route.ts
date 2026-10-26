import { NextResponse } from 'next/server';
import {
  getStoredInvoices,
  saveStoredInvoices,
  InvoiceStatus,
} from '@/lib/data/invoices-store';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoices = getStoredInvoices();
    const invoice = invoices.find((i) => i.id === id || i.invoiceNumber === id);

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      invoice,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve invoice.' },
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

    const invoices = getStoredInvoices();
    const index = invoices.findIndex((i) => i.id === id || i.invoiceNumber === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found.' },
        { status: 404 }
      );
    }

    const current = invoices[index];
    const updated = {
      ...current,
      status: (body.status as InvoiceStatus) || current.status,
      notes: body.notes !== undefined ? body.notes : current.notes,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    invoices[index] = updated;
    saveStoredInvoices(invoices);

    return NextResponse.json({
      success: true,
      invoice: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update invoice.' },
      { status: 500 }
    );
  }
}
