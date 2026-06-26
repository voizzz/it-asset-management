import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from './lib/session';

// Define public routes that don't require authentication
const publicRoutes = ['/login', '/api/auth/login', '/api/auth/logout', '/api/agent/report', '/api/agent/download', '/submit-ticket', '/api/employees', '/api/tickets', '/api/tickets/otp/request', '/api/tickets/otp/verify'];

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

  const isPublicRoute = publicRoutes.includes(pathname);
  const sessionCookie = request.cookies.get('session');

  if (!sessionCookie) {
    if (isPublicRoute) {
      return NextResponse.next();
    }
    return redirectToLogin(request);
  }

  // Verify the session
  const payload = await verifySession(sessionCookie.value);
  
  if (!payload) {
    // Session is invalid or expired
    if (isPublicRoute) {
      const response = NextResponse.next();
      response.cookies.delete('session');
      return response;
    }
    const response = redirectToLogin(request);
    response.cookies.delete('session');
    return response;
  }

  // Pass user details in headers for API routes if needed
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', String(payload.id));
  requestHeaders.set('x-user-role', String(payload.role));
  requestHeaders.set('x-user-name', String(payload.username));
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  });
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!api/agent|_next/static|_next/image|favicon.ico).*)'],
};
