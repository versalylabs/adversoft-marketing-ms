import { NextResponse } from 'next/server';
import {
  getStoredCampaigns,
  createCampaign,
  getCampaignMetrics,
  CampaignStatus,
  CreateCampaignInput,
} from '@/lib/data/campaigns-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as CampaignStatus | 'ALL' | null;
    const clientId = searchParams.get('clientId');
    const search = searchParams.get('search');

    let list = getStoredCampaigns();

    if (status && status !== 'ALL') {
      list = list.filter((c) => c.status === status);
    }
    if (clientId && clientId !== 'ALL') {
      list = list.filter((c) => c.clientId === clientId);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.campaignNumber.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.clientCompanyName.toLowerCase().includes(q) ||
          c.brandName.toLowerCase().includes(q) ||
          c.sites.some(
            (s) =>
              s.billboardCode.toLowerCase().includes(q) ||
              s.billboardCity.toLowerCase().includes(q)
          )
      );
    }

    const metrics = getCampaignMetrics();

    return NextResponse.json({
      success: true,
      campaigns: list,
      metrics,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve campaigns.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: CreateCampaignInput = await request.json();
    const result = createCampaign(body);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      campaign: result.campaign,
      message: `Campaign ${result.campaign?.campaignNumber} workspace initialized successfully.`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create campaign workspace.' },
      { status: 500 }
    );
  }
}
