import { NextRequest, NextResponse } from 'next/server';
import {
  generateFullSystemSnapshotBundle,
  createManualSnapshot,
  getStoredSnapshots,
} from '@/lib/data/settings-store';

export async function GET() {
  try {
    const bundle = generateFullSystemSnapshotBundle();
    const dateTag = new Date().toISOString().slice(0, 10);
    const filename = `adversoft_full_snapshot_${dateTag}.json`;

    return new NextResponse(JSON.stringify(bundle, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating snapshot download:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate system snapshot bundle' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const author = body.author || 'Alex Vance (Super Admin)';

    const snapshot = createManualSnapshot(author);

    return NextResponse.json({
      success: true,
      message: 'New system snapshot compiled and stored successfully',
      snapshot,
      snapshots: getStoredSnapshots(),
    });
  } catch (error) {
    console.error('Error creating manual snapshot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create system snapshot' },
      { status: 500 }
    );
  }
}
