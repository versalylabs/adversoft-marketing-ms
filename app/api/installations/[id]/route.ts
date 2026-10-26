import { NextResponse } from 'next/server';
import {
  getStoredWorkOrders,
  assignCrewToWorkOrder,
  updateWorkOrderStatus,
  uploadInstallationProof,
  updateSafetyChecklist,
} from '@/lib/data/installations-store';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const list = getStoredWorkOrders();
    const order = list.find((o) => o.id === id || o.workOrderNumber === id);

    if (!order) {
      return NextResponse.json({ success: false, error: 'Work order not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, workOrder: order });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve work order.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action === 'assign_crew') {
      const { crewId, scheduledDate, timeWindow } = body;
      const res = assignCrewToWorkOrder(id, crewId, scheduledDate, timeWindow);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        workOrder: res.workOrder,
        message: 'Field crew assigned and job scheduled.',
      });
    }

    if (action === 'update_status') {
      const { newStatus } = body;
      const res = updateWorkOrderStatus(id, newStatus);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        workOrder: res.workOrder,
        message: `Work order status changed to ${newStatus}.`,
      });
    }

    if (action === 'upload_proof') {
      const res = uploadInstallationProof(id, body);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        workOrder: res.workOrder,
        message: 'Proof-of-posting inspection photos uploaded and verified.',
      });
    }

    if (action === 'update_safety') {
      const res = updateSafetyChecklist(id, body.checklist);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        workOrder: res.workOrder,
        message: 'Safety checklist protocols updated.',
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action specified.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to process work order action.' },
      { status: 500 }
    );
  }
}
