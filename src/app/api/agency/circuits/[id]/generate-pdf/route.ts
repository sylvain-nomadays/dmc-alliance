/**
 * API pour générer un PDF d'itinéraire personnalisé pour une agence
 *
 * POST /api/agency/circuits/[id]/generate-pdf
 * Body: {
 *   language: 'fr' | 'en',
 *   customNote?: string,
 *   showPrice?: boolean,
 *   showCommission?: boolean,
 *   departureId?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { ItineraryPDF, type CircuitPDFData, type ItineraryDay } from '@/lib/pdf/itinerary-template';
import React from 'react';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Types pour Supabase
interface Profile {
  role: string;
}

interface Agency {
  id: string;
  name: string;
  logo_url: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
}

interface Destination {
  name_fr: string;
  name_en: string;
  region: string;
}

interface Circuit {
  id: string;
  title: string;
  subtitle: string | null;
  description_fr: string;
  description_en: string;
  itinerary: ItineraryDay[] | null;
  included_fr: string[] | null;
  included_en: string[] | null;
  not_included_fr: string[] | null;
  not_included_en: string[] | null;
  price_from: number;
  duration_days: number;
  group_size_min: number;
  group_size_max: number;
  difficulty_level: number;
  base_commission_rate: number;
  destination: Destination | null;
}

interface Departure {
  id: string;
  start_date: string;
  end_date: string;
  total_seats: number;
  booked_seats: number;
  price_override: number | null;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: circuitId } = await params;
    const body = await request.json();
    const {
      language = 'fr',
      customNote,
      showPrice = true,
      showCommission = false,
      departureId,
    } = body;

    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Get user profile to check role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: Profile | null };

    if (!profile || profile.role !== 'agency') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Get agency info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: agency, error: agencyError } = await (supabase as any)
      .from('agencies')
      .select('id, name, logo_url, email, phone, website, address, city, country')
      .eq('user_id', user.id)
      .single() as { data: Agency | null; error: Error | null };

    if (agencyError || !agency) {
      return NextResponse.json({ error: 'Agence non trouvée' }, { status: 404 });
    }

    // Get circuit with all details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: circuit, error: circuitError } = await (supabase as any)
      .from('circuits')
      .select(`
        id,
        title,
        subtitle,
        description_fr,
        description_en,
        itinerary,
        included_fr,
        included_en,
        not_included_fr,
        not_included_en,
        price_from,
        duration_days,
        group_size_min,
        group_size_max,
        difficulty_level,
        base_commission_rate,
        destination:destinations(name_fr, name_en, region)
      `)
      .eq('id', circuitId)
      .eq('status', 'published')
      .single() as { data: Circuit | null; error: Error | null };

    if (circuitError || !circuit) {
      return NextResponse.json({ error: 'Circuit non trouvé' }, { status: 404 });
    }

    // Get departure if specified
    let departure = null;
    if (departureId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: dep } = await (supabase as any)
        .from('circuit_departures')
        .select('*')
        .eq('id', departureId)
        .eq('circuit_id', circuitId)
        .single() as { data: Departure | null };

      if (dep) {
        departure = {
          start_date: dep.start_date,
          end_date: dep.end_date,
          price: dep.price_override || circuit.price_from,
          available_seats: dep.total_seats - (dep.booked_seats || 0),
        };
      }
    }

    // Build PDF data
    const destination = circuit.destination;

    const pdfData: CircuitPDFData = {
      title: circuit.title,
      subtitle: circuit.subtitle || undefined,
      destination: destination
        ? (language === 'fr' ? destination.name_fr : destination.name_en)
        : '',
      region: destination?.region,
      duration_days: circuit.duration_days,
      group_size_min: circuit.group_size_min,
      group_size_max: circuit.group_size_max,
      difficulty_level: circuit.difficulty_level,
      price_from: circuit.price_from,
      description: language === 'fr' ? circuit.description_fr : circuit.description_en,
      itinerary: circuit.itinerary || [],
      included: language === 'fr' ? (circuit.included_fr || []) : (circuit.included_en || []),
      not_included: language === 'fr' ? (circuit.not_included_fr || []) : (circuit.not_included_en || []),
      agency: {
        name: agency.name,
        logo_url: agency.logo_url || undefined,
        email: agency.email || undefined,
        phone: agency.phone || undefined,
        website: agency.website || undefined,
        address: agency.address
          ? `${agency.address}${agency.city ? `, ${agency.city}` : ''}${agency.country ? `, ${agency.country}` : ''}`
          : undefined,
      },
      customNote,
      showPrice,
      showCommission,
      commission_rate: showCommission ? circuit.base_commission_rate : undefined,
      departure: departure || undefined,
      language,
    };

    // Generate PDF
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(
      React.createElement(ItineraryPDF, { data: pdfData }) as any
    );

    // Return PDF
    const filename = `${circuit.title.replace(/[^a-zA-Z0-9]/g, '-')}-${language}.pdf`;

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(pdfBuffer);

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('[Generate PDF] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    );
  }
}
