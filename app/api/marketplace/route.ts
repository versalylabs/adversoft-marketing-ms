import { NextResponse } from 'next/server';
import {
  getMarketplaceBillboards,
  getMarketplaceMetrics,
  submitMarketplaceBookingRequest,
  MarketplaceFilterState,
} from '@/lib/data/marketplace-store';
import { INITIAL_BILLBOARDS, BillboardItem } from '@/lib/data/billboards-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: Partial<MarketplaceFilterState> = {
      searchQuery: searchParams.get('search') || '',
      city: searchParams.get('city') || 'ALL',
      type: searchParams.get('type') || 'ALL',
      availability: (searchParams.get('availability') as any) || 'ALL',
      maxBudget: searchParams.get('maxBudget') ? Number(searchParams.get('maxBudget')) : 35000,
      minTraffic: searchParams.get('minTraffic') ? Number(searchParams.get('minTraffic')) : 0,
      isDigitalOnly: searchParams.get('isDigitalOnly') === 'true',
      sortBy: (searchParams.get('sortBy') as any) || 'POPULAR',
    };

    const billboards = getMarketplaceBillboards(filters);
    const metrics = getMarketplaceMetrics();

    // Unique cities and types for filtering
    const listed = INITIAL_BILLBOARDS.filter((b) => b.isMarketplaceListed);
    const cities = Array.from(new Set(listed.map((b) => b.location.city))).sort();
    const types = Array.from(new Set(listed.map((b) => b.type))).sort();

    return NextResponse.json({
      success: true,
      billboards,
      metrics,
      cities,
      types,
      count: billboards.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve marketplace catalog.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.billboardId) {
      return NextResponse.json(
        { success: false, error: 'Billboard ID is required.' },
        { status: 400 }
      );
    }

    const billboard = INITIAL_BILLBOARDS.find((b) => b.id === body.billboardId || b.code === body.billboardId);
    if (!billboard) {
      return NextResponse.json(
        { success: false, error: 'Billboard not found in inventory catalog.' },
        { status: 404 }
      );
    }

    if (!body.companyName || !body.contactName || !body.contactEmail || !body.contactPhone) {
      return NextResponse.json(
        { success: false, error: 'Advertiser contact details (Company, Name, Email, Phone) are required.' },
        { status: 400 }
      );
    }

    if (!body.startDate || !body.endDate) {
      return NextResponse.json(
        { success: false, error: 'Flight start and end dates are required.' },
        { status: 400 }
      );
    }

    const result = submitMarketplaceBookingRequest({
      billboard,
      companyName: body.companyName,
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      industry: body.industry,
      website: body.website,
      campaignName: body.campaignName || `Campaign - ${body.companyName}`,
      startDate: body.startDate,
      endDate: body.endDate,
      requiresPrinting: body.requiresPrinting !== false,
      requiresInstallation: body.requiresInstallation !== false,
      requiresArtworkDesign: Boolean(body.requiresArtworkDesign),
      hasOwnArtwork: Boolean(body.hasOwnArtwork),
      notes: body.notes,
    });

    return NextResponse.json({
      success: true,
      request: result.request,
      crmLeadNumber: result.crmLead.leadNumber,
      bookingNumber: result.bookingRecord?.bookingNumber,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to submit marketplace booking inquiry.' },
      { status: 500 }
    );
  }
}
