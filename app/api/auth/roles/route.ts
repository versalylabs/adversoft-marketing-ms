import { NextResponse } from 'next/server';
import { ROLE_DEFINITIONS } from '@/lib/rbac';

export async function GET() {
  return NextResponse.json({
    totalRoles: Object.keys(ROLE_DEFINITIONS).length,
    roles: Object.values(ROLE_DEFINITIONS),
  });
}
