/**
 * Script to create the "Angleterre" (England) destination in Supabase
 * for Alainn Tours partner.
 *
 * Usage: npx tsx scripts/create-alainn-england.ts
 *
 * Safe to re-run: if the destination already exists, it will simply re-link it
 * to Alainn Tours (update partner_id). Existing descriptions/images are preserved.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local manually
const envFile = readFileSync(resolve(__dirname, '../.env.local'), 'utf-8');
for (const line of envFile.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim();
  }
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PARTNER_SLUG = 'alainn-tours';

const destination = {
  name: 'Angleterre',
  name_en: 'England',
  slug: 'angleterre',
  country: 'GB-ENG',
  region: 'europe',
  description_fr:
    "L'Angleterre marie l'effervescence de Londres à la douceur de ses campagnes : villages de pierre des Cotswolds, côtes crayeuses du Sud, universités millénaires d'Oxford et Cambridge. Alainn Tours compose des circuits qui révèlent toutes les facettes du pays.\n\nEntre patrimoine royal, pubs chaleureux, jardins anglais et musées de classe mondiale, l'Angleterre offre un dépaysement culturel à quelques heures de Paris.",
  description_en:
    "England combines the buzz of London with the gentleness of its countryside: stone villages of the Cotswolds, chalky coasts of the South, ancient universities of Oxford and Cambridge. Alainn Tours designs circuits that reveal all facets of the country.\n\nBetween royal heritage, welcoming pubs, English gardens and world-class museums, England offers a cultural getaway just hours from Paris.",
  highlights: [
    'Londres, capitale cosmopolite',
    'Villages des Cotswolds',
    "Universités d'Oxford et Cambridge",
    'Côtes du Sud (Douvres, Cornouailles)',
    'Patrimoine royal et châteaux',
  ],
  best_time: 'Mai - Septembre',
  ideal_duration: '7-10 jours',
  is_active: true,
};

async function main() {
  console.log(`\nCréation de la destination Angleterre pour Alainn Tours...\n`);

  // Resolve the partner ID by slug
  const { data: partner, error: partnerError } = await supabaseAdmin
    .from('partners')
    .select('id, name, slug')
    .eq('slug', PARTNER_SLUG)
    .single();

  if (partnerError || !partner) {
    console.error(`Partenaire "${PARTNER_SLUG}" non trouvé:`, partnerError?.message);
    process.exit(1);
  }
  console.log(`Partenaire trouvé: ${partner.name} (id: ${partner.id})`);

  // Check if destination already exists (by slug)
  const { data: existing } = await supabaseAdmin
    .from('destinations')
    .select('id, slug, partner_id, name')
    .eq('slug', destination.slug)
    .maybeSingle();

  if (existing) {
    console.log(
      `\nLa destination "${existing.name}" existe déjà (id: ${existing.id}) — mise à jour du partner_id uniquement.`
    );
    const { error } = await supabaseAdmin
      .from('destinations')
      .update({ partner_id: partner.id, is_active: true })
      .eq('id', existing.id);

    if (error) {
      console.error('Erreur mise à jour:', error.message);
      process.exit(1);
    }
    console.log(`  partner_id mis à jour → ${partner.name}`);
  } else {
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('destinations')
      .insert({ ...destination, partner_id: partner.id })
      .select('id, slug, name')
      .single();

    if (insertError) {
      console.error(`\nErreur d'insertion:`, insertError.message);
      process.exit(1);
    }
    console.log(`\nDestination créée avec succès: ${inserted.name} (id: ${inserted.id})`);
  }

  // Verify
  const { data: results } = await supabaseAdmin
    .from('destinations')
    .select('id, name, slug, is_active')
    .eq('partner_id', partner.id)
    .order('name');

  console.log(`\n=== Destinations de ${partner.name} ===`);
  (results || []).forEach((d) => {
    console.log(`  - ${d.name} (slug: ${d.slug}${d.is_active ? '' : ', INACTIF'})`);
  });

  console.log('\nTerminé.');
}

main();
