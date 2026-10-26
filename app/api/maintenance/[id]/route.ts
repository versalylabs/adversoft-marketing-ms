import { NextResponse } from 'next/server';
import {
  getStoredMaintenanceRecords,
  dispatchMaintenanceTechnician,
  updateMaintenanceStatus,
  resolveMaintenanceIncident,
} from '@/lib/data/maintenance-store';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const list = getStoredMaintenanceRecords();
    const record = list.find((m) => m.id === id || m.incidentNumber === id);

    if (!record) {
      return NextResponse.json({ success: false, error: 'Maintenance record not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, record });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve maintenance record.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action === 'dispatch_tech') {
      const { technicianId } = body;
      const res = dispatchMaintenanceTechnician(id, technicianId);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        record: res.record,
        message: `Technician ${res.record?.technicianName} dispatched.`,
      });
    }

    if (action === 'update_status') {
      const { newStatus } = body;
      const res = updateMaintenanceStatus(id, newStatus);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        record: res.record,
        message: `Incident status updated to ${newStatus}.`,
      });
    }

    if (action === 'resolve_incident') {
      const res = resolveMaintenanceIncident(id, body);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        record: res.record,
        message: `Incident ${res.record?.incidentNumber} certified as resolved.`,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action specified.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to process maintenance action.' },
      { status: 500 }
    );
  }
}
