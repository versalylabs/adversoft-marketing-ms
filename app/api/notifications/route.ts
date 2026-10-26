import { NextResponse } from 'next/server';
import {
  getStoredNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  dispatchNotification,
  getStoredAutomationRules,
  toggleAutomationRule,
  triggerAutomationRuleExecution,
  getStoredTransactionalEmails,
  getNotificationMetrics,
  NotificationCategory,
} from '@/lib/data/notifications-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as NotificationCategory | 'ALL' | null;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const search = searchParams.get('search');

    let notifications = getStoredNotifications();

    if (category && category !== 'ALL') {
      notifications = notifications.filter((n) => n.category === category);
    }
    if (unreadOnly) {
      notifications = notifications.filter((n) => !n.isRead);
    }
    if (search) {
      const q = search.toLowerCase();
      notifications = notifications.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q) ||
          n.category.toLowerCase().includes(q)
      );
    }

    const rules = getStoredAutomationRules();
    const emails = getStoredTransactionalEmails();
    const metrics = getNotificationMetrics();

    return NextResponse.json({
      success: true,
      notifications,
      rules,
      emails,
      metrics,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve notifications.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'MARK_READ') {
      const updated = markAsRead(body.id);
      return NextResponse.json({ success: true, notifications: updated });
    }

    if (action === 'MARK_ALL_READ') {
      const updated = markAllAsRead();
      return NextResponse.json({ success: true, notifications: updated });
    }

    if (action === 'DELETE') {
      const updated = deleteNotification(body.id);
      return NextResponse.json({ success: true, notifications: updated });
    }

    if (action === 'CLEAR_ALL') {
      const updated = clearAllNotifications();
      return NextResponse.json({ success: true, notifications: updated });
    }

    if (action === 'TOGGLE_RULE') {
      const updated = toggleAutomationRule(body.ruleId);
      return NextResponse.json({ success: true, rules: updated });
    }

    if (action === 'TRIGGER_RULE') {
      const result = triggerAutomationRuleExecution(body.ruleId);
      return NextResponse.json(result);
    }

    if (action === 'DISPATCH') {
      const item = dispatchNotification({
        title: body.title,
        message: body.message,
        category: body.category || 'SYSTEM',
        priority: body.priority || 'MEDIUM',
        actionUrl: body.actionUrl,
        actionLabel: body.actionLabel,
        recipientRole: body.recipientRole,
        recipientEmail: body.recipientEmail,
      });
      return NextResponse.json({ success: true, notification: item });
    }

    return NextResponse.json(
      { success: false, error: `Unsupported notification action: ${action}` },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to process notification transaction.' },
      { status: 500 }
    );
  }
}
