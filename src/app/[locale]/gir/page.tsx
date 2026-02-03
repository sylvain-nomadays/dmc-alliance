import { Suspense } from 'react';
import { getPublishedGirCircuits } from '@/lib/supabase/circuits';
import { circuits as staticCircuits } from '@/data/circuits';
import GirPageClient from './GirPageClient';
import type { DbCircuit } from '@/lib/supabase/circuits';

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

  // Fetch GIR circuits from Supabase
  const dbCircuits = await getPublishedGirCircuits();

  // Also get static circuits marked as GIR (for fallback/backward compatibility)
  const staticGirCircuits = staticCircuits.filter(c => c.isGir);

  // Merge: use DB circuits as primary, add static circuits that don't exist in DB
  const dbSlugs = new Set(dbCircuits.map(c => c.slug));

  // Convert static circuits to DB format for those not in DB
  // Note: Uses correct column names matching Supabase schema
  const convertedStaticCircuits: DbCircuit[] = staticGirCircuits
    .filter(c => !dbSlugs.has(c.slug))
    .map(c => ({
      id: c.id,
      slug: c.slug,
      title: c.title.fr,
      subtitle: c.subtitle.fr,
      description_fr: c.summary.fr,
      description_en: c.summary.en,
      highlights_fr: c.highlights.fr,
      highlights_en: c.highlights.en,
      included_fr: c.included.fr,
      included_en: c.included.en,
      not_included_fr: c.notIncluded.fr,
      not_included_en: c.notIncluded.en,
      itinerary: c.itinerary.map(day => ({
        day: day.day,
        title_fr: day.title.fr,
        title_en: day.title.en,
        description_fr: day.description.fr,
        description_en: day.description.en,
        meals: day.meals,
        accommodation: day.accommodation?.fr,
      })),
      duration_days: c.duration.days,
      price_from: c.departures[0]?.publicPrice || null,
      difficulty_level: c.difficulty === 'easy' ? 1 : c.difficulty === 'moderate' ? 2 : c.difficulty === 'challenging' ? 3 : 4,
      group_size_min: c.practicalInfo.groupSize.min,
      group_size_max: c.practicalInfo.groupSize.max,
      image_url: c.images.main,
      gallery_urls: c.images.gallery,
      status: 'published',
      is_gir: true,
      destination_id: null,
      partner_id: c.partnerId,
      destination: {
        id: c.destinationSlug,
        name: c.destinationSlug.charAt(0).toUpperCase() + c.destinationSlug.slice(1).replace(/-/g, ' '),
        name_en: c.destinationSlug.charAt(0).toUpperCase() + c.destinationSlug.slice(1).replace(/-/g, ' '),
        slug: c.destinationSlug,
        region: null,
      },
      partner: {
        id: c.partnerId,
        name: c.partnerId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        logo_url: null,
        slug: c.partnerId,
      },
      departures: c.departures.map(d => ({
        id: d.id,
        start_date: d.startDate,
        end_date: d.endDate,
        total_seats: d.totalSpots,
        booked_seats: d.totalSpots - d.availableSpots,
        status: d.status,
        price: d.publicPrice,
      })),
    }));

  const mergedCircuits = [...dbCircuits, ...convertedStaticCircuits];

  return (
    <Suspense fallback={<GirPageSkeleton />}>
      <GirPageClient circuits={mergedCircuits} locale={locale} />
    </Suspense>
  );
}
