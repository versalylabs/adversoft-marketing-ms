import { NextResponse } from 'next/server';
import {
  getStoredMaintenanceRecords,
  createMaintenanceIncident,
  getMaintenanceMetrics,
  getMaintenanceTechnicians,
  MaintenanceStatus,
  MaintenanceSeverity,
  MaintenanceIncidentType,
  CreateMaintenanceInput,
} from '@/lib/data/maintenance-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as MaintenanceStatus | 'ALL' | null;
    const severity = searchParams.get('severity') as MaintenanceSeverity | 'ALL' | null;
    const type = searchParams.get('type') as MaintenanceIncidentType | 'ALL' | null;
    const search = searchParams.get('search');

    let list = getStoredMaintenanceRecords();

    if (status && status !== 'ALL') {
      list = list.filter((m) => m.status === status);
    }
    if (severity && severity !== 'ALL') {
      list = list.filter((m) => m.severity === severity);
    }
    if (type && type !== 'ALL') {
      list = list.filter((m) => m.type === type);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.incidentNumber.toLowerCase().includes(q) ||
          m.title.toLowerCase().includes(q) ||
          m.billboardCode.toLowerCase().includes(q) ||
          m.billboardCity.toLowerCase().includes(q) ||
          (m.technicianName && m.technicianName.toLowerCase().includes(q))
      );
    }

    const metrics = getMaintenanceMetrics();
    const technicians = getMaintenanceTechnicians();

    return NextResponse.json({
      success: true,
      records: list,
      metrics,
      technicians,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve maintenance incidents.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: CreateMaintenanceInput = await request.json();
    const result = createMaintenanceIncident(body);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      record: result.record,
      message: `Maintenance incident ${result.record?.incidentNumber} filed successfully.`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to file maintenance incident.' },
      { status: 500 }
    );
  }
}
