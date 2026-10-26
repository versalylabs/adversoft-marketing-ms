import { NextRequest, NextResponse } from 'next/server';
import { performOmniSearch, SearchCategory } from '@/lib/data/audit-search-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const category = (searchParams.get('category') || 'ALL') as SearchCategory;

    const results = performOmniSearch(q, category);

    return NextResponse.json({
      success: true,
      query: q,
      category,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error('Error performing global search:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform omni search' },
      { status: 500 }
    );
  }
}
