import { NextResponse } from 'next/server';
import {
  getStoredContracts,
  createContract,
  getContractMetrics,
  ContractStatus,
  ExpirationAlertTier,
  CreateContractInput,
} from '@/lib/data/contracts-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as ContractStatus | 'ALL' | null;
    const alertTier = searchParams.get('alertTier') as ExpirationAlertTier | 'ALL' | null;
    const clientId = searchParams.get('clientId');
    const search = searchParams.get('search');

    let list = getStoredContracts();

    if (status && status !== 'ALL') {
      list = list.filter((c) => c.status === status);
    }
    if (alertTier && alertTier !== 'ALL') {
      list = list.filter((c) => c.expirationAlertTier === alertTier);
    }
    if (clientId && clientId !== 'ALL') {
      list = list.filter((c) => c.clientId === clientId);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.contractNumber.toLowerCase().includes(q) ||
          c.clientCompanyName.toLowerCase().includes(q) ||
          c.campaignName.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q)
      );
    }

    const metrics = getContractMetrics();

    return NextResponse.json({
      success: true,
      contracts: list,
      metrics,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve contracts.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: CreateContractInput = await request.json();
    const result = createContract(body);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      contract: result.contract,
      message: `Agreement ${result.contract?.contractNumber} generated successfully.`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to process contract creation.' },
      { status: 500 }
    );
  }
}
