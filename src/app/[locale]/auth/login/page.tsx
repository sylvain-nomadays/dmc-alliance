'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authenticatedUser, setAuthenticatedUser] = useState<{ email: string; name: string } | null>(null);

  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params.locale as string) || 'fr';

  // ✅ redirect fiable (ex: /admin)
  const redirect = searchParams.get('redirect');

  // Check if already logged in → redirect to dashboard
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setCheckingAuth(false);
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .single();

        if (redirect) {
          window.location.href = redirect;
          return;
        }

        if (profile?.role === 'agency') {
          window.location.href = `/${locale}/espace-pro/dashboard`;
        } else if (profile?.role === 'admin' || profile?.role === 'partner') {
          window.location.href = '/admin';
        } else {
          // User is authenticated but has no dedicated portal
          setAuthenticatedUser({
            email: user.email || '',
            name: profile?.full_name || user.email?.split('@')[0] || '',
          });
          setCheckingAuth(false);
        }
      } catch {
        setCheckingAuth(false);
      }
    };

    checkExistingSession();
  }, [locale, redirect]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Si un redirect est spécifié, l'utiliser directement
    if (redirect) {
      window.location.href = redirect;
      return;
    }

    // Sinon, récupérer le profil pour déterminer le rôle et rediriger
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('role')
        .eq('id', authData.user?.id)
        .single();

      let targetUrl = `/${locale}`;

      if (profile?.role === 'agency') {
        targetUrl = `/${locale}/espace-pro/dashboard`;
      } else if (profile?.role === 'admin') {
        targetUrl = '/admin';
      } else if (profile?.role === 'partner') {
        targetUrl = '/admin';
      }

      // ✅ IMPORTANT : Utiliser window.location pour forcer une vraie navigation
      // Cela permet au middleware de s'exécuter et vérifier les permissions
      window.location.href = targetUrl;
    } catch {
      // En cas d'erreur, rediriger vers la home
      window.location.href = `/${locale}`;
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/${locale}/auth/callback${
          redirect ? `?redirect=${redirect}` : ''
        }`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = `/${locale}`;
  };

  if (checkingAuth) {
    return (
      <div className="max-w-md w-full text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta-500 mx-auto" />
      </div>
    );
  }

  // Authenticated user without a dedicated portal
  if (authenticatedUser) {
    return (
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href={`/${locale}`} className="inline-block">
            <h1 className="text-2xl font-heading text-terracotta-600">
              The DMC Alliance
            </h1>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8 text-center">
          <div className="w-16 h-16 bg-terracotta-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-terracotta-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-heading text-gray-900 mb-1">
            {authenticatedUser.name}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {authenticatedUser.email}
          </p>

          <Button onClick={handleLogout} variant="outline" fullWidth>
            Se déconnecter
          </Button>
        </div>

        <p className="mt-6 text-center">
          <Link href={`/${locale}`} className="text-sm text-gray-500">
            ← Retour au site
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href={`/${locale}`} className="inline-block">
          <h1 className="text-2xl font-heading text-terracotta-600">
            The DMC Alliance
          </h1>
        </Link>
        <h2 className="mt-4 text-xl font-heading text-gray-900">
          Connexion à votre espace
        </h2>
        <p className="mt-2 text-gray-600">
          Accédez à votre tableau de bord
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-card p-8">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-terracotta-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-terracotta-500"
            />
          </div>

          <div className="flex justify-end">
            <Link
              href={`/${locale}/auth/forgot-password`}
              className="text-sm text-terracotta-600"
            >
              Mot de passe oublié ?
            </Link>
          </div>

          <Button type="submit" fullWidth loading={loading}>
            Se connecter
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">ou</span>
          </div>
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border rounded-lg"
        >
          <span className="font-medium">Continuer avec Google</span>
        </button>
      </div>

      <p className="mt-6 text-center text-gray-600">
        Pas encore de compte ?{' '}
        <Link href={`/${locale}/auth/register`} className="text-terracotta-600 font-medium">
          Créer un compte
        </Link>
      </p>

      <p className="mt-4 text-center">
        <Link href={`/${locale}`} className="text-sm text-gray-500">
          ← Retour au site
        </Link>
      </p>
    </div>
  );
}

function LoginFormSkeleton() {
  return (
    <div className="max-w-md w-full animate-pulse">
      <div className="h-64 bg-gray-200 rounded-xl" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-sand-50 px-4">
      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
