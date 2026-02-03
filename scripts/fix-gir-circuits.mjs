/**
 * Script pour marquer les circuits GIR existants dans Supabase
 * Exécuter avec: node scripts/fix-gir-circuits.mjs
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://otgxxrnddkdjwnqmsgsp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90Z3h4cm5kZGtkanducW1zZ3NwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTkzMzk1MiwiZXhwIjoyMDg1NTA5OTUyfQ.UBiy1JbAT9ALSC-WK00u65yT5YlpHUlIgeiyBWZGl54';

const supabase = createClient(supabaseUrl, supabaseKey);

// Les 3 circuits GIR originaux (ceux de /data/circuits.ts)
const GIR_SLUGS = [
  'entre-steppe-et-desert',        // Mongolie
  'grande-migration-masai-mara',   // Kenya - slug peut varier
  'grande-migration-masai-ma',     // Kenya - version courte
  'merveilles-de-kirghizie',       // Kirghizistan
  'merveilles-kirghizie',          // Kirghizistan - version courte
];

async function fixGirCircuits() {
  console.log('=== Mise à jour des circuits GIR ===\n');

  // 1. Mettre à jour les circuits qui devraient être GIR
  console.log('1. Marquage des circuits GIR...');

  for (const slug of GIR_SLUGS) {
    const { data, error } = await supabase
      .from('circuits')
      .update({ is_gir: true })
      .eq('slug', slug)
      .select('slug, title');

    if (error) {
      console.log(`   ❌ Erreur pour ${slug}:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`   ✅ ${slug}: ${data[0].title} → marqué GIR`);
    } else {
      console.log(`   ⚠️  ${slug}: circuit non trouvé (slug différent?)`);
    }
  }

  // 2. Vérifier le résultat
  console.log('\n2. Vérification finale...');
  const { data: girCircuits, error: girError } = await supabase
    .from('circuits')
    .select('slug, title, is_gir, status')
    .eq('is_gir', true);

  if (girError) {
    console.log('   ❌ Erreur:', girError.message);
  } else {
    console.log(`   ${girCircuits?.length || 0} circuits marqués comme GIR:`);
    girCircuits?.forEach((c) => {
      console.log(`      - ${c.slug}: ${c.title} (status: ${c.status})`);
    });
  }

  console.log('\n=== Terminé ===');
  console.log('Rafraîchissez la page /gir pour voir les circuits.');
}

fixGirCircuits().catch(console.error);
