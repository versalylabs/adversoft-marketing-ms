import { NextResponse } from 'next/server';
import {
  getStoredCampaigns,
  updateCampaignStatus,
  toggleCampaignTask,
  addCampaignTask,
  addProofPhoto,
  generateProofReport,
} from '@/lib/data/campaigns-store';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const list = getStoredCampaigns();
    const campaign = list.find((c) => c.id === id || c.campaignNumber === id);

    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve campaign.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action === 'update_status') {
      const { newStatus, reason } = body;
      const res = updateCampaignStatus(id, newStatus, reason);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        campaign: res.campaign,
        message: `Campaign status changed to ${newStatus}.`,
      });
    }

    if (action === 'toggle_task') {
      const { taskId } = body;
      const res = toggleCampaignTask(id, taskId);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        campaign: res.campaign,
        message: 'Task progress updated.',
      });
    }

    if (action === 'add_task') {
      const { taskInput } = body;
      const res = addCampaignTask(id, taskInput);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        campaign: res.campaign,
        message: 'Campaign milestone task added.',
      });
    }

    if (action === 'add_photo') {
      const { siteId, photo } = body;
      const res = addProofPhoto(id, siteId, photo);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        campaign: res.campaign,
        message: 'Proof of performance photo logged.',
      });
    }

    if (action === 'generate_proof_report') {
      const { summaryNotes, certifiedBy } = body;
      const res = generateProofReport(id, summaryNotes, certifiedBy);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        campaign: res.campaign,
        message: 'Proof of performance dossier certified successfully.',
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action specified.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to execute campaign modification.' },
      { status: 500 }
    );
  }
}
