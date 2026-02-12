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
    return await protectRoute(request);
  }

  // Handle PKCE code from Supabase email redirects (password reset, email verification)
  // When Supabase can't use our redirectTo (not in allowlist), it falls back to
  // the Site URL with ?code=xxx. We intercept it here, exchange the code,
  // and redirect to the appropriate page.
  const code = request.nextUrl.searchParams.get('code');
  if (code) {
    const { supabase, response: supabaseResponse } = await updateSupabaseSession(request);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Extract locale from pathname (e.g., /fr, /en) or default to 'fr'
      const localeMatch = pathname.match(/^\/(fr|en|de|nl|es|it)/);
      const locale = localeMatch ? localeMatch[1] : 'fr';

      // Redirect to reset-password page (the main use case for email-based codes)
      const resetUrl = new URL(`/${locale}/auth/reset-password`, request.url);
      const redirectResponse = NextResponse.redirect(resetUrl);

      // Copy session cookies so the browser keeps the authenticated session
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
      });

      return redirectResponse;
    }
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
