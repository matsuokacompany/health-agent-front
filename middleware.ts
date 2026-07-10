import { NextRequest, NextResponse } from 'next/server';

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
};

function withSecurityHeaders(response: NextResponse) {
  Object.entries(securityHeaders).forEach(([key, value]) => response.headers.set(key, value));
  return response;
}

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === '/') return withSecurityHeaders(NextResponse.redirect(new URL('/login', req.url)));
  return withSecurityHeaders(NextResponse.next());
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
