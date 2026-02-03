/**
 * Script de diagnostic pour vérifier les circuits GIR dans Supabase
 * Exécuter avec: node scripts/check-gir.mjs
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://otgxxrnddkdjwnqmsgsp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90Z3h4cm5kZGtkanducW1zZ3NwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTkzMzk1MiwiZXhwIjoyMDg1NTA5OTUyfQ.UBiy1JbAT9ALSC-WK00u65yT5YlpHUlIgeiyBWZGl54';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGirCircuits() {
  console.log('=== Diagnostic GIR Circuits ===\n');

  // 1. Compter tous les circuits
  console.log('1. Statistiques des circuits...');
  const { count: totalCount } = await supabase
    .from('circuits')
    .select('*', { count: 'exact', head: true });

  console.log(`   Total circuits: ${totalCount || 0}`);

  // 2. Lister tous les circuits avec leur statut
  console.log('\n2. Liste de tous les circuits:');
  const { data: allCircuits, error: listError } = await supabase
    .from('circuits')
    .select('id, slug, title, status, is_gir')
    .order('created_at', { ascending: false });

  if (listError) {
    console.log('   ❌ Erreur:', listError.message);
    if (listError.message.includes('is_gir') || listError.message.includes('column')) {
      console.log('\n   ⚠️  La colonne is_gir n\'existe probablement pas!');
      console.log('   Exécutez cette SQL dans Supabase:');
      console.log('   ALTER TABLE circuits ADD COLUMN IF NOT EXISTS is_gir BOOLEAN DEFAULT false;');
    }
  } else if (allCircuits && allCircuits.length > 0) {
    console.log('   | Slug | Titre | Status | is_gir |');
    console.log('   |------|-------|--------|--------|');
    allCircuits.forEach((c) => {
      const girStatus = c.is_gir === true ? '✅' : c.is_gir === false ? '❌' : '⚠️ null';
      const pubStatus = c.status === 'published' ? '✅' : '❌ ' + c.status;
      console.log(`   | ${(c.slug || 'N/A').substring(0, 25).padEnd(25)} | ${(c.title || 'N/A').substring(0, 20).padEnd(20)} | ${pubStatus.padEnd(12)} | ${girStatus} |`);
    });
  } else {
    console.log('   Aucun circuit trouvé dans la base de données.');
  }

  // 3. Circuits GIR publiés
  console.log('\n3. Circuits GIR publiés (ceux qui devraient apparaître sur /gir):');
  const { data: girCircuits, error: girError } = await supabase
    .from('circuits')
    .select('id, slug, title, status, is_gir')
    .eq('status', 'published')
    .eq('is_gir', true);

  if (girError) {
    console.log('   ❌ Erreur:', girError.message);
  } else if (girCircuits && girCircuits.length > 0) {
    console.log(`   ✅ ${girCircuits.length} circuits GIR publiés trouvés:`);
    girCircuits.forEach((c) => {
      console.log(`      - ${c.slug}: ${c.title}`);
    });
  } else {
    console.log('   ⚠️  Aucun circuit GIR publié trouvé!');
    console.log('\n   Pour qu\'un circuit apparaisse sur /gir, il doit avoir:');
    console.log('   - status = "published"');
    console.log('   - is_gir = true');
  }

  // 4. Recommandations
  console.log('\n4. Actions recommandées:');
  if (allCircuits && allCircuits.length > 0) {
    const unpublishedGir = allCircuits.filter((c) => c.is_gir === true && c.status !== 'published');
    const publishedNonGir = allCircuits.filter((c) => c.is_gir !== true && c.status === 'published');
    const nullGir = allCircuits.filter((c) => c.is_gir === null || c.is_gir === undefined);

    if (nullGir.length > 0) {
      console.log(`   - ${nullGir.length} circuits ont is_gir = null (valeur par défaut)`);
      console.log('     → Allez dans l\'admin et cochez "GIR" pour les circuits concernés');
    }
    if (unpublishedGir.length > 0) {
      console.log(`   - ${unpublishedGir.length} circuits marqués GIR mais pas publiés`);
      console.log('     → Changez leur statut en "Publié" dans l\'admin');
    }
    if (publishedNonGir.length > 0) {
      console.log(`   - ${publishedNonGir.length} circuits publiés mais pas marqués GIR`);
      console.log('     → Si ces circuits sont des GIR, cochez la case "GIR" dans l\'admin');
    }
  }

  console.log('\n=== Fin du diagnostic ===');
}

checkGirCircuits().catch(console.error);
