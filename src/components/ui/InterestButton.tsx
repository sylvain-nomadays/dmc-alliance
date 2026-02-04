'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from './Button';
import { Heart, Bookmark, BookmarkCheck, X, LogIn, UserPlus, HeartOff } from 'lucide-react';
import Link from 'next/link';

interface InterestButtonProps {
  entityType: 'destination' | 'partner' | 'gir';
  entitySlug: string;
  entityId?: string; // Required for GIR circuits
  entityName?: string; // For display in agency dashboard
  locale: string;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullWidth?: boolean;
}

const translations = {
  fr: {
    destination: {
      button: 'Je suis intéressé',
      buttonAdded: 'Destination suivie',
      modalTitle: 'Créez votre espace agence',
      modalText: 'Pour suivre cette destination et recevoir les actualités GIR, créez votre compte agence gratuit.',
      added: 'Destination ajoutée à vos favoris !',
      removed: 'Destination retirée de vos favoris',
    },
    partner: {
      button: 'Je suis intéressé',
      buttonAdded: 'Agence suivie',
      modalTitle: 'Créez votre espace agence',
      modalText: 'Pour suivre cette agence et ses offres GIR, créez votre compte agence gratuit.',
      added: 'Agence ajoutée à vos favoris !',
      removed: 'Agence retirée de vos favoris',
    },
    gir: {
      button: 'Suivre ce circuit',
      buttonAdded: 'Circuit suivi',
      modalTitle: 'Créez votre espace agence',
      modalText: 'Pour ajouter ce circuit à votre watchlist et être alerté des disponibilités, créez votre compte agence gratuit.',
      added: 'Circuit ajouté à votre watchlist !',
      removed: 'Circuit retiré de votre watchlist',
    },
    createAccount: 'Créer mon espace agence',
    alreadyRegistered: 'Déjà inscrit ?',
    signIn: 'Se connecter',
    error: 'Une erreur est survenue',
  },
  en: {
    destination: {
      button: "I'm interested",
      buttonAdded: 'Following',
      modalTitle: 'Create your agency account',
      modalText: 'To follow this destination and receive GIR news, create your free agency account.',
      added: 'Destination added to your favorites!',
      removed: 'Destination removed from favorites',
    },
    partner: {
      button: "I'm interested",
      buttonAdded: 'Following',
      modalTitle: 'Create your agency account',
      modalText: 'To follow this agency and its GIR offers, create your free agency account.',
      added: 'Agency added to your favorites!',
      removed: 'Agency removed from favorites',
    },
    gir: {
      button: 'Follow this circuit',
      buttonAdded: 'Following',
      modalTitle: 'Create your agency account',
      modalText: 'To add this circuit to your watchlist and get availability alerts, create your free agency account.',
      added: 'Circuit added to your watchlist!',
      removed: 'Circuit removed from watchlist',
    },
    createAccount: 'Create my agency account',
    alreadyRegistered: 'Already registered?',
    signIn: 'Sign in',
    error: 'An error occurred',
  },
};

