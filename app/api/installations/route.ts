import { NextResponse } from 'next/server';
import {
  getStoredWorkOrders,
  createWorkOrder,
  getInstallationMetrics,
  getFieldCrews,
  WorkOrderStatus,
  WorkOrderType,
  CreateWorkOrderInput,
} from '@/lib/data/installations-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as WorkOrderStatus | 'ALL' | null;
    const type = searchParams.get('type') as WorkOrderType | 'ALL' | null;
    const crewId = searchParams.get('crewId');
    const search = searchParams.get('search');

    let list = getStoredWorkOrders();

    if (status && status !== 'ALL') {
      list = list.filter((w) => w.status === status);
    }
    if (type && type !== 'ALL') {
      list = list.filter((w) => w.type === type);
    }
    if (crewId && crewId !== 'ALL') {
      list = list.filter((w) => w.crewId === crewId);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (w) =>
          w.workOrderNumber.toLowerCase().includes(q) ||
          w.campaignName.toLowerCase().includes(q) ||
          w.clientCompanyName.toLowerCase().includes(q) ||
          w.billboardCode.toLowerCase().includes(q) ||
          w.billboardCity.toLowerCase().includes(q) ||
          (w.leadTechnician && w.leadTechnician.toLowerCase().includes(q))
      );
    }

    const metrics = getInstallationMetrics();
    const crews = getFieldCrews();

    return NextResponse.json({
      success: true,
      workOrders: list,
      metrics,
      crews,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve installation work orders.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: CreateWorkOrderInput = await request.json();
    const result = createWorkOrder(body);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      workOrder: result.workOrder,
      message: `Installation work order ${result.workOrder?.workOrderNumber} generated successfully.`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to generate installation work order.' },
      { status: 500 }
    );
  }
}
