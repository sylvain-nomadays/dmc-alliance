'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MapPin, Check, Globe } from 'lucide-react';

export interface Destination {
  id: string;
  name: string;
  name_en: string | null;
  slug: string;
  country: string | null;
  region: string;
  image_url: string | null;
}

const REGION_LABELS: Record<string, { fr: string; en: string }> = {
  asia: { fr: 'Asie', en: 'Asia' },
  africa: { fr: 'Afrique', en: 'Africa' },
  europe: { fr: 'Europe', en: 'Europe' },
  americas: { fr: 'Amériques', en: 'Americas' },
  middle_east: { fr: 'Moyen-Orient', en: 'Middle East' },
  oceania: { fr: 'Océanie', en: 'Oceania' },
};

interface DestinationsClientProps {
  locale: string;
  agencyId: string;
  serverDestinations: Destination[];
  initialSelectedIds: string[];
}

export default function DestinationsClient({
  locale,
  agencyId,
  serverDestinations,
  initialSelectedIds,
}: DestinationsClientProps) {
  const [destinations] = useState<Destination[]>(serverDestinations);
  const [selectedDestinations, setSelectedDestinations] = useState<Set<string>>(
    new Set(initialSelectedIds)
  );

  const isFr = locale === 'fr';

  const toggleDestination = async (destId: string) => {
    const dest = destinations.find(d => d.id === destId);
    if (!dest) return;

    const supabase = createClient();
    const isSelected = selectedDestinations.has(destId);

    // Optimistic update
    setSelectedDestinations(prev => {
      const next = new Set(prev);
      if (isSelected) {
        next.delete(destId);
      } else {
        next.add(destId);
      }
      return next;
    });

    // Update database via agency_interests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    if (isSelected) {
      await db
        .from('agency_interests')
        .delete()
        .eq('agency_id', agencyId)
        .eq('entity_type', 'destination')
        .eq('entity_slug', dest.slug);
    } else {
      await db
        .from('agency_interests')
        .insert({
          agency_id: agencyId,
          entity_type: 'destination',
          entity_slug: dest.slug,
          entity_name: dest.name,
        });
    }
  };

  // Group destinations by region
  const destinationsByRegion = destinations.reduce((acc, dest) => {
    const region = dest.region || 'other';
    if (!acc[region]) acc[region] = [];
    acc[region].push(dest);
    return acc;
  }, {} as Record<string, Destination[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading text-gray-900">
          {isFr ? 'Mes destinations' : 'My Destinations'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isFr
            ? 'Sélectionnez les destinations qui vous intéressent pour recevoir des notifications ciblées'
            : 'Select destinations you\'re interested in to receive targeted notifications'}
        </p>
      </div>

      {/* Summary */}
      <div className="bg-terracotta-50 border border-terracotta-200 rounded-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-terracotta-100 rounded-full flex items-center justify-center">
          <Globe className="w-5 h-5 text-terracotta-600" />
        </div>
        <div>
          <p className="font-medium text-terracotta-800">
            {selectedDestinations.size} {isFr ? 'destination(s) sélectionnée(s)' : 'destination(s) selected'}
          </p>
          <p className="text-sm text-terracotta-600">
            {isFr
              ? 'Vous serez notifié des nouveaux circuits GIR sur ces destinations'
              : 'You\'ll be notified of new GIR circuits on these destinations'}
          </p>
        </div>
      </div>

      {/* Destinations by region */}
      {destinations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isFr ? 'Destinations bientôt disponibles' : 'Destinations coming soon'}
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {isFr
              ? 'Les destinations de nos partenaires seront bientôt disponibles pour personnaliser vos notifications. Revenez prochainement !'
              : 'Destinations from our partners will be available soon to customize your notifications. Check back later!'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(REGION_LABELS).map(([regionKey, labels]) => {
            const regionDestinations = destinationsByRegion[regionKey];
            if (!regionDestinations || regionDestinations.length === 0) return null;

            return (
              <div key={regionKey}>
                <h2 className="text-lg font-heading text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-terracotta-500" />
                  {isFr ? labels.fr : labels.en}
                  <span className="text-sm font-normal text-gray-500">
                    ({regionDestinations.length})
                  </span>
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {regionDestinations.map((dest) => {
                    const isSelected = selectedDestinations.has(dest.id);

                    return (
                      <button
                        key={dest.id}
                        onClick={() => toggleDestination(dest.id)}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                          isSelected
                            ? 'border-terracotta-500 ring-2 ring-terracotta-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {/* Image */}
                        <div className="aspect-[4/3] bg-gray-100 relative">
                          {dest.image_url ? (
                            <img
                              src={dest.image_url}
                              alt={isFr ? dest.name : (dest.name_en || dest.name)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <MapPin className="w-8 h-8" />
                            </div>
                          )}

                          {/* Selection overlay */}
                          {isSelected && (
                            <div className="absolute inset-0 bg-terracotta-500/20 flex items-center justify-center">
                              <div className="w-8 h-8 bg-terracotta-500 rounded-full flex items-center justify-center">
                                <Check className="w-5 h-5 text-white" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Name */}
                        <div className={`p-3 text-left ${isSelected ? 'bg-terracotta-50' : 'bg-white'}`}>
                          <p className={`font-medium ${isSelected ? 'text-terracotta-800' : 'text-gray-900'}`}>
                            {isFr ? dest.name : (dest.name_en || dest.name)}
                          </p>
                          <p className="text-xs text-gray-500 uppercase">
                            {dest.country}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
