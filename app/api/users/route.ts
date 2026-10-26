import { NextResponse } from 'next/server';
import { INITIAL_USERS } from '@/lib/data/users-store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const org = searchParams.get('org');

  let users = [...INITIAL_USERS];

  if (role) {
    users = users.filter((u) => u.role === role);
  }
  if (org) {
    users = users.filter((u) => u.organizationId === org);
  }

  return NextResponse.json({
    total: users.length,
    users,
  });
}
