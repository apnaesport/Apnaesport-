
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// const PROTECTED_ROUTES = ['/dashboard', '/games', '/tournaments', '/profile', '/settings'];
// const ADMIN_ROUTES = ['/admin']; // Base path for all admin routes

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // const currentUserCookie = request.cookies.get('firebaseAuthToken'); // Example cookie name, adjust as needed

  // The cookie 'firebaseAuthToken' is not being set by the current client-side Firebase auth flow.
  // Relying on it here causes a redirect loop after login.
  // Client-side guards in MainLayout and AdminLayout handle auth checks using AuthContext.

  // const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  // const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));

  // if ((isProtectedRoute || isAdminRoute) && !currentUserCookie) {
  //   const loginUrl = new URL('/auth/login', request.url);
  //   loginUrl.searchParams.set('redirect', pathname);
  //   return NextResponse.redirect(loginUrl);
  // }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/games/:path*',
    '/tournaments/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/dashboard',
    '/games',
    '/tournaments',
    '/profile',
    '/settings',
    '/admin'
  ],
};
