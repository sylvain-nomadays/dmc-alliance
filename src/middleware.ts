import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './navigation';
import { updateSupabaseSession } from './lib/supabase/session';

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Détection des routes protégées (sans header/footer public)
  const isProtectedRoute =
    pathname.includes('/admin') ||
    pathname.includes('/partner') ||
    pathname.includes('/agency') ||
    pathname.includes('/espace-pro');

  if (isProtectedRoute) {
    const response = await updateSupabaseSession(request);
    // Ajouter un header pour indiquer que c'est une route protégée
    response.headers.set('x-protected-route', 'true');
    return response;
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
