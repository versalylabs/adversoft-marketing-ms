import { NextResponse } from 'next/server';
import {
  getStoredArtworks,
  uploadArtworkRevision,
  requestArtworkRevision,
  approveArtwork,
  dispatchPrintTicket,
} from '@/lib/data/artwork-store';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const list = getStoredArtworks();
    const artwork = list.find((a) => a.id === id || a.artworkNumber === id);

    if (!artwork) {
      return NextResponse.json({ success: false, error: 'Artwork not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, artwork });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve artwork.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action === 'upload_revision') {
      const res = uploadArtworkRevision(id, body);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        artwork: res.artwork,
        message: `Revision v${res.artwork?.currentVersion} uploaded successfully.`,
      });
    }

    if (action === 'request_revision') {
      const { revisionReason, requestedBy } = body;
      const res = requestArtworkRevision(id, revisionReason, requestedBy);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        artwork: res.artwork,
        message: 'Revision requested and logged for design team.',
      });
    }

    if (action === 'approve') {
      const res = approveArtwork(id, body);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        artwork: res.artwork,
        message: 'Client digital approval verified and locked.',
      });
    }

    if (action === 'dispatch_print') {
      const res = dispatchPrintTicket(id, body);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        artwork: res.artwork,
        message: `Print ticket ${res.artwork?.printTicket?.ticketNumber} dispatched to vendor.`,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action specified.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to process artwork action.' },
      { status: 500 }
    );
  }
}
