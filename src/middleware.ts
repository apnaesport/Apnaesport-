
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PROTECTED_ROUTES = ['/dashboard', '/games', '/tournaments', '/profile', '/settings'];
const ADMIN_ROUTES = ['/admin']; // Base path for all admin routes

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const currentUserCookie = request.cookies.get('firebaseAuthToken'); // Example cookie name, adjust as needed

  // Check if the user is trying to access a protected route
  // The matcher should already ensure this middleware only runs on relevant paths,
  // but an explicit check can remain for clarity or future matcher changes.
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));

  if ((isProtectedRoute || isAdminRoute) && !currentUserCookie) {
    // If trying to access a protected/admin route without auth token, redirect to login
    // Preserve the intended destination for redirection after login
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // For admin routes, an additional check for admin role would ideally happen here
  // or be enforced by the AdminLayout component on the client-side.
  // Middleware typically doesn't have full access to DB or complex auth state easily.
  // For now, basic auth check is done. Role check is client-side in AdminLayout.

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
    // Add specific root paths if they are also protected and not covered by /:path*
    // For example, if /dashboard itself (not /dashboard/subpage) is protected:
    '/dashboard',
    '/games',
    '/tournaments',
    '/profile',
    '/settings',
    '/admin'
  ],
};
