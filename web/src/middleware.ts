import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from './lib/session';

// Define public routes that don't require authentication
const publicRoutes = ['/login', '/api/auth/login', '/api/auth/logout', '/api/agent/report', '/api/agent/download'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Exclude static files and next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/icon.svg') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get('session');
  
  if (!sessionCookie) {
    return redirectToLogin(request);
  }

  // Verify the session
  const payload = await verifySession(sessionCookie.value);
  
  if (!payload) {
    // Session is invalid or expired
    const response = redirectToLogin(request);
    response.cookies.delete('session');
    return response;
  }

  // Pass user details in headers for API routes if needed
  const response = NextResponse.next();
  response.headers.set('x-user-id', payload.id);
  response.headers.set('x-user-role', payload.role);
  response.headers.set('x-user-name', payload.username);
  
  return response;
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!api/agent|_next/static|_next/image|favicon.ico).*)'],
};
