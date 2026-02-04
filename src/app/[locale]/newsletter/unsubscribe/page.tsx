/**
 * Newsletter Unsubscribe Page
 * Allows users to unsubscribe from the newsletter
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const translations = {
  fr: {
    title: 'Se désinscrire de la newsletter',
    subtitle: 'Nous sommes désolés de vous voir partir. Entrez votre email pour confirmer la désinscription.',
    emailLabel: 'Adresse email',
    emailPlaceholder: 'votre@email.com',
    deleteData: 'Supprimer également toutes mes données (RGPD)',
    deleteDataHelp: 'Cette option supprimera définitivement toutes vos informations de notre base de données.',
    unsubscribeBtn: 'Se désinscrire',
    processing: 'Traitement en cours...',
    success: {
      title: 'Désinscription confirmée',
      message: 'Vous avez été désinscrit de notre newsletter. Vous ne recevrez plus nos emails.',
      cta: 'Retour à l\'accueil',
    },
    error: {
      title: 'Erreur',
      notFound: 'Cette adresse email n\'est pas inscrite à notre newsletter.',
      invalid: 'Le lien de désinscription est invalide.',
      server: 'Une erreur s\'est produite. Veuillez réessayer.',
      retry: 'Réessayer',
    },
    backToHome: 'Retour à l\'accueil',
  },
  en: {
    title: 'Unsubscribe from newsletter',
    subtitle: 'We\'re sorry to see you go. Enter your email to confirm unsubscription.',
    emailLabel: 'Email address',
    emailPlaceholder: 'your@email.com',
    deleteData: 'Also delete all my data (GDPR)',
    deleteDataHelp: 'This option will permanently delete all your information from our database.',
    unsubscribeBtn: 'Unsubscribe',
    processing: 'Processing...',
    success: {
      title: 'Unsubscription confirmed',
      message: 'You have been unsubscribed from our newsletter. You will no longer receive our emails.',
      cta: 'Back to home',
    },
    error: {
      title: 'Error',
      notFound: 'This email address is not subscribed to our newsletter.',
      invalid: 'The unsubscribe link is invalid.',
      server: 'An error occurred. Please try again.',
      retry: 'Try again',
    },
    backToHome: 'Back to home',
  },
};

function UnsubscribeContent({ locale }: { locale: string }) {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [deleteData, setDeleteData] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const lang = locale === 'en' ? 'en' : 'fr';
  const t = translations[lang];

  // Pre-fill email from URL params
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, deleteData }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
      } else {
        setStatus('error');
        if (data.error === 'not_found') {
          setErrorMessage(t.error.notFound);
        } else if (data.error === 'invalid') {
          setErrorMessage(t.error.invalid);
        } else {
          setErrorMessage(t.error.server);
        }
      }
    } catch {
      setStatus('error');
      setErrorMessage(t.error.server);
    }
  };

  // Success state
  if (status === 'success') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-heading font-bold text-green-800 mb-4">
            {t.success.title}
          </h1>
          <p className="text-gray-600 mb-8">
            {t.success.message}
          </p>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center px-6 py-3 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-lg font-medium transition-colors"
          >
            {t.success.cta}
          </Link>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">
            {t.title}
          </h1>
          <p className="text-gray-600">
            {t.subtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              {t.emailLabel}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
            />
          </div>

          {/* Delete data option */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="deleteData"
              checked={deleteData}
              onChange={(e) => setDeleteData(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-gray-300 text-terracotta-500 focus:ring-terracotta-500"
            />
            <div>
              <label htmlFor="deleteData" className="text-sm font-medium text-gray-700 cursor-pointer">
                {t.deleteData}
              </label>
              <p className="text-xs text-gray-500 mt-1">
                {t.deleteDataHelp}
              </p>
            </div>
          </div>

          {/* Error message */}
          {status === 'error' && errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">{t.error.title}</span>
              </div>
              <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={status === 'loading' || !email}
            className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            {status === 'loading' ? t.processing : t.unsubscribeBtn}
          </button>

          {/* Back to home link */}
          <div className="text-center">
            <Link
              href={`/${locale}`}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {t.backToHome}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewsletterUnsubscribePage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const [locale, setLocale] = useState('fr');

  useEffect(() => {
    params.then(p => setLocale(p.locale));
  }, [params]);

  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta-500" />
      </div>
    }>
      <UnsubscribeContent locale={locale} />
    </Suspense>
  );
}
