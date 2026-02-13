import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
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
    const protectedResponse = await protectRoute(request);

    // If protectRoute returned a redirect, pass it through directly
    if (protectedResponse.status >= 300 && protectedResponse.status < 400) {
      return protectedResponse;
    }

    // Admin routes are NOT under [locale], so skip intl middleware for them
    if (pathname.startsWith('/admin')) {
      return protectedResponse;
    }

    // For non-admin protected routes (e.g. espace-pro), run intl middleware and merge cookies
    const intlResponse = intlMiddleware(request);

    // Copy all Supabase auth cookies (with full options) onto intl response
    protectedResponse.cookies.getAll().forEach((cookie) => {
      intlResponse.cookies.set(cookie);
    });

    return intlResponse;
  }

  // Handle auth code from Supabase email redirects (password reset, email verification)
  // When the code arrives at the homepage (Supabase fallback), redirect to the
  // reset-password page and let it handle the code exchange client-side.
  const code = request.nextUrl.searchParams.get('code');
  if (code && !pathname.includes('/auth/reset-password')) {
    const localeMatch = pathname.match(/^\/(fr|en|de|nl|es|it)/);
    const locale = localeMatch ? localeMatch[1] : 'fr';

    const resetUrl = new URL(`/${locale}/auth/reset-password`, request.url);
    resetUrl.searchParams.set('code', code);
    return NextResponse.redirect(resetUrl);
  }

  // Public routes: refresh Supabase session (keeps cookies alive)
  // then apply i18n middleware, preserving the updated auth cookies
  const { response: supabaseResponse } = await updateSupabaseSession(request);
  const intlResponse = intlMiddleware(request);

  // Copy Supabase auth cookies (with full options) onto the intl response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie);
  });

  return intlResponse;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
