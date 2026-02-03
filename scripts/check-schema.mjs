/**
 * Script pour vérifier le schéma des tables
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://otgxxrnddkdjwnqmsgsp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90Z3h4cm5kZGtkanducW1zZ3NwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTkzMzk1MiwiZXhwIjoyMDg1NTA5OTUyfQ.UBiy1JbAT9ALSC-WK00u65yT5YlpHUlIgeiyBWZGl54';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('=== Vérification du schéma ===\n');

  // Vérifier la structure de destinations
  console.log('1. Structure de la table destinations:');
  const { data: dest, error: destErr } = await supabase
    .from('destinations')
    .select('*')
    .limit(1);

  if (destErr) {
    console.log('   Erreur:', destErr.message);
  } else if (dest && dest.length > 0) {
    console.log('   Colonnes:', Object.keys(dest[0]).join(', '));
    console.log('   Exemple:', JSON.stringify(dest[0], null, 2));
  }

  // Vérifier la structure de partners
  console.log('\n2. Structure de la table partners:');
  const { data: part, error: partErr } = await supabase
    .from('partners')
    .select('*')
    .limit(1);

  if (partErr) {
    console.log('   Erreur:', partErr.message);
  } else if (part && part.length > 0) {
    console.log('   Colonnes:', Object.keys(part[0]).join(', '));
  }

  // Vérifier circuit_departures
  console.log('\n3. Structure de la table circuit_departures:');
  const { data: dep, error: depErr } = await supabase
    .from('circuit_departures')
    .select('*')
    .limit(1);

  if (depErr) {
    console.log('   Erreur:', depErr.message);
  } else if (dep && dep.length > 0) {
    console.log('   Colonnes:', Object.keys(dep[0]).join(', '));
  } else {
    console.log('   Table vide ou inexistante');
  }

  // Vérifier circuits
  console.log('\n4. Structure de la table circuits:');
  const { data: circ, error: circErr } = await supabase
    .from('circuits')
    .select('*')
    .limit(1);

  if (circErr) {
    console.log('   Erreur:', circErr.message);
  } else if (circ && circ.length > 0) {
    console.log('   Colonnes:', Object.keys(circ[0]).join(', '));
  }
}

checkSchema().catch(console.error);
