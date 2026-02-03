'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface AgencyCtaSectionProps {
  locale: string;
}

export function AgencyCtaSection({ locale }: AgencyCtaSectionProps) {
  const isFr = locale === 'fr';

  const translations = {
    badge: isFr ? 'Espace Professionnel' : 'Professional Space',
    title: isFr ? 'Vous êtes une agence de voyage ?' : 'Are you a travel agency?',
    subtitle: isFr
      ? 'Accédez aux circuits GIR en temps réel, suivez le remplissage et gérez vos demandes depuis votre espace dédié.'
      : 'Access GIR tours in real-time, track availability, and manage your requests from your dedicated space.',
    benefits: isFr
      ? [
          'Accès aux circuits GIR avec disponibilités temps réel',
          'Commission garantie sur chaque réservation',
          'Watchlist personnalisée et alertes',
          'Demandes de devis simplifiées',
        ]
      : [
          'Access to GIR tours with real-time availability',
          'Guaranteed commission on every booking',
          'Personalized watchlist and alerts',
          'Simplified quote requests',
        ],
    createAccount: isFr ? 'Créer mon espace gratuit' : 'Create my free account',
    login: isFr ? 'Se connecter' : 'Log in',
    alreadyMember: isFr ? 'Déjà inscrit ?' : 'Already registered?',
  };

  return (
    <section className="py-20 bg-gradient-to-br from-terracotta-600 via-terracotta-500 to-terracotta-600 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-sand-500/10 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span className="text-sm font-medium text-white">{translations.badge}</span>
              </div>

              {/* Title */}
              <h2 className="text-3xl md:text-4xl font-heading text-white mb-4">
                {translations.title}
              </h2>

              {/* Subtitle */}
              <p className="text-lg text-white/70 mb-8">{translations.subtitle}</p>

              {/* Benefits */}
              <ul className="space-y-3 mb-8">
                {translations.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg
                        className="w-4 h-4 text-white"
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
                    <span className="text-white/80">{benefit}</span>
                  </li>
                ))}
              </ul>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Link href={`/${locale}/auth/register`}>
                  <Button
                    variant="primary"
                    size="lg"
                    rightIcon={
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    }
                  >
                    {translations.createAccount}
                  </Button>
                </Link>

                <div className="flex items-center gap-2 text-white/80">
                  <span className="text-sm">{translations.alreadyMember}</span>
                  <Link
                    href={`/${locale}/auth/login`}
                    className="text-white hover:text-white/80 font-medium underline underline-offset-2 transition-colors"
                  >
                    {translations.login}
                  </Link>
                </div>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="relative lg:pl-8">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                {/* Mock dashboard preview */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  {/* Header mock */}
                  <div className="bg-deep-blue-900 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-terracotta-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">DA</span>
                      </div>
                      <span className="text-white text-sm font-medium">DMC Alliance</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-sage-400" />
                      <span className="text-xs text-white/60">
                        {isFr ? 'Connecté' : 'Connected'}
                      </span>
                    </div>
                  </div>

                  {/* Content mock */}
                  <div className="p-4 space-y-3">
                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-sand-50 rounded-lg p-2 text-center">
                        <p className="text-lg font-bold text-terracotta-600">24</p>
                        <p className="text-xs text-gray-500">
                          {isFr ? 'Circuits' : 'Tours'}
                        </p>
                      </div>
                      <div className="bg-sand-50 rounded-lg p-2 text-center">
                        <p className="text-lg font-bold text-sage-600">8%</p>
                        <p className="text-xs text-gray-500">
                          {isFr ? 'Commission' : 'Commission'}
                        </p>
                      </div>
                      <div className="bg-sand-50 rounded-lg p-2 text-center">
                        <p className="text-lg font-bold text-deep-blue-600">5</p>
                        <p className="text-xs text-gray-500">
                          {isFr ? 'Alertes' : 'Alerts'}
                        </p>
                      </div>
                    </div>

                    {/* Circuit cards mock */}
                    <div className="space-y-2">
                      {[
                        { name: 'Mongolie Essentielle', fill: 75, places: '6/8' },
                        { name: 'Vietnam Authentique', fill: 50, places: '10/20' },
                      ].map((circuit, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-terracotta-400 to-terracotta-600 rounded-lg" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {circuit.name}
                            </p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-terracotta-500 rounded-full"
                                  style={{ width: `${circuit.fill}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">{circuit.places}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating notification */}
                <div className="absolute -right-4 top-8 bg-white rounded-lg shadow-lg p-3 border border-gray-100 max-w-[180px] animate-pulse">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 bg-sage-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-sage-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-900">
                        {isFr ? 'Nouvelle place disponible' : 'New spot available'}
                      </p>
                      <p className="text-xs text-gray-500">Kenya Safari</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
