import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthContext } from '@/lib/auth/getAuthContext';
import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from '@/components/agency/LogoutButton';

interface AgencyInfo {
  id: string;
  name: string;
  commission_rate: number;
  is_verified: boolean;
}

async function getAgencyInfo(userId: string): Promise<AgencyInfo | null> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('agencies')
    .select('id, name, commission_rate, is_verified')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as AgencyInfo;
}

export default async function AgencyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const authContext = await getAuthContext();

  if (!authContext) {
    redirect(`/${locale}/auth/login?redirect=/${locale}/agency`);
  }

  // Check if user is an agency
  if (authContext.profile.role !== 'agency') {
    redirect(`/${locale}`);
  }

  const agency = await getAgencyInfo(authContext.user.id);

  if (!agency) {
    // User has agency role but no agency record - show error
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-heading text-gray-900 mb-2">Compte non configuré</h1>
          <p className="text-gray-600 mb-4">
            Votre compte agence n&apos;est pas encore configuré. Veuillez contacter l&apos;équipe DMC Alliance.
          </p>
          <Link
            href={`/${locale}/contact`}
            className="inline-block bg-terracotta-500 text-white px-6 py-2 rounded-lg hover:bg-terracotta-600 transition-colors"
          >
            Nous contacter
          </Link>
        </div>
      </div>
    );
  }

  const isFr = locale === 'fr';

  const navigation = [
    {
      name: isFr ? 'Tableau de bord' : 'Dashboard',
      href: `/${locale}/agency/dashboard`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: isFr ? 'Circuits GIR' : 'GIR Circuits',
      href: `/${locale}/agency/circuits`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: isFr ? 'Ma watchlist' : 'My Watchlist',
      href: `/${locale}/agency/watchlist`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      ),
    },
    {
      name: isFr ? 'Mes destinations' : 'My Destinations',
      href: `/${locale}/agency/destinations`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: isFr ? 'Mes demandes' : 'My Requests',
      href: `/${locale}/agency/requests`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
    },
    {
      name: isFr ? 'Notifications' : 'Notifications',
      href: `/${locale}/agency/notifications`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      name: isFr ? 'Mon agence' : 'My Agency',
      href: `/${locale}/agency/settings`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="bg-deep-blue-900 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/${locale}`} className="flex items-center gap-2">
                <div className="w-10 h-10 bg-terracotta-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">DA</span>
                </div>
                <div>
                  <span className="font-heading text-lg">DMC Alliance</span>
                  <span className="block text-xs text-deep-blue-300">
                    {isFr ? 'Espace Agence' : 'Agency Portal'}
                  </span>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              {/* Commission badge */}
              <div className="hidden sm:flex items-center gap-2 bg-deep-blue-800/50 rounded-lg px-3 py-2">
                <span className="text-xs text-deep-blue-300">
                  {isFr ? 'Votre commission' : 'Your commission'}
                </span>
                <span className="text-lg font-bold text-terracotta-400">{agency.commission_rate}%</span>
              </div>

              {/* Agency name */}
              <div className="text-right">
                <p className="font-medium">{agency.name}</p>
                {agency.is_verified && (
                  <span className="inline-flex items-center gap-1 text-xs text-sage-400">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {isFr ? 'Vérifié' : 'Verified'}
                  </span>
                )}
              </div>

              {/* Logout button */}
              <LogoutButton
                locale={locale}
                label={isFr ? 'Déconnexion' : 'Logout'}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto -mb-px">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 hover:text-terracotta-600 border-b-2 border-transparent hover:border-terracotta-500 whitespace-nowrap transition-colors"
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>© 2024 DMC Alliance. {isFr ? 'Tous droits réservés.' : 'All rights reserved.'}</p>
            <div className="flex gap-4">
              <Link href={`/${locale}/contact`} className="hover:text-terracotta-600">
                {isFr ? 'Contact' : 'Contact'}
              </Link>
              <Link href={`/${locale}/legal`} className="hover:text-terracotta-600">
                {isFr ? 'Mentions légales' : 'Legal'}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
