'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MapPin, Check, Globe } from 'lucide-react';

interface Destination {
  id: string;
  name_fr: string;
  country_code: string;
  region: string;
  image_url: string | null;
}

// Grouper par région
const REGION_LABELS: Record<string, { fr: string; en: string }> = {
  asia: { fr: 'Asie', en: 'Asia' },
  africa: { fr: 'Afrique', en: 'Africa' },
  europe: { fr: 'Europe', en: 'Europe' },
  americas: { fr: 'Amériques', en: 'Americas' },
  middle_east: { fr: 'Moyen-Orient', en: 'Middle East' },
  oceania: { fr: 'Océanie', en: 'Oceania' },
};

export default function AgencyDestinationsPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedDestinations, setSelectedDestinations] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agencyId, setAgencyId] = useState<string | null>(null);

  const isFr = locale === 'fr';

  // Charger les destinations et les intérêts de l'agence
  useEffect(() => {
    const load = async () => {
      const supabase = createClient();

      // Charger toutes les destinations
      const { data: allDestinations } = await supabase
        .from('destinations')
        .select('id, name_fr, country_code, region, image_url')
        .eq('is_active', true)
        .order('name_fr');

      setDestinations(allDestinations || []);

      // Récupérer l'agence
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: agency } = await (supabase as any)
        .from('agencies')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (agency) {
        setAgencyId(agency.id);

        // Charger les intérêts existants
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: interests } = await (supabase as any)
          .from('agency_destination_interests')
          .select('destination_id')
          .eq('agency_id', agency.id);

        if (interests) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setSelectedDestinations(new Set(interests.map((i: any) => i.destination_id)));
        }
      }

      setLoading(false);
    };

    load();
  }, []);

  // Toggle une destination
  const toggleDestination = async (destId: string) => {
    if (!agencyId) return;

    const supabase = createClient();
    const isSelected = selectedDestinations.has(destId);

    // Mise à jour optimiste
    setSelectedDestinations(prev => {
      const next = new Set(prev);
      if (isSelected) {
        next.delete(destId);
      } else {
        next.add(destId);
      }
      return next;
    });

    // Mise à jour en base
    if (isSelected) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('agency_destination_interests')
        .delete()
        .eq('agency_id', agencyId)
        .eq('destination_id', destId);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('agency_destination_interests')
        .insert({
          agency_id: agencyId,
          destination_id: destId,
        });
    }
  };

  // Grouper les destinations par région
  const destinationsByRegion = destinations.reduce((acc, dest) => {
    const region = dest.region || 'other';
    if (!acc[region]) acc[region] = [];
    acc[region].push(dest);
    return acc;
  }, {} as Record<string, Destination[]>);

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        {isFr ? 'Chargement...' : 'Loading...'}
      </div>
    );
  }

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

      {/* Résumé */}
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

      {/* Destinations par région */}
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
                              alt={dest.name_fr}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <MapPin className="w-8 h-8" />
                            </div>
                          )}

                          {/* Overlay sélection */}
                          {isSelected && (
                            <div className="absolute inset-0 bg-terracotta-500/20 flex items-center justify-center">
                              <div className="w-8 h-8 bg-terracotta-500 rounded-full flex items-center justify-center">
                                <Check className="w-5 h-5 text-white" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Nom */}
                        <div className={`p-3 text-left ${isSelected ? 'bg-terracotta-50' : 'bg-white'}`}>
                          <p className={`font-medium ${isSelected ? 'text-terracotta-800' : 'text-gray-900'}`}>
                            {dest.name_fr}
                          </p>
                          <p className="text-xs text-gray-500 uppercase">
                            {dest.country_code}
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