export function InterestButton({
  entityType,
  entitySlug,
  entityId,
  entityName,
  locale,
  variant = 'outline',
  size = 'md',
  className = '',
  fullWidth = true,
}: InterestButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAgency, setIsAgency] = useState(false);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const t = translations[locale as keyof typeof translations] || translations.fr;
  const entityT = t[entityType];

  const supabase = createClient();

  // Check authentication and follow status on mount
  useEffect(() => {
    const checkAuth = async () => {
      setCheckingStatus(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setIsAuthenticated(true);

        // Check if user is an agency
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: agency } = await (supabase as any)
          .from('agencies')
          .select('id')
          .eq('user_id', user.id)
          .single() as { data: { id: string } | null };

        if (agency) {
          setIsAgency(true);
          setAgencyId(agency.id);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const db = supabase as any;

          if (entityType === 'gir' && entityId) {
            // For GIR circuits, check gir_watchlist
            const { data: watchlistItem } = await db
              .from('gir_watchlist')
              .select('id')
              .eq('agency_id', agency.id)
              .eq('circuit_id', entityId)
              .single() as { data: { id: string } | null };

            setIsFollowing(!!watchlistItem);
          } else {
            // For destinations and partners, check agency_interests
            const { data: interestItem } = await db
              .from('agency_interests')
              .select('id')
              .eq('agency_id', agency.id)
              .eq('entity_type', entityType)
              .eq('entity_slug', entitySlug)
              .single() as { data: { id: string } | null };

            setIsFollowing(!!interestItem);
          }
        }
      }
      setCheckingStatus(false);
    };

    checkAuth();
  }, [supabase, entityType, entityId, entitySlug]);

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Handle button click
  const handleClick = async () => {
    if (!isAuthenticated) {
      setShowModal(true);
      return;
    }

    if (!isAgency) {
      // User is authenticated but not an agency
      setShowModal(true);
      return;
    }

    if (!agencyId) return;

    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    try {
      if (entityType === 'gir' && entityId) {
        // Handle GIR circuits via gir_watchlist
        if (isFollowing) {
          await db
            .from('gir_watchlist')
            .delete()
            .eq('agency_id', agencyId)
            .eq('circuit_id', entityId);

          setIsFollowing(false);
          showToast(entityT.removed, 'success');
        } else {
          await db
            .from('gir_watchlist')
            .insert({
              agency_id: agencyId,
              circuit_id: entityId,
              notify_on_booking: true,
              notify_on_availability_change: true,
              notify_on_price_change: true,
            });

          setIsFollowing(true);
          showToast(entityT.added, 'success');
        }
      } else {
        // Handle destinations and partners via agency_interests
        if (isFollowing) {
          await db
            .from('agency_interests')
            .delete()
            .eq('agency_id', agencyId)
            .eq('entity_type', entityType)
            .eq('entity_slug', entitySlug);

          setIsFollowing(false);
          showToast(entityT.removed, 'success');
        } else {
          await db
            .from('agency_interests')
            .insert({
              agency_id: agencyId,
              entity_type: entityType,
              entity_slug: entitySlug,
              entity_name: entityName || entitySlug,
            });

          setIsFollowing(true);
          showToast(entityT.added, 'success');
        }
      }
    } catch (error) {
      console.error('Interest toggle error:', error);
      showToast(t.error, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Build redirect URLs
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : `/${locale}/${entityType === 'gir' ? 'gir' : entityType === 'destination' ? 'destinations' : 'partners'}/${entitySlug}`;
  const registerUrl = `/${locale}/auth/register?redirect=${encodeURIComponent(currentPath)}`;
  const loginUrl = `/${locale}/auth/login?redirect=${encodeURIComponent(currentPath)}`;

  // Determine button icon and text
  const getButtonContent = () => {
    if (checkingStatus) {
      return (
        <>
          <span className="w-4 h-4 mr-2 animate-pulse bg-current rounded-full opacity-50" />
          ...
        </>
      );
    }

    if (entityType === 'gir') {
      if (isFollowing) {
        return (
          <>
            <BookmarkCheck className="w-4 h-4 mr-2" />
            {entityT.buttonAdded}
          </>
        );
      }
      return (
        <>
          <Bookmark className="w-4 h-4 mr-2" />
          {entityT.button}
        </>
      );
    }

    // Destinations and partners use Heart icon
    if (isFollowing) {
      return (
        <>
          <Heart className="w-4 h-4 mr-2 fill-current" />
          {entityT.buttonAdded}
        </>
      );
    }
    return (
      <>
        <Heart className="w-4 h-4 mr-2" />
        {entityT.button}
      </>
    );
  };

  return (
    <>
      {/* Interest Button */}
      <Button
        variant={isFollowing ? 'primary' : variant}
        size={size}
        fullWidth={fullWidth}
        onClick={handleClick}
        loading={loading}
        disabled={checkingStatus}
        className={className}
      >
        {getButtonContent()}
      </Button>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Modal for non-authenticated users */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="w-16 h-16 bg-terracotta-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {entityType === 'gir' ? (
                <Bookmark className="w-8 h-8 text-terracotta-600" />
              ) : (
                <Heart className="w-8 h-8 text-terracotta-600" />
              )}
            </div>

            {/* Title */}
            <h3 className="text-xl font-heading font-semibold text-center text-gray-900 mb-2">
              {entityT.modalTitle}
            </h3>

            {/* Description */}
            <p className="text-gray-600 text-center mb-6">
              {entityT.modalText}
            </p>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <Link href={registerUrl} className="block">
                <Button variant="primary" fullWidth>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {t.createAccount}
                </Button>
              </Link>

              <p className="text-center text-sm text-gray-500">
                {t.alreadyRegistered}{' '}
                <Link
                  href={loginUrl}
                  className="text-terracotta-600 font-medium hover:underline inline-flex items-center"
                >
                  <LogIn className="w-3 h-3 mr-1" />
                  {t.signIn}
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default InterestButton;
