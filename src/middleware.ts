import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './navigation';
import { updateSupabaseSession, protectRoute } from './lib/supabase/session';

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Detect protected routes
  const isProtectedRoute =
    pathname.includes('/admin') ||
    pathname.includes('/partner') ||
    pathname.includes('/agency') ||
    pathname.includes('/espace-pro');

  if (isProtectedRoute) {
    // Protected routes: full auth check + role validation
    return await protectRoute(request);
  }

  // Public routes: refresh Supabase session (keeps cookies alive)
  // then apply i18n middleware, preserving the updated auth cookies
  const { response: supabaseResponse } = await updateSupabaseSession(request);
  const intlResponse = intlMiddleware(request);

  // Copy Supabase auth cookies onto the intl response so the browser keeps them
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value);
  });

  return intlResponse;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
