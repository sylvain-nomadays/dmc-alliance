'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params.locale as string) || 'fr';

  // ✅ redirect fiable (ex: /admin)
  const redirect = searchParams.get('redirect');

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
        redirectTo: `${window.location.origin}/auth/callback${
          redirect ? `?redirect=${redirect}` : ''
        }`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-block">
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
              href="/auth/forgot-password"
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
        <Link href="/auth/register" className="text-terracotta-600 font-medium">
          Créer un compte
        </Link>
      </p>

      <p className="mt-4 text-center">
        <Link href="/" className="text-sm text-gray-500">
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
