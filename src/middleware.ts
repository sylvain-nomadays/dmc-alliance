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

  // Créer les headers de requête modifiés
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  if (isProtectedRoute) {
    // Pour les routes protégées, mettre à jour la session Supabase
    return await updateSupabaseSession(request);
  }

  // Pour les routes publiques, utiliser le middleware i18n
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
