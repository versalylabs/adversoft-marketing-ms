import { NextResponse } from 'next/server';
import {
  getExecutiveAnalytics,
  REPORT_DOCUMENTS,
  ReportDocument,
  TimeRangeFilter,
} from '@/lib/data/reports-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = (searchParams.get('timeRange') as TimeRangeFilter) || 'YTD';

    const analytics = getExecutiveAnalytics(timeRange);

    return NextResponse.json({
      success: true,
      timeRange,
      analytics,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve executive analytics.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, category, period, summary, highlights, author } = body;

    const newReport: ReportDocument = {
      id: `rpt_${Date.now()}`,
      reportNumber: `RPT-2026-${Date.now().toString().slice(-4)}`,
      title: title || 'Custom Executive Performance Report',
      category: category || 'EXECUTIVE_BRIEFING',
      period: period || 'Custom Period 2026',
      generatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      generatedBy: author || 'Adversoft Analytics Engine',
      summary: summary || 'Automated on-demand executive briefing generated from current operational and commercial telemetry.',
      highlights: highlights || [
        'Occupancy rate tracking at target commercial levels.',
        'Yield per face optimized across key metropolitan routes.',
        'Zero critical SLA illumination breaches recorded.',
      ],
    };

    REPORT_DOCUMENTS.unshift(newReport);

    return NextResponse.json({
      success: true,
      report: newReport,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to compile custom report.' },
      { status: 500 }
    );
  }
}
