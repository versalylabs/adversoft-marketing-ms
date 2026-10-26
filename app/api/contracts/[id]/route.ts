import { NextResponse } from 'next/server';
import {
  getStoredContracts,
  signContractByClient,
  countersignByAdversoft,
  renewContract,
} from '@/lib/data/contracts-store';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const contracts = getStoredContracts();
    const contract = contracts.find((c) => c.id === id || c.contractNumber === id);

    if (!contract) {
      return NextResponse.json({ success: false, error: 'Contract not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, contract });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve contract.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action === 'sign_client') {
      const { signerName, signerTitle } = body;
      const result = signContractByClient(id, signerName || 'Client Officer', signerTitle || 'Authorized Signatory');
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        contract: result.contract,
        message: 'Client digital signature applied successfully.',
      });
    }

    if (action === 'sign_adversoft') {
      const { officerName, officerTitle } = body;
      const result = countersignByAdversoft(id, officerName || 'Marcus Brody', officerTitle || 'Senior Vice President of Outdoor Media');
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        contract: result.contract,
        message: 'Adversoft countersignature executed successfully.',
      });
    }

    if (action === 'renew') {
      const { durationMonths = 3, rateEscalationPercent = 0 } = body;
      const result = renewContract(id, durationMonths, rateEscalationPercent);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        contract: result.newContract,
        message: `Contract successfully renewed under reference ${result.newContract?.contractNumber}.`,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action specified.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to process contract action.' },
      { status: 500 }
    );
  }
}
