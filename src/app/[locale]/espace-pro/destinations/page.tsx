import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth/getAuthContext';
import { supabaseAdmin } from '@/lib/supabase/admin';
import DestinationsClient from './DestinationsClient';
import type { Destination } from './DestinationsClient';

async function getAgencyId(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('agencies')
    .select('id')
    .eq('user_id', userId)
    .single();
  return data?.id || null;
}

async function getAllDestinations(): Promise<Destination[]> {
  const { data, error } = await supabaseAdmin
    .from('destinations')
    .select('id, name, name_en, slug, country, region, image_url')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error loading destinations:', error.message);
    return [];
  }
  return (data || []) as Destination[];
}

async function getSelectedDestinationIds(
  agencyId: string,
  destinations: Destination[]
): Promise<string[]> {
  const { data: interests } = await supabaseAdmin
    .from('agency_interests')
    .select('entity_slug')
    .eq('agency_id', agencyId)
    .eq('entity_type', 'destination');

  if (!interests || interests.length === 0) return [];

  const selectedSlugs = new Set(interests.map((i: { entity_slug: string }) => i.entity_slug));
  return destinations
    .filter((d) => selectedSlugs.has(d.slug))
    .map((d) => d.id);
}

export default async function AgencyDestinationsPage({
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

  const destinations = await getAllDestinations();
  const selectedIds = await getSelectedDestinationIds(agencyId, destinations);

  return (
    <DestinationsClient
      locale={locale}
      agencyId={agencyId}
      serverDestinations={destinations}
      initialSelectedIds={selectedIds}
    />
  );
}
