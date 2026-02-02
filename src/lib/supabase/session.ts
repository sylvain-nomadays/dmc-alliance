import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

export async function updateSupabaseSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('🔍 [MIDDLEWARE] Path:', request.nextUrl.pathname);

  if (!url || !key) {
    console.error('❌ [MIDDLEWARE] Supabase env missing');
    return response;
  }

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  console.log('🔍 [MIDDLEWARE] User:', user?.email || 'NOT LOGGED IN', 'Error:', userError?.message || 'none');

  // 🔴 Pas connecté → login (avec locale)
  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/fr/auth/login';
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    console.log('🔴 [MIDDLEWARE] Redirecting to login:', loginUrl.toString());
    return NextResponse.redirect(loginUrl);
  }

  // 🔍 Récupération DU RÔLE
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  console.log('🔍 [MIDDLEWARE] Profile:', profile, 'Error:', error?.message || 'none');

  // Si pas de profil, on le crée avec le rôle par défaut
  if (error || !profile) {
    console.warn('⚠️ [MIDDLEWARE] Profile not found for:', user.email, '- Error:', error?.message);

    // Créer le profil automatiquement
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase as any)
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
        role: 'user',
      });

    if (insertError) {
      console.error('❌ [MIDDLEWARE] Failed to create profile:', insertError.message);
    }

    if (request.nextUrl.pathname.startsWith('/admin')) {
      console.warn('⛔ [MIDDLEWARE] New user trying to access admin -> redirect to /fr');
      return NextResponse.redirect(new URL('/fr', request.url));
    }

    return response;
  }

  // 🔐 Protection admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    console.log('🔐 [MIDDLEWARE] Checking admin access. Role:', profile.role);
    if (profile.role !== 'admin') {
      console.warn('⛔ [MIDDLEWARE] Not admin! Role is:', profile.role, '-> redirect to /fr');
      return NextResponse.redirect(new URL('/fr', request.url));
    }
    console.log('✅ [MIDDLEWARE] Admin access granted!');
  }

  return response;
}
