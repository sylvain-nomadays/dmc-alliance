import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getAuthContext } from '@/lib/auth/getAuthContext';
import { createClient } from '@/lib/supabase/server';

interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  totalCommission: number;
  watchedCircuits: number;
  upcomingDepartures: number;
}

interface AgencyProfile {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  specialties: string[] | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  profile_completed: boolean;
}

interface JoinRequest {
  id: string;
  status: string;
  created_at: string;
  message: string | null;
  user: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

interface RecentBooking {
  id: string;
  client_name: string;
  places_booked: number;
  total_price: number;
  commission_amount: number;
  status: string;
  created_at: string;
  circuit: {
    title_fr: string;
    departure_date: string;
  };
}

interface WatchedCircuit {
  id: string;
  circuit: {
    id: string;
    title_fr: string;
    departure_date: string;
    places_available: number;
    places_total: number;
    price_from: number;
    destination: {
      name: string;
    };
  };
}

async function getAgencyProfile(userId: string): Promise<AgencyProfile | null> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('agencies')
    .select('id, name, logo_url, description, specialties, contact_name, email, phone, profile_completed')
    .eq('user_id', userId)
    .single();
  return data || null;
}

async function getJoinRequests(agencyId: string): Promise<JoinRequest[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('agency_join_requests')
    .select(`
      id, status, created_at, message,
      user:profiles(id, email, full_name)
    `)
    .eq('agency_id', agencyId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5);
  return data || [];
}

async function getDashboardData(agencyId: string): Promise<{
  stats: DashboardStats;
  recentBookings: RecentBooking[];
  watchedCircuits: WatchedCircuit[];
}> {
  const supabase = await createClient();

  // Get stats
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bookings } = await (supabase as any)
    .from('bookings')
    .select('id, status, commission_amount')
    .eq('agency_id', agencyId);

  const totalBookings = bookings?.length || 0;
  const pendingBookings = bookings?.filter((b: { status: string }) => b.status === 'pending').length || 0;
  const totalCommission = bookings?.reduce((sum: number, b: { commission_amount: number }) => sum + (b.commission_amount || 0), 0) || 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: watchedCircuits } = await (supabase as any)
    .from('gir_watchlist')
    .select('*', { count: 'exact', head: true })
    .eq('agency_id', agencyId);

  // Get recent bookings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: recentBookings } = await (supabase as any)
    .from('bookings')
    .select(`
      id,
      client_name,
      places_booked,
      total_price,
      commission_amount,
      status,
      created_at,
      circuit:circuits(title_fr, departure_date)
    `)
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })
    .limit(5);

  // Get watched circuits
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: watched } = await (supabase as any)
    .from('gir_watchlist')
    .select(`
      id,
      circuit:circuits(
        id,
        title_fr,
        departure_date,
        places_available,
        places_total,
        price_from,
        destination:destinations(name)
      )
    `)
    .eq('agency_id', agencyId)
    .limit(4);

  // Count upcoming departures in next 30 days
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: upcomingDepartures } = await (supabase as any)
    .from('bookings')
    .select('*, circuit:circuits!inner(departure_date)', { count: 'exact', head: true })
    .eq('agency_id', agencyId)
    .eq('status', 'confirmed')
    .lte('circuit.departure_date', thirtyDaysFromNow.toISOString())
    .gte('circuit.departure_date', new Date().toISOString());

  return {
    stats: {
      totalBookings,
      pendingBookings,
      totalCommission,
      watchedCircuits: watchedCircuits || 0,
      upcomingDepartures: upcomingDepartures || 0,
    },
    recentBookings: recentBookings || [],
    watchedCircuits: watched || [],
  };
}

async function getAgencyId(userId: string): Promise<string | null> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('agencies')
    .select('id')
    .eq('user_id', userId)
    .single();
  return data?.id || null;
}

