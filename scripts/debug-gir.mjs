/**
 * Script de debug détaillé pour les GIR
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://otgxxrnddkdjwnqmsgsp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90Z3h4cm5kZGtkanducW1zZ3NwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTkzMzk1MiwiZXhwIjoyMDg1NTA5OTUyfQ.UBiy1JbAT9ALSC-WK00u65yT5YlpHUlIgeiyBWZGl54';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
  console.log('=== DEBUG GIR ===\n');

  // 1. Tous les circuits avec details
  console.log('1. Tous les circuits dans Supabase:');
  const { data: all, error: allErr } = await supabase
    .from('circuits')
    .select('id, slug, title, status, is_gir, image_url, duration_days, price_from')
    .order('created_at', { ascending: false });

  if (allErr) {
    console.log('   Erreur:', allErr.message);
  } else {
    console.log(`   ${all?.length || 0} circuits trouvés:\n`);
    all?.forEach((c, i) => {
      console.log(`   ${i+1}. ${c.title}`);
      console.log(`      - slug: ${c.slug}`);
      console.log(`      - status: ${c.status}`);
      console.log(`      - is_gir: ${c.is_gir}`);
      console.log(`      - duration: ${c.duration_days} jours`);
      console.log(`      - price: ${c.price_from}€`);
      console.log(`      - image: ${c.image_url ? 'OUI' : 'NON'}`);
      console.log('');
    });
  }

  // 2. Requête exacte utilisée par getPublishedGirCircuits (avec bons noms de colonnes)
  console.log('\n2. Résultat de la requête GIR (status=published AND is_gir=true):');
  const { data: gir, error: girErr } = await supabase
    .from('circuits')
    .select(`
      *,
      destination:destinations(id, name, name_en, slug, region),
      partner:partners(id, name, logo_url, slug),
      departures:circuit_departures(id, start_date, end_date, total_seats, booked_seats, status, price)
    `)
    .eq('status', 'published')
    .eq('is_gir', true)
    .order('created_at', { ascending: false });

  if (girErr) {
    console.log('   Erreur:', girErr.message);
  } else {
    console.log(`   ${gir?.length || 0} circuits GIR publiés:\n`);
    gir?.forEach((c, i) => {
      console.log(`   ${i+1}. ${c.title} (${c.slug})`);
      console.log(`      - destination: ${c.destination?.name || 'AUCUNE'}`);
      console.log(`      - partner: ${c.partner?.name || 'AUCUN'}`);
      console.log(`      - departures: ${c.departures?.length || 0}`);
      console.log('');
    });
  }

  // 3. Vérifier les données statiques
  console.log('\n3. Les 3 circuits statiques dans /data/circuits.ts sont:');
  console.log('   - entre-steppe-et-desert (Mongolie)');
  console.log('   - grande-migration-masai-mara (Kenya)');
  console.log('   - merveilles-de-kirghizie (Kirghizistan)');

  console.log('\n=== CONCLUSION ===');
  if (gir && gir.length > 0) {
    console.log(`✅ ${gir.length} circuits GIR sont dans Supabase et devraient s'afficher.`);
    console.log('\nSi vous ne les voyez pas sur le site, le problème vient de:');
    console.log('1. Le cache Next.js - Arrêtez le serveur, supprimez .next/, relancez');
    console.log('2. Le code de la page /gir utilise peut-être encore les données statiques');
  } else {
    console.log('❌ Aucun circuit GIR publié trouvé dans Supabase!');
  }
}

debug().catch(console.error);
