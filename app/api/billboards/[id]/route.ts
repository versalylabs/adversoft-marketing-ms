import { NextResponse } from 'next/server';
import {
  getBillboardById,
  updateBillboard,
  updateBillboardStatus,
  deleteBillboard,
  BillboardStatus,
} from '@/lib/data/billboards-store';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const billboard = getBillboardById(id);

  if (!billboard) {
    return NextResponse.json(
      { error: `Billboard with id or code '${id}' not found` },
      { status: 404 }
    );
  }

  return NextResponse.json({ billboard });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.status && Object.keys(body).length <= 2) {
      // Status update with optional notes
      const updated = updateBillboardStatus(id, body.status as BillboardStatus, body.notes);
      if (!updated) {
        return NextResponse.json({ error: 'Billboard not found' }, { status: 404 });
      }
      return NextResponse.json({
        message: 'Status updated successfully',
        billboard: updated,
      });
    }

    const updated = updateBillboard(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Billboard not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Billboard updated successfully',
      billboard: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = deleteBillboard(id);

  if (!deleted) {
    return NextResponse.json({ error: 'Billboard not found' }, { status: 404 });
  }

  return NextResponse.json({
    message: `Billboard ${id} successfully removed from inventory`,
  });
}
