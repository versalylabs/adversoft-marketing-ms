import { NextRequest, NextResponse } from 'next/server';
import {
  getStoredOrgSettings,
  saveStoredOrgSettings,
  getStoredRegionalOffices,
  saveStoredRegionalOffices,
  getStoredBackupConfig,
  saveStoredBackupConfig,
  getStoredSnapshots,
  INITIAL_DIAGNOSTICS,
} from '@/lib/data/settings-store';

export async function GET() {
  try {
    const organization = getStoredOrgSettings();
    const regionalOffices = getStoredRegionalOffices();
    const backupConfig = getStoredBackupConfig();
    const snapshots = getStoredSnapshots();

    return NextResponse.json({
      success: true,
      organization,
      regionalOffices,
      backupConfig,
      snapshots,
      diagnostics: INITIAL_DIAGNOSTICS,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve system settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.organization) {
      saveStoredOrgSettings(body.organization);
    }

    if (body.regionalOffices) {
      saveStoredRegionalOffices(body.regionalOffices);
    }

    if (body.backupConfig) {
      saveStoredBackupConfig(body.backupConfig);
    }

    return NextResponse.json({
      success: true,
      message: 'System configuration updated successfully',
      organization: getStoredOrgSettings(),
      regionalOffices: getStoredRegionalOffices(),
      backupConfig: getStoredBackupConfig(),
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save system settings' },
      { status: 500 }
    );
  }
}
