import { Suspense } from 'react';
import { getPublishedGirCircuits } from '@/lib/supabase/circuits';
import { createClient } from '@/lib/supabase/server';
import GirPageClient from './GirPageClient';

export const dynamic = 'force-dynamic';

// Loading skeleton
function GirPageSkeleton() {
  return (
    <div className="pt-16 animate-pulse">
      <div className="h-64 bg-gray-200" />
      <div className="container mx-auto px-4 py-12">
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-64" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function GirPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Fetch GIR circuits from Supabase (uses admin client for reliability)
  const circuits = await getPublishedGirCircuits();

  // Check if user is authenticated
  let isAuthenticated = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    isAuthenticated = !!user;
  } catch {
    // Not authenticated
  }

  return (
    <Suspense fallback={<GirPageSkeleton />}>
      <GirPageClient circuits={circuits} locale={locale} isAuthenticated={isAuthenticated} />
    </Suspense>
  );
}
