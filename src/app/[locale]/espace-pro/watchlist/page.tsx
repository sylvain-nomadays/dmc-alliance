import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth/getAuthContext';
import { supabaseAdmin } from '@/lib/supabase/admin';
import WatchlistClient from './WatchlistClient';
import type { WatchlistItem, FavoriteItem } from './WatchlistClient';

async function getAgencyId(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('agencies')
    .select('id')
    .eq('user_id', userId)
    .single();
  return data?.id || null;
}

async function getWatchlist(agencyId: string): Promise<WatchlistItem[]> {
  const { data, error } = await supabaseAdmin
    .from('gir_watchlist')
    .select(`
      id, circuit_id, notify_on_booking, notify_on_availability_change,
      notify_on_price_change, created_at,
      circuit:circuits(
        id, title, slug, duration_days, price_from, image_url,
        destination:destinations(name, name_en),
        partner:partners(name),
        departures:circuit_departures(id, start_date, end_date, total_seats, booked_seats, status, price)
      )
    `)
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading watchlist:', error.message);
    return [];
  }

  return (data || []) as WatchlistItem[];
}

async function getFavorites(agencyId: string): Promise<FavoriteItem[]> {
  const { data: favData, error } = await supabaseAdmin
    .from('agency_interests')
    .select('id, entity_type, entity_slug, entity_name, created_at')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });

  if (error || !favData || favData.length === 0) return [];

  // Enrich favorites with destination/partner data
  const destSlugs = favData.filter((f: FavoriteItem) => f.entity_type === 'destination').map((f: FavoriteItem) => f.entity_slug);
  const partnerSlugs = favData.filter((f: FavoriteItem) => f.entity_type === 'partner').map((f: FavoriteItem) => f.entity_slug);

  const [destResult, partnerResult] = await Promise.all([
    destSlugs.length > 0
      ? supabaseAdmin.from('destinations').select('id, name, name_en, slug, image_url').in('slug', destSlugs)
      : { data: [] },
    partnerSlugs.length > 0
      ? supabaseAdmin.from('partners').select('id, name, slug, logo_url').in('slug', partnerSlugs)
      : { data: [] },
  ]);

  const destMap = new Map((destResult.data || []).map((d: { slug: string }) => [d.slug, d]));
  const partnerMap = new Map((partnerResult.data || []).map((p: { slug: string }) => [p.slug, p]));

  return favData.map((f: FavoriteItem) => ({
    ...f,
    destination: f.entity_type === 'destination' ? destMap.get(f.entity_slug) || null : null,
    partner: f.entity_type === 'partner' ? partnerMap.get(f.entity_slug) || null : null,
  }));
}

export default async function AgencyWatchlistPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const authContext = await getAuthContext();

  if (!authContext || authContext.profile.role !== 'agency') {
    redirect(`/${locale}`);
  }

  const agencyId = await getAgencyId(authContext.user.id);
  if (!agencyId) {
    redirect(`/${locale}`);
  }

  const [watchlist, favorites] = await Promise.all([
    getWatchlist(agencyId),
    getFavorites(agencyId),
  ]);

  return (
    <WatchlistClient
      locale={locale}
      initialWatchlist={watchlist}
      initialFavorites={favorites}
    />
  );
}
