import { NextRequest, NextResponse } from 'next/server';

const isDevelopment = process.env.NODE_ENV === 'development';
const connectSrc = isDevelopment ? "'self' http: https: ws: wss:" : "'self' https:";

function createSecurityHeaders(nonce: string) {
  const developmentScriptSource = isDevelopment ? " 'unsafe-eval'" : '';

  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Content-Security-Policy': `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${developmentScriptSource}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src ${connectSrc}; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`,
  };
}

function withSecurityHeaders(response: NextResponse, securityHeaders: ReturnType<typeof createSecurityHeaders>) {
  Object.entries(securityHeaders).forEach(([key, value]) => response.headers.set(key, value));
  return response;
}

export function middleware(req: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const securityHeaders = createSecurityHeaders(nonce);

  if (req.nextUrl.pathname === '/') {
    return withSecurityHeaders(NextResponse.redirect(new URL('/login', req.url)), securityHeaders);
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('Content-Security-Policy', securityHeaders['Content-Security-Policy']);
  requestHeaders.set('x-nonce', nonce);

  return withSecurityHeaders(
    NextResponse.next({ request: { headers: requestHeaders } }),
    securityHeaders,
  );
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
