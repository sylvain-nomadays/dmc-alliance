'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const params = useParams();
  const locale = (params.locale as string) || 'fr';
  const isFr = locale === 'fr';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/${locale}/auth/callback?redirect=/${locale}/auth/reset-password`,
    });

    if (error) {
      setError(
        isFr
          ? 'Une erreur est survenue. Veuillez réessayer.'
          : 'An error occurred. Please try again.'
      );
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

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
            {isFr ? 'Mot de passe oublié' : 'Forgot password'}
          </h2>
          <p className="mt-2 text-gray-600">
            {isFr
              ? 'Entrez votre email pour recevoir un lien de réinitialisation'
              : 'Enter your email to receive a reset link'}
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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isFr ? 'Email envoyé !' : 'Email sent!'}
              </h3>
              <p className="text-gray-600 mb-6">
                {isFr
                  ? 'Si un compte existe avec cette adresse, vous recevrez un email avec un lien pour réinitialiser votre mot de passe.'
                  : 'If an account exists with this email, you will receive a password reset link.'}
              </p>
              <Link
                href={`/${locale}/auth/login`}
                className="text-terracotta-600 font-medium hover:text-terracotta-700"
              >
                {isFr ? '← Retour à la connexion' : '← Back to login'}
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
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder={isFr ? 'votre@email.com' : 'your@email.com'}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>

                <Button type="submit" fullWidth loading={loading}>
                  {isFr ? 'Envoyer le lien' : 'Send reset link'}
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
