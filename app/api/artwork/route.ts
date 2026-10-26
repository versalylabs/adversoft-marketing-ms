import { NextResponse } from 'next/server';
import {
  getStoredArtworks,
  createArtwork,
  getArtworkMetrics,
  ArtworkStatus,
  CreateArtworkInput,
} from '@/lib/data/artwork-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as ArtworkStatus | 'ALL' | null;
    const campaignId = searchParams.get('campaignId');
    const clientId = searchParams.get('clientId');
    const search = searchParams.get('search');

    let list = getStoredArtworks();

    if (status && status !== 'ALL') {
      list = list.filter((a) => a.status === status);
    }
    if (campaignId && campaignId !== 'ALL') {
      list = list.filter((a) => a.campaignId === campaignId || a.campaignNumber === campaignId);
    }
    if (clientId && clientId !== 'ALL') {
      list = list.filter((a) => a.clientId === clientId);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.artworkNumber.toLowerCase().includes(q) ||
          a.title.toLowerCase().includes(q) ||
          a.campaignName.toLowerCase().includes(q) ||
          a.clientCompanyName.toLowerCase().includes(q) ||
          a.billboardCode.toLowerCase().includes(q) ||
          a.billboardCity.toLowerCase().includes(q)
      );
    }

    const metrics = getArtworkMetrics();

    return NextResponse.json({
      success: true,
      artworks: list,
      metrics,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve artworks.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: CreateArtworkInput = await request.json();
    const result = createArtwork(body);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      artwork: result.artwork,
      message: `Artwork asset ${result.artwork?.artworkNumber} initialized for review.`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to initialize artwork asset.' },
      { status: 500 }
    );
  }
}
