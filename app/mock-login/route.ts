import { NextRequest, NextResponse } from 'next/server';
import type { Role } from '@/lib/types';
import { roleHome } from '@/lib/rbac';

const isRole = (value: string | null): value is Role =>
  value === 'patient' || value === 'professional' || value === 'admin';

export function GET(request: NextRequest) {
  const requestedRole = request.nextUrl.searchParams.get('role');
  const role = isRole(requestedRole) ? requestedRole : 'patient';
  const response = NextResponse.redirect(new URL(roleHome[role], request.url));

  response.cookies.set('role', role, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  return response;
}
