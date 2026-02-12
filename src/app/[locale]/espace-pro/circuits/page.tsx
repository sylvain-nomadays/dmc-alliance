import { getPublishedGirCircuits } from '@/lib/supabase/circuits';
import AgencyCircuitsClient from './AgencyCircuitsClient';

export default async function AgencyCircuitsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Fetch GIR circuits server-side using admin client (bypasses RLS)
  // This ensures agencies see the same circuits as the public GIR page
  const circuits = await getPublishedGirCircuits();

  return <AgencyCircuitsClient locale={locale} serverCircuits={circuits} />;
}
