import { NextRequest, NextResponse } from 'next/server';
import {
  getStoredAuditLogs,
  logAuditEvent,
  getAuditStats,
  AuditSeverity,
  AuditEntityType,
  AuditLogEntry,
} from '@/lib/data/audit-search-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const severity = searchParams.get('severity') as AuditSeverity | 'ALL' | null;
    const entityType = searchParams.get('entityType') as AuditEntityType | 'ALL' | null;

    let logs = getStoredAuditLogs();

    if (severity && severity !== 'ALL') {
      logs = logs.filter((l) => l.severity === severity);
    }

    if (entityType && entityType !== 'ALL') {
      logs = logs.filter((l) => l.entityType === entityType);
    }

    if (search) {
      logs = logs.filter(
        (l) =>
          l.entityTitle.toLowerCase().includes(search) ||
          l.description.toLowerCase().includes(search) ||
          l.actor.name.toLowerCase().includes(search) ||
          l.actor.email.toLowerCase().includes(search) ||
          l.actionLabel.toLowerCase().includes(search) ||
          l.id.toLowerCase().includes(search) ||
          l.entityId.toLowerCase().includes(search)
      );
    }

    const stats = getAuditStats();

    return NextResponse.json({
      success: true,
      stats,
      total: logs.length,
      logs,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve audit log trail' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.action || !body.entityType || !body.entityId || !body.actor) {
      return NextResponse.json(
        { success: false, error: 'Missing required audit event fields' },
        { status: 400 }
      );
    }

    const created = logAuditEvent({
      actor: body.actor,
      action: body.action,
      actionLabel: body.actionLabel || body.action,
      entityType: body.entityType,
      entityId: body.entityId,
      entityTitle: body.entityTitle || `${body.entityType} ${body.entityId}`,
      routeLink: body.routeLink,
      severity: body.severity || 'INFO',
      description: body.description || 'System state modification recorded',
      diff: body.diff || [],
      metadata: body.metadata || {},
    });

    return NextResponse.json({
      success: true,
      log: created,
    });
  } catch (error) {
    console.error('Error logging audit event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record audit event' },
      { status: 500 }
    );
  }
}
