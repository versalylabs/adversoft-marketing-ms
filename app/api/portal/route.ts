import { NextResponse } from 'next/server';
import { INITIAL_CLIENTS } from '@/lib/data/crm-store';
import { getStoredCampaigns } from '@/lib/data/campaigns-store';
import { getStoredArtworks, approveArtwork, requestRevision } from '@/lib/data/artwork-store';
import { getStoredWorkOrders } from '@/lib/data/installations-store';
import { getStoredInvoices, getStoredPayments, recordPayment } from '@/lib/data/invoices-store';
import { getStoredContracts } from '@/lib/data/contracts-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId') || INITIAL_CLIENTS[0].id;

    const client = INITIAL_CLIENTS.find((c) => c.id === clientId || c.accountNumber === clientId);

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client account not found.' },
        { status: 404 }
      );
    }

    // Filter data for this client
    const campaigns = getStoredCampaigns().filter(
      (c) => c.clientId === client.id || c.clientCompanyName === client.companyName
    );

    const artworks = getStoredArtworks().filter(
      (a) => a.clientId === client.id || a.clientCompanyName === client.companyName
    );

    const workOrders = getStoredWorkOrders().filter(
      (w) => w.clientId === client.id || w.clientCompanyName === client.companyName
    );

    const invoices = getStoredInvoices().filter(
      (i) => i.clientId === client.id || i.clientCompanyName === client.companyName
    );

    const payments = getStoredPayments().filter(
      (p) => p.clientId === client.id || p.clientCompanyName === client.companyName
    );

    const contracts = getStoredContracts().filter(
      (cnt) => cnt.clientId === client.id || cnt.clientCompanyName === client.companyName
    );

    // Compute client-specific summary metrics
    const totalBilled = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalPaid = payments
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
    const activeFlights = campaigns.filter((c) => c.status === 'LIVE').length;
    const pendingArtworkApprovals = artworks.filter((a) => a.status === 'IN_REVIEW').length;
    const totalImpressions = campaigns.reduce(
      (sum, c) =>
        sum +
        (c.proofReport?.totalImpressionsDelivered ||
          c.sites?.reduce((acc, s) => acc + (s.totalImpressions || 0), 0) ||
          0),
      0
    );

    return NextResponse.json({
      success: true,
      client,
      allClients: INITIAL_CLIENTS.map((c) => ({
        id: c.id,
        accountNumber: c.accountNumber,
        companyName: c.companyName,
        industry: c.industry,
      })),
      campaigns,
      artworks,
      workOrders,
      invoices,
      payments,
      contracts,
      metrics: {
        totalBilled,
        totalPaid,
        balanceDue,
        activeFlights,
        totalCampaigns: campaigns.length,
        pendingArtworkApprovals,
        totalImpressions,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve client portal workspace data.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'APPROVE_ARTWORK') {
      const { artworkId, approverName, approverEmail, notes } = body;
      const res = approveArtwork(artworkId, {
        approvedBy: approverName || 'Authorized Signatory',
        approverEmail: approverEmail || 'signatory@client.com',
        approverRole: 'Client Marketing Director',
        notes: notes || 'Approved via Client Portal self-service console.',
        approvalMethod: 'DIGITAL_SIGNATURE',
      });
      return NextResponse.json(res);
    }

    if (action === 'REQUEST_REVISION') {
      const { artworkId, revisionReason, requestedBy } = body;
      const res = requestRevision(artworkId, revisionReason, requestedBy || 'Client Portal');
      return NextResponse.json(res);
    }

    if (action === 'PAY_INVOICE') {
      const { invoiceId, amount, paymentMethod, referenceNumber, notes, receivedBy } = body;
      const res = recordPayment({
        invoiceId,
        amount,
        paymentMethod: paymentMethod || 'CREDIT_CARD',
        referenceNumber: referenceNumber || `STRIPE_PORTAL_${Date.now().toString().slice(-6)}`,
        notes: notes || 'Paid online via Client Self-Service Portal.',
        receivedBy: receivedBy || 'Self-Service Portal (Stripe)',
      });
      return NextResponse.json(res);
    }

    return NextResponse.json(
      { success: false, error: `Unsupported portal action: ${action}` },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to process portal transaction.' },
      { status: 500 }
    );
  }
}
