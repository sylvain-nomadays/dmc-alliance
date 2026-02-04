/**
 * Newsletter Confirmation Page
 * Shows success/error message after email confirmation
 */

import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Confirmation Newsletter | DMC Alliance',
  description: 'Confirmation de votre inscription à la newsletter DMC Alliance',
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; error?: string }>;
}

const translations = {
  fr: {
    success: {
      title: 'Inscription confirmée !',
      message: 'Merci ! Votre adresse email a été confirmée avec succès. Vous recevrez désormais nos newsletters avec les dernières actualités, nouveaux GIR et offres exclusives.',
      cta: 'Retour à l\'accueil',
    },
    already: {
      title: 'Déjà confirmé',
      message: 'Votre adresse email est déjà confirmée. Vous êtes bien inscrit à notre newsletter.',
      cta: 'Retour à l\'accueil',
    },
    invalid: {
      title: 'Lien invalide',
      message: 'Ce lien de confirmation est invalide ou a expiré. Veuillez vous réinscrire à notre newsletter.',
      cta: 'Retour à l\'accueil',
    },
    server: {
      title: 'Erreur serveur',
      message: 'Une erreur s\'est produite lors de la confirmation. Veuillez réessayer plus tard ou nous contacter.',
      cta: 'Nous contacter',
      ctaHref: '/contact',
    },
    default: {
      title: 'Vérifiez votre email',
      message: 'Un email de confirmation a été envoyé. Cliquez sur le lien dans l\'email pour activer votre inscription.',
      cta: 'Retour à l\'accueil',
    },
  },
  en: {
    success: {
      title: 'Subscription confirmed!',
      message: 'Thank you! Your email address has been confirmed successfully. You will now receive our newsletters with the latest news, new GIR tours and exclusive offers.',
      cta: 'Back to home',
    },
    already: {
      title: 'Already confirmed',
      message: 'Your email address is already confirmed. You are subscribed to our newsletter.',
      cta: 'Back to home',
    },
    invalid: {
      title: 'Invalid link',
      message: 'This confirmation link is invalid or has expired. Please subscribe to our newsletter again.',
      cta: 'Back to home',
    },
    server: {
      title: 'Server error',
      message: 'An error occurred during confirmation. Please try again later or contact us.',
      cta: 'Contact us',
      ctaHref: '/contact',
    },
    default: {
      title: 'Check your email',
      message: 'A confirmation email has been sent. Click the link in the email to activate your subscription.',
      cta: 'Back to home',
    },
  },
};

export default async function NewsletterConfirmPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { status, error } = await searchParams;

  const lang = locale === 'en' ? 'en' : 'fr';
  const t = translations[lang];

  // Determine which message to show
  let content;
  let isSuccess = false;
  let isError = false;

  if (status === 'success') {
    content = t.success;
    isSuccess = true;
  } else if (status === 'already') {
    content = t.already;
    isSuccess = true;
  } else if (error === 'invalid') {
    content = t.invalid;
    isError = true;
  } else if (error === 'server') {
    content = t.server;
    isError = true;
  } else {
    content = t.default;
  }

  const ctaHref = 'ctaHref' in content ? (content as { ctaHref: string }).ctaHref : `/${locale}`;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
          isSuccess ? 'bg-green-100' : isError ? 'bg-red-100' : 'bg-blue-100'
        }`}>
          {isSuccess ? (
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : isError ? (
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          )}
        </div>

        {/* Title */}
        <h1 className={`text-2xl font-heading font-bold mb-4 ${
          isSuccess ? 'text-green-800' : isError ? 'text-red-800' : 'text-gray-900'
        }`}>
          {content.title}
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          {content.message}
        </p>

        {/* CTA Button */}
        <Link
          href={ctaHref}
          className={`inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-colors ${
            isSuccess
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : isError
              ? 'bg-terracotta-500 hover:bg-terracotta-600 text-white'
              : 'bg-terracotta-500 hover:bg-terracotta-600 text-white'
          }`}
        >
          {content.cta}
        </Link>
      </div>
    </div>
  );
}
