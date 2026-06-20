import { NextRequest, NextResponse } from 'next/server';
import { handleAuthCallback } from '@/services/auth';

export async function GET(request: NextRequest) {
  await handleAuthCallback(request.nextUrl.searchParams);

  return NextResponse.redirect(new URL('/', request.url));
}
