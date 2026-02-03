/**
 * Script de diagnostic pour vérifier les circuits GIR dans Supabase
 * Exécuter avec: npx tsx scripts/check-gir-circuits.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://otgxxrnddkdjwnqmsgsp.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGirCircuits() {
  console.log('=== Diagnostic GIR Circuits ===\n');

  // 1. Vérifier si la colonne is_gir existe
  console.log('1. Vérification de la structure de la table circuits...');
  const { data: columns, error: columnsError } = await supabase
    .rpc('get_table_columns', { table_name: 'circuits' })
    .single();

  if (columnsError) {
    // Fallback: essayer de récupérer un circuit pour voir les colonnes
    const { data: sampleCircuit, error: sampleError } = await supabase
      .from('circuits')
      .select('*')
      .limit(1)
      .single();

    if (sampleError) {
      console.log('   ❌ Erreur:', sampleError.message);
    } else if (sampleCircuit) {
      const hasIsGir = 'is_gir' in sampleCircuit;
      console.log(`   Colonne is_gir existe: ${hasIsGir ? '✅ Oui' : '❌ Non'}`);
      if (!hasIsGir) {
        console.log('\n   ⚠️  IMPORTANT: Vous devez exécuter la migration SQL suivante:');
        console.log('   ALTER TABLE circuits ADD COLUMN IF NOT EXISTS is_gir BOOLEAN DEFAULT false;');
      }
    }
  }

  // 2. Compter tous les circuits
  console.log('\n2. Statistiques des circuits...');
  const { count: totalCount } = await supabase
    .from('circuits')
    .select('*', { count: 'exact', head: true });

  console.log(`   Total circuits: ${totalCount || 0}`);

  // 3. Lister tous les circuits avec leur statut
  console.log('\n3. Liste de tous les circuits:');
  const { data: allCircuits, error: listError } = await supabase
    .from('circuits')
    .select('id, slug, title, status, is_gir')
    .order('created_at', { ascending: false });

  if (listError) {
    console.log('   ❌ Erreur:', listError.message);
  } else if (allCircuits && allCircuits.length > 0) {
    console.log('   | Slug | Titre | Status | is_gir |');
    console.log('   |------|-------|--------|--------|');
    allCircuits.forEach((c: any) => {
      const girStatus = c.is_gir === true ? '✅' : c.is_gir === false ? '❌' : '⚠️ null';
      const pubStatus = c.status === 'published' ? '✅' : '❌ ' + c.status;
      console.log(`   | ${c.slug?.substring(0, 25) || 'N/A'} | ${(c.title || 'N/A').substring(0, 20)} | ${pubStatus} | ${girStatus} |`);
    });
  } else {
    console.log('   Aucun circuit trouvé dans la base de données.');
  }

  // 4. Circuits GIR publiés
  console.log('\n4. Circuits GIR publiés (ceux qui devraient apparaître sur /gir):');
  const { data: girCircuits, error: girError } = await supabase
    .from('circuits')
    .select('id, slug, title, status, is_gir')
    .eq('status', 'published')
    .eq('is_gir', true);

  if (girError) {
    console.log('   ❌ Erreur:', girError.message);
    if (girError.message.includes('is_gir')) {
      console.log('\n   ⚠️  La colonne is_gir n\'existe pas! Exécutez la migration SQL.');
    }
  } else if (girCircuits && girCircuits.length > 0) {
    console.log(`   ✅ ${girCircuits.length} circuits GIR publiés trouvés:`);
    girCircuits.forEach((c: any) => {
      console.log(`      - ${c.slug}: ${c.title}`);
    });
  } else {
    console.log('   ⚠️  Aucun circuit GIR publié trouvé!');
    console.log('\n   Pour qu\'un circuit apparaisse sur /gir, il doit avoir:');
    console.log('   - status = "published"');
    console.log('   - is_gir = true');
  }

  // 5. Recommandations
  console.log('\n5. Actions recommandées:');
  if (allCircuits && allCircuits.length > 0) {
    const unpublishedGir = allCircuits.filter((c: any) => c.is_gir === true && c.status !== 'published');
    const publishedNonGir = allCircuits.filter((c: any) => c.is_gir !== true && c.status === 'published');

    if (unpublishedGir.length > 0) {
      console.log(`   - ${unpublishedGir.length} circuits marqués GIR mais pas publiés`);
    }
    if (publishedNonGir.length > 0) {
      console.log(`   - ${publishedNonGir.length} circuits publiés mais pas marqués GIR`);
      console.log('     Si ces circuits sont des GIR, cochez la case "GIR" dans l\'admin.');
    }
  }

  console.log('\n=== Fin du diagnostic ===');
}

checkGirCircuits().catch(console.error);
