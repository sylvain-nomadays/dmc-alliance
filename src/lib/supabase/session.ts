import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

interface SessionResult {
  supabase: SupabaseClient<Database>;
  user: User | null;
  response: NextResponse;
}

export async function updateSupabaseSession(request: NextRequest): Promise<SessionResult> {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('❌ [MIDDLEWARE] Supabase env missing');
    // Return a dummy client that won't be used — caller checks user === null
    const supabase = createServerClient<Database>(url || '', key || '', {
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
    });
    return { supabase, user: null, response: supabaseResponse };
  }

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user, response: supabaseResponse };
}

/**
 * Full auth check for protected routes (admin, espace-pro, etc.)
 * Verifies user is logged in and has the appropriate role.
 */
export async function protectRoute(request: NextRequest) {
  const { supabase, user, response } = await updateSupabaseSession(request);

  const pathname = request.nextUrl.pathname;

  // Not logged in → redirect to login
  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/fr/auth/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Fetch profile for role check
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // No profile → auto-create and allow non-admin routes
  if (error || !profile) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
        role: 'user',
      });

    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/fr', request.url));
    }

    return response;
  }

  // Admin route protection
  if (pathname.startsWith('/admin')) {
    const allowedRoles = ['admin', 'partner'];

    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.redirect(new URL('/fr', request.url));
    }

    // Partners can only access certain admin pages
    if (profile.role === 'partner') {
      const allowedPartnerPaths = [
        '/admin',
        '/admin/destinations',
        '/admin/circuits',
        '/admin/articles',
        '/admin/media',
        '/admin/agency-requests',
        '/admin/my-agency',
        '/admin/join-requests',
      ];

      const isAllowed = allowedPartnerPaths.some(
        (path) => pathname === path || pathname.startsWith(path + '/')
      );

      if (!isAllowed) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    }
  }

  return response;
}
