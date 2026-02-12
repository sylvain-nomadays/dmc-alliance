'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params.locale as string) || 'fr';
  const isFr = locale === 'fr';

  // Exchange the auth code for a session when arriving from the email link
  useEffect(() => {
    const exchangeCode = async () => {
      const code = searchParams.get('code');
      const supabase = createClient();

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('[Reset Password] Code exchange error:', error.message);
          setError(
            isFr
              ? 'Le lien a expiré ou est invalide. Veuillez refaire une demande.'
              : 'The link has expired or is invalid. Please request a new one.'
          );
        } else {
          setSessionReady(true);
        }
        // Remove code from URL without reload
        window.history.replaceState({}, '', window.location.pathname);
      } else {
        // No code — check if user already has an active session
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setSessionReady(true);
        } else {
          setError(
            isFr
              ? 'Aucune session active. Veuillez utiliser le lien reçu par email.'
              : 'No active session. Please use the link from your email.'
          );
        }
      }
      setInitializing(false);
    };

    exchangeCode();
  }, [searchParams, isFr]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError(
        isFr
          ? 'Le mot de passe doit contenir au moins 6 caractères.'
          : 'Password must be at least 6 characters.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        isFr
          ? 'Les mots de passe ne correspondent pas.'
          : 'Passwords do not match.'
      );
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(
        isFr
          ? 'Impossible de mettre à jour le mot de passe. Le lien a peut-être expiré.'
          : 'Unable to update password. The link may have expired.'
      );
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand-50 px-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            {isFr ? 'Vérification en cours...' : 'Verifying...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sand-50 px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href={`/${locale}`} className="inline-block">
            <h1 className="text-2xl font-heading text-terracotta-600">
              The DMC Alliance
            </h1>
          </Link>
          <h2 className="mt-4 text-xl font-heading text-gray-900">
            {isFr ? 'Nouveau mot de passe' : 'New password'}
          </h2>
          <p className="mt-2 text-gray-600">
            {isFr
              ? 'Choisissez votre nouveau mot de passe'
              : 'Choose your new password'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8">
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-sage-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isFr ? 'Mot de passe mis à jour !' : 'Password updated!'}
              </h3>
              <p className="text-gray-600 mb-6">
                {isFr
                  ? 'Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter.'
                  : 'Your password has been successfully changed. You can now log in.'}
              </p>
              <Link
                href={`/${locale}/auth/login`}
                className="inline-block bg-terracotta-500 text-white px-6 py-3 rounded-lg hover:bg-terracotta-600 transition-colors font-medium"
              >
                {isFr ? 'Se connecter' : 'Log in'}
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Nouveau mot de passe' : 'New password'}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Confirmer le mot de passe' : 'Confirm password'}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>

                <Button type="submit" fullWidth loading={loading}>
                  {isFr ? 'Mettre à jour le mot de passe' : 'Update password'}
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center">
          <Link
            href={`/${locale}/auth/login`}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {isFr ? '← Retour à la connexion' : '← Back to login'}
          </Link>
        </p>
      </div>
    </div>
  );
}
