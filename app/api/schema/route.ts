import { NextResponse } from 'next/server';
import { DATABASE_MODELS } from '@/lib/data/schema-metadata';

export async function GET() {
  return NextResponse.json({
    totalModels: DATABASE_MODELS.length,
    models: DATABASE_MODELS,
  });
}
