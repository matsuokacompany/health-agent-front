import { handleSignIn } from '@logto/next/server-actions';
import { NextRequest, NextResponse } from 'next/server';
import { logtoConfig } from '@/app/logto';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  await handleSignIn(logtoConfig, searchParams);

  return NextResponse.redirect(new URL('/', request.url));
}