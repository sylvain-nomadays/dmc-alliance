import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

const LOCALES = ['fr', 'en', 'de', 'nl', 'es', 'it'];

function revalidateDestinationPages(...slugs: (string | undefined | null)[]) {
  const uniqueSlugs = [...new Set(slugs.filter(Boolean))];
  for (const locale of LOCALES) {
    for (const slug of uniqueSlugs) {
      revalidatePath(`/${locale}/destinations/${slug}`);
    }
    revalidatePath(`/${locale}/destinations`);
  }
}

// PUT: Mise à jour d'une destination (admin uniquement)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { id, ...destinationData } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    // Récupérer le slug actuel pour la revalidation
    const { data: existing } = await supabaseAdmin
      .from('destinations')
      .select('slug')
      .eq('id', id)
      .single();

    const { error } = await supabaseAdmin
      .from('destinations')
      .update(destinationData)
      .eq('id', id);

    if (error) {
      console.error('Error updating destination:', error);
      return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
    }

    revalidateDestinationPages(existing?.slug, destinationData.slug);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin destination update error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST: Création d'une destination (admin uniquement)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const destinationData = await request.json();

    const { data, error } = await supabaseAdmin
      .from('destinations')
      .insert(destinationData)
      .select('id')
      .single();

    if (error) {
      console.error('Error creating destination:', error);
      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
    }

    revalidateDestinationPages(destinationData.slug);

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error('Admin destination create error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