export default async function AgencyDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('agency');
  const authContext = await getAuthContext();

  if (!authContext || authContext.profile.role !== 'agency') {
    redirect(`/${locale}`);
  }

  const agencyId = await getAgencyId(authContext.user.id);
  if (!agencyId) {
    redirect(`/${locale}`);
  }

  const [{ stats, recentBookings, watchedCircuits }, agencyProfile, joinRequests] = await Promise.all([
    getDashboardData(agencyId),
    getAgencyProfile(authContext.user.id),
    getJoinRequests(agencyId),
  ]);

  const isFr = locale === 'fr';

  // Calcul de la complétion du profil
  const profileFields = [
    agencyProfile?.name,
    agencyProfile?.description,
    agencyProfile?.contact_name,
    agencyProfile?.email,
    agencyProfile?.phone,
    agencyProfile?.logo_url,
    (agencyProfile?.specialties?.length || 0) > 0,
  ];
  const completedFields = profileFields.filter(Boolean).length;
  const profilePercentage = Math.round((completedFields / profileFields.length) * 100);

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: isFr ? 'En attente' : 'Pending', color: 'bg-yellow-100 text-yellow-700' },
    confirmed: { label: isFr ? 'Confirmé' : 'Confirmed', color: 'bg-sage-100 text-sage-700' },
    cancelled: { label: isFr ? 'Annulé' : 'Cancelled', color: 'bg-red-100 text-red-700' },
    completed: { label: isFr ? 'Terminé' : 'Completed', color: 'bg-gray-100 text-gray-700' },
  };

  return (
    <div>
      {/* Welcome */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-heading text-gray-900">
            {isFr ? `Bonjour${agencyProfile?.contact_name ? `, ${agencyProfile.contact_name.split(' ')[0]}` : ''} !` : `Hello${agencyProfile?.contact_name ? `, ${agencyProfile.contact_name.split(' ')[0]}` : ''}!`}
          </h1>
          <p className="text-gray-600">
            {isFr
              ? 'Bienvenue dans votre espace agence partenaire'
              : 'Welcome to your partner agency portal'}
          </p>
        </div>
        {agencyProfile?.logo_url && (
          <img
            src={agencyProfile.logo_url}
            alt={agencyProfile.name}
            className="w-16 h-16 rounded-xl object-cover border border-gray-200"
          />
        )}
      </div>

      {/* Carte de complétion du profil */}
      {profilePercentage < 100 && (
        <div className="mb-8 bg-gradient-to-r from-terracotta-500 to-terracotta-600 rounded-xl p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-1">
                {isFr ? 'Faisons plus ample connaissance' : 'Let\'s Get to Know Each Other'}
              </h2>
              <p className="text-terracotta-100 text-sm mb-3">
                {isFr
                  ? 'Complétez votre profil agence pour permettre aux DMC de comprendre vos attentes et vous faire des propositions adaptées à votre clientèle.'
                  : 'Complete your agency profile so DMCs can understand your needs and offer proposals tailored to your clientele.'}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white/20 rounded-full h-3 max-w-xs">
                  <div
                    className="bg-white rounded-full h-3 transition-all"
                    style={{ width: `${profilePercentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{profilePercentage}%</span>
              </div>
            </div>
            <Link
              href={`/${locale}/espace-pro/settings`}
              className="px-6 py-3 bg-white text-terracotta-600 font-medium rounded-lg hover:bg-terracotta-50 transition-colors text-center"
            >
              {isFr ? 'Compléter mon profil' : 'Complete Profile'}
            </Link>
          </div>
        </div>
      )}

      {/* Demandes de rejoindre l'agence */}
      {joinRequests.length > 0 && (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">
                {isFr ? `${joinRequests.length} demande(s) pour rejoindre votre agence` : `${joinRequests.length} request(s) to join your agency`}
              </h3>
              <p className="text-sm text-blue-700 mb-3">
                {isFr
                  ? 'Des collaborateurs souhaitent rejoindre votre espace professionnel.'
                  : 'Colleagues want to join your professional space.'}
              </p>
              <div className="space-y-2">
                {joinRequests.slice(0, 3).map((request) => (
                  <div key={request.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2">
                    <div>
                      <p className="font-medium text-gray-900">{request.user?.full_name || request.user?.email}</p>
                      <p className="text-xs text-gray-500">{request.user?.email}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(request.created_at).toLocaleDateString(isFr ? 'fr-FR' : 'en-US')}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                href={`/${locale}/espace-pro/settings?tab=team`}
                className="inline-block mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {isFr ? 'Gérer les demandes →' : 'Manage requests →'}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">
            {isFr ? 'Réservations totales' : 'Total Bookings'}
          </p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">
            {isFr ? 'En attente' : 'Pending'}
          </p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pendingBookings}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">
            {isFr ? 'Commissions gagnées' : 'Commissions Earned'}
          </p>
          <p className="text-2xl font-bold text-sage-600">{stats.totalCommission.toLocaleString('fr-FR')} €</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">
            {isFr ? 'Circuits suivis' : 'Watched Circuits'}
          </p>
          <p className="text-2xl font-bold text-terracotta-600">{stats.watchedCircuits}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">
            {isFr ? 'Départs à venir' : 'Upcoming Departures'}
          </p>
          <p className="text-2xl font-bold text-deep-blue-600">{stats.upcomingDepartures}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Bookings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-heading text-lg text-gray-900">
              {isFr ? 'Réservations récentes' : 'Recent Bookings'}
            </h2>
            <Link
              href={`/${locale}/espace-pro/bookings`}
              className="text-sm text-terracotta-600 hover:text-terracotta-700"
            >
              {isFr ? 'Voir tout' : 'View all'}
            </Link>
          </div>
          {recentBookings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>{isFr ? 'Aucune réservation pour le moment' : 'No bookings yet'}</p>
              <Link
                href={`/${locale}/espace-pro/circuits`}
                className="inline-block mt-4 text-terracotta-600 hover:text-terracotta-700"
              >
                {isFr ? 'Explorer les circuits' : 'Explore circuits'}
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{booking.client_name}</p>
                      <p className="text-sm text-gray-500">{booking.circuit?.title_fr}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusLabels[booking.status]?.color}`}>
                      {statusLabels[booking.status]?.label}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      {booking.places_booked} {isFr ? 'place(s)' : 'place(s)'}
                    </span>
                    <span className="text-sage-600 font-medium">
                      +{booking.commission_amount?.toLocaleString('fr-FR')} € commission
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Watched Circuits */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-heading text-lg text-gray-900">
              {isFr ? 'Circuits suivis' : 'Watched Circuits'}
            </h2>
            <Link
              href={`/${locale}/espace-pro/watchlist`}
              className="text-sm text-terracotta-600 hover:text-terracotta-700"
            >
              {isFr ? 'Voir tout' : 'View all'}
            </Link>
          </div>
          {watchedCircuits.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <p>{isFr ? 'Aucun circuit suivi' : 'No watched circuits'}</p>
              <Link
                href={`/${locale}/espace-pro/circuits`}
                className="inline-block mt-4 text-terracotta-600 hover:text-terracotta-700"
              >
                {isFr ? 'Découvrir les circuits' : 'Discover circuits'}
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {watchedCircuits.map((item) => (
                <Link
                  key={item.id}
                  href={`/${locale}/espace-pro/circuits/${item.circuit?.id}`}
                  className="block px-6 py-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{item.circuit?.title_fr}</p>
                      <p className="text-sm text-gray-500">{item.circuit?.destination?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {item.circuit?.price_from?.toLocaleString('fr-FR')} €
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(item.circuit?.departure_date || '').toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-terracotta-500 rounded-full h-2"
                        style={{
                          width: `${((item.circuit?.places_total || 0) - (item.circuit?.places_available || 0)) / (item.circuit?.places_total || 1) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {item.circuit?.places_available}/{item.circuit?.places_total} {isFr ? 'places' : 'places'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gradient-to-r from-deep-blue-900 to-deep-blue-800 rounded-xl p-6 text-white">
        <h2 className="font-heading text-xl mb-4">
          {isFr ? 'Actions rapides' : 'Quick Actions'}
        </h2>
        <div className="grid sm:grid-cols-4 gap-4">
          <Link
            href={`/${locale}/espace-pro/circuits`}
            className="flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors"
          >
            <svg className="w-8 h-8 text-terracotta-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <div>
              <p className="font-medium">{isFr ? 'Rechercher' : 'Search'}</p>
              <p className="text-sm text-deep-blue-200">{isFr ? 'Circuits GIR' : 'GIR Circuits'}</p>
            </div>
          </Link>
          <Link
            href={`/${locale}/espace-pro/watchlist`}
            className="flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors"
          >
            <svg className="w-8 h-8 text-terracotta-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <div>
              <p className="font-medium">{isFr ? 'Ma watchlist' : 'My Watchlist'}</p>
              <p className="text-sm text-deep-blue-200">{isFr ? 'Circuits suivis' : 'Watched circuits'}</p>
            </div>
          </Link>
          <Link
            href={`/${locale}/espace-pro/destinations`}
            className="flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors"
          >
            <svg className="w-8 h-8 text-terracotta-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium">{isFr ? 'Destinations' : 'Destinations'}</p>
              <p className="text-sm text-deep-blue-200">{isFr ? 'Mes préférences' : 'My preferences'}</p>
            </div>
          </Link>
          <Link
            href={`/${locale}/espace-pro/settings`}
            className="flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors"
          >
            <svg className="w-8 h-8 text-terracotta-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className="font-medium">{isFr ? 'Paramètres' : 'Settings'}</p>
              <p className="text-sm text-deep-blue-200">{isFr ? 'Mon profil' : 'My profile'}</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
